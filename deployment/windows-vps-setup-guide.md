# Windows Server 2019 VPS CI/CD Setup Guide

## Overview

This guide will help you set up CI/CD for your TouriMate project on Windows Server 2019 VPS using GitHub Actions. The setup includes:

- **Backend**: .NET 8 Web API deployed to IIS
- **Frontend**: React + TypeScript deployed to IIS  
- **Database**: SQL Server with Entity Framework Core
- **Deployment**: Automated via GitHub Actions with SSH

## Prerequisites

### Windows Server 2019 VPS Requirements

1. **Windows Server 2019** with Administrator access
2. **Internet connection** for downloading packages
3. **Static IP address** for your VPS
4. **Domain name** (optional, for SSL)

### Required Software

- .NET 8 Runtime and SDK
- IIS with ASP.NET Core Hosting Bundle
- SQL Server (Express or Full)
- Git for Windows
- OpenSSH Server

## Step-by-Step Setup

### 1. Initial Server Configuration

#### Install Required Software

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force

# Install Chocolatey package manager
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required software
choco install dotnet-8.0-sdk -y
choco install git -y
choco install nodejs -y
choco install sql-server-express -y
```

#### Enable IIS Features

```powershell
# Enable IIS features
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
```

#### Install ASP.NET Core Hosting Bundle

```powershell
# Download and install ASP.NET Core Hosting Bundle
$url = "https://download.visualstudio.microsoft.com/download/pr/8c4b7d0c-8b0c-4b0c-8b0c-8b0c4b0c8b0c/8b0c4b0c8b0c4b0c8b0c4b0c8b0c4b0c8b0c/aspnetcore-runtime-8.0.0-win-x64.exe"
$output = "C:\temp\aspnetcore-runtime.exe"
New-Item -ItemType Directory -Path "C:\temp" -Force
Invoke-WebRequest -Uri $url -OutFile $output
Start-Process -FilePath $output -ArgumentList "/quiet" -Wait
```

### 2. SSH Server Configuration

#### Install OpenSSH Server

```powershell
# Install OpenSSH Server
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# Start and enable SSH service
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

# Configure firewall
New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
```

#### Create Deployment User

```powershell
# Create deployment user
$password = Read-Host "Enter password for deployment user" -AsSecureString
New-LocalUser -Name "deploy" -Description "Deployment User" -Password $password

# Add to required groups
Add-LocalGroupMember -Group "IIS_IUSRS" -Member "deploy"
Add-LocalGroupMember -Group "Administrators" -Member "deploy"
```

#### Generate SSH Key Pair

```powershell
# Generate SSH key pair for deployment user
ssh-keygen -t rsa -b 4096 -C "deploy@your-vps" -f C:\Users\deploy\.ssh\id_rsa

# Set permissions
icacls "C:\Users\deploy\.ssh" /grant "deploy:(OI)(CI)F" /T
icacls "C:\Users\deploy\.ssh\id_rsa" /grant "deploy:F"
```

### 3. IIS Configuration

#### Create Application Pools

```powershell
Import-Module WebAdministration

# Create staging app pool
New-WebAppPool -Name "TouriMateAPIStaging" -Force
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIStaging" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIStaging" -Name managedRuntimeVersion -Value ""

# Create production app pool
New-WebAppPool -Name "TouriMateAPIProduction" -Force
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name managedRuntimeVersion -Value ""
```

#### Create Websites

```powershell
# Create staging website
New-Website -Name "TouriMate API Staging" -Port 5001 -PhysicalPath "C:\inetpub\wwwroot\tourimate-staging" -ApplicationPool "TouriMateAPIStaging"

# Create production website
New-Website -Name "TouriMate API Production" -Port 5000 -PhysicalPath "C:\inetpub\wwwroot\tourimate-production" -ApplicationPool "TouriMateAPIProduction"

# Create frontend websites
New-Website -Name "TouriMate Frontend Staging" -Port 3001 -PhysicalPath "C:\inetpub\wwwroot\tourimate-frontend-staging" -ApplicationPool "DefaultAppPool"
New-Website -Name "TouriMate Frontend Production" -Port 3000 -PhysicalPath "C:\inetpub\wwwroot\tourimate-frontend-production" -ApplicationPool "DefaultAppPool"
```

#### Create Deployment Directories

```powershell
# Create deployment directories
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-staging" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-production" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-frontend-staging" -Force
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-frontend-production" -Force

# Set permissions
icacls "C:\inetpub\wwwroot\tourimate-staging" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\tourimate-production" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\tourimate-frontend-staging" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\tourimate-frontend-production" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

### 4. Database Configuration

#### Create Databases and User

```sql
-- Connect to SQL Server as Administrator
-- Create staging database
CREATE DATABASE TouriMateStaging;

-- Create production database
CREATE DATABASE TouriMateProduction;

-- Create deployment user
CREATE LOGIN [deploy] WITH PASSWORD = 'YourSecurePassword';

-- Grant permissions for staging
USE TouriMateStaging;
CREATE USER [deploy] FOR LOGIN [deploy];
ALTER ROLE db_owner ADD MEMBER [deploy];

-- Grant permissions for production
USE TouriMateProduction;
CREATE USER [deploy] FOR LOGIN [deploy];
ALTER ROLE db_owner ADD MEMBER [deploy];
```

### 5. Firewall Configuration

