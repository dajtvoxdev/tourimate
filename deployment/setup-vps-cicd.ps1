# TouriMate VPS Auto-Deploy Setup Script
# This script sets up the complete VPS-based CI/CD solution

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("task-scheduler", "webhook", "both")]
    [string]$DeploymentMethod = "both",
    
    [Parameter(Mandatory=$false)]
    [string]$WebhookSecret = "tourimate-webhook-secret-$(Get-Random)",
    
    [Parameter(Mandatory=$false)]
    [int]$WebhookPort = 9000,
    
    [Parameter(Mandatory=$false)]
    [int]$TaskIntervalMinutes = 5
)

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "TouriMate VPS Auto-Deploy Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Deployment Method: $DeploymentMethod" -ForegroundColor White
Write-Host "Webhook Secret: $WebhookSecret" -ForegroundColor White
Write-Host "Webhook Port: $WebhookPort" -ForegroundColor White
Write-Host "Task Interval: $TaskIntervalMinutes minutes" -ForegroundColor White
Write-Host "===========================================" -ForegroundColor Cyan

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Create necessary directories
Write-Host "`n[STEP 1] Creating directories..." -ForegroundColor Yellow
$Directories = @(
    "C:\deployment",
    "C:\logs\tourimate",
    "C:\logs\tourimate\webhook",
    "C:\backups\tourimate",
    "C:\inetpub\wwwroot\tourimate-staging",
    "C:\inetpub\wwwroot\tourimate-production",
    "C:\inetpub\wwwroot\tourimate-frontend-staging",
    "C:\inetpub\wwwroot\tourimate-frontend-production"
)

