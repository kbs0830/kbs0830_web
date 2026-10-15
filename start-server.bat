@echo off
rem Normally you do NOT need this anymore: after running scripts\setup-autostart.ps1 (as admin),
rem Next.js (task kbs0830_NextJS) and the tunnel (Windows service Cloudflared) start on boot.
rem Keep this only for manually bringing things back up.
echo Starting kbs0830.com (silent)...

schtasks /run /tn "kbs0830_NextJS"

timeout /t 3 /nobreak >nul

rem The Cloudflared service only really runs the tunnel if its binPath contains "tunnel ... run".
rem If setup-autostart.ps1 has not been run yet, fall back to a foreground cloudflared like before.
sc qc Cloudflared | find /i "tunnel" >nul
if %errorlevel%==0 (
  sc start Cloudflared >nul 2>&1
  echo Tunnel: Cloudflared service
) else (
  echo [WARN] Cloudflared service not configured - run scripts\setup-autostart.ps1 as admin
  start /b "" cloudflared tunnel --config "C:\Users\user\.cloudflared\config.yml" run kbs0830
)

echo Done. Server running at http://localhost:3000 and https://kbs0830.com
