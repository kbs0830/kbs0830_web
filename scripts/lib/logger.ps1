# 共用的時間戳記 log 寫入邏輯，被 deploy.ps1 / watchdog.ps1 共用。
# 統一格式方便之後直接用同一套工具（例如 tail、grep）去看不同腳本的 log，
# 也統一做 5MB 自動輪替（跟 scripts/server.js 的 rotateIfNeeded 邏輯一致）。

$script:MAX_LOG_BYTES = 5MB

function Write-TimestampedLog {
    param(
        [Parameter(Mandatory)] [string]$LogFile,
        [Parameter(Mandatory)] [string]$Message
    )

    $logDir = Split-Path -Parent $LogFile
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

    if ((Test-Path $LogFile) -and (Get-Item $LogFile).Length -gt $script:MAX_LOG_BYTES) {
        Remove-Item "$LogFile.1" -Force -ErrorAction SilentlyContinue
        Rename-Item $LogFile "$LogFile.1" -Force
    }

    $line = "[$(Get-Date -Format o)] $Message"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding utf8
}
