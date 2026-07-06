# 部署後健檢：確認 server 回應正常，且首頁引用的 JS chunk 真的載得到。
# 這正是之前「process 沒重啟、chunk hash 對不上」導致全白頁面的那個 bug ——
# 這裡直接把它變成一個會讓部署失敗的自動檢查，不會再悄悄留著壞掉的網站。

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"
$url = "http://localhost:3000/"
$maxWaitSeconds = 30
$deadline = (Get-Date).AddSeconds($maxWaitSeconds)

Write-Host "等待 server 就緒 · Waiting for server..."

$html = $null
while ((Get-Date) -lt $deadline) {
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -eq 200) {
            $html = $resp.Content
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $html) {
    Write-Host "[FAILED] 首頁在 $maxWaitSeconds 秒內沒有正常回應 · Homepage did not respond in time" -ForegroundColor Red
    exit 1
}

if ($html -notmatch "PINGWEI") {
    Write-Host "[FAILED] 首頁內容看起來不對勁（缺少預期文字）· Homepage content looks wrong" -ForegroundColor Red
    exit 1
}

$chunkMatches = [regex]::Matches($html, '/_next/static/chunks/[^"''<>]+\.js') |
    ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 3

if ($chunkMatches.Count -eq 0) {
    Write-Host "[FAILED] 首頁 HTML 裡找不到任何 JS chunk 參照 · No JS chunk references found" -ForegroundColor Red
    exit 1
}

foreach ($chunk in $chunkMatches) {
    $chunkUrl = "http://localhost:3000$chunk"
    try {
        $chunkResp = Invoke-WebRequest -Uri $chunkUrl -UseBasicParsing -TimeoutSec 5
        $code = $chunkResp.StatusCode
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
    }

    if ($code -ne 200) {
        Write-Host "[FAILED] Chunk $chunk 回傳 $code（很可能是 process 沒重啟、build hash 對不上）" -ForegroundColor Red
        Write-Host "         Chunk returned $code — likely a stale process serving mismatched build hashes" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[OK] 首頁與 JS chunk 都正常 · Homepage and JS chunks all healthy" -ForegroundColor Green
exit 0
