# 一次性設定：讓桌機「開機（不用登入）」就自動把整個站跑起來，並修掉 72 小時被砍的問題。
# 必須用「以系統管理員身分執行」的 PowerShell 跑（一般權限改排程/服務會 Access denied）：
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup-autostart.ps1
#
# 可以重複執行（每一步都是直接覆寫成目標狀態），跑完最後會印出檢查結果。
#
# 背景（2026-10-15 查到的）：
# 1. kbs0830_NextJS / GitHubActionsRunner 的 ExecutionTimeLimit 還是預設 PT72H。2026-09 文件寫
#    「已修復」，但實際設定根本沒寫進去（非管理員執行 Set-ScheduledTask 會失敗），所以整站
#    還是每 72 小時被 Task Scheduler 砍一次（10/07、10/10、10/13 都有，靠 watchdog 救回）。
# 2. Windows 服務 Cloudflared 雖然是自動啟動、也在 RUNNING，但 binPath 沒有帶任何參數、
#    LocalSystem 的設定目錄裡也沒有 config.yml——等於空轉。真正在服務流量的是
#    start-server.bat 開出來的那個 console 版 cloudflared，重開機後沒人登入點 bat，Tunnel 就不通。
# 3. kbs0830_Watchdog / GitHubActionsRunner 用 InteractiveToken（只在使用者登入時才跑），
#    Runner 的觸發條件還是「登入時」——重開機後沒登入，監控跟自動部署都不會動。

#Requires -RunAsAdministrator
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$user = "$env:USERDOMAIN\$env:USERNAME"
$cloudflaredConfig = Join-Path $env:USERPROFILE ".cloudflared\config.yml"

# ── 1. 排程工作：拿掉 72 小時上限、不因為電源狀態停止 ─────────────────────────
$settings = New-ScheduledTaskSettingsSet `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew

# S4U = 「不論使用者是否登入都執行」，而且不用存密碼
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType S4U -RunLevel Highest

Write-Host "[1/3] kbs0830_NextJS：取消 72 小時上限"
Set-ScheduledTask -TaskName kbs0830_NextJS -Settings $settings | Out-Null

Write-Host "[2/3] GitHubActionsRunner / kbs0830_Watchdog：開機就跑、不需要登入"
Set-ScheduledTask -TaskName GitHubActionsRunner -Settings $settings -Principal $principal `
  -Trigger (New-ScheduledTaskTrigger -AtStartup) | Out-Null
Set-ScheduledTask -TaskName kbs0830_Watchdog -Principal $principal | Out-Null

# ── 2. Cloudflared 服務：真的帶參數去跑 tunnel ─────────────────────────────────
Write-Host "[3/3] Cloudflared 服務：指定 config 並設定失敗自動重啟"
$link = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links\cloudflared.exe"
$exe = (Get-Item $link).Target   # WinGet Links 是 symlink，服務要指到實體檔
if (-not $exe) { $exe = $link }
if (-not (Test-Path $cloudflaredConfig)) { throw "找不到 $cloudflaredConfig" }

$binPath = "`"$exe`" tunnel --config `"$cloudflaredConfig`" run"
sc.exe config Cloudflared binPath= $binPath start= delayed-auto | Out-Null
# 掛了 5 秒後自動重啟，最多連續 3 次；一天後計數歸零
sc.exe failure Cloudflared reset= 86400 actions= restart/5000/restart/5000/restart/5000 | Out-Null
Restart-Service Cloudflared
Start-Sleep -Seconds 8

# ── 檢查結果 ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==== 檢查 ===="
foreach ($n in "kbs0830_NextJS", "GitHubActionsRunner", "kbs0830_Watchdog") {
  $t = Get-ScheduledTask -TaskName $n
  $limit = $t.Settings.ExecutionTimeLimit
  if (-not $limit) { $limit = "(預設 PT72H!)" }
  "{0,-22} 上限={1,-14} 登入方式={2}" -f $n, $limit, $t.Principal.LogonType
}
$svc = Get-CimInstance Win32_Service -Filter "Name='Cloudflared'"
"Cloudflared 服務         狀態={0} 啟動={1}" -f $svc.State, $svc.StartMode
"  binPath: $($svc.PathName)"
try {
  $ready = Invoke-RestMethod http://127.0.0.1:20241/ready -TimeoutSec 5
  "  tunnel ready connections: $($ready.readyConnections)"
} catch {
  "  (metrics 20241 被 start-server.bat 開的舊 cloudflared 占用時，服務會改用 20242 之類的 port，這行抓不到不代表失敗)"
}
Write-Host ""
Write-Host "預期：三個工作上限都是 PT0S；Runner/Watchdog 登入方式是 S4U；Cloudflared 是 Running、binPath 有 tunnel run。"
Write-Host "確認服務正常後，可以把 start-server.bat 開出來的 cloudflared 黑視窗關掉，以後不用再點 bat。"
