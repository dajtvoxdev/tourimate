# TouriMate VPS Auto-Deploy Setup Guide
# Complete guide for setting up VPS-based CI/CD

## Overview

This solution replaces GitHub Actions with a VPS-based CI/CD system that automatically pulls code from your Git repository and builds/deploys on your Windows VPS.

## Features

- ✅ **Automatic Git Pull**: Pulls latest code from your repository
- ✅ **Smart Build Detection**: Only builds components that changed
- ✅ **Backup System**: Creates backups before each deployment
- ✅ **Database Migrations**: Automatically runs EF migrations
- ✅ **Multiple Environments**: Support for staging and production
- ✅ **Comprehensive Logging**: Detailed logs for troubleshooting
- ✅ **Webhook Support**: GitHub webhook integration for instant deployments
- ✅ **Task Scheduler**: Automated periodic deployments
- ✅ **Health Monitoring**: Built-in health checks

## Prerequisites

### VPS Requirements
- Windows Server 2019/2022 or Windows 10/11
- .NET 8.0 SDK
- Node.js (for frontend builds)
- Git
- IIS with ASP.NET Core Hosting Bundle
- SQL Server (Express or higher)

### Repository Setup
- Git repository at `C:\Users\Administrator\Desktop\code`
- Repository contains both backend (`tourimate/`) and frontend (`tourimate-client/`) projects

## Installation Steps

### 1. Initial Server Setup

Run the server setup script to install required software:

```powershell
# Run as Administrator
.\deployment\windows-deployment-scripts.ps1
```

### 2. Configure IIS

Set up IIS websites and application pools:

```powershell
# Run as Administrator
Import-Module WebAdministration

# Create application pools
New-WebAppPool -Name "TouriMateAPIStaging" -Force
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIStaging" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIStaging" -Name managedRuntimeVersion -Value ""

New-WebAppPool -Name "TouriMateAPIProduction" -Force
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name processModel.identityType -Value ApplicationPoolIdentity
Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name managedRuntimeVersion -Value ""

# Create websites
New-Website -Name "TouriMate API Staging" -Port 5001 -PhysicalPath "C:\inetpub\wwwroot\tourimate-staging" -ApplicationPool "TouriMateAPIStaging"
New-Website -Name "TouriMate API Production" -Port 5000 -PhysicalPath "C:\inetpub\wwwroot\tourimate-production" -ApplicationPool "TouriMateAPIProduction"
New-Website -Name "TouriMate Frontend Staging" -Port 3001 -PhysicalPath "C:\inetpub\wwwroot\tourimate-frontend-staging" -ApplicationPool "DefaultAppPool"
New-Website -Name "TouriMate Frontend Production" -Port 3000 -PhysicalPath "C:\inetpub\wwwroot\tourimate-frontend-production" -ApplicationPool "DefaultAppPool"
```

### 3. Set Up Auto-Deploy System

#### Option A: Task Scheduler (Recommended for periodic deployments)

```powershell
# Run as Administrator
.\deployment\setup-task-scheduler.ps1
```

This creates a Windows Task Scheduler task that runs every 5 minutes and automatically deploys if there are changes.

#### Option B: GitHub Webhook (Recommended for instant deployments)

1. **Start the webhook handler**:

```powershell
# Run as Administrator
.\deployment\github-webhook-handler.ps1 -Port 9000 -Secret "your-secret-key"
```

2. **Configure GitHub webhook**:
   - Go to your GitHub repository settings
   - Navigate to "Webhooks" section
   - Click "Add webhook"
   - Set Payload URL: `http://your-vps-ip:9000/webhook`
   - Set Content type: `application/json`
   - Set Secret: `your-secret-key`
   - Select "Just the push event"
   - Click "Add webhook"

### 4. Configure Firewall

Allow the webhook port through Windows Firewall:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "TouriMate Webhook" -Direction Inbound -Protocol TCP -LocalPort 9000 -Action Allow
```

## Usage

### Manual Deployment

You can manually trigger deployments using the deployment script:

```powershell
# Deploy both backend and frontend to production
.\deployment\vps-auto-deploy.ps1 -Environment production -Component both

# Deploy only backend to staging
.\deployment\vps-auto-deploy.ps1 -Environment staging -Component backend

# Deploy only frontend to production
.\deployment\vps-auto-deploy.ps1 -Environment production -Component frontend

# Force deployment (ignores change detection)
.\deployment\vps-auto-deploy.ps1 -Environment production -Component both -Force
```

### Monitoring Deployments

#### Check Logs
```powershell
# View latest deployment logs
Get-ChildItem "C:\logs\tourimate" -Name "deploy-*.log" | Sort-Object -Descending | Select-Object -First 1 | ForEach-Object { Get-Content "C:\logs\tourimate\$_" }

# View webhook logs
Get-Content "C:\logs\tourimate\webhook\webhook-$(Get-Date -Format 'yyyyMMdd').log"
```

#### Check Task Scheduler Status
```powershell
Get-ScheduledTask -TaskName "TouriMate Auto Deploy"
```

#### Health Check
```powershell
# Check webhook handler health
Invoke-WebRequest -Uri "http://localhost:9000/health"

