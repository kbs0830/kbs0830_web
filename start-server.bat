@echo off
echo Starting kbs0830.com (silent)...

schtasks /run /tn "kbs0830_NextJS"

timeout /t 3 /nobreak >nul

start /b "" cloudflared tunnel --config "C:\Users\user\.cloudflared\config.yml" run kbs0830

echo Done. Server running at http://localhost:3000 and https://kbs0830.com
