# 每週流量週報（TODO 點子，2026-11-09）：每週一 09:00 後寄一封到 otemon，整理過去 7 天：
#   - Cloudflare：訪客、頁面瀏覽（跟前一週比）
#   - 真人造訪、未過濾流量（AI 爬蟲／搜尋引擎／其他機器人）：這兩份檔案只存累計，跟上週寄信時的快照相減
#   - 首頁 Web Vitals p75（/api/web-vitals）
#   - 部署：成功／失敗／自動退回次數（logs\deploy.log）
#   - watchdog：網站／runner 自動重啟、外網斷線次數（logs\watchdog.log）
#
# 由 watchdog.ps1 每 5 分鐘呼叫；這週（週一起算）已經寄過就直接結束。桌機週一關機的話，開機後補寄。
# 手動：powershell -File scripts\weekly-report.ps1 -DryRun（只印不寄）、-Force（這週寄過也再寄）
# Windows PowerShell 5.1 跑：不能用 ??、?.、三元運算子。

param([switch]$DryRun, [switch]$Force)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repo = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $repo "data"
$stateFile = Join-Path $dataDir "weekly-report-state.json"
$logFile = Join-Path $repo "logs\watchdog.log"

$now = Get-Date
$monday = $now.Date.AddDays(-(([int]$now.DayOfWeek + 6) % 7))
$weekKey = $monday.ToString("yyyy-MM-dd")
$since = $now.AddDays(-7)

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")

function Read-Json($path) {
    if (-not (Test-Path $path)) { return $null }
    try { return [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8) | ConvertFrom-Json } catch { return $null }
}

$state = Read-Json $stateFile
if (-not $Force -and -not $DryRun) {
    if ($now -lt $monday.AddHours(9)) { exit 0 }
    if ($state -and $state.week -eq $weekKey) { exit 0 }
}

$nf = [Globalization.CultureInfo]::InvariantCulture
function N($v) { return ([double]$v).ToString("#,0", $nf) }
function Delta($cur, $prev) {
    if ($prev -le 0) { return "" }
    $pct = [math]::Round(($cur - $prev) / $prev * 100)
    if ($pct -ge 0) { return "（比前一週 +$pct%）" } else { return "（比前一週 $pct%）" }
}

$lines = @()
$lines += "kbs0830.com 週報：$($since.ToString('MM/dd')) – $($now.ToString('MM/dd'))"
$lines += ""

# --- Cloudflare（每日數字，UTC 日期）---
$cf = Read-Json (Join-Path $dataDir "cloudflare-daily.json")
if ($cf) {
    $days = @{}
    foreach ($p in $cf.days.PSObject.Properties) { $days[$p.Name] = $p.Value }
    $sum = { param($from, $to)
        $u = 0; $v = 0
        for ($d = $from; $d -le $to; $d = $d.AddDays(1)) {
            $k = $d.ToString("yyyy-MM-dd")
            if ($days.ContainsKey($k)) { $u += $days[$k].uniques; $v += $days[$k].pageViews }
        }
        return @($u, $v)
    }
    $end = $now.ToUniversalTime().Date.AddDays(-1)  # 今天還沒過完，算到昨天
    $this = & $sum $end.AddDays(-6) $end
    $prev = & $sum $end.AddDays(-13) $end.AddDays(-7)
    $lines += "【Cloudflare】$($end.AddDays(-6).ToString('MM/dd'))–$($end.ToString('MM/dd'))"
    $lines += "  訪客 $(N $this[0]) $(Delta $this[0] $prev[0])"
    $lines += "  頁面瀏覽 $(N $this[1]) $(Delta $this[1] $prev[1])"
    $lines += ""
}

# --- 真人造訪、未過濾（累計 → 跟上週快照相減）---
$visits = 0
$vs = Read-Json (Join-Path $dataDir "visitor-stats.json")
if ($vs) { foreach ($p in $vs.PSObject.Properties) { if ($p.Name -ne "XX") { $visits += [int]$p.Value } } }
$raw = Read-Json (Join-Path $dataDir "raw-traffic.json")

