# 定期健康檢查：確認 kbs0830.com 的 origin（localhost:3000）還活著，
# 如果沒有回應就自動透過 Task Scheduler 重啟 kbs0830_NextJS；同時也確認 GitHub Actions
# self-hosted runner 還在跑，沒有就重啟 GitHubActionsRunner。
#
# 背景（網站）：Cloudflare Tunnel 跟 Next.js server 是兩個獨立的行程，tunnel 掛了不代表
# origin 也會掛——之前發生過 node.exe 無聲死掉、tunnel 卻繼續轉發，導致訪客
# 看了好幾小時的 "connection refused" 都沒人發現。這支腳本補上那個監控空缺。
#
# 背景（runner）：2026-07-25 發現 GitHubActionsRunner 這個 Task Scheduler 工作雖然顯示
# Ready，但 Runner.Listener.exe 進程其實已經無聲掛掉，導致 push 到 main 都不會觸發自動
# 部署，是手動查 GitHub Actions 才發現、手動重啟才復活。這裡跟網站檢查共用同一個 5 分鐘
# 排程一起巡，不另外開一個 Task Scheduler 任務。
#
# 健康檢查邏輯共用 scripts/lib/health-check.ps1（跟 verify-deploy.ps1 同一份，
# 只維護一份邏輯）。由 Task Scheduler 排程「kbs0830_Watchdog」每 5 分鐘執行一次。

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$logFile = Join-Path $repo "logs\watchdog.log"
$siteTaskName = "kbs0830_NextJS"
$runnerTaskName = "GitHubActionsRunner"
$runnerProcessName = "Runner.Listener"

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\health-check.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")

function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }
# 通知結果也記進 log；沒寄（Clear-Alert 回 $null）就不寫
function Notify($result) { if ($result) { Log "通知：$result" } }

$exitCode = 0

# --- 網站健康檢查 ---
$result = Test-SiteHealth -Url "http://localhost:3000/" -MaxWaitSeconds 10

