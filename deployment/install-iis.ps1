# Install IIS and Required Features
# Run this script as Administrator before running setup.ps1

Write-Host "Installing IIS and required features..." -ForegroundColor Green

# Enable IIS features
Write-Host "Enabling IIS Web Server Role..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All

Write-Host "Enabling IIS Web Server..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All

Write-Host "Enabling IIS Common HTTP Features..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures -All

Write-Host "Enabling IIS ASP.NET..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45 -All

Write-Host "Enabling IIS Management Console..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementConsole -All

Write-Host "Enabling IIS Management Scripts and Tools..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementScriptingTools -All

Write-Host "Enabling IIS Management Service..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ManagementService -All

# Install ASP.NET Core Hosting Bundle
Write-Host "Installing ASP.NET Core Hosting Bundle..." -ForegroundColor Yellow
$url = "https://download.visualstudio.microsoft.com/download/pr/8c4b7d0c-8b0c-4b0c-8b0c-8b0c4b0c8b0c/8b0c4b0c8b0c4b0c8b0c4b0c8b0c4b0c8b0c/aspnetcore-runtime-8.0.0-win-x64.exe"
$output = "C:\temp\aspnetcore-runtime.exe"

# Create temp directory
if (!(Test-Path "C:\temp")) {
    New-Item -ItemType Directory -Path "C:\temp" -Force
}

# Download and install
try {
    Invoke-WebRequest -Uri $url -OutFile $output
    Start-Process -FilePath $output -ArgumentList "/quiet" -Wait
    Write-Host "ASP.NET Core Hosting Bundle installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to install ASP.NET Core Hosting Bundle: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please install it manually from: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
}

# Restart IIS
Write-Host "Restarting IIS..." -ForegroundColor Yellow
iisreset

Write-Host "IIS installation completed!" -ForegroundColor Green
Write-Host "You can now run the setup.ps1 script" -ForegroundColor Cyan
