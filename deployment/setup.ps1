# TouriMate VPS Auto-Deploy Setup
# Single script to set up production-only CI/CD

param(
    [Parameter(Mandatory=$false)]
    [string]$WebhookSecret = "tourimate-webhook-secret-$(Get-Random)",
    
    [Parameter(Mandatory=$false)]
    [int]$WebhookPort = 9000
)

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "TouriMate VPS Auto-Deploy Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Environment: Production Only" -ForegroundColor White
Write-Host "Webhook Secret: $WebhookSecret" -ForegroundColor White
Write-Host "Webhook Port: $WebhookPort" -ForegroundColor White
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
    "C:\inetpub\wwwroot\tourimate-production",
    "C:\inetpub\wwwroot\tourimate-frontend-production"
)

foreach ($Dir in $Directories) {
    if (!(Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        Write-Host "Created: $Dir" -ForegroundColor Green
    } else {
        Write-Host "Exists: $Dir" -ForegroundColor Blue
    }
}

# Copy deployment script
Write-Host "`n[STEP 2] Copying deployment script..." -ForegroundColor Yellow
if (Test-Path "vps-auto-deploy.ps1") {
    Copy-Item -Path "vps-auto-deploy.ps1" -Destination "C:\deployment\vps-auto-deploy.ps1" -Force
    Write-Host "Copied: vps-auto-deploy.ps1 -> C:\deployment\vps-auto-deploy.ps1" -ForegroundColor Green
} else {
    Write-Host "Missing: vps-auto-deploy.ps1" -ForegroundColor Red
}

# Check prerequisites
Write-Host "`n[STEP 3] Checking prerequisites..." -ForegroundColor Yellow

# Check Git repository
$GitRepo = "C:\Users\Administrator\Desktop\code"
if (Test-Path $GitRepo) {
    Write-Host "Git repository found: $GitRepo" -ForegroundColor Green
} else {
    Write-Host "Git repository not found: $GitRepo" -ForegroundColor Red
    Write-Host "Please ensure your Git repository is cloned to this location" -ForegroundColor Yellow
}

# Check .NET SDK
try {
    $DotNetVersion = dotnet --version
    Write-Host ".NET SDK found: $DotNetVersion" -ForegroundColor Green
} catch {
    Write-Host ".NET SDK not found" -ForegroundColor Red
    Write-Host "Please install .NET 8.0 SDK" -ForegroundColor Yellow
}

# Check Node.js
try {
    $NodeVersion = node --version
    Write-Host "Node.js found: $NodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js for frontend builds" -ForegroundColor Yellow
}

# Check IIS
try {
    Import-Module WebAdministration -ErrorAction Stop
    Write-Host "IIS WebAdministration module available" -ForegroundColor Green
} catch {
    Write-Host "IIS WebAdministration module not available" -ForegroundColor Red
    Write-Host "Please install IIS with WebAdministration module" -ForegroundColor Yellow
}

# Configure IIS
Write-Host "`n[STEP 4] Configuring IIS..." -ForegroundColor Yellow
try {
    Import-Module WebAdministration
    
    # Create application pool for production
    if (!(Get-WebAppPool -Name "TouriMateAPIProduction" -ErrorAction SilentlyContinue)) {
        New-WebAppPool -Name "TouriMateAPIProduction" -Force
        Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name processModel.identityType -Value ApplicationPoolIdentity
        Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name managedRuntimeVersion -Value ""
        Write-Host "Created application pool: TouriMateAPIProduction" -ForegroundColor Green
    } else {
        Write-Host "Application pool exists: TouriMateAPIProduction" -ForegroundColor Blue
    }
    
    # Create production websites
    $Websites = @(
        @{Name = "TouriMate API Production"; Port = 5000; Path = "C:\inetpub\wwwroot\tourimate-production"; Pool = "TouriMateAPIProduction"},
        @{Name = "TouriMate Frontend Production"; Port = 3000; Path = "C:\inetpub\wwwroot\tourimate-frontend-production"; Pool = "DefaultAppPool"}
    )
    
    foreach ($Site in $Websites) {
        if (!(Get-Website -Name $Site.Name -ErrorAction SilentlyContinue)) {
            New-Website -Name $Site.Name -Port $Site.Port -PhysicalPath $Site.Path -ApplicationPool $Site.Pool
            Write-Host "Created website: $($Site.Name)" -ForegroundColor Green
        } else {
            Write-Host "Website exists: $($Site.Name)" -ForegroundColor Blue
        }
    }
    
    # Set permissions
    $Paths = @(
        "C:\inetpub\wwwroot\tourimate-production",
        "C:\inetpub\wwwroot\tourimate-frontend-production"
    )
    
    foreach ($Path in $Paths) {
        icacls $Path /grant "IIS_IUSRS:(OI)(CI)F" /T | Out-Null
    }
    Write-Host "Set IIS permissions" -ForegroundColor Green
    
} catch {
    Write-Host "IIS configuration failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Configure firewall
Write-Host "`n[STEP 5] Configuring firewall..." -ForegroundColor Yellow
try {
    $FirewallRules = @(
        @{Name = "TouriMate API Production"; Port = 5000},
        @{Name = "TouriMate Frontend Production"; Port = 3000},
        @{Name = "TouriMate Webhook"; Port = $WebhookPort}
    )
    
    foreach ($Rule in $FirewallRules) {
        if (!(Get-NetFirewallRule -DisplayName $Rule.Name -ErrorAction SilentlyContinue)) {
            New-NetFirewallRule -DisplayName $Rule.Name -Direction Inbound -Protocol TCP -LocalPort $Rule.Port -Action Allow
            Write-Host "Created firewall rule: $($Rule.Name)" -ForegroundColor Green
        } else {
            Write-Host "Firewall rule exists: $($Rule.Name)" -ForegroundColor Blue
        }
    }
} catch {
    Write-Host "Firewall configuration failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Create webhook handler
Write-Host "`n[STEP 6] Creating webhook handler..." -ForegroundColor Yellow

$WebhookHandlerScript = @"
# TouriMate GitHub Webhook Handler - Production Only

param(
    [string]`$Secret = "$WebhookSecret",
    [int]`$Port = $WebhookPort
)

Write-Host "Starting TouriMate Webhook Handler..." -ForegroundColor Green
Write-Host "Secret: `$Secret" -ForegroundColor White
Write-Host "Port: `$Port" -ForegroundColor White
Write-Host "Webhook URL: http://your-vps-ip:`$Port/webhook" -ForegroundColor Cyan

# Create logs directory
`$LogPath = "C:\logs\tourimate"
if (!(Test-Path `$LogPath)) {
    New-Item -ItemType Directory -Path `$LogPath -Force | Out-Null
}

# Logging function
function Write-WebhookLog {
    param([string]`$Message, [string]`$Level = "INFO")
    `$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$LogEntry = "[`$Timestamp] [`$Level] `$Message"
    Write-Host `$LogEntry
    `$LogFile = Join-Path `$LogPath "webhook-`$(Get-Date -Format 'yyyyMMdd').log"
    Add-Content -Path `$LogFile -Value `$LogEntry
}

# Verify GitHub webhook signature
function Test-GitHubSignature {
    param([string]`$Payload, [string]`$Signature, [string]`$Secret)
    if ([string]::IsNullOrEmpty(`$Signature)) { return `$false }
    `$Signature = `$Signature -replace '^sha256=', ''
    `$Encoding = [System.Text.Encoding]::UTF8
    `$KeyBytes = `$Encoding.GetBytes(`$Secret)
    `$PayloadBytes = `$Encoding.GetBytes(`$Payload)
    `$Hmac = New-Object System.Security.Cryptography.HMACSHA256(`$KeyBytes)
    `$ComputedHash = `$Hmac.ComputeHash(`$PayloadBytes)
    `$ComputedSignature = [System.BitConverter]::ToString(`$ComputedHash) -replace '-', '' -replace '^', ''
    return `$Signature -eq `$ComputedSignature
}

# Process GitHub webhook payload
function Process-GitHubWebhook {
    param([string]`$Payload)
    try {
        `$WebhookData = `$Payload | ConvertFrom-Json
        Write-WebhookLog "Received webhook for repository: `$(`$WebhookData.repository.full_name)"
        Write-WebhookLog "Ref: `$(`$WebhookData.ref)"
        Write-WebhookLog "Commit: `$(`$WebhookData.head_commit.id)"
        
        if (`$WebhookData.ref -eq "refs/heads/main") {
            Write-WebhookLog "Push to main branch detected - triggering deployment"
            
            # Determine what changed
            `$ChangedFiles = @()
            foreach (`$commit in `$WebhookData.commits) {
                `$ChangedFiles += `$commit.added
                `$ChangedFiles += `$commit.modified
                `$ChangedFiles += `$commit.removed
            }
            
            # Determine components to deploy
            `$DeployBackend = `$false
            `$DeployFrontend = `$false
            
            foreach (`$file in `$ChangedFiles) {
                if (`$file -like "tourimate/*" -or `$file -like "entities/*") {
                    `$DeployBackend = `$true
                }
                if (`$file -like "tourimate-client/*") {
                    `$DeployFrontend = `$true
                }
            }
            
            # If no specific changes detected, deploy both
            if (!`$DeployBackend -and !`$DeployFrontend) {
                `$DeployBackend = `$true
                `$DeployFrontend = `$true
            }
            
            # Trigger deployment
            `$Component = if (`$DeployBackend -and `$DeployFrontend) { "both" } 
                        elseif (`$DeployBackend) { "backend" } 
                        else { "frontend" }
            
            Write-WebhookLog "Deploying component: `$Component"
            
            # Start deployment process
            `$DeployProcess = Start-Process -FilePath "PowerShell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"C:\deployment\vps-auto-deploy.ps1`" -Environment production -Component `$Component" -PassThru -WindowStyle Hidden
            
            Write-WebhookLog "Deployment process started with PID: `$(`$DeployProcess.Id)"
            
            return @{
                Success = `$true
                Message = "Deployment triggered for `$Component"
                ProcessId = `$DeployProcess.Id
            }
        } else {
            Write-WebhookLog "Push to non-main branch ignored: `$(`$WebhookData.ref)"
            return @{
                Success = `$true
                Message = "Push to non-main branch ignored"
            }
        }
    } catch {
        Write-WebhookLog "Error processing webhook: `$(`$_.Exception.Message)" "ERROR"
        return @{
            Success = `$false
            Message = "Error processing webhook: `$(`$_.Exception.Message)"
        }
    }
}

# Create HTTP listener
try {
    `$Listener = New-Object System.Net.HttpListener
    `$Listener.Prefixes.Add("http://+:`$Port/")
    `$Listener.Start()
    
    Write-WebhookLog "Webhook handler started on port `$Port"
    Write-WebhookLog "Listening for GitHub webhooks..."
    
    while (`$Listener.IsListening) {
        try {
            `$Context = `$Listener.GetContext()
            `$Request = `$Context.Request
            `$Response = `$Context.Response
            
            Write-WebhookLog "Received request: `$(`$Request.HttpMethod) `$(`$Request.Url.AbsolutePath)"
            
            if (`$Request.HttpMethod -eq "POST" -and `$Request.Url.AbsolutePath -eq "/webhook") {
                # Read payload
                `$Reader = New-Object System.IO.StreamReader(`$Request.InputStream)
                `$Payload = `$Reader.ReadToEnd()
                `$Reader.Close()
                
                # Get signature
                `$Signature = `$Request.Headers["X-Hub-Signature-256"]
                
                # Verify signature
                if (Test-GitHubSignature -Payload `$Payload -Signature `$Signature -Secret `$Secret) {
                    Write-WebhookLog "Webhook signature verified"
                    
                    # Process webhook
                    `$Result = Process-GitHubWebhook -Payload `$Payload
                    
                    # Send response
                    `$Response.StatusCode = if (`$Result.Success) { 200 } else { 500 }
                    `$Response.ContentType = "application/json"
                    
                    `$ResponseBody = `$Result | ConvertTo-Json
                    `$ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes(`$ResponseBody)
                    `$Response.OutputStream.Write(`$ResponseBytes, 0, `$ResponseBytes.Length)
                    
                    Write-WebhookLog "Response sent: `$(`$Result.Message)"
                } else {
                    Write-WebhookLog "Invalid webhook signature" "WARNING"
                    `$Response.StatusCode = 401
                    `$ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes("Unauthorized")
                    `$Response.OutputStream.Write(`$ResponseBytes, 0, `$ResponseBytes.Length)
                }
            } elseif (`$Request.HttpMethod -eq "GET" -and `$Request.Url.AbsolutePath -eq "/health") {
                # Health check endpoint
                `$HealthResponse = @{
                    Status = "OK"
                    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                    Service = "TouriMate Webhook Handler"
                    Version = "1.0"
                } | ConvertTo-Json
                
                `$Response.StatusCode = 200
                `$Response.ContentType = "application/json"
                `$ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes(`$HealthResponse)
                `$Response.OutputStream.Write(`$ResponseBytes, 0, `$ResponseBytes.Length)
                
                Write-WebhookLog "Health check requested"
            } else {
                `$Response.StatusCode = 404
                `$ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
                `$Response.OutputStream.Write(`$ResponseBytes, 0, `$ResponseBytes.Length)
            }
            
            `$Response.Close()
        } catch {
            Write-WebhookLog "Error handling request: `$(`$_.Exception.Message)" "ERROR"
        }
    }
} catch {
    Write-WebhookLog "Failed to start webhook handler: `$(`$_.Exception.Message)" "ERROR"
    Write-Host "Make sure you have permission to bind to port `$Port" -ForegroundColor Red
    Write-Host "You may need to run as Administrator or configure Windows Firewall" -ForegroundColor Yellow
} finally {
    if (`$Listener) {
        `$Listener.Stop()
        Write-WebhookLog "Webhook handler stopped"
    }
}
"@

$WebhookHandlerScript | Out-File -FilePath "C:\deployment\webhook-handler.ps1" -Encoding UTF8
Write-Host "Webhook handler created" -ForegroundColor Green

# Create management scripts
Write-Host "`n[STEP 7] Creating management scripts..." -ForegroundColor Yellow

# Health check script
$HealthCheckScript = @"
# TouriMate Health Check Script

Write-Host "TouriMate System Health Check" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check IIS sites
Write-Host "`nIIS Sites:" -ForegroundColor Yellow
Import-Module WebAdministration
`$Sites = @("TouriMate API Production", "TouriMate Frontend Production")
foreach (`$Site in `$Sites) {
    try {
        `$SiteInfo = Get-Website -Name `$Site
        Write-Host "`$Site - State: `$(`$SiteInfo.State)" -ForegroundColor Green
    } catch {
        Write-Host "`$Site - Not found" -ForegroundColor Red
    }
}

# Check application pools
Write-Host "`nApplication Pools:" -ForegroundColor Yellow
`$Pools = @("TouriMateAPIProduction", "DefaultAppPool")
foreach (`$Pool in `$Pools) {
    try {
        `$PoolInfo = Get-WebAppPoolState -Name `$Pool
        Write-Host "`$Pool - State: `$(`$PoolInfo.Value)" -ForegroundColor Green
    } catch {
        Write-Host "`$Pool - Not found" -ForegroundColor Red
    }
}

# Check webhook handler
Write-Host "`nWebhook Handler:" -ForegroundColor Yellow
try {
    `$Response = Invoke-WebRequest -Uri "http://localhost:$WebhookPort/health" -Method GET -TimeoutSec 5
    Write-Host "Webhook Handler - Status: `$(`$Response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Webhook Handler - Not responding" -ForegroundColor Red
}

# Check disk space
Write-Host "`nDisk Space:" -ForegroundColor Yellow
`$Disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
`$FreeSpaceGB = [math]::Round(`$Disk.FreeSpace / 1GB, 2)
`$UsedSpacePercent = [math]::Round(((`$Disk.Size - `$Disk.FreeSpace) / `$Disk.Size) * 100, 2)
Write-Host "C: Drive - Free: `$FreeSpaceGB GB, Used: `$UsedSpacePercent%" -ForegroundColor Green

Write-Host "`nHealth check completed!" -ForegroundColor Green
"@

$HealthCheckScript | Out-File -FilePath "C:\deployment\health-check.ps1" -Encoding UTF8
Write-Host "Health check script created" -ForegroundColor Green

# Manual deployment script
$ManualDeployScript = @"
# TouriMate Manual Deployment Script

param(
    [Parameter(Mandatory=`$false)]
    [ValidateSet("backend", "frontend", "both")]
    [string]`$Component = "both"
)

Write-Host "Starting manual deployment..." -ForegroundColor Green
Write-Host "Environment: production" -ForegroundColor White
Write-Host "Component: `$Component" -ForegroundColor White

& "C:\deployment\vps-auto-deploy.ps1" -Environment production -Component `$Component
"@

$ManualDeployScript | Out-File -FilePath "C:\deployment\manual-deploy.ps1" -Encoding UTF8
Write-Host "Manual deployment script created" -ForegroundColor Green

# Final summary
Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Test the deployment:" -ForegroundColor White
Write-Host "   .\C:\deployment\manual-deploy.ps1 -Component both" -ForegroundColor Gray

Write-Host "`n2. Check system health:" -ForegroundColor White
Write-Host "   .\C:\deployment\health-check.ps1" -ForegroundColor Gray

Write-Host "`n3. Start webhook handler:" -ForegroundColor White
Write-Host "   .\C:\deployment\webhook-handler.ps1" -ForegroundColor Gray

Write-Host "`n4. Configure GitHub webhook:" -ForegroundColor White
Write-Host "   URL: http://your-vps-ip:$WebhookPort/webhook" -ForegroundColor Gray
Write-Host "   Secret: $WebhookSecret" -ForegroundColor Gray

Write-Host "`n5. Monitor logs:" -ForegroundColor White
Write-Host "   C:\logs\tourimate\" -ForegroundColor Gray

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Setup completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "===========================================" -ForegroundColor Cyan
