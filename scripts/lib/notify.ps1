# 自動通知：部署失敗、watchdog 修不好時寄信，被 deploy.ps1 / watchdog.ps1 共用。
# 收寄件都是 otemon.pcwork@gmail.com（CLAUDE.md：系統自動通知一律用這個，不用真人信箱）。
#
# 帳密放 .env.local 的 ALERT_SMTP_USER / ALERT_SMTP_PASS（Gmail「應用程式密碼」，不是登入密碼），
# 收件人 ALERT_EMAIL_TO 沒填就寄給自己。沒設定就只回傳 skipped、不寄，不影響部署/監控本身。
# 為什麼不用 Windows 認證管理員或 Export-Clixml 加密：watchdog 是 S4U 身分執行，S4U 沒有
# 使用者的 DPAPI 金鑰，那兩種都解不開，只能讀一般檔案。
#
# 同一個 Key 在冷卻時間內只寄一次：watchdog 每 5 分鐘跑一次，一直壞的話不能每 5 分鐘一封。
# 狀態檔放 data/alerts/（gitignore），檔案存在＝這個 Key 目前是「已通知、尚未恢復」。

$script:NotifyRepo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script:AlertStateDir = Join-Path $script:NotifyRepo "data\alerts"

function Get-AlertConfig {
    $envFile = Join-Path $script:NotifyRepo ".env.local"
    $cfg = @{}
    if (Test-Path $envFile) {
        foreach ($line in Get-Content $envFile -Encoding utf8) {
            if ($line -match '^\s*(ALERT_[A-Z_]+)\s*=\s*"?(.*?)"?\s*$') { $cfg[$Matches[1]] = $Matches[2] }
        }
    }
    if (-not $cfg.ALERT_SMTP_USER -or -not $cfg.ALERT_SMTP_PASS) { return $null }
    if (-not $cfg.ALERT_EMAIL_TO) { $cfg.ALERT_EMAIL_TO = $cfg.ALERT_SMTP_USER }
    return $cfg
}

function Send-AlertMail {
    param([Parameter(Mandatory)] [string]$Subject, [Parameter(Mandatory)] [string]$Body)

    $cfg = Get-AlertConfig
    if (-not $cfg) { return "skipped（.env.local 沒有 ALERT_SMTP_USER / ALERT_SMTP_PASS）" }

    # Windows PowerShell 5.1 的 .NET Framework 預設不一定開 TLS 1.2，Gmail 要求 TLS 1.2
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

    $msg = New-Object System.Net.Mail.MailMessage($cfg.ALERT_SMTP_USER, $cfg.ALERT_EMAIL_TO)
    $msg.Subject = "[kbs0830] $Subject"
    $msg.Body = "$Body`n`n—— $env:COMPUTERNAME $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $msg.SubjectEncoding = [System.Text.Encoding]::UTF8
    $msg.BodyEncoding = [System.Text.Encoding]::UTF8

    $smtp = New-Object System.Net.Mail.SmtpClient("smtp.gmail.com", 587)
    $smtp.EnableSsl = $true
    $smtp.Timeout = 20000
    $smtp.Credentials = New-Object System.Net.NetworkCredential($cfg.ALERT_SMTP_USER, $cfg.ALERT_SMTP_PASS)
    try {
        $smtp.Send($msg)
        return "sent → $($cfg.ALERT_EMAIL_TO)"
    } catch {
        # 不能用 ??：watchdog/deploy 是 Windows PowerShell 5.1 跑的，沒有這個運算子
        $err = if ($_.Exception.InnerException) { $_.Exception.InnerException.Message } else { $_.Exception.Message }
        return "send failed：$err"
    } finally {
        $msg.Dispose(); $smtp.Dispose()
    }
}

# 出事時呼叫。同一個 Key 在 CooldownMinutes 內已經寄過就不再寄（0 = 每次都寄，例如部署失敗）。
function Send-Alert {
    param(
        [Parameter(Mandatory)] [string]$Key,
        [Parameter(Mandatory)] [string]$Subject,
        [Parameter(Mandatory)] [string]$Body,
        [int]$CooldownMinutes = 60
    )
    $stateFile = Join-Path $script:AlertStateDir "$Key.last"
    if ($CooldownMinutes -gt 0 -and (Test-Path $stateFile) -and
        (Get-Item $stateFile).LastWriteTime -gt (Get-Date).AddMinutes(-$CooldownMinutes)) {
        return "cooldown（$CooldownMinutes 分鐘內已通知過）"
    }
    $result = Send-AlertMail -Subject $Subject -Body $Body
    if ($result -like "sent*") {
        New-Item -ItemType Directory -Path $script:AlertStateDir -Force | Out-Null
        Set-Content -Path $stateFile -Value (Get-Date -Format o)
    }
    return $result
}

# 恢復正常時呼叫：只有之前真的寄過這個 Key 的告警，才補一封「已恢復」，然後清掉狀態。
function Clear-Alert {
    param(
        [Parameter(Mandatory)] [string]$Key,
        [Parameter(Mandatory)] [string]$Subject,
        [string]$Body = "之前通知的問題已經恢復。"
    )
    $stateFile = Join-Path $script:AlertStateDir "$Key.last"
    if (-not (Test-Path $stateFile)) { return $null }
    $result = Send-AlertMail -Subject $Subject -Body $Body
    if ($result -like "sent*") { Remove-Item $stateFile -Force }
    return $result
}
