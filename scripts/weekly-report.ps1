# 每週流量週報（TODO 點子，2026-11-09）：每週一 09:00 後寄一封到 otemon，整理過去 7 天：
#   - Cloudflare：訪客、頁面瀏覽（跟前一週比）
#   - 真人造訪、未過濾流量（AI 爬蟲／搜尋引擎／其他機器人）：這兩份檔案只存累計，跟上週寄信時的快照相減
#   - 首頁 Web Vitals p75（/api/web-vitals）
#   - 部署：成功／失敗／自動退回次數（logs\deploy.log）
#   - watchdog：網站／runner 自動重啟、外網斷線次數（logs\watchdog.log）
#   - 自家雷達：近 7 天架次、最多同時、在線率、航空公司（data\radar.json）
#   - Google 搜尋：點擊／曝光／排名、sitemap 網址的索引狀態（scripts\lib\search-console.js，要 .env.local 的 GSC_KEY_FILE）
#   - 外部來源排行（I10）：搜尋／社群／AI／信件／直接進入分開算（data\visits-detail.json 的累計，跟上週快照相減）
#   - 404 前幾名（C3，data\not-found.json，server.js 記的；掃描器只算次數）
#   - Cloudflare 快取命中率、外網抖動次數、磁碟剩餘空間（C5）
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
        $u = 0; $v = 0; $req = 0; $hit = 0
        for ($d = $from; $d -le $to; $d = $d.AddDays(1)) {
            $k = $d.ToString("yyyy-MM-dd")
            if ($days.ContainsKey($k)) {
                $u += $days[$k].uniques; $v += $days[$k].pageViews
                # cachedRequests 2026-11-25 起才有：只拿有這欄的日子算命中率
                if ($null -ne $days[$k].cachedRequests) { $req += $days[$k].requests; $hit += $days[$k].cachedRequests }
            }
        }
        return @($u, $v, $req, $hit)
    }
    $end = $now.ToUniversalTime().Date.AddDays(-1)  # 今天還沒過完，算到昨天
    $this = & $sum $end.AddDays(-6) $end
    $prev = & $sum $end.AddDays(-13) $end.AddDays(-7)
    $lines += "【Cloudflare】$($end.AddDays(-6).ToString('MM/dd'))–$($end.ToString('MM/dd'))"
    $lines += "  訪客 $(N $this[0]) $(Delta $this[0] $prev[0])"
    $lines += "  頁面瀏覽 $(N $this[1]) $(Delta $this[1] $prev[1])"
    if ($this[2] -gt 0) {
        $lines += "  快取命中率 $([math]::Round($this[3] / $this[2] * 100, 1))%（$(N $this[3]) / $(N $this[2]) 個請求由 Cloudflare 直接回，沒到桌機）"
    }
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

# --- 外部來源排行（決策表 I10，2026-11-25）---
# visits-detail.json 的 referrers 是累計「來源網域 → 工作階段數」，跟上週快照相減；直接進入＝這 7 天的工作階段 − 有來源的
function Ref-Kind($h) {
    if ($h.StartsWith("ref:")) { return "活動連結" }
    if ($h -match '(^|\.)(mail\.[a-z.]+|outlook\.(live|office)\.com)$' -or $h -eq "com.google.android.gm") { return "信件" }
    if ($h -match '(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|you\.com|phind\.com)$') { return "AI" }
    if ($h -match '(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|baidu\.com|yandex\.[a-z.]+|ecosia\.org|naver\.com|search\.brave\.com|startpage\.com)$') { return "搜尋" }
    if ($h -match '(^|\.)(facebook\.com|fb\.me|instagram\.com|t\.co|x\.com|twitter\.com|linkedin\.com|lnkd\.in|threads\.(net|com)|reddit\.com|line\.me|youtube\.com|ptt\.cc|dcard\.tw|plurk\.com|bsky\.app|mastodon\.[a-z.]+)$') { return "社群" }
    if ($h -match '(^|\.)github\.(com|io)$') { return "GitHub" }
    return "其他網站"
}
$detail = Read-Json (Join-Path $dataDir "visits-detail.json")
$refNow = @{}
if ($detail -and $detail.referrers) { foreach ($p in $detail.referrers.PSObject.Properties) { $refNow[$p.Name] = [int]$p.Value } }
if ($detail) {
    $sessions7 = 0
    for ($d = $now.Date.AddDays(-7); $d -lt $now.Date; $d = $d.AddDays(1)) {
        $v = $detail.days.($d.ToString("yyyy-MM-dd"))
        if ($v) { $sessions7 += [int]$v.sessions }
    }
    $refPrev = @{}
    if ($state -and $state.referrers) { foreach ($p in $state.referrers.PSObject.Properties) { $refPrev[$p.Name] = [int]$p.Value } }
    $hostGain = @{}; $kindGain = @{}; $referred = 0
    foreach ($h in $refNow.Keys) {
        $g = $refNow[$h] - [int]$refPrev[$h]
        if ($g -le 0) { continue }
        $hostGain[$h] = $g; $referred += $g
        $k = Ref-Kind $h
        $kindGain[$k] = [int]$kindGain[$k] + $g
    }
    if ($state -and $state.referrers) {
        $lines += "【外部來源】近 7 天 $(N $sessions7) 次造訪"
        $parts = @("直接進入 $(N ([math]::Max(0, $sessions7 - $referred)))")
    } else {
        # 第一封還沒有快照：只能列累計，直接進入沒辦法算（工作階段是 7 天、來源是累計，兩個不能相減）
        $lines += "【外部來源】累計（$($detail.since) 起；下週起才是 7 天的增加量，直接進入也是）"
        $parts = @()
    }
    foreach ($e in ($kindGain.GetEnumerator() | Sort-Object Value -Descending)) { $parts += "$($e.Key) $(N $e.Value)" }
    $lines += "  $($parts -join '、')"
    if ($hostGain.Count -gt 0) {
        $lines += "  網域：$(($hostGain.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 8 | ForEach-Object { "$($_.Key) $($_.Value)" }) -join '、')"
    }
    $lines += ""
}

