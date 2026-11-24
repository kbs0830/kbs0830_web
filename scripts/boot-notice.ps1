# 開機通知信（決策表 C2，2026-11-25）：桌機重開機後寄一封到 otemon——停了多久、是怎麼停的。
#
# 由 watchdog.ps1 每 5 分鐘呼叫；LastBootUpTime 跟上次記的一樣就直接結束（data\alerts\last-boot.txt）。
# 第一次跑（沒有紀錄）只記下來、不寄。
#
# 「停了多久」：data\uptime.log 開機前最後一行（watchdog 每 5 分鐘一行）→ 開機時間，誤差 5 分鐘內。
# 「怎麼停的」：系統事件記錄（一般權限就讀得到）
#   - 1074（User32）：有人或某個程式要求關機／重開（開始選單、Windows Update……），看得到是哪個程式
#   - 6006：正常關機走完了
#   - 41（Kernel-Power）／6008：上次沒有正常關機——停電、當機、按住電源鍵。有 1074 又有 41＝關機卡住被強制斷電
# Windows PowerShell 5.1 跑：不能用 ??、?.、三元運算子；檔案要 UTF-8 with BOM。
# 手動：powershell -File scripts\boot-notice.ps1 -DryRun（只印不寄、不記）；-TestBoot "2026-11-23 22:46" 拿過去某次開機來試判斷

param([switch]$DryRun, [string]$TestBoot)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$stateFile = Join-Path $repo "data\alerts\last-boot.txt"
$uptimeFile = Join-Path $repo "data\uptime.log"
$logFile = Join-Path $repo "logs\watchdog.log"

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")

$boot = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
if ($TestBoot) { $boot = [datetime]::Parse($TestBoot); $DryRun = [switch]::new($true) }
$bootKey = $boot.ToString("yyyy-MM-ddTHH:mm:ss")
$known = $null
if (Test-Path $stateFile) { $known = ([IO.File]::ReadAllText($stateFile)).Trim() }
if (-not $DryRun) {
    if ($known -eq $bootKey) { exit 0 }
    if (-not $known) {
        New-Item -ItemType Directory -Force -Path (Split-Path $stateFile) | Out-Null
        [IO.File]::WriteAllText($stateFile, $bootKey)
        exit 0
    }
}

# --- 開機前最後一次 watchdog 紀錄 ---
$lastAlive = $null
if (Test-Path $uptimeFile) {
    $tail = Get-Content $uptimeFile -Tail 3000
    for ($i = $tail.Count - 1; $i -ge 0; $i--) {
        $t = ($tail[$i] -split " ")[0]
        try { $dt = [datetime]::Parse($t) } catch { continue }
        if ($dt -lt $boot) { $lastAlive = $dt; break }
    }
}

# --- 系統事件 ---
$from = $boot.AddHours(-24)
if ($lastAlive) { $from = $lastAlive.AddMinutes(-1) }
$events = @()
try {
    $events = @(Get-WinEvent -FilterHashtable @{ LogName = "System"; Id = 41, 6008, 1074, 6006; StartTime = $from; EndTime = $boot.AddMinutes(5) } -ErrorAction Stop)
} catch {}
$requested = @($events | Where-Object { $_.Id -eq 1074 })
$clean = @($events | Where-Object { $_.Id -eq 6006 }).Count -gt 0
$unclean = @($events | Where-Object { $_.Id -eq 41 -or $_.Id -eq 6008 }).Count -gt 0

$lines = @()
$why = "原因不明"
if ($requested.Count -gt 0) {
    $e = $requested[0]  # Get-WinEvent 新的在前：取最後一次要求
    # Properties：0=程式、2=原因、4=關機／重新啟動、6=使用者（訊息文字會依系統語系變，所以用欄位）
    $proc = (Split-Path -Leaf ([string]$e.Properties[0].Value)) -replace ' \(.*\)$', ''  # 後面會帶「 (電腦名稱)」
    $kind = [string]$e.Properties[4].Value
    $who = "$proc 要求$kind"
    if ($proc -match "StartMenuExperienceHost|explorer|shutdown\.exe|winlogon") { $who = "從開始選單／指令手動$kind" }
    elseif ($proc -match "TrustedInstaller|MoUsoCoreWorker|usoclient|wuauclt|svchost") { $who = "Windows Update $kind" }
    $why = $who
    $lines += "要求的時間：$($e.TimeCreated.ToString('MM/dd HH:mm'))（$proc）"
    if ($unclean -and -not $clean) { $why += "，但關機沒有走完（卡住後被強制斷電？）" }
    elseif ($unclean) { $why += "（開機時系統還是記了一筆非正常關機，關機過程可能卡住）" }
} elseif ($unclean) {
    $why = "非正常關機：停電、當機或按住電源鍵（Kernel-Power 41）"
} elseif ($clean) {
    $why = "正常關機（沒有記到是誰要求的）"
}

$down = ""
if ($lastAlive) {
    $mins = [math]::Round(($boot - $lastAlive).TotalMinutes)
    if ($mins -ge 120) { $down = "約 $([math]::Round($mins / 60, 1)) 小時" } else { $down = "約 $mins 分鐘" }
}

$body = @()
$body += "桌機 $($boot.ToString('yyyy-MM-dd HH:mm')) 開機。"
if ($lastAlive) { $body += "開機前最後一次 watchdog 紀錄：$($lastAlive.ToString('yyyy-MM-dd HH:mm'))，停了$down（5 分鐘一筆，誤差 5 分鐘內）。" }
else { $body += "data\uptime.log 找不到開機前的紀錄，不知道停了多久。" }
$body += "怎麼停的：$why"
$body += $lines
$body += ""
$body += "開機後的服務：NextJS／Runner 約 20 秒、Cloudflared 約 2 分 20 秒（延遲自動啟動）才起來，這段外網 530 是正常的。"
$body += "watchdog 之後每 5 分鐘照常檢查；網站沒起來會另外寄信。"
$body += "現況：https://kbs0830.com/status"
$text = $body -join "`n"

$subjectWhy = "原因不明"
if ($why.StartsWith("非正常")) { $subjectWhy = "疑似停電／當機" }
elseif ($requested.Count -gt 0) { $subjectWhy = ($why -split "，|（")[0] }
elseif ($clean) { $subjectWhy = "正常關機" }
$subject = "🔌 桌機重新開機（$subjectWhy"
if ($down) { $subject += "，停了$down" }
$subject += "）"

if ($DryRun) { $subject; $text; exit 0 }

$r = Send-AlertMail -Subject $subject -Body $text
Write-TimestampedLog -LogFile $logFile -Message "[BOOT] $($boot.ToString('o')) 開機（$why）通知：$r"
# 寄出去或根本沒設定寄信才記下來；寄失敗下一輪再試
if ($r -like "sent*" -or $r -like "skipped*") { [IO.File]::WriteAllText($stateFile, $bootKey) }
