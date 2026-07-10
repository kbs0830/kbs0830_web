# 統一的部署腳本：pull + build + restart + 健檢，manual (deploy.bat) 跟 CI 都呼叫這支，
# 避免兩邊邏輯各自維護、慢慢長歪。所有步驟都會帶時間戳寫進 logs/deploy.log，
# 之後要查「上次到底幾點部署的、有沒有過健檢」直接看這個檔案就好。

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$logFile = Join-Path $repo "logs\deploy.log"

. (Join-Path $PSScriptRoot "lib\logger.ps1")
function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }

Set-Location $repo

Log "===== Deploy started ====="

try {
    Log "git pull origin main"
    git pull origin main 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { throw "git pull failed (exit $LASTEXITCODE)" }

    Log "next build"
    node node_modules\next\dist\bin\next build 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { throw "Build failed (exit $LASTEXITCODE)" }

    Log "restarting Next.js (Task Scheduler: kbs0830_NextJS)"
    Stop-ScheduledTask -TaskName "kbs0830_NextJS" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Start-ScheduledTask -TaskName "kbs0830_NextJS"

    Log "verifying deployment"
    & (Join-Path $repo "scripts\verify-deploy.ps1") *>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { throw "Deployment verification failed" }

    Log "===== Deploy succeeded — https://kbs0830.com updated ====="
    exit 0
}
catch {
    Log "[FAILED] $($_.Exception.Message)"
    Log "===== Deploy FAILED ====="
    exit 1
}