# --- 404（決策表 C3，2026-11-25）：server.js 記的「台灣日期 → 路徑 → 次數」---
$nfData = Read-Json (Join-Path $dataDir "not-found.json")
if ($nfData -and $nfData.days) {
    $nfPaths = @{}; $nfTotal = 0; $scan = 0
    for ($d = $now.Date.AddDays(-7); $d -lt $now.Date; $d = $d.AddDays(1)) {
        $key = $d.ToString("yyyy-MM-dd")
        $v = $nfData.days.$key
        if ($v) { foreach ($p in $v.PSObject.Properties) { $nfPaths[$p.Name] = [int]$nfPaths[$p.Name] + [int]$p.Value; $nfTotal += [int]$p.Value } }
        if ($nfData.scanners -and $nfData.scanners.$key) { $scan += [int]$nfData.scanners.$key }
    }
    $lines += "【404】近 7 天 $(N $nfTotal) 次（另外掃描器亂試 $(N $scan) 次，不列）"
    if ($nfPaths.Count -gt 0) {
        $lines += "  $(($nfPaths.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object { "$($_.Key) $($_.Value)" }) -join '、')"
    }
    $lines += ""
}

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

# --- Google 搜尋（Search Console，TODO C4，2026-11-17）---
# scripts\lib\search-console.js 抓搜尋成效（點擊／曝光／排名，跟前一週比）＋ sitemap 每個網址的索引狀態，印一行 JSON。
# 沒設 .env.local 的 GSC_KEY_FILE → skipped，這段不顯示；出錯就寫一行原因，週報照寄。
$gsc = $null
try {
    $gscOut = & node (Join-Path $PSScriptRoot "lib\search-console.js") 2>$null
    if ($gscOut) { $gsc = ($gscOut -join "") | ConvertFrom-Json }
} catch { $gsc = [PSCustomObject]@{ error = $_.Exception.Message } }
if ($gsc -and $gsc.error) {
    $lines += "【Google 搜尋】讀不到：$($gsc.error)"
    $lines += ""
} elseif ($gsc -and -not $gsc.skipped) {
    $a = $gsc.analytics
    $lines += "【Google 搜尋】$($a.range)（Search Console 的資料晚 2～3 天）"
    $pos = ""
    if ($a.cur.impressions -gt 0) { $pos = "、平均排名 $([math]::Round($a.cur.position, 1))" }
    $lines += "  點擊 $(N $a.cur.clicks) $(Delta $a.cur.clicks $a.prev.clicks)、曝光 $(N $a.cur.impressions) $(Delta $a.cur.impressions $a.prev.impressions)$pos"
    if ($a.queries -and $a.queries.Count -gt 0) {
        $lines += "  搜尋字詞：$(($a.queries | ForEach-Object { "$($_.key)（曝光 $($_.impressions)、點擊 $($_.clicks)）" }) -join '、')"
    }
    if ($a.pages -and $a.pages.Count -gt 0) {
        $lines += "  曝光最多的頁面：$(($a.pages | ForEach-Object { "$($_.key)（$($_.impressions)）" }) -join '、')"
    }
    $ix = $gsc.index
    $was = ""
    if ($state -and $state.gscIndexed) { $was = "（上週 $($state.gscIndexed)）" }
    $lines += "  已建立索引：sitemap $($ix.total) 個網址中 $($ix.indexed) 個$was"
    $lines += "  $(($ix.states.PSObject.Properties | Sort-Object Value -Descending | ForEach-Object { "$($_.Name) $($_.Value)" }) -join '、')"
    if ($ix.notIndexed -and $ix.notIndexed.Count -gt 0 -and $ix.notIndexed.Count -le 12) {
        $lines += "  還沒收錄：$($ix.notIndexed -join '、')"
    }
    $lines += ""
}