$lines += "【這個網站自己數的】"
if ($state) {
    $lines += "  真人造訪 +$(N ($visits - $state.visits))（累計 $(N $visits)）"
    if ($raw -and $state.raw) {
        $lines += "  未過濾頁面請求 +$(N ($raw.total - $state.raw.total))：瀏覽器 +$(N ($raw.browser - $state.raw.browser))、AI 爬蟲 +$(N ($raw.ai - $state.raw.ai))、搜尋引擎 +$(N ($raw.search - $state.raw.search))、其他機器人 +$(N ($raw.bot - $state.raw.bot))"
    }
} else {
    $lines += "  （第一封週報，還沒有上週的數字可以比，先列累計）"
    $lines += "  真人造訪累計 $(N $visits)"
    if ($raw) { $lines += "  未過濾累計 $(N $raw.total)：瀏覽器 $(N $raw.browser)、AI 爬蟲 $(N $raw.ai)、搜尋引擎 $(N $raw.search)、其他機器人 $(N $raw.bot)（$($raw.since) 起）" }
}
if ($raw -and $raw.names) {
    $top = $raw.names.PSObject.Properties | Sort-Object { [int]$_.Value } -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Name) $($_.Value)" }
    $lines += "  最常來的爬蟲（累計）：$($top -join '、')"
}
$lines += ""

# --- Web Vitals（首頁 p75；good：LCP ≤2500ms、INP ≤200ms、CLS ≤0.1）---
try {
    $wv = Invoke-RestMethod -Uri "http://localhost:3000/api/web-vitals" -TimeoutSec 15
    $hp = $wv."/"
    if ($hp) {
        $parts = @()
        foreach ($m in "LCP", "INP", "CLS") {
            $x = $hp.$m
            if ($x) { $parts += "$m $($x.p75)（n=$($x.n)）" }
        }
        $lines += "【首頁 Web Vitals p75】$($parts -join '、')"
        $lines += "  good 的標準：LCP ≤2500、INP ≤200、CLS ≤0.1"
        $lines += ""
    }
} catch { $lines += "【Web Vitals】讀不到：$($_.Exception.Message)"; $lines += "" }

# --- log：最近 7 天 ---
function Count-Log($path, $pattern) {
    if (-not (Test-Path $path)) { return 0 }
    $n = 0
    foreach ($l in [IO.File]::ReadAllLines($path, [Text.Encoding]::UTF8)) {
        if ($l -match '^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})' -and [datetime]::Parse($Matches[1]) -ge $since -and $l.Contains($pattern)) { $n++ }  # 不用 -like：[ROLLBACK] 的方括號會被當成萬用字元
    }
    return $n
}
$deployLog = Join-Path $repo "logs\deploy.log"
$lines += "【部署】成功 $(Count-Log $deployLog 'Deploy succeeded') 次、失敗 $(Count-Log $deployLog 'Deploy FAILED') 次、自動退回 $(Count-Log $deployLog '[ROLLBACK]') 次"
$siteRestart = (Count-Log $logFile '[RECOVERED] 網站重啟後恢復') + (Count-Log $logFile '[RECOVERED] 重啟後恢復')
$runnerRestart = Count-Log $logFile '[RECOVERED] GitHub Actions runner'
$tunnel = Count-Log $logFile '外網連不到'
$manual = (Count-Log $logFile '需要人工介入')
$lines += "【watchdog】網站自動重啟 $siteRestart 次、runner 重啟 $runnerRestart 次、外網連不到 $tunnel 次、需要人工介入 $manual 次"
$lines += ""
$lines += "詳細：https://kbs0830.com/stats"

$body = $lines -join "`n"
if ($DryRun) { $body; exit 0 }

$r = Send-AlertMail -Subject "📊 週報 $($since.ToString('MM/dd'))–$($now.ToString('MM/dd'))" -Body $body
Write-TimestampedLog -LogFile $logFile -Message "[WEEKLY] 週報：$r"
if ($r -like "sent*") {
    $snap = @{ week = $weekKey; at = $now.ToString("o"); visits = $visits }
    if ($raw) { $snap.raw = @{ total = $raw.total; browser = $raw.browser; ai = $raw.ai; search = $raw.search; bot = $raw.bot } }
    [IO.File]::WriteAllText($stateFile, ($snap | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding($false)))
}
