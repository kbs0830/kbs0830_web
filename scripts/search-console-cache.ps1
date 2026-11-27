# Search Console 搜尋成效快取（TODO G9，2026-11-26）：給站長後台 /admin/reports 顯示「Google 搜尋字詞」用。
#
# 抓近 28 天的搜尋成效（點擊、曝光、搜尋字詞、頁面），寫到 data\search-console.json（不進 git）。
# 只抓成效、不逐網址查索引，幾秒就好；Search Console 的資料晚 2～3 天，一天抓一次就夠。
# 認證用 .env.local 的 GSC_KEY_FILE（唯讀服務帳號，見 scripts\lib\search-console.js）；沒設就什麼都不做。
#
# 由 watchdog.ps1 每 5 分鐘帶 -IfOlderThanHours 24 呼叫，超過 24 小時沒更新才真的抓。失敗只記 log、不寄信（舊的快取照樣顯示更新時間）。
# 手動跑：powershell -File scripts\search-console-cache.ps1

param([int]$IfOlderThanHours = 0)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$cacheFile = Join-Path $repo "data\search-console.json"
$logFile = Join-Path $repo "logs\search-console.log"

$indexFile = Join-Path $repo "data\search-index.json"
$indexTry = Join-Path $repo "data\search-index.try"

$cacheFresh = $IfOlderThanHours -gt 0 -and (Test-Path $cacheFile) -and
    (Get-Item $cacheFile).LastWriteTime -gt (Get-Date).AddHours(-$IfOlderThanHours)
# 收錄狀態（TODO V6，2026-11-27）：每週一次、逐網址問 URL Inspection API（約 1～2 分鐘，所以丟到背景跑，不卡住 watchdog）。
# 結果寫 data\search-index.json，後台報表的「Google 收錄狀態」讀它。失敗也記一次嘗試（search-index.try），6 小時內不重試，免得每 5 分鐘打一次 API
$indexDue = $IfOlderThanHours -gt 0 -and
    (-not (Test-Path $indexFile) -or (Get-Item $indexFile).LastWriteTime -lt (Get-Date).AddDays(-7)) -and
    (-not (Test-Path $indexTry) -or (Get-Item $indexTry).LastWriteTime -lt (Get-Date).AddHours(-6))

if ($cacheFresh -and -not $indexDue) { exit 0 }

. (Join-Path $PSScriptRoot "lib\logger.ps1")
function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }

if ($indexDue) {
    Set-Content -Path $indexTry -Value (Get-Date -Format o)
    Start-Process -FilePath "node" -ArgumentList ('"' + (Join-Path $PSScriptRoot "lib\search-console.js") + '" --index') -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $repo "logs\search-index.out") -RedirectStandardError (Join-Path $repo "logs\search-index.err")
    Log "[OK] 收錄狀態檢查已在背景啟動（結果 data\search-index.json、輸出 logs\search-index.out）"
}

if (-not $cacheFresh) {
    $out = & node (Join-Path $PSScriptRoot "lib\search-console.js") --cache 2>&1
    if ($LASTEXITCODE -eq 0) {
        Log "[OK] 搜尋成效快取已更新：$out"
    } else {
        # 例如沒設 GSC_KEY_FILE（skipped）、網路不通、金鑰過期：只記 log。下一輪（5 分鐘後）watchdog 會再試，所以這裡把戳記往後挪一下避免狂打 API
        Log "[WARN] 搜尋成效快取沒更新：$out"
        if (Test-Path $cacheFile) { (Get-Item $cacheFile).LastWriteTime = (Get-Date).AddHours(-$IfOlderThanHours + 1) }
    }
}
exit 0
