# 備份還原演練（TODO「每季實際從 GitHub 下載備份解密一次」，2026-11-09）：備份沒還原過等於沒有。
#
# 照「整台桌機壞掉」的情境走一遍：
#   1. 從 GitHub 重新 clone 私有備份 repo（不用 D: 上那份 clone，真的從網路下載）
#   2. 用金鑰解密、解壓
#   3. 跟 D: 最新一份本機備份逐檔比 SHA256
# 結果寫 logs\backup.log，成功失敗都寄信（一季一封，看得到「有在演練」）。
#
# 由 watchdog.ps1 每 5 分鐘帶 -IfOlderThanDays 90 呼叫，超過 90 天沒演練過才真的跑。
# 手動跑：powershell -File scripts\restore-drill.ps1

param([int]$IfOlderThanDays = 0)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$userHome = if ($env:USERPROFILE) { $env:USERPROFILE } else { "C:\Users\$env:USERNAME" }
$backupRoot = "D:\Backups\kbs0830"
$githubDir = Join-Path $backupRoot "github"
$stampFile = Join-Path $backupRoot "last-restore-drill.txt"
$keyFile = Join-Path $userHome ".kbs0830-backup-key"
$openssl = "C:\Program Files\Git\mingw64\bin\openssl.exe"
$tar = "$env:SystemRoot\System32\tar.exe"
$logFile = Join-Path $repo "logs\backup.log"

if ($IfOlderThanDays -gt 0 -and (Test-Path $stampFile) -and
    (Get-Item $stampFile).LastWriteTime -gt (Get-Date).AddDays(-$IfOlderThanDays)) {
    exit 0
}

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")
function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }

$work = Join-Path $env:TEMP ("kbs0830-restore-drill-" + (Get-Date -Format "yyyyMMddHHmmss"))
$ok = $false
$summary = ""

try {
    Log "=== 備份還原演練開始 ==="
    if (-not (Test-Path (Join-Path $githubDir ".git"))) { throw "$githubDir 不是 git clone，GitHub 備份沒設定" }
    if (-not (Test-Path $keyFile)) { throw "找不到解密金鑰 $keyFile" }

    $url = (git -C $githubDir remote get-url origin).Trim()
    $ssh = (git -C $githubDir config core.sshCommand)
    New-Item -ItemType Directory -Path $work -Force | Out-Null

    # 1. 從 GitHub 重新下載（淺 clone，只要最新一份）
    $cloneDir = Join-Path $work "clone"
    $out = git -c "core.sshCommand=$ssh" clone -q --depth 1 $url $cloneDir 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git clone 失敗：$out" }
    $enc = Join-Path $cloneDir "kbs0830-backup.tar.gz.enc"
    if (-not (Test-Path $enc)) { throw "repo 裡沒有 kbs0830-backup.tar.gz.enc" }
    $commit = git -C $cloneDir log -1 --format="%h %s" 2>$null

    # 2. 解密、解壓
    $tgz = Join-Path $work "backup.tar.gz"
    & $openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in $enc -out $tgz -pass "file:$keyFile" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "解密失敗（金鑰不對或檔案損毀），exit $LASTEXITCODE" }
    $restoreDir = Join-Path $work "restore"
    New-Item -ItemType Directory -Path $restoreDir -Force | Out-Null
    & $tar -xzf $tgz -C $restoreDir
    if ($LASTEXITCODE -ne 0) { throw "解壓失敗，exit $LASTEXITCODE" }

    # 3. 跟 D: 最新一份逐檔比
    $local = Get-ChildItem $backupRoot -Directory | Where-Object Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' |
        Sort-Object Name -Descending | Select-Object -First 1
    if (-not $local) { throw "D: 沒有本機備份可以比對" }

    $restoredFiles = @(Get-ChildItem $restoreDir -Recurse -File)
    $localFiles = @(Get-ChildItem $local.FullName -Recurse -File)
    $diff = @()
    foreach ($f in $localFiles) {
        $rel = $f.FullName.Substring($local.FullName.Length + 1)
        $other = Join-Path $restoreDir $rel
        if (-not (Test-Path $other)) { $diff += "GitHub 那份少了：$rel"; continue }
        if ((Get-FileHash $f.FullName).Hash -ne (Get-FileHash $other).Hash) { $diff += "內容不同：$rel" }
    }
    if ($restoredFiles.Count -gt $localFiles.Count) { $diff += "GitHub 那份多了 $($restoredFiles.Count - $localFiles.Count) 個檔案" }

    $summary = "GitHub 最新備份：$commit`nD: 最新備份：$($local.Name)`n解出 $($restoredFiles.Count) 個檔案，D: 有 $($localFiles.Count) 個"
    if ($diff.Count -gt 0) {
        # 兩份不是同一次備份（例如 GitHub push 失敗那天）也會不同：信裡寫清楚，讓人判斷
        throw "解得開，但跟 D: 那份對不起來：`n" + (($diff | Select-Object -First 15) -join "`n")
    }
    $ok = $true
    Log "[OK] 還原演練通過：$($restoredFiles.Count) 個檔案跟 $($local.Name) 逐檔相同"
} catch {
    Log "[FAILED] 還原演練失敗：$($_.Exception.Message)"
    $summary = "$summary`n`n$($_.Exception.Message)".Trim()
} finally {
    if (Test-Path $work) { Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue }
}

if ($ok) {
    Set-Content -Path $stampFile -Value (Get-Date -Format o)
    Remove-Item (Join-Path $script:AlertStateDir "restore-drill.last") -ErrorAction SilentlyContinue
    $r = Send-AlertMail -Subject "✅ 備份還原演練通過（每季一次）" -Body ("從 GitHub 重新下載 → 解密 → 解壓 → 跟 D: 逐檔比對，全部相同。`n`n" + $summary + "`n`n下次演練：90 天後，watchdog 自動跑。")
} else {
    # 失敗不寫 stamp：明天 watchdog 會再試（寄信有 1 天冷卻，不會每 5 分鐘一封）
    $r = Send-Alert -Key "restore-drill" -CooldownMinutes 1440 -Subject "🔴 備份還原演練失敗" -Body ("備份可能救不回來，要人工檢查。`n`n" + $summary + "`n`n還原步驟見 CLAUDE.md「自動備份」。")
}
Log "  通知：$r"
if (-not $ok) { exit 1 }
