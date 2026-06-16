@echo off
echo Starting kbs0830.com...

start "Next.js" cmd /k "cd /d C:\Users\user\Desktop\kbs0830_web-master && node node_modules\next\dist\bin\next start"

timeout /t 3 /nobreak >nul

start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run --url http://localhost:3000 kbs0830"

echo.
echo Server started!
echo Local:   http://localhost:3000
echo Public:  https://kbs0830.com
echo.
echo Close this window to keep servers running in background.
