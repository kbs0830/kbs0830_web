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
#
# 2026-11-28（TODO C13）起兩個槽都在乾淨副本 .live\ 裡：.live 是 git worktree，每次部署 checkout origin/main（只有已 push 的程式碼）。
# 以前直接在正式站資料夾 build，好幾個 Claude session 在這裡改到一半、沒 commit 的檔案也會被 build（11/26 兩次 build 失敗；
# build 得過的話更糟：上線了、git 裡卻沒有）。指標檔寫 ".live/.next-a"，server.js 就從 .live 執行，資料、log、node_modules 還是用這裡的。
# 舊格式 ".next-a"（這個資料夾本身的槽）照樣認得：第一次切過去健檢沒過，退回的就是它。
$live = Join-Path $repo ".live"
$pointerFile = Join-Path $repo "data\next-dist-dir.txt"
$activeSlot = if (Test-Path $pointerFile) { (Get-Content $pointerFile -Raw).Trim() } else { ".next" }
$targetName = if ($activeSlot -eq ".live/.next-a") { ".next-b" } else { ".next-a" }
$targetSlot = ".live/$targetName"

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
    # Google：沒有 IndexNow，改成重新提交 sitemap（2026-11-25；11/21 之後加的 16 頁 Google 都不知道，因為它 4 天沒回來讀 sitemap）。
    # 用 Search Console 服務帳號（scripts\lib\search-console.js --submit-sitemap）；沒設 GSC_KEY_FILE 就跳過。失敗只記 log
    try {
        if (-not $changed) { return }
        $out = (& node (Join-Path $PSScriptRoot "lib\search-console.js") --submit-sitemap 2>$null) -join ""
        $r = $out | ConvertFrom-Json
        if ($r.ok) { Log "Google：已重新提交 sitemap" }
        elseif ($r.skipped) { Log "Google sitemap 提交跳過：$($r.skipped)" }
        else { Log "[WARN] Google sitemap 提交失敗：$($r.error)" }
    } catch {
        Log "[WARN] Google sitemap 提交失敗：$($_.Exception.Message)"
    }
}

# 新功能上線（2026-11-12，使用者：「推送新功能（持續 12 小時）就給我櫻花粉」）：這次部署的 commit 裡有 feat 開頭的，
# 就寫 data/feature-release.json（12 小時後到期）；/api/visitor-stats 帶出去，VisitBeacon 把分頁圖示的指示燈點亮成櫻花粉。
# 要在 Update-ResumePdf 之前跑：它會更新 last-deployed-commit.txt。失敗只記 log。
function Update-FeatureRelease {
    $lastFile = Join-Path $repo "data\last-deployed-commit.txt"
    try {
        if (-not (Test-Path $lastFile)) { return }
        $subjects = @(git log --format=%s "$((Get-Content $lastFile -Raw).Trim())..HEAD")
        $feat = $subjects | Where-Object { $_ -match '^feat(\(|:|!)' } | Select-Object -First 1
        if (-not $feat) { return }
        $info = @{ until = (Get-Date).ToUniversalTime().AddHours(12).ToString("o"); title = $feat; commit = (git rev-parse --short HEAD).Trim() }
        [IO.File]::WriteAllText((Join-Path $repo "data\feature-release.json"), ($info | ConvertTo-Json), (New-Object Text.UTF8Encoding($false)))
        Log "新功能上線：$feat → 分頁圖示指示燈亮櫻花粉 12 小時"
    } catch {
        Log "[WARN] feature-release 沒更新：$($_.Exception.Message)"
    }
}

