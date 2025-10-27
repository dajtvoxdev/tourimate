# Windows Server Deployment Scripts

## PowerShell Deployment Scripts

### 1. Initial Server Setup Script

```powershell
# setup-server.ps1
# Run this script as Administrator on Windows Server 2019

Write-Host "Setting up Windows Server 2019 for TouriMate deployment..." -ForegroundColor Green

# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required software
Write-Host "Installing required software..." -ForegroundColor Yellow
choco install dotnet-8.0-sdk -y
choco install git -y
choco install nodejs -y

# Enable IIS features
Write-Host "Enabling IIS features..." -ForegroundColor Yellow
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
Enable-WindowsOptionalFeature -Online -FeatureName IIS-RequestFiltering
Enable-WindowsOptionalFeature -Online -FeatureName IIS-StaticContent
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DefaultDocument
Enable-WindowsOptionalFeature -Online -FeatureName IIS-DirectoryBrowsing
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45

# Install ASP.NET Core Hosting Bundle
Write-Host "Installing ASP.NET Core Hosting Bundle..." -ForegroundColor Yellow
$url = "https://download.visualstudio.microsoft.com/download/pr/8c4b7d0c-8b0c-4b0c-8b0c-8b0c4b0c8b0c/8b0c4b0c8b0c4b0c8b0c4b0c8b0c4b0c8b0c/aspnetcore-runtime-8.0.0-win-x64.exe"
$output = "C:\temp\aspnetcore-runtime.exe"
New-Item -ItemType Directory -Path "C:\temp" -Force
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process -FilePath $output -ArgumentList "/quiet" -Wait

# Install OpenSSH Server
Write-Host "Installing OpenSSH Server..." -ForegroundColor Yellow
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# Configure firewall
Write-Host "Configuring firewall..." -ForegroundColor Yellow
New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "API Staging" -Direction Inbound -Protocol TCP -LocalPort 5001 -Action Allow
New-NetFirewallRule -DisplayName "API Production" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "Frontend Staging" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "Frontend Production" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Create deployment user
Write-Host "Creating deployment user..." -ForegroundColor Yellow
$password = Read-Host "Enter password for deployment user" -AsSecureString
New-LocalUser -Name "deploy" -Description "Deployment User" -Password $password
Add-LocalGroupMember -Group "IIS_IUSRS" -Member "deploy"
Add-LocalGroupMember -Group "Administrators" -Member "deploy"

# Create deployment directories
Write-Host "Creating deployment directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-staging" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-production" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-frontend-staging" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-frontend-production" -Force

Write-Host "Server setup completed successfully!" -ForegroundColor Green
Write-Host "Please configure IIS and SQL Server manually." -ForegroundColor Yellow
```

### 2. IIS Configuration Script

```powershell
# configure-iis.ps1
# Run this script as Administrator

Write-Host "Configuring IIS for TouriMate..." -ForegroundColor Green

Import-Module WebAdministration

# Create application pools
Write-Host "Creating application pools..." -ForegroundColor Yellow
New-WebAppPool -Name "TouriMateAPIStaging" -Force
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIStaging" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIStaging" -Name managedRuntimeVersion -Value ""

New-WebAppPool -Name "TouriMateAPIProduction" -Force
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name managedRuntimeVersion -Value ""

# Create websites
Write-Host "Creating websites..." -ForegroundColor Yellow
New-Website -Name "TouriMate API Staging" -Port 5001 -PhysicalPath "C:\inetpub\wwwroot\tourimate-staging" -ApplicationPool "TouriMateAPIStaging"
New-Website -Name "TouriMate API Production" -Port 5000 -PhysicalPath "C:\inetpub\wwwroot\tourimate-production" -ApplicationPool "TouriMateAPIProduction"
New-Website -Name "TouriMate Frontend Staging" -Port 3001 -PhysicalPath "C:\inetpub\wwwroot\tourimate-frontend-staging" -ApplicationPool "DefaultAppPool"
New-Website -Name "TouriMate Frontend Production" -Port 3000 -PhysicalPath "C:\inetpub\wwwroot\tourimate-frontend-production" -ApplicationPool "DefaultAppPool"

# Set permissions
Write-Host "Setting permissions..." -ForegroundColor Yellow
icacls "C:\inetpub\wwwroot\tourimate-staging" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\tourimate-production" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\tourimate-frontend-staging" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\tourimate-frontend-production" /grant "IIS_IUSRS:(OI)(CI)F" /T

Write-Host "IIS configuration completed successfully!" -ForegroundColor Green
```

