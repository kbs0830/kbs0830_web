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

# IndexNow：網站內容跟上次部署比有變，就把 sitemap 裡的網址通知 Bing（ChatGPT 搜尋、Copilot
# 用的就是 Bing 的索引）、Yandex 等，不用等它們自己來爬。Google 不支援 IndexNow，靠 sitemap。
# 金鑰檔是 public/<key>.txt（搜尋引擎抓它來確認網站是我們的），換金鑰要兩邊一起換。
# 要在 Update-ResumePdf 之前跑：它會更新 last-deployed-commit.txt。失敗只記 log。
$indexNowKey = "9e53d4be27b74af07737c631c0d7721e"
function Submit-IndexNow {
    $lastFile = Join-Path $repo "data\last-deployed-commit.txt"
    try {
        if (-not (Test-Path $lastFile)) { return }
        $changed = git diff --name-only (Get-Content $lastFile -Raw).Trim() HEAD -- src content public
        if (-not $changed) { return }
        $sitemap = [xml](Invoke-WebRequest "https://kbs0830.com/sitemap.xml" -UseBasicParsing -TimeoutSec 15).Content
        $urls = @($sitemap.urlset.url | ForEach-Object { $_.loc })
        $body = @{
            host        = "kbs0830.com"
            key         = $indexNowKey
            keyLocation = "https://kbs0830.com/$indexNowKey.txt"
            urlList     = $urls
        } | ConvertTo-Json
        $resp = Invoke-WebRequest "https://api.indexnow.org/indexnow" -Method Post -Body $body `
            -ContentType "application/json; charset=utf-8" -UseBasicParsing -TimeoutSec 20
        Log "IndexNow：已通知 $($urls.Count) 個網址（HTTP $($resp.StatusCode)）"
    } catch {
        Log "[WARN] IndexNow 通知失敗：$($_.Exception.Message)"
    }
}

# public/resume.pdf 是 /resume 的列印快照，不會自己更新。內容來源跟上次部署比有變，
# 就對剛上線的正式站重印一份（由 Publish-GeneratedFiles commit）。PDF 每次產生 bytes
# 都不同，所以不能每次部署都印。失敗只記 log，不影響這次部署的結果。
function Update-ResumePdf {
    $lastFile = Join-Path $repo "data\last-deployed-commit.txt"
    $head = (git rev-parse HEAD).Trim()
    try {
        $sources = "src/app/resume", "src/lib/about.ts", "src/lib/projects.ts", "src/app/globals.css", "src/app/fonts.ts"
        $changed = if (Test-Path $lastFile) { git diff --name-only (Get-Content $lastFile -Raw).Trim() $head -- $sources }
        if ($changed) {
            Log "resume 內容有變（$($changed -join ', ')），重新產生 public/resume.pdf"
            node scripts\generate-resume-pdf.js 2>&1 | ForEach-Object { Log "  $_" }
            if ($LASTEXITCODE -ne 0) { throw "generate-resume-pdf.js 失敗 (exit $LASTEXITCODE)" }
        }
        # 只有成功（或沒變）才記下這次的 commit；失敗的話下次部署會再試一次
        Set-Content -Path $lastFile -Value $head -NoNewline
    } catch {
        Log "[WARN] 履歷 PDF 沒有更新：$($_.Exception.Message)"
    }
}

# 部署過程中自動產生的檔案（架構圖 SVG、履歷 PDF）有變就 commit + push，repo 才會跟線上一致。
# push 會再觸發一次部署，那次這兩樣都不會再變，所以不會無限循環。
function Publish-GeneratedFiles {
    $paths = "src/generated", "public/resume.pdf"
    if (-not (git status --porcelain -- $paths)) { return }
    try {
        git add -A -- $paths
        git commit -q -m "chore: 自動更新部署產生的檔案（架構圖 SVG／履歷 PDF）" 2>&1 | ForEach-Object { Log "  $_" }
        git push -q origin HEAD:main 2>&1 | ForEach-Object { Log "  $_" }
        if ($LASTEXITCODE -ne 0) { throw "push 失敗 (exit $LASTEXITCODE)" }
        Log "已 commit 並 push 自動產生的檔案"
    } catch {
        Log "[WARN] 自動產生的檔案沒有推上去：$($_.Exception.Message)"
    }
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

    # 架構圖預先畫成 SVG（只畫新增／改過的，沒變就秒過）。失敗不擋部署：ArchitectureDiagram
    # 找不到 SVG 會退回瀏覽器端即時渲染，網站照常
    Log "render architecture diagrams"
    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts\render-diagrams.mjs 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { Log "[WARN] 架構圖預先渲染失敗，這次改由瀏覽器端即時畫" }

    # 有跑 pnpm install 的部署網站已經停了（見上），停站時間 = install + build，2026-11 實測約 35 秒
    $siteState = if ($lockHash -ne $installedHash) { "網站已停（剛裝完套件）" } else { "線上是 $activeSlot，照常服務" }
    Log "next build → $targetSlot（$siteState）"
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
    Submit-IndexNow
    Update-ResumePdf
    Publish-GeneratedFiles
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