# Check IIS sites
Import-Module WebAdministration
Get-Website | Where-Object { $_.Name -like "*TouriMate*" }
```

## Configuration

### Environment Variables

You can customize the deployment by modifying the configuration in `vps-auto-deploy.ps1`:

```powershell
$Config = @{
    GitRepository = "C:\Users\Administrator\Desktop\code"  # Your Git repository path
    BackupPath = "C:\backups\tourimate"                    # Backup storage location
    LogPath = "C:\logs\tourimate"                          # Log storage location
    # ... other settings
}
```

### Deployment Paths

The system automatically deploys to these locations:
- Backend Staging: `C:\inetpub\wwwroot\tourimate-staging`
- Backend Production: `C:\inetpub\wwwroot\tourimate-production`
- Frontend Staging: `C:\inetpub\wwwroot\tourimate-frontend-staging`
- Frontend Production: `C:\inetpub\wwwroot\tourimate-frontend-production`

## Troubleshooting

### Common Issues

#### 1. Git Pull Fails
```powershell
# Check Git configuration
cd "C:\Users\Administrator\Desktop\code"
git status
git remote -v

# Reset repository if needed
git fetch origin
git reset --hard origin/main
```

#### 2. Build Failures
```powershell
# Check .NET SDK
dotnet --version

# Check Node.js
node --version
npm --version

# Manual build test
cd "C:\Users\Administrator\Desktop\code"
dotnet build tourimate.sln
```

#### 3. IIS Issues
```powershell
# Restart IIS
iisreset

# Check application pools
Import-Module WebAdministration
Get-WebAppPool | Where-Object { $_.Name -like "*TouriMate*" }
```

#### 4. Permission Issues
```powershell
# Fix IIS permissions
icacls "C:\inetpub\wwwroot" /grant "IIS_IUSRS:(OI)(CI)F" /T

# Fix deployment script permissions
icacls "C:\deployment" /grant "Administrators:(OI)(CI)F" /T
```

#### 5. Webhook Not Working
```powershell
# Check if webhook handler is running
Get-Process | Where-Object { $_.ProcessName -eq "PowerShell" -and $_.CommandLine -like "*webhook*" }

# Test webhook locally
Invoke-WebRequest -Uri "http://localhost:9000/health" -Method GET
```

### Log Analysis

The system creates detailed logs in `C:\logs\tourimate\`:

- `deploy-YYYYMMDD-HHMMSS.log`: Individual deployment logs
- `webhook/webhook-YYYYMMDD.log`: Webhook handler logs

Each log includes:
- Timestamps for all operations
- Git pull results
- Build output
- Deployment status
- Error messages with stack traces

## Security Considerations

1. **Webhook Security**: Use a strong secret key for GitHub webhooks
2. **Firewall**: Only open necessary ports (80, 443, 9000)
3. **User Permissions**: Run deployment scripts with minimal required permissions
4. **Backup Security**: Secure backup directories with appropriate permissions
5. **Log Security**: Protect log files from unauthorized access

## Performance Optimization

1. **Incremental Builds**: The system only builds changed components
2. **Backup Cleanup**: Old backups are automatically cleaned up after 7 days
3. **Parallel Operations**: Backend and frontend can be built in parallel
4. **Efficient File Copying**: Uses PowerShell's optimized file operations

## Migration from GitHub Actions

To migrate from GitHub Actions to this VPS-based solution:

1. **Disable GitHub Actions**: Remove or disable the existing workflow files
2. **Set up VPS deployment**: Follow the installation steps above
3. **Test thoroughly**: Run several test deployments
4. **Update documentation**: Update your deployment documentation
5. **Monitor**: Watch logs for the first few deployments

## Support

For issues or questions:
1. Check the logs in `C:\logs\tourimate\`
2. Review this documentation
3. Test individual components manually
4. Check Windows Event Logs for system-level issues

## Advanced Configuration

### Custom Build Scripts

You can extend the deployment by adding custom build steps:

```powershell
# Add to vps-auto-deploy.ps1 after the main deployment functions
function Invoke-CustomBuildSteps {
    param([string]$Environment, [string]$LogFile)
    
    Write-Log -Message "Running custom build steps..." -LogFile $LogFile
    
    # Add your custom build logic here
    # Example: Run tests, generate documentation, etc.
}
```

### Multiple Environments

To add more environments (e.g., development, testing):

1. Update the `$Config` object in `vps-auto-deploy.ps1`
2. Add new IIS sites and application pools
3. Update the deployment paths
4. Modify the webhook handler to support the new environment

### Integration with External Services

The webhook handler can be extended to integrate with:
- Slack notifications
- Email alerts
- Monitoring systems
- External build services

Example Slack notification:
```powershell
function Send-SlackNotification {
    param([string]$Message, [string]$WebhookUrl)
    
    $Body = @{
        text = $Message
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $Body -ContentType "application/json"
}
```

This completes the VPS-based CI/CD setup. The system will now automatically pull code from your Git repository and deploy to your VPS without requiring GitHub Actions.