### 3. Database Setup Script

```powershell
# setup-database.ps1
# Run this script as Administrator

Write-Host "Setting up SQL Server databases..." -ForegroundColor Green

# Install SQL Server Express (if not already installed)
Write-Host "Installing SQL Server Express..." -ForegroundColor Yellow
choco install sql-server-express -y

# Wait for SQL Server to start
Start-Sleep -Seconds 30

# Create databases and user
Write-Host "Creating databases and user..." -ForegroundColor Yellow
$sqlScript = @"
-- Create staging database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TouriMateStaging')
BEGIN
    CREATE DATABASE TouriMateStaging;
END

-- Create production database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TouriMateProduction')
BEGIN
    CREATE DATABASE TouriMateProduction;
END

-- Create deployment user
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'deploy')
BEGIN
    CREATE LOGIN [deploy] WITH PASSWORD = 'YourSecurePassword';
END

-- Grant permissions for staging
USE TouriMateStaging;
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'deploy')
BEGIN
    CREATE USER [deploy] FOR LOGIN [deploy];
    ALTER ROLE db_owner ADD MEMBER [deploy];
END

-- Grant permissions for production
USE TouriMateProduction;
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'deploy')
BEGIN
    CREATE USER [deploy] FOR LOGIN [deploy];
    ALTER ROLE db_owner ADD MEMBER [deploy];
END
"@

# Execute SQL script
$sqlScript | sqlcmd -S localhost -E

Write-Host "Database setup completed successfully!" -ForegroundColor Green
```

### 4. Deployment Helper Script

```powershell
# deploy-helper.ps1
# Helper script for manual deployments

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("backend", "frontend")]
    [string]$Component
)

Write-Host "Deploying $Component to $Environment..." -ForegroundColor Green

if ($Component -eq "backend") {
    $appPool = "TouriMateAPI$Environment"
    $siteName = "TouriMate API $Environment"
    $path = "C:\inetpub\wwwroot\tourimate-$Environment"
} else {
    $appPool = "DefaultAppPool"
    $siteName = "TouriMate Frontend $Environment"
    $path = "C:\inetpub\wwwroot\tourimate-frontend-$Environment"
}

# Stop application
Write-Host "Stopping $siteName..." -ForegroundColor Yellow
if ($Component -eq "backend") {
    net stop $siteName 2>$null
} else {
    Import-Module WebAdministration
    Stop-Website -Name $siteName -ErrorAction SilentlyContinue
}

# Backup current deployment
Write-Host "Backing up current deployment..." -ForegroundColor Yellow
if (Test-Path $path) {
    $backupPath = "$path-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Move-Item $path $backupPath -Force
    Write-Host "Backup created at: $backupPath" -ForegroundColor Green
}

# Create new directory
New-Item -ItemType Directory -Path $path -Force

# Set permissions
icacls $path /grant "IIS_IUSRS:(OI)(CI)F" /T

# Start application
Write-Host "Starting $siteName..." -ForegroundColor Yellow
if ($Component -eq "backend") {
    net start $siteName
} else {
    Start-Website -Name $siteName
}

Write-Host "Deployment completed successfully!" -ForegroundColor Green
```

### 5. Health Check Script

```powershell
# health-check.ps1
# Script to check application health

Write-Host "Checking TouriMate application health..." -ForegroundColor Green

# Check IIS sites
Write-Host "`nChecking IIS sites..." -ForegroundColor Yellow
Import-Module WebAdministration

$sites = @(
    "TouriMate API Staging",
    "TouriMate API Production", 
    "TouriMate Frontend Staging",
    "TouriMate Frontend Production"
)

