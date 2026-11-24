# 週報／月報寄信（2026-11-25，取代 weekly-report.ps1）。收件：otemon（scripts\lib\notify.ps1）。
#   - 週報：週一 09:00 後寄「上一週（週一～週日）」
#   - 月報：每月 1 號 09:00 後寄「上個月」
#   - 日報不寄信，只在網站 /reports 看（使用者要的）
# 內容跟網頁 /reports 是同一份（src\lib\reports.ts）：這裡打本機的 /api/reports?format=text 拿純文字版，
# 再補一段 Google 搜尋（scripts\lib\search-console.js，網頁上不放搜尋字詞）。網站沒回應就這輪不寄，下一輪（5 分鐘後）再試。
#
# 由 watchdog.ps1 每 5 分鐘呼叫（-Period week、-Period month 各一次）；這一期寄過就直接結束（data\report-mail-state.json）。
# 手動：powershell -File scripts\report-mail.ps1 -Period week -DryRun（只印不寄）
#       powershell -File scripts\report-mail.ps1 -Period week -Force（現在就寄上一週，寄過也再寄）
#       -Anchor 2026-11-23：指定哪一期（那一期裡的任何一天）；-BaseUrl http://localhost:3200：對測試用的 server 試跑
# Windows PowerShell 5.1 跑：不能用 ??、?.、三元運算子；檔案要 UTF-8 with BOM。

param([ValidateSet("week", "month")][string]$Period = "week", [switch]$DryRun, [switch]$Force, [string]$Anchor, [string]$BaseUrl = "http://localhost:3000")

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$stateFile = Join-Path $repo "data\report-mail-state.json"
$logFile = Join-Path $repo "logs\watchdog.log"

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")

$now = Get-Date
if ($Period -eq "week") {
    $thisMonday = $now.Date.AddDays(-(([int]$now.DayOfWeek + 6) % 7))
    $dueAt = $thisMonday.AddHours(9)
    $target = $thisMonday.AddDays(-7)
    $key = $target.ToString("yyyy-MM-dd")
    $name = "週報"
} else {
    $firstOfMonth = New-Object DateTime($now.Year, $now.Month, 1)
    $dueAt = $firstOfMonth.AddHours(9)
    $target = $firstOfMonth.AddMonths(-1)
    $key = $target.ToString("yyyy-MM")
    $name = "月報"
}
if ($Anchor) {
    $target = [datetime]::Parse($Anchor)
    if ($Period -eq "week") { $target = $target.Date.AddDays(-(([int]$target.DayOfWeek + 6) % 7)); $key = $target.ToString("yyyy-MM-dd") }
    else { $target = New-Object DateTime($target.Year, $target.Month, 1); $key = $target.ToString("yyyy-MM") }
}

$state = $null
if (Test-Path $stateFile) { try { $state = [IO.File]::ReadAllText($stateFile, [Text.Encoding]::UTF8) | ConvertFrom-Json } catch { $state = $null } }
if (-not $Force -and -not $DryRun) {
    if ($now -lt $dueAt) { exit 0 }
    if ($state -and $state.$Period -eq $key) { exit 0 }
}

# --- 報表本體（本機 API；Cloudflare 進來的請求那支 API 會回 404）---
$url = "$BaseUrl/api/reports?period=$Period&anchor=$($target.ToString('yyyy-MM-dd'))&format=text"
try {
    $wc = New-Object Net.WebClient
    $wc.Encoding = [Text.Encoding]::UTF8
    $body = $wc.DownloadString($url)
} catch {
    Write-TimestampedLog -LogFile $logFile -Message "[WARN] $name 拿不到報表（$url）：$($_.Exception.Message)，下一輪再試"
    exit 0
}
$lines = @($body -split "`n")
$first = $lines[0]

# --- Google 搜尋（Search Console）：週報 7 天、月報 30 天；沒設 GSC_KEY_FILE 就不顯示 ---
$days = 7
if ($Period -eq "month") { $days = 30 }
$gsc = $null
try {
    $gscOut = & node (Join-Path $PSScriptRoot "lib\search-console.js") --days $days 2>$null
    if ($gscOut) { $gsc = ($gscOut -join "") | ConvertFrom-Json }
} catch { $gsc = [PSCustomObject]@{ error = $_.Exception.Message } }
$nf = [Globalization.CultureInfo]::InvariantCulture
function N($v) { return ([double]$v).ToString("#,0", $nf) }
function Delta($cur, $prev) {
    if ($prev -le 0) { return "" }
    $pct = [math]::Round(($cur - $prev) / $prev * 100)
    if ($pct -ge 0) { return "（+$pct%）" } else { return "（$pct%）" }
}
$g = @()
if ($gsc -and $gsc.error) {
    $g += "【Google 搜尋】讀不到：$($gsc.error)"
} elseif ($gsc -and -not $gsc.skipped) {
    $a = $gsc.analytics
    $g += "【Google 搜尋】$($a.range)（Search Console 的資料晚 2～3 天）"
    $pos = ""
    if ($a.cur.impressions -gt 0) { $pos = "、平均排名 $([math]::Round($a.cur.position, 1))" }
    $g += "  點擊 $(N $a.cur.clicks) $(Delta $a.cur.clicks $a.prev.clicks)、曝光 $(N $a.cur.impressions) $(Delta $a.cur.impressions $a.prev.impressions)$pos"
    if ($a.queries -and $a.queries.Count -gt 0) {
        $g += "  搜尋字詞：$(($a.queries | ForEach-Object { "$($_.key)（曝光 $($_.impressions)、點擊 $($_.clicks)）" }) -join '、')"
    }
    if ($a.pages -and $a.pages.Count -gt 0) {
        $g += "  曝光最多的頁面：$(($a.pages | ForEach-Object { "$($_.key)（$($_.impressions)）" }) -join '、')"
    }
    $ix = $gsc.index
    $was = ""
    if ($state -and $state.gscIndexed) { $was = "（上次 $($state.gscIndexed)）" }
    $g += "  已建立索引：sitemap $($ix.total) 個網址中 $($ix.indexed) 個$was"
    $g += "  $(($ix.states.PSObject.Properties | Sort-Object Value -Descending | ForEach-Object { "$($_.Name) $($_.Value)" }) -join '、')"
    if ($ix.notIndexed -and $ix.notIndexed.Count -gt 0 -and $ix.notIndexed.Count -le 12) {
        $g += "  還沒收錄：$($ix.notIndexed -join '、')"
    }
}
# 插在最後一行（網頁版連結）前面
if ($g.Count -gt 0) { $lines = @($lines[0..($lines.Count - 2)]) + $g + @("") + @($lines[-1]) }
$text = $lines -join "`n"

$label = ($first -replace '^kbs0830\.com ', '')
$subject = "📊 $label"
if ($DryRun) { $subject; $text; exit 0 }

$r = Send-AlertMail -Subject $subject -Body $text
Write-TimestampedLog -LogFile $logFile -Message "[REPORT] $name $key：$r"
if ($r -like "sent*") {
    $snap = @{}
    if ($state) { foreach ($p in $state.PSObject.Properties) { $snap[$p.Name] = $p.Value } }
    $snap[$Period] = $key
    $snap["at"] = $now.ToString("o")
    if ($gsc -and $gsc.index) { $snap["gscIndexed"] = $gsc.index.indexed }
    [IO.File]::WriteAllText($stateFile, ($snap | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding($false)))
}
