# 每日備份：把「不在 git 裡、壞了會真的不見」的東西存兩份。
#   1. 本機 D:\Backups\kbs0830\<日期>\：原檔直接放（跟來源同一台機器、同等信任），保留 30 份。
#      D: 是另一顆實體硬碟（C: 是 NVMe、D: 是 HDD），C: 壞掉時還在
#   2. GitHub 私有 repo kbs0830/kbs0830_backup：整包 tar.gz 用 AES-256 加密後 commit，
#      git 歷史就是版本紀錄。整台桌機壞掉／失竊時靠這份——解密金鑰要另外存在密碼管理器
#
# 由 watchdog.ps1 每 5 分鐘帶 -IfOlderThanHours 24 呼叫（不另開排程工作：建排程要管理員權限），
# 超過 24 小時沒成功備份才真的跑。手動跑：powershell -File scripts\backup.ps1
# 還原方式見 CLAUDE.md「自動備份」。

param([int]$IfOlderThanHours = 0)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$userHome = if ($env:USERPROFILE) { $env:USERPROFILE } else { "C:\Users\$env:USERNAME" }
$backupRoot = "D:\Backups\kbs0830"
$githubDir = Join-Path $backupRoot "github"
$stampFile = Join-Path $backupRoot "last-success.txt"
$keyFile = Join-Path $userHome ".kbs0830-backup-key"
$keepLocal = 30
$openssl = "C:\Program Files\Git\mingw64\bin\openssl.exe"
$tar = "$env:SystemRoot\System32\tar.exe"
$logFile = Join-Path $repo "logs\backup.log"

if ($IfOlderThanHours -gt 0 -and (Test-Path $stampFile) -and
    (Get-Item $stampFile).LastWriteTime -gt (Get-Date).AddHours(-$IfOlderThanHours)) {
    exit 0
}

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")
function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }

function Copy-IfExists($from, $to) {
    if (-not (Test-Path $from)) { Log "  （略過，不存在）$from"; return }
    New-Item -ItemType Directory -Path (Split-Path -Parent $to) -Force | Out-Null
    Copy-Item -Path $from -Destination $to -Recurse -Force
}

