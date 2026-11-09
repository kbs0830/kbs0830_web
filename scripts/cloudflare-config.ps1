# Cloudflare 設定寫成程式（TODO「Cloudflare 設定寫成腳本」，2026-11-09）。
# 之前這些設定只存在 dashboard：www 導向 9 月「設好了」其實沒存成功、HTTP→HTTPS 一直沒開，都是事後才發現。
#
# 管四件事：
#   1. Always Use HTTPS（http:// → https:// 301）
#   2. HSTS（瀏覽器記住只走 https；max-age 半年、不含子網域、不 preload——要撤回還來得及）
#   3. www → 裸網域 301（Single Redirect；dashboard 用範本建的那條也算數，不會重複建）
#   4. WAF 自訂規則：擋掃描器（/wp-*、*.php、/.env、/.git、xmlrpc）。網站本身沒有這些路徑，
#      server.log 裡這類請求佔大宗，在 Cloudflare 擋掉就不會打到桌機
#
# 用法（Windows PowerShell 5.1）：
#   powershell -File scripts\cloudflare-config.ps1          只檢查，列出跟預期不同的地方（不改任何東西）
#   powershell -File scripts\cloudflare-config.ps1 -Apply   把不同的地方改成預期的樣子，改完用 curl 回查
# deploy.ps1 每次部署帶 -Check -Quiet 呼叫：有設定被改掉（漂移）就寫 log＋寄信，不擋部署。
#
# 金鑰：.env.local 的 CLOUDFLARE_CONFIG_TOKEN。沒設就什麼都不做（log 寫 skipped）。
# 權限只要三個、只限 kbs0830.com：Zone Settings:Edit、Single Redirect:Edit、Zone WAF:Edit
# （跟讀流量的 CLOUDFLARE_ANALYTICS_TOKEN 分開：那把只能讀，外洩也改不了設定）
# 不能用 ??、?.、三元運算子（PS 5.1）。

param([switch]$Apply, [switch]$Check, [switch]$Quiet)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$repo = Split-Path -Parent $PSScriptRoot
$zone = "bedff9fea6cd187647a5f2dbd02ae833"  # kbs0830.com（不是機密，lib/cloudflare-analytics.ts 也寫死）
$api = "https://api.cloudflare.com/client/v4/zones/$zone"
$logFile = Join-Path $repo "logs\deploy.log"

. (Join-Path $PSScriptRoot "lib\logger.ps1")
. (Join-Path $PSScriptRoot "lib\notify.ps1")
function Say($msg) { if (-not $Quiet) { Write-Host $msg } }

# --- 金鑰 ---
$token = $null
$envFile = Join-Path $repo ".env.local"
if (Test-Path $envFile) {
    foreach ($line in [IO.File]::ReadAllLines($envFile)) {
        if ($line -match '^\s*CLOUDFLARE_CONFIG_TOKEN\s*=\s*"?([^"\s]+)"?\s*$') { $token = $Matches[1] }
    }
}
if (-not $token) {
    Say "skipped：.env.local 沒有 CLOUDFLARE_CONFIG_TOKEN"
    exit 0
}
$headers = @{ Authorization = "Bearer $token" }

function Cf($method, $path, $body) {
    $req = @{ Method = $method; Uri = "$api$path"; Headers = $headers; ContentType = "application/json; charset=utf-8" }
    if ($body) { $req.Body = [Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Depth 10 -Compress)) }
    try {
        return Invoke-RestMethod @req
    } catch {
        $msg = $_.Exception.Message
        try { $msg = ($_.ErrorDetails.Message | ConvertFrom-Json).errors | ForEach-Object { "$($_.code) $($_.message)" } } catch {}
        throw "$method $path → $msg"
    }
}

# --- 預期的樣子 ---
$hsts = @{ enabled = $true; max_age = 15552000; include_subdomains = $false; preload = $false; nosniff = $true }
$wwwRule = @{
    ref = "kbs0830_www_to_apex"
    description = "www → kbs0830.com（scripts/cloudflare-config.ps1）"
    expression = '(http.host eq "www.kbs0830.com")'
    action = "redirect"
    action_parameters = @{ from_value = @{
        status_code = 301
        target_url = @{ expression = 'concat("https://kbs0830.com", http.request.uri.path)' }
        preserve_query_string = $true
    } }
}
# 只用 contains（免費方案的規則語言都能用）。網站沒有任何路徑含這些字串：改路由前想一下會不會被擋
$scannerExpr = '(http.request.uri.path contains "/wp-") or (http.request.uri.path contains ".php") or (http.request.uri.path contains "/.env") or (http.request.uri.path contains "/.git") or (http.request.uri.path contains "xmlrpc")'
$wafRule = @{
    ref = "kbs0830_block_scanners"
    description = "擋掃描器：/wp-*、*.php、/.env、/.git、xmlrpc（scripts/cloudflare-config.ps1）"
    expression = $scannerExpr
    action = "block"
}

