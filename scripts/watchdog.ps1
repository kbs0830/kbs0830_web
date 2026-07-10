# 定期健康檢查：確認 kbs0830.com 的 origin（localhost:3000）還活著，
# 如果沒有回應就自動透過 Task Scheduler 重啟 kbs0830_NextJS。
#
# 背景：Cloudflare Tunnel 跟 Next.js server 是兩個獨立的行程，tunnel 掛了不代表
# origin 也會掛——之前發生過 node.exe 無聲死掉、tunnel 卻繼續轉發，導致訪客
# 看了好幾小時的 "connection refused" 都沒人發現。這支腳本補上那個監控空缺。
#
# 健康檢查邏輯共用 scripts/lib/health-check.ps1（跟 verify-deploy.ps1 同一份，
# 只維護一份邏輯）。由 Task Scheduler 排程「kbs0830_Watchdog」每 5 分鐘執行一次。

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$logFile = Join-Path $repo "logs\watchdog.log"
$taskName = "kbs0830_NextJS"

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\health-check.ps1")

function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }

$result = Test-SiteHealth -Url "http://localhost:3000/" -MaxWaitSeconds 10

if ($result.Success) {
    # 正常時不寫 log，避免每 5 分鐘一筆灌爆 watchdog.log；只在異常/處理過程才記錄。
    exit 0
}

Log "[WARN] 健康檢查失敗：$($result.Reason)"
Log "嘗試重啟 Task Scheduler 工作 '$taskName'"

try {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-ScheduledTask -TaskName $taskName

    $recovery = Test-SiteHealth -Url "http://localhost:3000/" -MaxWaitSeconds 30

    if ($recovery.Success) {
        Log "[RECOVERED] 重啟後恢復正常：$($recovery.Reason)"
        exit 0
    } else {
        Log "[FAILED] 重啟後仍然異常：$($recovery.Reason) —— 需要人工介入"
        exit 1
    }
} catch {
    Log "[FAILED] 重啟過程發生錯誤：$($_.Exception.Message)"
    exit 1
}