```powershell
# Configure firewall rules
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
New-NetFirewallRule -DisplayName "API Staging" -Direction Inbound -Protocol TCP -LocalPort 5001 -Action Allow
New-NetFirewallRule -DisplayName "API Production" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "Frontend Staging" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "Frontend Production" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 6. GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

#### VPS Connection Secrets
```
VPS_HOST=your-vps-ip-address
VPS_USERNAME=deploy
VPS_SSH_KEY=<content-of-C:\Users\deploy\.ssh\id_rsa>
VPS_PORT=22
```

#### Database Secrets
```
CONNECTION_STRING_STAGING=Server=localhost;Database=TouriMateStaging;User Id=deploy;Password=YourSecurePassword;TrustServerCertificate=true
CONNECTION_STRING_PRODUCTION=Server=localhost;Database=TouriMateProduction;User Id=deploy;Password=YourSecurePassword;TrustServerCertificate=true
```

#### Application Secrets
```
JWT_SECRET_KEY=<your-jwt-secret-key>
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY=<your-firebase-private-key>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
SEPAY_API_KEY=<your-sepay-api-key>
SEPAY_API_SECRET=<your-sepay-api-secret>
SEPAY_WEBHOOK_SECRET=<your-sepay-webhook-secret>
EMAIL_SMTP_SERVER=<your-smtp-server>
EMAIL_SMTP_USERNAME=<your-smtp-username>
EMAIL_SMTP_PASSWORD=<your-smtp-password>
```

### 7. Environment Configuration Files

#### Backend appsettings.json

Create these files in your project:

**appsettings.Staging.json**:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TouriMateStaging;User Id=deploy;Password=YourSecurePassword;TrustServerCertificate=true"
  },
  "JWT": {
    "SecretKey": "your-staging-secret-key-here",
    "Issuer": "TouriMate",
    "Audience": "TouriMate-Users",
    "ExpirationMinutes": 60
  }
}
```

**appsettings.Production.json**:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TouriMateProduction;User Id=deploy;Password=YourSecurePassword;TrustServerCertificate=true"
  },
  "JWT": {
    "SecretKey": "your-production-secret-key-here",
    "Issuer": "TouriMate",
    "Audience": "TouriMate-Users",
    "ExpirationMinutes": 60
  }
}
```

#### Frontend Environment Variables

**tourimate-client/.env.staging**:
```
VITE_API_BASE_URL=http://your-vps-ip:5001
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-firebase-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-firebase-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-sender-id>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your-cloudinary-upload-preset>
VITE_APP_NAME=TouriMate
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=staging
```

**tourimate-client/.env.production**:
```
VITE_API_BASE_URL=http://your-vps-ip:5000
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-firebase-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-firebase-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-sender-id>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your-cloudinary-upload-preset>
VITE_APP_NAME=TouriMate
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### 8. Test the Setup

#### Test SSH Connection

```bash
# From your local machine
ssh deploy@your-vps-ip
```

#### Test Deployment

1. Push changes to `develop` branch
2. Check GitHub Actions tab for workflow execution
3. Verify staging deployments work
4. Merge `develop` to `main` branch
5. Verify production deployments work

## Deployment Process

### Backend Deployment
1. **Build**: .NET application is built and published
2. **Package**: Application is packaged into tar.gz
3. **Deploy**: Package is uploaded via SSH and extracted
4. **Configure**: IIS permissions are set
5. **Start**: Application is started via Windows Service

### Frontend Deployment
1. **Build**: React application is built
2. **Package**: Static files are packaged into tar.gz
3. **Deploy**: Package is uploaded via SSH and extracted
4. **Configure**: IIS permissions are set
5. **Start**: IIS website is started

## Monitoring and Maintenance

### Health Check Script

Create a PowerShell script to monitor your applications:

```powershell
# health-check.ps1
Import-Module WebAdministration

Write-Host "Checking TouriMate application health..." -ForegroundColor Green

# Check IIS sites
$sites = @("TouriMate API Staging", "TouriMate API Production", "TouriMate Frontend Staging", "TouriMate Frontend Production")
foreach ($site in $sites) {
    $siteState = Get-Website -Name $site | Select-Object -ExpandProperty State
    if ($siteState -eq "Started") {
        Write-Host "✓ $site is running" -ForegroundColor Green
    } else {
        Write-Host "✗ $site is not running" -ForegroundColor Red
    }
}

# Check SQL Server
$sqlService = Get-Service -Name "MSSQL*" | Where-Object {$_.Status -eq "Running"}
if ($sqlService) {
    Write-Host "✓ SQL Server is running" -ForegroundColor Green
} else {
    Write-Host "✗ SQL Server is not running" -ForegroundColor Red
}
```

### Backup Strategy

1. **Database Backups**: Set up automated SQL Server backups
2. **Application Backups**: Backup deployment directories
3. **Configuration Backups**: Backup IIS configuration and scripts

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   ```powershell
   icacls "C:\inetpub\wwwroot" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

2. **Application Pool Issues**:
   ```powershell
   Restart-WebAppPool -Name "TouriMateAPIStaging"
   Restart-WebAppPool -Name "TouriMateAPIProduction"
   ```

3. **SSH Connection Issues**:
   ```powershell
   Get-Service -Name "sshd"
   Start-Service -Name "sshd"
   ```

4. **Database Connection Issues**:
   ```powershell
   Get-Service -Name "MSSQL*"
   Start-Service -Name "MSSQLSERVER"
   ```

## Security Considerations

1. **Change default passwords** in all scripts
2. **Use strong passwords** for deployment user
3. **Enable Windows Firewall** and configure rules
4. **Regular security updates** for Windows Server
5. **Monitor logs** for security events
6. **Use SSL certificates** for HTTPS
7. **Restrict SSH access** to specific IPs if possible

## Next Steps

1. **Set up SSL certificates** for HTTPS
2. **Configure automated backups** for databases
3. **Set up monitoring** and alerting
4. **Implement log aggregation** and analysis
5. **Configure health checks** and monitoring endpoints
6. **Set up automated security updates**