if (-not $result.Success) {
    # 正常時不寫 log，避免每 5 分鐘一筆灌爆 watchdog.log；只在異常/處理過程才記錄。
    Log "[WARN] 網站健康檢查失敗：$($result.Reason)"
    Log "嘗試重啟 Task Scheduler 工作 '$siteTaskName'"

    try {
        Stop-ScheduledTask -TaskName $siteTaskName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-ScheduledTask -TaskName $siteTaskName

        $recovery = Test-SiteHealth -Url "http://localhost:3000/" -MaxWaitSeconds 30

        if ($recovery.Success) {
            Log "[RECOVERED] 網站重啟後恢復正常：$($recovery.Reason)"
            # 自己修好的也通知一聲（冷卻 1 小時）：72 小時被砍那種事件，靠這個才會被注意到
            Notify (Send-Alert -Key "site-restarted" -Subject "網站曾無回應，已自動重啟恢復" `
                -Body "健康檢查失敗：$($result.Reason)`n重啟後：$($recovery.Reason)`n`n詳見 logs\watchdog.log")
        } else {
            Log "[FAILED] 網站重啟後仍然異常：$($recovery.Reason) —— 需要人工介入"
            Notify (Send-Alert -Key "site" -Subject "🔴 網站掛了，自動重啟救不回來" `
                -Body "健康檢查失敗：$($result.Reason)`n重啟後仍然異常：$($recovery.Reason)`n`n需要人工介入。之後恢復會再寄一封通知。")
            $exitCode = 1
        }
    } catch {
        Log "[FAILED] 網站重啟過程發生錯誤：$($_.Exception.Message)"
        Notify (Send-Alert -Key "site" -Subject "🔴 網站掛了，自動重啟救不回來" `
            -Body "健康檢查失敗：$($result.Reason)`n重啟過程錯誤：$($_.Exception.Message)`n`n需要人工介入。之後恢復會再寄一封通知。")
        $exitCode = 1
    }
}
if ($exitCode -eq 0) { Notify (Clear-Alert -Key "site" -Subject "✅ 網站已恢復正常") }

# --- 從外網經 Cloudflare Tunnel 打一次 ---
# 2026-10-29 那次是 origin 健康、Tunnel 斷了 4 天，上面的 localhost 檢查完全看不出來。
# origin 本身壞掉時上面已經處理過，這裡只在 origin 正常時看「外面連不連得進來」。
# Test-SiteHealth 會在 30 秒內重試，偶發的網路抖動不會誤報。
# 不自動重啟 Cloudflared：服務本身有「當機自動重啟」，而且一般權限重啟不了服務；這裡只負責讓人知道。
if ($exitCode -eq 0) {
    $public = Test-SiteHealth -Url "https://kbs0830.com/" -MaxWaitSeconds 30
    if ($public.Success) {
        Notify (Clear-Alert -Key "tunnel" -Subject "✅ 外網已經連得到網站")
    } else {
        $svc = (Get-Service Cloudflared -ErrorAction SilentlyContinue).Status
        Log "[FAILED] origin 正常但外網連不到：$($public.Reason)（Cloudflared 服務：$svc）"
        Notify (Send-Alert -Key "tunnel" -Subject "🔴 外網連不到網站（origin 正常，疑似 Tunnel）" `
            -Body "localhost:3000 正常，但 https://kbs0830.com/ 失敗：$($public.Reason)`nCloudflared 服務狀態：$svc`n`n先試：系統管理員 PowerShell 跑 Restart-Service Cloudflared")
        $exitCode = 1
    }
}

# --- GitHub Actions self-hosted runner 存活檢查 ---
if (-not (Get-Process -Name $runnerProcessName -ErrorAction SilentlyContinue)) {
    Log "[WARN] GitHub Actions runner（$runnerProcessName.exe）沒有偵測到在跑"
    Log "嘗試重啟 Task Scheduler 工作 '$runnerTaskName'"

    try {
        Stop-ScheduledTask -TaskName $runnerTaskName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-ScheduledTask -TaskName $runnerTaskName
        Start-Sleep -Seconds 5

        if (Get-Process -Name $runnerProcessName -ErrorAction SilentlyContinue) {
            Log "[RECOVERED] GitHub Actions runner 重啟後恢復"
        } else {
            Log "[FAILED] GitHub Actions runner 重啟後仍然沒有偵測到進程 —— 需要人工介入"
            Notify (Send-Alert -Key "runner" -Subject "🔴 GitHub Actions runner 停了，自動部署不會動" `
                -Body "Runner.Listener 不在，重啟 '$runnerTaskName' 之後還是沒起來。`npush 到 main 的部署會一直排隊。")
            $exitCode = 1
        }
    } catch {
        Log "[FAILED] 重啟 GitHub Actions runner 過程發生錯誤：$($_.Exception.Message)"
        Notify (Send-Alert -Key "runner" -Subject "🔴 GitHub Actions runner 停了，自動部署不會動" `
            -Body "重啟 '$runnerTaskName' 過程錯誤：$($_.Exception.Message)`npush 到 main 的部署會一直排隊。")
        $exitCode = 1
    }
} else {
    Notify (Clear-Alert -Key "runner" -Subject "✅ GitHub Actions runner 已恢復")
}

# --- 每日備份（超過 24 小時沒成功備份才真的跑，失敗由 backup.ps1 自己寄信，不影響監控結果）---
& (Join-Path $PSScriptRoot "backup.ps1") -IfOlderThanHours 24 | Out-Null

# --- 提醒信（reminders.json 排的日期到了就寄，每則只寄一次；失敗不影響監控結果）---
try { & (Join-Path $PSScriptRoot "reminders.ps1") | Out-Null } catch { Log "[WARN] reminders.ps1 失敗：$($_.Exception.Message)" }

exit $exitCode