foreach ($Dir in $Directories) {
    if (!(Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        Write-Host "✅ Created: $Dir" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Exists: $Dir" -ForegroundColor Blue
    }
}

# Copy deployment scripts
Write-Host "`n[STEP 2] Copying deployment scripts..." -ForegroundColor Yellow
$Scripts = @(
    @{Source = "vps-auto-deploy.ps1"; Dest = "C:\deployment\vps-auto-deploy.ps1"},
    @{Source = "setup-task-scheduler.ps1"; Dest = "C:\deployment\setup-task-scheduler.ps1"},
    @{Source = "github-webhook-handler.ps1"; Dest = "C:\deployment\github-webhook-handler.ps1"}
)

foreach ($Script in $Scripts) {
    if (Test-Path $Script.Source) {
        Copy-Item -Path $Script.Source -Destination $Script.Dest -Force
        Write-Host "✅ Copied: $($Script.Source) -> $($Script.Dest)" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $($Script.Source)" -ForegroundColor Red
    }
}

# Check prerequisites
Write-Host "`n[STEP 3] Checking prerequisites..." -ForegroundColor Yellow

# Check Git repository
$GitRepo = "C:\Users\Administrator\Desktop\code"
if (Test-Path $GitRepo) {
    Write-Host "✅ Git repository found: $GitRepo" -ForegroundColor Green
} else {
    Write-Host "❌ Git repository not found: $GitRepo" -ForegroundColor Red
    Write-Host "Please ensure your Git repository is cloned to this location" -ForegroundColor Yellow
}

# Check .NET SDK
try {
    $DotNetVersion = dotnet --version
    Write-Host "✅ .NET SDK found: $DotNetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ .NET SDK not found" -ForegroundColor Red
    Write-Host "Please install .NET 8.0 SDK" -ForegroundColor Yellow
}

# Check Node.js
try {
    $NodeVersion = node --version
    Write-Host "✅ Node.js found: $NodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js for frontend builds" -ForegroundColor Yellow
}

# Check IIS
try {
    Import-Module WebAdministration -ErrorAction Stop
    Write-Host "✅ IIS WebAdministration module available" -ForegroundColor Green
} catch {
    Write-Host "❌ IIS WebAdministration module not available" -ForegroundColor Red
    Write-Host "Please install IIS with WebAdministration module" -ForegroundColor Yellow
}

# Configure IIS
Write-Host "`n[STEP 4] Configuring IIS..." -ForegroundColor Yellow
try {
    Import-Module WebAdministration
    
    # Create application pools
    $AppPools = @(
        @{Name = "TouriMateAPIStaging"; Runtime = ""},
        @{Name = "TouriMateAPIProduction"; Runtime = ""}
    )
    
    foreach ($Pool in $AppPools) {
        if (!(Get-WebAppPool -Name $Pool.Name -ErrorAction SilentlyContinue)) {
            New-WebAppPool -Name $Pool.Name -Force
            Set-ItemProperty -Path "IIS:\AppPools\$($Pool.Name)" -Name processModel.identityType -Value ApplicationPoolIdentity
            Set-ItemProperty -Path "IIS:\AppPools\$($Pool.Name)" -Name managedRuntimeVersion -Value $Pool.Runtime
            Write-Host "✅ Created application pool: $($Pool.Name)" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  Application pool exists: $($Pool.Name)" -ForegroundColor Blue
        }
    }
    
    # Create websites
    $Websites = @(
        @{Name = "TouriMate API Staging"; Port = 5001; Path = "C:\inetpub\wwwroot\tourimate-staging"; Pool = "TouriMateAPIStaging"},
        @{Name = "TouriMate API Production"; Port = 5000; Path = "C:\inetpub\wwwroot\tourimate-production"; Pool = "TouriMateAPIProduction"},
        @{Name = "TouriMate Frontend Staging"; Port = 3001; Path = "C:\inetpub\wwwroot\tourimate-frontend-staging"; Pool = "DefaultAppPool"},
        @{Name = "TouriMate Frontend Production"; Port = 3000; Path = "C:\inetpub\wwwroot\tourimate-frontend-production"; Pool = "DefaultAppPool"}
    )
    
    foreach ($Site in $Websites) {
        if (!(Get-Website -Name $Site.Name -ErrorAction SilentlyContinue)) {
            New-Website -Name $Site.Name -Port $Site.Port -PhysicalPath $Site.Path -ApplicationPool $Site.Pool
            Write-Host "✅ Created website: $($Site.Name)" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  Website exists: $($Site.Name)" -ForegroundColor Blue
        }
    }
    
    # Set permissions
    $Paths = @(
        "C:\inetpub\wwwroot\tourimate-staging",
        "C:\inetpub\wwwroot\tourimate-production",
        "C:\inetpub\wwwroot\tourimate-frontend-staging",
        "C:\inetpub\wwwroot\tourimate-frontend-production"
    )
    
    foreach ($Path in $Paths) {
        icacls $Path /grant "IIS_IUSRS:(OI)(CI)F" /T | Out-Null
    }
    Write-Host "✅ Set IIS permissions" -ForegroundColor Green
    
} catch {
    Write-Host "❌ IIS configuration failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Configure firewall
Write-Host "`n[STEP 5] Configuring firewall..." -ForegroundColor Yellow
try {
    $FirewallRules = @(
        @{Name = "TouriMate API Staging"; Port = 5001},
        @{Name = "TouriMate API Production"; Port = 5000},
        @{Name = "TouriMate Frontend Staging"; Port = 3001},
        @{Name = "TouriMate Frontend Production"; Port = 3000},
        @{Name = "TouriMate Webhook"; Port = $WebhookPort}
    )
    
    foreach ($Rule in $FirewallRules) {
        if (!(Get-NetFirewallRule -DisplayName $Rule.Name -ErrorAction SilentlyContinue)) {
            New-NetFirewallRule -DisplayName $Rule.Name -Direction Inbound -Protocol TCP -LocalPort $Rule.Port -Action Allow
            Write-Host "✅ Created firewall rule: $($Rule.Name)" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  Firewall rule exists: $($Rule.Name)" -ForegroundColor Blue
        }
    }
} catch {
    Write-Host "❌ Firewall configuration failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Set up deployment method
if ($DeploymentMethod -eq "task-scheduler" -or $DeploymentMethod -eq "both") {
    Write-Host "`n[STEP 6] Setting up Task Scheduler..." -ForegroundColor Yellow
    try {
        & "C:\deployment\setup-task-scheduler.ps1" -IntervalMinutes $TaskIntervalMinutes
        Write-Host "✅ Task Scheduler configured" -ForegroundColor Green
    } catch {
        Write-Host "❌ Task Scheduler setup failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($DeploymentMethod -eq "webhook" -or $DeploymentMethod -eq "both") {
    Write-Host "`n[STEP 7] Setting up GitHub Webhook..." -ForegroundColor Yellow
    
    # Create webhook service script
    $WebhookServiceScript = @"
# TouriMate Webhook Service Starter
# Run this script to start the webhook handler

param(
    [string]`$Secret = "$WebhookSecret",
    [int]`$Port = $WebhookPort
)

Write-Host "Starting TouriMate Webhook Handler..." -ForegroundColor Green
Write-Host "Secret: `$Secret" -ForegroundColor White
Write-Host "Port: `$Port" -ForegroundColor White
Write-Host "Webhook URL: http://your-vps-ip:`$Port/webhook" -ForegroundColor Cyan

& "C:\deployment\github-webhook-handler.ps1" -Secret `$Secret -Port `$Port
"@
    
    $WebhookServiceScript | Out-File -FilePath "C:\deployment\start-webhook.ps1" -Encoding UTF8
    Write-Host "✅ Webhook service script created" -ForegroundColor Green
}

# Create management scripts
Write-Host "`n[STEP 8] Creating management scripts..." -ForegroundColor Yellow

# Health check script
$HealthCheckScript = @"
# TouriMate Health Check Script

Write-Host "TouriMate System Health Check" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check IIS sites
Write-Host "`nIIS Sites:" -ForegroundColor Yellow
Import-Module WebAdministration
`$Sites = @("TouriMate API Staging", "TouriMate API Production", "TouriMate Frontend Staging", "TouriMate Frontend Production")
foreach (`$Site in `$Sites) {
    try {
        `$SiteInfo = Get-Website -Name `$Site
        Write-Host "✅ `$Site - State: `$(`$SiteInfo.State)" -ForegroundColor Green
    } catch {
        Write-Host "❌ `$Site - Not found" -ForegroundColor Red
    }
}

# Check application pools
Write-Host "`nApplication Pools:" -ForegroundColor Yellow
`$Pools = @("TouriMateAPIStaging", "TouriMateAPIProduction", "DefaultAppPool")
foreach (`$Pool in `$Pools) {
    try {
        `$PoolInfo = Get-WebAppPoolState -Name `$Pool
        Write-Host "✅ `$Pool - State: `$(`$PoolInfo.Value)" -ForegroundColor Green
    } catch {
        Write-Host "❌ `$Pool - Not found" -ForegroundColor Red
    }
}