try {
    $stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
    $dest = Join-Path $backupRoot $stamp
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Log "===== Backup started → $dest ====="

    # --- 檔案 ---
    Copy-IfExists (Join-Path $repo ".env.local") (Join-Path $dest "env\.env.local")
    Copy-IfExists (Join-Path $userHome ".cloudflared") (Join-Path $dest "cloudflared")
    Copy-IfExists (Join-Path $repo "data\visitor-stats.json") (Join-Path $dest "data\visitor-stats.json")
    Copy-IfExists (Join-Path $repo "data\web-vitals.json") (Join-Path $dest "data\web-vitals.json")
    Copy-IfExists (Join-Path $repo "data\raw-traffic.json") (Join-Path $dest "data\raw-traffic.json")
    Copy-IfExists (Join-Path $repo "data\cloudflare-daily.json") (Join-Path $dest "data\cloudflare-daily.json")
    Copy-IfExists (Join-Path $repo "data\visits-detail.json") (Join-Path $dest "data\visits-detail.json")  # 訪客分析（2026-11-12）
    Copy-IfExists (Join-Path $repo ".git\config") (Join-Path $dest "git\config")
    foreach ($name in "deploy.log", "watchdog.log", "backup.log") {
        Copy-IfExists (Join-Path $repo "logs\$name") (Join-Path $dest "logs\$name")
    }

    # --- 系統設定（不在任何檔案裡，只活在 Task Scheduler / 服務設定）---
    $tasksDir = Join-Path $dest "tasks"
    New-Item -ItemType Directory -Path $tasksDir -Force | Out-Null
    foreach ($task in "kbs0830_NextJS", "GitHubActionsRunner", "kbs0830_Watchdog") {
        $xml = schtasks /query /tn $task /xml 2>$null
        if ($LASTEXITCODE -eq 0) { $xml | Out-File (Join-Path $tasksDir "$task.xml") -Encoding Unicode }
        else { Log "  （略過，查不到排程工作）$task" }
    }
    @(sc.exe qc Cloudflared; sc.exe qfailure Cloudflared) | Out-File (Join-Path $dest "cloudflared-service.txt") -Encoding utf8

    @(
        "kbs0830 backup $stamp ($env:COMPUTERNAME)"
        "site commit: $(git -C $repo log --oneline -1)"
        ""
        Get-ChildItem $dest -Recurse -File | ForEach-Object { "{0,10}  {1}" -f $_.Length, $_.FullName.Substring($dest.Length + 1) }
    ) | Out-File (Join-Path $dest "manifest.txt") -Encoding utf8

    # --- 本機只留最近 30 份 ---
    Get-ChildItem $backupRoot -Directory | Where-Object Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' |
        Sort-Object Name -Descending | Select-Object -Skip $keepLocal | Remove-Item -Recurse -Force

    # 本機那份完成就算「今天備份過」：GitHub 失敗時不能讓 watchdog 每 5 分鐘重跑、
    # 每次多一個本機資料夾把好的備份擠出 30 份。GitHub 失敗會寄信，隔天再試
    Set-Content -Path $stampFile -Value (Get-Date -Format o)
    $localDone = $true

    # --- GitHub（加密）---
    if (-not (Test-Path $keyFile)) {
        # 第一次跑：產生隨機金鑰。同一份也放到 D:，C: 壞掉時本機那份還解得開；
        # 但整台機器壞掉時兩份都會不見，所以要另外抄到密碼管理器（見 CLAUDE.md）
        $bytes = New-Object byte[] 32
        [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
        Set-Content -Path $keyFile -Value ([Convert]::ToBase64String($bytes)) -NoNewline
        Copy-Item $keyFile (Join-Path $backupRoot "BACKUP-KEY.txt") -Force
        Log "已產生新的加密金鑰：$keyFile（請抄到密碼管理器）"
    }

    if (Test-Path (Join-Path $githubDir ".git")) {
        $tgz = Join-Path $env:TEMP "kbs0830-backup.tar.gz"
        & $tar -czf $tgz -C $dest .
        if ($LASTEXITCODE -ne 0) { throw "tar 失敗 (exit $LASTEXITCODE)" }
        & $openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -in $tgz `
            -out (Join-Path $githubDir "kbs0830-backup.tar.gz.enc") -pass "file:$keyFile"
        if ($LASTEXITCODE -ne 0) { throw "openssl 加密失敗 (exit $LASTEXITCODE)" }
        Remove-Item $tgz -Force

        git -C $githubDir add -A 2>&1 | Out-Null
        git -C $githubDir commit -q -m "backup $stamp" 2>&1 | Out-Null
        $push = git -C $githubDir push -q origin HEAD 2>&1
        if ($LASTEXITCODE -ne 0) { throw "GitHub push 失敗：$push" }
        Log "GitHub 加密備份已 push"
    } else {
        Log "（GitHub 備份尚未設定：$githubDir 不是 git clone，只做本機備份）"
    }

    Log "===== Backup succeeded ====="
    $notified = Clear-Alert -Key "backup" -Subject "✅ 自動備份已恢復正常"
    if ($notified) { Log "通知：$notified" }
    exit 0
}
catch {
    Log "[FAILED] $($_.Exception.Message)"
    if (-not $localDone -and $dest -and (Test-Path $dest)) { Remove-Item $dest -Recurse -Force -ErrorAction SilentlyContinue }
    Log "===== Backup FAILED ====="
    Log "通知：$(Send-Alert -Key 'backup' -CooldownMinutes 1440 -Subject '自動備份失敗' -Body "錯誤：$($_.Exception.Message)`n本機備份：$(if ($localDone) { '已完成' } else { '沒完成' })`n`n詳見 logs\backup.log。")"
    exit 1
}
