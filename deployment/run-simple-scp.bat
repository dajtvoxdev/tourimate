@echo off
REM TouriMate Simple SCP Deploy
REM This script uses SCP with Windows paths and password authentication

echo Starting TouriMate Simple SCP Deploy...
echo.

REM Change to project directory
cd /d "D:\tourimate"

REM Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell not found
    pause
    exit /b 1
)

REM Run the simple SCP deploy script
echo Running simple SCP deploy...
powershell -ExecutionPolicy Bypass -File "deployment\simple-scp-deploy.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Simple SCP Deploy completed successfully!
    echo Backend: https://tourimate.site:5000
    echo Frontend: https://tourimate.site
) else (
    echo.
    echo ❌ Simple SCP Deploy failed!
    echo Check the log file for details: D:\tourimate\deployment\simple-deploy.log
)

echo.
pause