foreach ($site in $sites) {
    $siteState = Get-Website -Name $site | Select-Object -ExpandProperty State
    if ($siteState -eq "Started") {
        Write-Host "✓ $site is running" -ForegroundColor Green
    } else {
        Write-Host "✗ $site is not running (State: $siteState)" -ForegroundColor Red
    }
}

# Check application pools
Write-Host "`nChecking application pools..." -ForegroundColor Yellow
$appPools = @(
    "TouriMateAPIStaging",
    "TouriMateAPIProduction",
    "DefaultAppPool"
)

foreach ($pool in $appPools) {
    $poolState = Get-WebAppPoolState -Name $pool | Select-Object -ExpandProperty Value
    if ($poolState -eq "Started") {
        Write-Host "✓ $pool is running" -ForegroundColor Green
    } else {
        Write-Host "✗ $pool is not running (State: $poolState)" -ForegroundColor Red
    }
}

# Check SQL Server
Write-Host "`nChecking SQL Server..." -ForegroundColor Yellow
$sqlService = Get-Service -Name "MSSQL*" | Where-Object {$_.Status -eq "Running"}
if ($sqlService) {
    Write-Host "✓ SQL Server is running" -ForegroundColor Green
} else {
    Write-Host "✗ SQL Server is not running" -ForegroundColor Red
}

# Check disk space
Write-Host "`nChecking disk space..." -ForegroundColor Yellow
$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
$freeSpaceGB = [math]::Round($disk.FreeSpace / 1GB, 2)
$totalSpaceGB = [math]::Round($disk.Size / 1GB, 2)
$usedSpacePercent = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)

Write-Host "C: Drive - Free: $freeSpaceGB GB, Used: $usedSpacePercent%" -ForegroundColor $(if ($usedSpacePercent -lt 80) { "Green" } elseif ($usedSpacePercent -lt 90) { "Yellow" } else { "Red" })

# Check memory usage
Write-Host "`nChecking memory usage..." -ForegroundColor Yellow
$memory = Get-WmiObject -Class Win32_OperatingSystem
$totalMemoryGB = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
$freeMemoryGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
$usedMemoryPercent = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 2)

Write-Host "Memory - Total: $totalMemoryGB GB, Free: $freeMemoryGB GB, Used: $usedMemoryPercent%" -ForegroundColor $(if ($usedMemoryPercent -lt 80) { "Green" } elseif ($usedMemoryPercent -lt 90) { "Yellow" } else { "Red" })

Write-Host "`nHealth check completed!" -ForegroundColor Green
```

## Usage Instructions

### 1. Initial Setup
```powershell
# Run as Administrator
.\setup-server.ps1
.\configure-iis.ps1
.\setup-database.ps1
```

### 2. Manual Deployment
```powershell
# Deploy backend to staging
.\deploy-helper.ps1 -Environment staging -Component backend

# Deploy frontend to production
.\deploy-helper.ps1 -Environment production -Component frontend
```

### 3. Health Check
```powershell
# Check application health
.\health-check.ps1
```

## Security Notes

1. **Change default passwords** in all scripts
2. **Use strong passwords** for deployment user
3. **Enable Windows Firewall** and configure rules
4. **Regular security updates** for Windows Server
5. **Monitor logs** for security events
6. **Use SSL certificates** for HTTPS
7. **Restrict SSH access** to specific IPs if possible

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   ```powershell
   # Fix IIS permissions
   icacls "C:\inetpub\wwwroot" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

2. **Application Pool Issues**:
   ```powershell
   # Restart application pools
   Restart-WebAppPool -Name "TouriMateAPIStaging"
   Restart-WebAppPool -Name "TouriMateAPIProduction"
   ```

3. **SQL Server Connection Issues**:
   ```powershell
   # Check SQL Server service
   Get-Service -Name "MSSQL*"
   Start-Service -Name "MSSQLSERVER"
   ```

4. **SSH Connection Issues**:
   ```powershell
   # Check SSH service
   Get-Service -Name "sshd"
   Start-Service -Name "sshd"
   ```

## Monitoring

1. **Set up Windows Event Log monitoring**
2. **Configure IIS logging**
3. **Monitor application performance**
4. **Set up alerts for critical issues**
5. **Regular backup verification**
