# 每月外部連結檢查（TODO C8，2026-11-26）：作品的 GitHub 連結、文章引用的網址壞掉就寄信。
#
# 從本機網站（預設 http://localhost:3000）的 sitemap 逐頁抓 HTML，收集指到別的網站的連結，逐一確認還活著
# （邏輯在 scripts\lib\link-check.js；擋機器人的 401/403/429/999 不算壞）。結果寫 data\link-check.json 與 logs\link-check.log。
#   - 沒有壞連結：不寄信（一個月沒收到信＝正常），只記 log
#   - 有壞連結：寄一封列出「哪個網址、哪幾頁用到」的信；沒壞掉之前每 7 天最多再寄一次
#
# 由 watchdog.ps1 每 5 分鐘帶 -IfOlderThanDays 30 呼叫，超過 30 天沒檢查過才真的跑。
# 手動跑：powershell -File scripts\link-check.ps1 [-BaseUrl http://localhost:3200]

param([int]$IfOlderThanDays = 0, [string]$BaseUrl = "http://localhost:3000")

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$resultFile = Join-Path $repo "data\link-check.json"
$logFile = Join-Path $repo "logs\link-check.log"

if ($IfOlderThanDays -gt 0 -and (Test-Path $resultFile) -and
    (Get-Item $resultFile).LastWriteTime -gt (Get-Date).AddDays(-$IfOlderThanDays)) {
    exit 0
}

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")
function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }

Log "=== 外部連結檢查開始（$BaseUrl）==="
$out = & node (Join-Path $PSScriptRoot "link-check.js") --base $BaseUrl 2>&1
$code = $LASTEXITCODE
foreach ($line in $out) { Log "  $line" }

if ($code -eq 0) {
    Log "[OK] 外部連結都還活著"
    Remove-Item (Join-Path $script:AlertStateDir "link-check.last") -ErrorAction SilentlyContinue
    exit 0
}
if ($code -eq 2) {
    # 檢查本身失敗（網站連不到之類）：不寫 stamp 以外的東西，watchdog 下一輪再試；網站掛掉由 watchdog 自己通知
    Log "[WARN] 連結檢查沒跑完：$($out -join ' ')"
    Remove-Item $resultFile -ErrorAction SilentlyContinue
    exit 2
}

$r = Send-Alert -Key "link-check" -CooldownMinutes 10080 -Subject "🔗 網站有外部連結壞掉了" -Body ("每月外部連結檢查發現壞掉的連結（對方擋機器人的不算）：`n`n" + (($out | Where-Object { $_ -match '✗|壞掉' }) -join "`n") + "`n`n修好之前每 7 天最多再提醒一次。完整結果：data\link-check.json")
Log "  通知：$r"
exit 1
