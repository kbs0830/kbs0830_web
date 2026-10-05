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
    $lockBefore = (Get-FileHash (Join-Path $repo "pnpm-lock.yaml")).Hash

    Log "git pull origin main"
    git pull origin main 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { throw "git pull failed (exit $LASTEXITCODE)" }

    # 套件有變（pnpm-lock.yaml 雜湊不同）才重新安裝，平常部署不多花這一步。
    # 安裝前先停掉正式站：Windows 會鎖住執行中 process 載入的 native .node 檔
    # （@next/swc、sharp 等），不停掉直接裝會 EPERM，或裝出新舊混雜的 node_modules。
    # 代價是套件更新那次部署會有「install + build」這段時間的停機，換來不會裝壞。
    if ((Get-FileHash (Join-Path $repo "pnpm-lock.yaml")).Hash -ne $lockBefore) {
        Log "pnpm-lock.yaml changed — stopping Next.js before pnpm install"
        Stop-ScheduledTask -TaskName "kbs0830_NextJS" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2

        # 跟 package.json scripts 同一個思路：直接用 node 執行 pnpm 的 JS 入口，
        # 不依賴 runner 執行環境的 PATH 有沒有 pnpm。
        $pnpmEntry = Join-Path $env:APPDATA "npm\node_modules\pnpm\bin\pnpm.cjs"
        Log "pnpm install --frozen-lockfile"
        if (Test-Path $pnpmEntry) {
            node $pnpmEntry install --frozen-lockfile 2>&1 | ForEach-Object { Log "  $_" }
        } else {
            pnpm install --frozen-lockfile 2>&1 | ForEach-Object { Log "  $_" }
        }
        if ($LASTEXITCODE -ne 0) { throw "pnpm install failed (exit $LASTEXITCODE)" }
    }

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