# public/resume.pdf 是 /resume 的列印快照，不會自己更新。內容來源跟上次部署比有變，
# 就對剛上線的正式站重印一份（由 Publish-GeneratedFiles commit）。PDF 每次產生 bytes
# 都不同，所以不能每次部署都印。失敗只記 log，不影響這次部署的結果。
function Update-ResumePdf {
    $lastFile = Join-Path $repo "data\last-deployed-commit.txt"
    $head = (git rev-parse HEAD).Trim()
    try {
        $sources = "src/app/resume", "src/lib/content/page-content.ts", "src/lib/content/about.ts", "src/lib/content/projects.ts", "src/app/globals.css", "src/app/fonts.ts"
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

# Cloudflare 靜態頁快取（scripts/cloudflare-config.ps1 第 5 項）：版本換了就清掉。
# 失敗只寫 log、不擋部署（最壞情況是舊頁面多留一陣子）；token 沒有 Cache Purge 權限時 cloudflare-config 自己會 skip
function Clear-CloudflareCache {
    try {
        & (Join-Path $PSScriptRoot "cloudflare-config.ps1") -Purge -Quiet | Out-Null
        if ($LASTEXITCODE -ne 0) { Log "[WARN] Cloudflare 清快取失敗（exit $LASTEXITCODE），見上一行" }
    } catch { Log "[WARN] Cloudflare 清快取失敗：$($_.Exception.Message)" }
}

function Test-Deploy {
    & (Join-Path $repo "scripts\verify-deploy.ps1") *>&1 | ForEach-Object { Log "  $_" }
    return $LASTEXITCODE -eq 0
}

Set-Location $repo

Log "===== Deploy started ====="

try {
    Log "git fetch origin main"
    git fetch origin main 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { throw "git fetch failed (exit $LASTEXITCODE)" }

    # 正式站資料夾是大家的工作區：盡量跟上（只 fast-forward），跟不上也不擋部署——部署只看 .live
    git merge --ff-only origin/main 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { Log "[WARN] 正式站資料夾沒辦法 fast-forward 到 origin/main（有本機 commit，或沒 commit 的改動擋住）；不影響部署" }

    # 乾淨副本：第一次建 worktree，之後每次強制 checkout origin/main（這裡不會有人改檔案，-f 只會蓋掉上次部署產生的架構圖／PDF）
    if (-not (Test-Path (Join-Path $live ".git"))) {
        Log "建立乾淨副本 .live（git worktree add）"
        git worktree prune
        git worktree add --detach $live origin/main 2>&1 | ForEach-Object { Log "  $_" }
    } else {
        git -C $live checkout -f --detach origin/main 2>&1 | ForEach-Object { Log "  $_" }
    }
    if ($LASTEXITCODE -ne 0) { throw ".live checkout origin/main failed (exit $LASTEXITCODE)" }
    Log "build 的是 $((git -C $live log --oneline -1) -join '')（.live：只有已 push 的程式碼，正式站資料夾裡沒 commit 的改動不會進來）"
    # .env.local 不進 git：複製一份給 build 用（執行時 server.js 會先讀正式站資料夾那份）
    if (Test-Path (Join-Path $repo ".env.local")) { Copy-Item (Join-Path $repo ".env.local") (Join-Path $live ".env.local") -Force }

    # 套件有變才重新安裝，平常部署不多花這一步。比對的是「上次成功 install 時的
    # lockfile 雜湊」（存在 node_modules 裡），不是 pull 前後有沒有變——2026-11 在正式站
    # 目錄直接 git merge，pull 回報 Already up to date，舊判斷就跳過 install、build 失敗。
    # 安裝前先停掉正式站：Windows 會鎖住執行中 process 載入的 native .node 檔
    # （@next/swc、sharp 等），不停掉直接裝會 EPERM，或裝出新舊混雜的 node_modules。
    # 代價是套件更新那次部署會有「install + build」這段時間的停機，換來不會裝壞。
    # node_modules 只有正式站資料夾一份（.live 往上層找）。要的是 .live 那份 lockfile 的套件，但 pnpm install 是照正式站資料夾的 lockfile 裝：
    # 兩份不一樣（正式站資料夾沒 fast-forward 成功）就不能裝，直接失敗、線上不動
    $lockHash = (Get-FileHash (Join-Path $live "pnpm-lock.yaml")).Hash
    $stampFile = Join-Path $repo "node_modules\.deploy-lock-hash"
    $installedHash = if (Test-Path $stampFile) { (Get-Content $stampFile -Raw).Trim() } else { "" }
    if ($lockHash -ne $installedHash) {
        if ((Get-FileHash (Join-Path $repo "pnpm-lock.yaml")).Hash -ne $lockHash) {
            throw "套件有更新，但正式站資料夾的 pnpm-lock.yaml 跟 origin/main 不一樣（上面的 fast-forward 沒成功），不能安裝。先讓正式站資料夾跟上 origin/main 再部署"
        }
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
    # 從這裡開始都在 .live 裡做：架構圖、build、之後的 git diff／履歷 PDF／自動 commit 都對著部署的那個版本
    Set-Location $live

    Log "render architecture diagrams"
    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts\render-diagrams.mjs 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { Log "[WARN] 架構圖預先渲染失敗，這次改由瀏覽器端即時畫" }

    # 有跑 pnpm install 的部署網站已經停了（見上），停站時間 = install + build，2026-11 實測約 35 秒
    $siteState = if ($lockHash -ne $installedHash) { "網站已停（剛裝完套件）" } else { "線上是 $activeSlot，照常服務" }
    Log "next build → $targetSlot（$siteState）"
    $targetPath = Join-Path $live $targetName
    if (Test-Path $targetPath) { Remove-Item $targetPath -Recurse -Force }
    # tsconfig.deploy.json：Next 會往裡面加 <distDir>/types，用副本才不會弄髒 tsconfig.json（見 next.config.ts）
    Copy-Item (Join-Path $live "tsconfig.json") (Join-Path $live "tsconfig.deploy.json") -Force
    # build 時讀到的資料（prerender）跟執行時同一份：正式站資料夾的 data／logs／草稿（server.js 也是設這幾個）
    $env:NEXT_DIST_DIR = $targetName
    $env:DATA_DIR = Join-Path $repo "data"
    $env:LOGS_DIR = Join-Path $repo "logs"
    $env:BLOG_DRAFTS_DIR = Join-Path $repo "content\drafts"
    node (Join-Path $repo "node_modules\next\dist\bin\next") build 2>&1 | ForEach-Object { Log "  $_" }
    $buildExit = $LASTEXITCODE
    Remove-Item Env:NEXT_DIST_DIR, Env:DATA_DIR, Env:LOGS_DIR, Env:BLOG_DRAFTS_DIR
    if ($buildExit -ne 0) { throw "Build failed (exit $buildExit)，線上沒動、還是 $activeSlot" }

    Log "switching $activeSlot → $targetSlot, restarting Next.js (Task Scheduler: kbs0830_NextJS)"
    Switch-Slot $targetSlot
    # Cloudflare 快取的是舊版 HTML，裡面引用的是舊版的 JS chunk——新版 server 不再提供那些檔案。
    # 所以切完槽「馬上」清快取，不能等健檢、IndexNow 跑完（2026-11-10 加 Cloudflare 快取時）
    Clear-CloudflareCache

    Log "verifying deployment"
    if (-not (Test-Deploy) -or $TestRollback) {
        Log "[ROLLBACK] 健檢沒過，指回 $activeSlot"
        Switch-Slot $activeSlot
        Clear-CloudflareCache
        $rolledBack = Test-Deploy
        throw "Deployment verification failed，$(if ($rolledBack) { "已自動退回 $activeSlot，網站正常" } else { '退回上一版後健檢還是沒過，需要人工介入' })"
    }

    Log "===== Deploy succeeded — https://kbs0830.com updated ====="
    # 改用 .live 之前、在正式站資料夾裡的兩個舊槽：上一版也已經在 .live 裡（退回用不到它們）才清掉
    if ($activeSlot -like ".live/*") {
        foreach ($old in ".next-a", ".next-b") {
            $oldPath = Join-Path $repo $old
            if (Test-Path $oldPath) {
                try { Remove-Item $oldPath -Recurse -Force -ErrorAction Stop; Log "清掉舊的 $old（改用 .live 之前的 build 槽）" }
                catch { Log "[WARN] 舊的 $old 沒清掉（可能被 VS Code 鎖住）：$($_.Exception.Message)" }
            }
        }
    }
    Submit-IndexNow
    Update-FeatureRelease
    # Cloudflare 設定有沒有被改掉（www 導向、HTTPS、HSTS、WAF）：只檢查，漂移就寫 log＋寄信，不擋部署
    try { & (Join-Path $PSScriptRoot "cloudflare-config.ps1") -Check -Quiet | Out-Null } catch { Log "[WARN] cloudflare-config 檢查失敗：$($_.Exception.Message)" }
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
    $dirtyNote = if ($script:dirtySource -and $script:dirtySource.Count -gt 0) {
        "`n⚠️ 部署時工作目錄有 $($script:dirtySource.Count) 個還沒 commit 的程式檔（可能是別的 session 改到一半，build 失敗多半是這個原因）：`n" + (($script:dirtySource | Select-Object -First 10) -join "`n") + "`n"
    } else { "" }
    $body = "commit：$(git log --oneline -1)`n錯誤：$($_.Exception.Message)`n$dirtyNote`n完整 log：logs\deploy.log`n`n$($tail -join "`n")"
    Log "通知：$(Send-Alert -Key 'deploy' -CooldownMinutes 0 -Subject '部署失敗' -Body $body)"
    exit 1
}