function Get-Entrypoint($phase) {
    try { return (Cf GET "/rulesets/phases/$phase/entrypoint").result } catch { if ("$_" -match "10003|not found|404") { return $null } else { throw } }
}
function Set-RuleIfMissing($phase, $rule, $isPresent) {
    $ep = Get-Entrypoint $phase
    $rules = @()
    if ($ep -and $ep.rules) { $rules = @($ep.rules) }
    $found = $rules | Where-Object { & $isPresent $_ } | Select-Object -First 1
    if ($found -and $found.enabled -ne $false) { return "ok" }
    if (-not $Apply) { if ($found) { return "規則在但被停用" } else { return "沒有這條規則" } }
    if ($found) {
        Cf PATCH "/rulesets/$($ep.id)/rules/$($found.id)" (@{ enabled = $true } + $rule) | Out-Null
        return "已重新啟用"
    }
    if ($ep) { Cf POST "/rulesets/$($ep.id)/rules" $rule | Out-Null }
    else { Cf PUT "/rulesets/phases/$phase/entrypoint" @{ rules = @($rule) } | Out-Null }
    return "已建立"
}

$drift = @()
$report = @()
try {
    # 1. Always Use HTTPS
    $https = (Cf GET "/settings/always_use_https").result.value
    if ($https -ne "on") {
        if ($Apply) { Cf PATCH "/settings/always_use_https" @{ value = "on" } | Out-Null; $report += "Always Use HTTPS：已打開" }
        else { $drift += "Always Use HTTPS 是 $https" }
    } else { $report += "Always Use HTTPS：ok" }

    # 2. HSTS
    $sh = (Cf GET "/settings/security_header").result.value.strict_transport_security
    if (-not $sh.enabled -or [int]$sh.max_age -lt $hsts.max_age) {
        if ($Apply) { Cf PATCH "/settings/security_header" @{ value = @{ strict_transport_security = $hsts } } | Out-Null; $report += "HSTS：已打開（max-age 半年）" }
        else { $drift += "HSTS 沒開（enabled=$($sh.enabled) max_age=$($sh.max_age)）" }
    } else { $report += "HSTS：ok" }

    # 3. www → 裸網域（dashboard 範本建的那條也算：導向規則、條件裡有 www）
    $r = Set-RuleIfMissing "http_request_dynamic_redirect" $wwwRule { param($x) $x.action -eq "redirect" -and "$($x.expression)" -match "www" }
    if ($r -eq "ok") { $report += "www 導向：ok" } elseif ($Apply) { $report += "www 導向：$r" } else { $drift += "www 導向：$r" }

    # 4. WAF 擋掃描器
    $r = Set-RuleIfMissing "http_request_firewall_custom" $wafRule { param($x) $x.ref -eq "kbs0830_block_scanners" }
    if ($r -eq "ok") { $report += "WAF 擋掃描器：ok" } elseif ($Apply) { $report += "WAF 擋掃描器：$r" } else { $drift += "WAF 擋掃描器：$r" }
} catch {
    $err = "Cloudflare API 失敗：$($_.Exception.Message)"
    Say $err
    Write-TimestampedLog -LogFile $logFile -Message "[WARN] cloudflare-config：$err"
    exit 1
}

$report | ForEach-Object { Say "  $_" }

if ($Apply) {
    # 改完回查（Cloudflare 生效通常幾秒內）
    Start-Sleep -Seconds 5
    $checks = @(
        @{ name = "http:// → https"; url = "http://kbs0830.com/"; want = 301 },
        @{ name = "www → 裸網域"; url = "https://www.kbs0830.com/"; want = 301 },
        @{ name = "擋 /wp-admin"; url = "https://kbs0830.com/wp-admin"; want = 403 },
        @{ name = "首頁照常"; url = "https://kbs0830.com/"; want = 200 }
    )
    foreach ($c in $checks) {
        # 不用 Invoke-WebRequest -MaximumRedirection 0：PS 5.1 遇到 301 會丟例外、拿不到狀態碼（第一次跑顯示 0）
        $code = 0
        try {
            $wr = [Net.HttpWebRequest]::Create($c.url)
            $wr.AllowAutoRedirect = $false
            $wr.Method = "HEAD"
            $wr.UserAgent = "kbs0830-cloudflare-config"
            $resp = $wr.GetResponse()
            $code = [int]$resp.StatusCode
            $resp.Close()
        } catch [Net.WebException] {
            if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode; $_.Exception.Response.Close() }
        }
        $mark = "NG"; if ($code -eq $c.want) { $mark = "OK" }
        Say "  [$mark] $($c.name)：$code（預期 $($c.want)）"
    }
    Write-TimestampedLog -LogFile $logFile -Message "cloudflare-config -Apply：$($report -join '；')"
    exit 0
}

if ($drift.Count -gt 0) {
    $msg = "Cloudflare 設定跟預期不同：`n- " + ($drift -join "`n- ") + "`n`n修正：powershell -File scripts\cloudflare-config.ps1 -Apply"
    Say $msg
    Write-TimestampedLog -LogFile $logFile -Message "[WARN] cloudflare-config 漂移：$($drift -join '；')"
    if ($Check) { $r = Send-Alert -Key "cloudflare-config" -CooldownMinutes 1440 -Subject "🟠 Cloudflare 設定被改掉了" -Body $msg; Write-TimestampedLog -LogFile $logFile -Message "  通知：$r" }
    exit 2
}
Say "全部符合預期"
exit 0
