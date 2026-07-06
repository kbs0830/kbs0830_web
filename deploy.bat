@echo off
REM 實際邏輯都在 scripts\deploy.ps1（manual 跟 CI 共用同一份，log 寫在 logs\deploy.log）
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy.ps1"
exit /b %errorlevel%
