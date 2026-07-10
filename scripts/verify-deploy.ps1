# 部署後健檢：確認 server 回應正常，且首頁引用的 JS chunk 真的載得到。
# 這正是之前「process 沒重啟、chunk hash 對不上」導致全白頁面的那個 bug ——
# 這裡直接把它變成一個會讓部署失敗的自動檢查，不會再悄悄留著壞掉的網站。
#
# 實際檢查邏輯在 scripts/lib/health-check.ps1（跟 scripts/watchdog.ps1 共用同一份）。

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

. (Join-Path $PSScriptRoot "lib\health-check.ps1")

Write-Host "等待 server 就緒 · Waiting for server..."

$result = Test-SiteHealth -Url "http://localhost:3000/" -MaxWaitSeconds 30

if (-not $result.Success) {
    Write-Host "[FAILED] $($result.Reason)" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] $($result.Reason)" -ForegroundColor Green
exit 0