# --- 自家雷達（2026-11-21，data\radar.json 每天的彙總，台灣日期）---
$radar = Read-Json (Join-Path $dataDir "radar.json")
if ($radar -and $radar.days) {
    $u = 0; $peak = 0; $polls = 0; $on = 0; $airl = @{}
    for ($d = $now.Date.AddDays(-7); $d -lt $now.Date; $d = $d.AddDays(1)) {
        $v = $radar.days.($d.ToString("yyyy-MM-dd"))
        if (-not $v) { continue }
        $u += $v.unique; $polls += $v.polls; $on += $v.online
        if ($v.peak -gt $peak) { $peak = $v.peak }
        foreach ($p in $v.airlines.PSObject.Properties) { $airl[$p.Name] = [int]$airl[$p.Name] + [int]$p.Value }
    }
    if ($polls -gt 0) {
        $lines += "【自家雷達】近 7 天收到 $(N $u) 架次（每天平均 $(N ([math]::Round($u / 7)))）、最多同時 $peak 架、在線 $([math]::Round($on / $polls * 100, 1))%"
        if ($airl.Count -gt 0) {
            $lines += "  航空公司：$(($airl.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 8 | ForEach-Object { "$($_.Key) $($_.Value)" }) -join '、')"
        }
        $lines += ""
    }
}

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
# 抖動（C5）：外網檢查失敗一次、下一輪（5 分鐘後）就好了的次數；本機首頁健檢偶爾逾時也算
$jitter = Count-Log $logFile '外網檢查失敗一次'
$localSlow = Count-Log $logFile '網站健康檢查失敗'
$lines += "  外網抖動（失敗一次、下一輪就好）$jitter 次、本機健檢失敗 $localSlow 次"
# 磁碟（C5）：C:（網站、node_modules、log）、D:（每日備份）
$disk = @()
foreach ($dl in "C", "D") {
    $drv = Get-PSDrive -Name $dl -PSProvider FileSystem -ErrorAction SilentlyContinue
    if ($drv -and ($drv.Used + $drv.Free) -gt 0) {
        $freeGb = [math]::Round($drv.Free / 1GB)
        $pct = [math]::Round($drv.Free / ($drv.Used + $drv.Free) * 100)
        $warn = ""
        if ($pct -lt 10) { $warn = " ⚠️ 不到 10%" }
        $disk += "$($dl): 剩 $freeGb GB（$pct%）$warn"
    }
}
if ($disk.Count -gt 0) { $lines += "【磁碟】$($disk -join '、')" }
$lines += ""
$lines += "詳細：https://kbs0830.com/stats"

$body = $lines -join "`n"
if ($DryRun) { $body; exit 0 }

$r = Send-AlertMail -Subject "📊 週報 $($since.ToString('MM/dd'))–$($now.ToString('MM/dd'))" -Body $body
Write-TimestampedLog -LogFile $logFile -Message "[WEEKLY] 週報：$r"
if ($r -like "sent*") {
    $snap = @{ week = $weekKey; at = $now.ToString("o"); visits = $visits }
    if ($raw) { $snap.raw = @{ total = $raw.total; browser = $raw.browser; ai = $raw.ai; search = $raw.search; bot = $raw.bot } }
    if ($gsc -and $gsc.index) { $snap.gscIndexed = $gsc.index.indexed }
    if ($refNow.Count -gt 0) { $snap.referrers = $refNow }
    [IO.File]::WriteAllText($stateFile, ($snap | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding($false)))
}
