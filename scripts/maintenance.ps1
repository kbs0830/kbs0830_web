# 維修模式開關（2026-11-12）：網站顯示「維修中」頁（503，分頁圖示是琥珀色的視窗），watchdog 暫停自動重啟。
#   powershell -File scripts\maintenance.ps1 -On "升級桌機硬碟，預計 30 分鐘"
#   powershell -File scripts\maintenance.ps1 -Off
#   powershell -File scripts\maintenance.ps1          （看現在的狀態）
# 不用重啟：scripts\server.js 每個請求都看 data\maintenance.flag 在不在。
# 注意：Cloudflare 快取裡的頁面還是會照常給訪客（那是好事：大部分頁面維修中也看得到），沒快取到的才看到維修頁。
# 開超過 12 小時 watchdog 會寄信提醒（怕忘了關）。
param([string]$On, [switch]$Off)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$repo = Split-Path -Parent $PSScriptRoot
$flag = Join-Path $repo "data\maintenance.flag"
. (Join-Path $PSScriptRoot "lib\logger.ps1")
$logFile = Join-Path $repo "logs\watchdog.log"

if ($On) {
    New-Item -ItemType Directory -Path (Split-Path $flag) -Force | Out-Null
    [IO.File]::WriteAllText($flag, $On, (New-Object Text.UTF8Encoding($false)))
    Write-TimestampedLog -LogFile $logFile -Message "[MAINTENANCE] 維修模式開啟：$On"
    Write-Host "維修模式：開（$On）"
} elseif ($Off) {
    if (Test-Path $flag) { Remove-Item $flag -Force }
    Write-TimestampedLog -LogFile $logFile -Message "[MAINTENANCE] 維修模式關閉"
    Write-Host "維修模式：關"
} elseif (Test-Path $flag) {
    $since = (Get-Item $flag).LastWriteTime
    Write-Host "維修模式：開（從 $since 起）：$([IO.File]::ReadAllText($flag))"
} else {
    Write-Host "維修模式：關"
}
