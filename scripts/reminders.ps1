# 提醒信：讀 repo 根目錄的 reminders.json，日期（＋時間，預設 09:00）到了就寄一封，每則只寄一次。
# 由 watchdog.ps1 每 5 分鐘呼叫；桌機關機錯過的話，下次開機後補寄（只要還沒寄過）。
# 寄過的記在 data/alerts/reminder-<id>.sent（gitignore）。想重寄某一則：刪掉那個檔案。
# 「check」欄位會在信裡附上即時檢查結果，讓信本身就告訴你要不要動手：
#   web-vitals    → /api/web-vitals 每頁每個指標的樣本數跟 p75
#   http-redirect → http://kbs0830.com 有沒有 301 到 https
# ⚠️ Windows PowerShell 5.1 跑的：這個檔案要 UTF-8 with BOM、不能用 ?? 之類 PS 7 語法；
#    讀 json 一定要 -Encoding UTF8，不然中文會被當 Big5 讀爛

$repo = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "lib\notify.ps1")
. (Join-Path $PSScriptRoot "lib\logger.ps1")
$logFile = Join-Path $repo "logs\watchdog.log"
function Log($msg) { Write-TimestampedLog -LogFile $logFile -Message $msg }

$file = Join-Path $repo "reminders.json"
if (-not (Test-Path $file)) { return }
try {
    $list = (Get-Content $file -Raw -Encoding UTF8 | ConvertFrom-Json).reminders
} catch {
    Log "[WARN] reminders.json 讀不了（JSON 格式錯？）：$($_.Exception.Message)"
    return
}

function Get-CheckResult([string]$check) {
    try {
        switch ($check) {
            "web-vitals" {
                $data = Invoke-RestMethod -Uri "http://localhost:3000/api/web-vitals" -TimeoutSec 10
                $lines = @()
                foreach ($page in $data.PSObject.Properties) {
                    $metrics = @()
                    foreach ($m in $page.Value.PSObject.Properties) { $metrics += "$($m.Name) $($m.Value.p75)（n=$($m.Value.n)）" }
                    $lines += "  $($page.Name)：$($metrics -join '、')"
                }
                if ($lines.Count -eq 0) { return "（目前還沒有任何真實訪客數據）" }
                return "目前數據（p75，毫秒；CLS 沒單位）：`n" + ($lines -join "`n")
            }
            "http-redirect" {
                # 不跟著轉址，只看第一個回應
                $req = [System.Net.HttpWebRequest]::Create("http://kbs0830.com/")
                $req.AllowAutoRedirect = $false
                $req.Timeout = 15000
                try { $res = $req.GetResponse() } catch [System.Net.WebException] { $res = $_.Exception.Response }
                $code = [int]$res.StatusCode
                $loc = $res.Headers["Location"]
                $res.Close()
                if ($code -ge 300 -and $code -lt 400 -and $loc -like "https://*") { return "✅ HTTP→HTTPS 已生效（$code → $loc），這項不用做了" }
                return "❌ HTTP→HTTPS 還沒生效：http://kbs0830.com/ 回 $code"
            }
        }
    } catch {
        return "（自動檢查失敗：$($_.Exception.Message)）"
    }
    return $null
}

$now = Get-Date
foreach ($r in $list) {
    if (-not $r.id -or -not $r.date -or -not $r.subject) { continue }
    $marker = Join-Path $script:AlertStateDir "reminder-$($r.id).sent"
    if (Test-Path $marker) { continue }
    $time = if ($r.time) { $r.time } else { "09:00" }
    try { $due = [datetime]::ParseExact("$($r.date) $time", "yyyy-MM-dd HH:mm", $null) } catch { Log "[WARN] 提醒 $($r.id) 日期格式錯：$($r.date) $time"; continue }
    if ($now -lt $due) { continue }

    $body = [string]$r.body
    if ($r.check) {
        $result = Get-CheckResult ([string]$r.check)
        if ($result) { $body += "`n`n—— 自動檢查 ——`n$result" }
    }
    $body += "`n`n（這是 reminders.json 排的提醒；要新增或改日期，跟 Claude 說或直接改那個檔案。）"

    $sent = Send-AlertMail -Subject $r.subject -Body $body
    Log "提醒 $($r.id)：$sent"
    # 只有真的寄出才記成已寄；沒設帳密或暫時寄不出去，下一輪（5 分鐘後）再試
    if ($sent -like "sent*") {
        if (-not (Test-Path $script:AlertStateDir)) { New-Item -ItemType Directory -Path $script:AlertStateDir -Force | Out-Null }
        Set-Content -Path $marker -Value (Get-Date -Format o) -Encoding UTF8
    }
}
