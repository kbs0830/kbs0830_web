# 共用健康檢查邏輯：確認首頁回應正常、內容正確、且引用的 JS chunk 真的載得到。
# 被 scripts/verify-deploy.ps1（部署後檢查）和 scripts/watchdog.ps1（定期巡檢）共用，
# 只維護這一份，之後要加新的檢查項目也只需要改這裡。

function Test-SiteHealth {
    param(
        [string]$Url = "http://localhost:3000/",
        [int]$MaxWaitSeconds = 30,
        [string]$ExpectedText = "PINGWEI"
    )

    $deadline = (Get-Date).AddSeconds($MaxWaitSeconds)
    $html = $null

    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -eq 200) {
                $html = $resp.Content
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }

    if (-not $html) {
        return [PSCustomObject]@{
            Success = $false
            Reason  = "首頁在 $MaxWaitSeconds 秒內沒有正常回應 (Homepage did not respond in time)"
        }
    }

    if ($html -notmatch $ExpectedText) {
        return [PSCustomObject]@{
            Success = $false
            Reason  = "首頁內容看起來不對勁，缺少預期文字 '$ExpectedText' (Homepage content looks wrong)"
        }
    }

    $baseUri = [Uri]$Url
    $chunkMatches = [regex]::Matches($html, '/_next/static/chunks/[^"''<>]+\.js') |
        ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 3

    if ($chunkMatches.Count -eq 0) {
        return [PSCustomObject]@{
            Success = $false
            Reason  = "首頁 HTML 裡找不到任何 JS chunk 參照 (No JS chunk references found)"
        }
    }

    foreach ($chunk in $chunkMatches) {
        $chunkUrl = "$($baseUri.Scheme)://$($baseUri.Authority)$chunk"
        try {
            $chunkResp = Invoke-WebRequest -Uri $chunkUrl -UseBasicParsing -TimeoutSec 5
            $code = $chunkResp.StatusCode
        } catch {
            $code = $_.Exception.Response.StatusCode.value__
        }

        if ($code -ne 200) {
            return [PSCustomObject]@{
                Success = $false
                Reason  = "Chunk $chunk 回傳 $code，很可能是 process 沒重啟、build hash 對不上 (stale process serving mismatched build hashes)"
            }
        }
    }

    return [PSCustomObject]@{
        Success = $true
        Reason  = "首頁與 JS chunk 都正常 (Homepage and JS chunks all healthy)"
    }
}
