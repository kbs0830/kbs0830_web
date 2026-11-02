# 統一的部署腳本：pull + build + restart + 健檢，manual (deploy.bat) 跟 CI 都呼叫這支，
# 避免兩邊邏輯各自維護、慢慢長歪。所有步驟都會帶時間戳寫進 logs/deploy.log，
# 之後要查「上次到底幾點部署的、有沒有過健檢」直接看這個檔案就好。

# -TestRollback：切換新版之後故意當成健檢失敗，驗證自動退回上一版真的會動（只給手動測試用）
param([switch]$TestRollback)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$logFile = Join-Path $repo "logs\deploy.log"

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")
function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }

# 兩個 build 槽 .next-a / .next-b 輪流用：build 到「沒在線上」那槽（線上照常服務，build 失敗
# 完全不影響），成功才改 data\next-dist-dir.txt 指過去、重啟；健檢沒過就指回原本那槽再重啟。
# 不搬資料夾：VS Code 的 TypeScript 服務會鎖住 tsconfig 收進去的 <distDir>/types，
# 2026-11 第一版用「.next-build 改名成 .next」就是撞到這個鎖（Access denied）。
$pointerFile = Join-Path $repo "data\next-dist-dir.txt"
$activeSlot = if (Test-Path $pointerFile) { (Get-Content $pointerFile -Raw).Trim() } else { ".next" }
$targetSlot = if ($activeSlot -eq ".next-a") { ".next-b" } else { ".next-a" }

function Stop-Site {
    Stop-ScheduledTask -TaskName "kbs0830_NextJS" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

function Switch-Slot($slot) {
    Stop-Site
    Set-Content -Path $pointerFile -Value $slot -NoNewline
    Start-ScheduledTask -TaskName "kbs0830_NextJS"
}

function Test-Deploy {
    & (Join-Path $repo "scripts\verify-deploy.ps1") *>&1 | ForEach-Object { Log "  $_" }
    return $LASTEXITCODE -eq 0
}

Set-Location $repo

Log "===== Deploy started ====="

try {
    Log "git pull origin main"
    git pull origin main 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { throw "git pull failed (exit $LASTEXITCODE)" }

    # 套件有變才重新安裝，平常部署不多花這一步。比對的是「上次成功 install 時的
    # lockfile 雜湊」（存在 node_modules 裡），不是 pull 前後有沒有變——2026-11 在正式站
    # 目錄直接 git merge，pull 回報 Already up to date，舊判斷就跳過 install、build 失敗。
    # 安裝前先停掉正式站：Windows 會鎖住執行中 process 載入的 native .node 檔
    # （@next/swc、sharp 等），不停掉直接裝會 EPERM，或裝出新舊混雜的 node_modules。
    # 代價是套件更新那次部署會有「install + build」這段時間的停機，換來不會裝壞。
    $lockHash = (Get-FileHash (Join-Path $repo "pnpm-lock.yaml")).Hash
    $stampFile = Join-Path $repo "node_modules\.deploy-lock-hash"
    $installedHash = if (Test-Path $stampFile) { (Get-Content $stampFile -Raw).Trim() } else { "" }
    if ($lockHash -ne $installedHash) {
        Log "node_modules out of date with pnpm-lock.yaml — stopping Next.js before pnpm install"
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
        Set-Content -Path $stampFile -Value $lockHash -NoNewline
    }

    Log "next build → $targetSlot（線上是 $activeSlot，照常服務）"
    $targetPath = Join-Path $repo $targetSlot
    if (Test-Path $targetPath) { Remove-Item $targetPath -Recurse -Force }
    # tsconfig.deploy.json：Next 會往裡面加 <distDir>/types，用副本才不會弄髒 tsconfig.json（見 next.config.ts）
    Copy-Item (Join-Path $repo "tsconfig.json") (Join-Path $repo "tsconfig.deploy.json") -Force
    $env:NEXT_DIST_DIR = $targetSlot
    node node_modules\next\dist\bin\next build 2>&1 | ForEach-Object { Log "  $_" }
    $buildExit = $LASTEXITCODE
    Remove-Item Env:NEXT_DIST_DIR
    if ($buildExit -ne 0) { throw "Build failed (exit $buildExit)，線上沒動、還是 $activeSlot" }

    Log "switching $activeSlot → $targetSlot, restarting Next.js (Task Scheduler: kbs0830_NextJS)"
    Switch-Slot $targetSlot

    Log "verifying deployment"
    if (-not (Test-Deploy) -or $TestRollback) {
        Log "[ROLLBACK] 健檢沒過，指回 $activeSlot"
        Switch-Slot $activeSlot
        $rolledBack = Test-Deploy
        throw "Deployment verification failed，$(if ($rolledBack) { "已自動退回 $activeSlot，網站正常" } else { '退回上一版後健檢還是沒過，需要人工介入' })"
    }

    Log "===== Deploy succeeded — https://kbs0830.com updated ====="
    $notified = Clear-Alert -Key "deploy" -Subject "部署已恢復正常" -Body "$(git log --oneline -1) 部署成功，網站已更新。"
    if ($notified) { Log "通知：$notified" }
    exit 0
}
catch {
    Log "[FAILED] $($_.Exception.Message)"
    # pnpm install 那條路會先停站；之後 build 失敗的話站還是停著，至少把舊版拉起來
    if ((Get-ScheduledTask -TaskName "kbs0830_NextJS").State -ne "Running") {
        Log "Next.js 沒在跑，用現有的 .next 重新啟動"
        Start-ScheduledTask -TaskName "kbs0830_NextJS"
    }
    Log "===== Deploy FAILED ====="
    # 附上這次部署的 log 尾巴（從 Deploy started 那行起），收信就看得到卡在哪
    $lines = Get-Content $logFile -Encoding utf8
    $start = ($lines | Select-String -Pattern "===== Deploy started =====" | Select-Object -Last 1).LineNumber
    $tail = if ($start) { $lines[($start - 1)..($lines.Count - 1)] | Select-Object -Last 40 } else { $lines | Select-Object -Last 40 }
    $body = "commit：$(git log --oneline -1)`n錯誤：$($_.Exception.Message)`n`n完整 log：logs\deploy.log`n`n$($tail -join "`n")"
    Log "通知：$(Send-Alert -Key 'deploy' -CooldownMinutes 0 -Subject '部署失敗' -Body $body)"
    exit 1
}
