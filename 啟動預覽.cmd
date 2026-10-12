@echo off
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\start-preview.ps1"
if %ERRORLEVEL% neq 0 pause
