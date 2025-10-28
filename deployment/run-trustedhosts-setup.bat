@echo off
REM Run PowerShell Remoting Setup as Administrator
REM This script runs setup-trustedhosts.ps1 with Administrator privileges

echo Setting up PowerShell Remoting TrustedHosts...
echo This requires Administrator privileges.
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo This script must be run as Administrator!
    echo Please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo Running as Administrator ✅
echo.

REM Change to project directory
cd /d "D:\tourimate"

REM Run the TrustedHosts setup script
powershell -ExecutionPolicy Bypass -File "deployment\setup-trustedhosts.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ TrustedHosts setup completed!
    echo You can now use: .\deployment\deploy-via-remoting.ps1
) else (
    echo.
    echo ❌ TrustedHosts setup failed!
    echo You can use: .\deployment\run-simple-scp.bat instead
)

echo.
pause
