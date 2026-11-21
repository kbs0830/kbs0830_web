# 升級 Cloudflared 服務用的那份 cloudflared（2026-11-21）
#
# 這台有兩份 cloudflared，不要搞混：
#   - C:\Program Files (x86)\cloudflared\：winget（MSI）管的那份，`winget upgrade` 升的是它，PATH 也排前面
#   - %LOCALAPPDATA%\Microsoft\WinGet\Packages\Cloudflare.cloudflared_...：舊的免安裝版，2026-11-21 之前服務跑的是它
#     （11/09 TODO 寫「裝的是 2026.10.0」是看錯成上面那份；服務其實是 2026.5.2）
# 這支會把服務指到最新的那份（第一次跑就會從免安裝版搬到 Program Files 那份），之後再跑就是單純升級。
#
# 用「系統管理員」PowerShell 執行（停／啟服務要管理員）：
#   powershell -ExecutionPolicy Bypass -File C:\Users\user\Desktop\kbs0830_web-master\scripts\upgrade-cloudflared.ps1
# 外網會斷 30 秒～1 分鐘（530）。watchdog 外網檢查要連續兩輪失敗才寄信，不會誤報。
# Windows PowerShell 5.1：不要用 ?? / ?. / 三元運算子。

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host ""; Write-Host $msg -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Bad($msg) { Write-Host "  !!  $msg" -ForegroundColor Red }

function Get-ServiceExe {
  $path = (Get-CimInstance Win32_Service -Filter "Name='Cloudflared'").PathName
  if ($path -match '^"([^"]+)"') { return $Matches[1] }
  return ($path -split ' ')[0]
}

function Get-ExeVersion($exe) {
  $out = (& $exe --version 2>&1) -join ' '
  if ($out -match 'version (\S+)') { return $Matches[1] }
  return $out
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Bad '要用「系統管理員」PowerShell 執行（開始 → 輸入 PowerShell → 右鍵 → 以系統管理員身分執行）'
  exit 1
}

$exe = Get-ServiceExe
$before = Get-ExeVersion $exe
Write-Host "服務用的檔案：$exe"
Write-Host "升級前版本：  $before"

# ── 1. 停服務（卡在 STOP_PENDING 就直接砍，11/02 遇過）──────────────────────
Write-Step '[1/4] 停止 Cloudflared 服務'
sc.exe stop Cloudflared | Out-Null
for ($i = 0; $i -lt 20; $i++) {
  if ((Get-Service Cloudflared).Status -eq 'Stopped') { break }
  Start-Sleep -Seconds 1
}
if ((Get-Service Cloudflared).Status -ne 'Stopped') {
  Write-Host '  20 秒還沒停，強制結束'
  taskkill /f /fi "SERVICES eq Cloudflared" | Out-Null
  Start-Sleep -Seconds 2
}
# 同一個檔案如果還有別的 process 開著（例如舊的 start-server.bat 黑視窗），檔案會被鎖住、winget 換不掉
Get-Process cloudflared -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe } | ForEach-Object {
  Write-Host "  結束還在用這個檔案的 cloudflared（PID $($_.Id)）"
  Stop-Process $_.Id -Force
}
Write-Ok "服務狀態：$((Get-Service Cloudflared).Status)"

# ── 2. 升級 ─────────────────────────────────────────────────────────────────
Write-Step '[2/4] winget 升級 Cloudflare.cloudflared'
$upgradeFailed = $false
try {
  winget upgrade --id Cloudflare.cloudflared --exact --silent --accept-source-agreements --accept-package-agreements
  Write-Host "  winget 結束代碼：$LASTEXITCODE"
} catch {
  $upgradeFailed = $true
  Write-Bad "winget 執行失敗：$($_.Exception.Message)"
}
# winget 的 Cloudflare.cloudflared 現在給的是 MSI，裝到 Program Files (x86)，不會動到服務原本用的免安裝版
# （2026-11-21 第一次跑就這樣：MSI 那份變 2026.11.1、服務那份還是 2026.5.2）。
# 所以裝完挑「最新的那份」，服務不是用它就把服務指過去（參數照舊），以後 winget 升級都會升到服務在用的這份。
$candidates = @($exe, "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe", "$env:ProgramFiles\cloudflared\cloudflared.exe") |
  Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique
$newest = $exe
$newestVer = Get-ExeVersion $exe
foreach ($c in $candidates) {
  $v = Get-ExeVersion $c
  try { if ([version]$v -gt [version]$newestVer) { $newest = $c; $newestVer = $v } } catch { }
}
if ($newest -ne $exe) {
  $svcKey = 'HKLM:\SYSTEM\CurrentControlSet\Services\Cloudflared'
  $oldImage = (Get-ItemProperty $svcKey).ImagePath
  if ($oldImage -match '^"[^"]+"\s*(.*)$' -or $oldImage -match '^\S+\s*(.*)$') { $svcArgs = $Matches[1] } else { $svcArgs = '' }
  $newImage = "`"$newest`" $svcArgs".Trim()
  Set-ItemProperty $svcKey -Name ImagePath -Value $newImage
  Write-Ok "服務改用新的那份：$newest"
  Write-Host "     （原本：$oldImage）"
  $exe = $newest
}
$after = Get-ExeVersion $exe
if ($after -eq $before) {
  $upgradeFailed = $true
  Write-Bad "版本沒變（$after）。winget 的訊息在上面，請整段截圖給 Claude"
} else {
  Write-Ok "服務的版本：$before → $after"
}

# ── 3. 不管升級成不成功，服務一定要開回來 ────────────────────────────────────
Write-Step '[3/4] 啟動 Cloudflared 服務'
Start-Service Cloudflared
Start-Sleep -Seconds 3
Write-Ok "服務狀態：$((Get-Service Cloudflared).Status)"

# ── 4. 外網確認 ──────────────────────────────────────────────────────────────
Write-Step '[4/4] 從外網打 https://kbs0830.com/（最多等 2 分鐘）'
$ok = $false
for ($i = 0; $i -lt 24; $i++) {
  try {
    $r = Invoke-WebRequest 'https://kbs0830.com/' -UseBasicParsing -TimeoutSec 10
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { }
  Start-Sleep -Seconds 5
}
if ($ok) { Write-Ok '網站外網正常（200）' } else { Write-Bad '2 分鐘內外網都沒有 200，請截圖給 Claude' }

Write-Host ""
if ($ok -and -not $upgradeFailed) {
  Write-Host "完成：服務現在是 $after，網站正常。" -ForegroundColor Green
  exit 0
}
exit 1
