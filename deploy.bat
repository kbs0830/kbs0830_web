@echo off
echo Deploying kbs0830.com...

cd /d C:\Users\user\Desktop\kbs0830_web-master

echo Pulling latest code...
git pull origin main

echo Building...
node node_modules\next\dist\bin\next build

echo Restarting Next.js...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
start "Next.js" cmd /k "node node_modules\next\dist\bin\next start"

echo Done! https://kbs0830.com updated.