# Check scheduled tasks
Write-Host "`nScheduled Tasks:" -ForegroundColor Yellow
try {
    `$Task = Get-ScheduledTask -TaskName "TouriMate Auto Deploy" -ErrorAction SilentlyContinue
    if (`$Task) {
        Write-Host "✅ TouriMate Auto Deploy - State: `$(`$Task.State)" -ForegroundColor Green
    } else {
        Write-Host "❌ TouriMate Auto Deploy - Not found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking scheduled task" -ForegroundColor Red
}

# Check webhook handler
Write-Host "`nWebhook Handler:" -ForegroundColor Yellow
try {
    `$Response = Invoke-WebRequest -Uri "http://localhost:$WebhookPort/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Webhook Handler - Status: `$(`$Response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Webhook Handler - Not responding" -ForegroundColor Red
}

# Check disk space
Write-Host "`nDisk Space:" -ForegroundColor Yellow
`$Disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
`$FreeSpaceGB = [math]::Round(`$Disk.FreeSpace / 1GB, 2)
`$UsedSpacePercent = [math]::Round(((`$Disk.Size - `$Disk.FreeSpace) / `$Disk.Size) * 100, 2)
Write-Host "C: Drive - Free: `$FreeSpaceGB GB, Used: `$UsedSpacePercent%" -ForegroundColor `$(if (`$UsedSpacePercent -lt 80) { "Green" } elseif (`$UsedSpacePercent -lt 90) { "Yellow" } else { "Red" })

Write-Host "`nHealth check completed!" -ForegroundColor Green
"@

$HealthCheckScript | Out-File -FilePath "C:\deployment\health-check.ps1" -Encoding UTF8
Write-Host "✅ Health check script created" -ForegroundColor Green

# Manual deployment script
$ManualDeployScript = @"
# TouriMate Manual Deployment Script

param(
    [Parameter(Mandatory=`$false)]
    [ValidateSet("staging", "production")]
    [string]`$Environment = "production",
    
    [Parameter(Mandatory=`$false)]
    [ValidateSet("backend", "frontend", "both")]
    [string]`$Component = "both"
)

Write-Host "Starting manual deployment..." -ForegroundColor Green
Write-Host "Environment: `$Environment" -ForegroundColor White
Write-Host "Component: `$Component" -ForegroundColor White

& "C:\deployment\vps-auto-deploy.ps1" -Environment `$Environment -Component `$Component
"@

$ManualDeployScript | Out-File -FilePath "C:\deployment\manual-deploy.ps1" -Encoding UTF8
Write-Host "✅ Manual deployment script created" -ForegroundColor Green

# Final summary
Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "🎉 SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Test the deployment:" -ForegroundColor White
Write-Host "   .\C:\deployment\manual-deploy.ps1 -Environment production -Component both" -ForegroundColor Gray

Write-Host "`n2. Check system health:" -ForegroundColor White
Write-Host "   .\C:\deployment\health-check.ps1" -ForegroundColor Gray

if ($DeploymentMethod -eq "webhook" -or $DeploymentMethod -eq "both") {
    Write-Host "`n3. Start webhook handler:" -ForegroundColor White
    Write-Host "   .\C:\deployment\start-webhook.ps1" -ForegroundColor Gray
    
    Write-Host "`n4. Configure GitHub webhook:" -ForegroundColor White
    Write-Host "   URL: http://your-vps-ip:$WebhookPort/webhook" -ForegroundColor Gray
    Write-Host "   Secret: $WebhookSecret" -ForegroundColor Gray
}

Write-Host "`n5. Monitor logs:" -ForegroundColor White
Write-Host "   C:\logs\tourimate\" -ForegroundColor Gray

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Setup completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "===========================================" -ForegroundColor Cyan
