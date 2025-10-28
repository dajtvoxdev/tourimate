@echo off
REM TouriMate Deploy via PowerShell Remoting
REM This script uses PowerShell remoting instead of SCP

echo Starting TouriMate Deploy via PowerShell Remoting...
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

REM Run the remoting deploy script
echo Running deploy via PowerShell Remoting...
powershell -ExecutionPolicy Bypass -File "deployment\deploy-via-remoting.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Deploy via PowerShell Remoting completed successfully!
    echo Backend: https://tourimate.site:5000
    echo Frontend: https://tourimate.site
) else (
    echo.
    echo ❌ Deploy via PowerShell Remoting failed!
    echo Check the log file for details: D:\tourimate\deployment\remoting-deploy.log
)

echo.
pause
