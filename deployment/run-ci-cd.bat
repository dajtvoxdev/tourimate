@echo off
REM TouriMate CI/CD Runner
REM This script runs the CI/CD pipeline manually

echo Starting TouriMate CI/CD Pipeline...
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

REM Run the CI/CD script
echo Running CI/CD pipeline...
powershell -ExecutionPolicy Bypass -File "deployment\local-ci-cd.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ CI/CD Pipeline completed successfully!
    echo Backend: https://tourimate.site:5000
    echo Frontend: https://tourimate.site
) else (
    echo.
    echo ❌ CI/CD Pipeline failed!
)

echo.
pause
