@echo off
REM TouriMate Auto Build and Deploy Runner
REM This script runs the auto build and deploy pipeline

echo Starting TouriMate Auto Build and Deploy...
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

REM Run the auto build and deploy script
echo Running auto build and deploy pipeline...
powershell -ExecutionPolicy Bypass -File "deployment\auto-build-deploy.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Auto Build and Deploy completed successfully!
    echo Backend: https://tourimate.site:5000
    echo Frontend: https://tourimate.site
) else (
    echo.
    echo ❌ Auto Build and Deploy failed!
    echo Check the log file for details: D:\tourimate\deployment\auto-deploy.log
)

echo.
pause
