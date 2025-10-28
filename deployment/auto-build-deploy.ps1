# Auto Build and Deploy Script for TouriMate
# This script builds locally and deploys to VPS via SSH
# Usage: .\auto-build-deploy.ps1

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipDeploy = $false,
    [switch]$Verbose = $false,
    [switch]$Force = $false
)

# Configuration
$Config = @{
    # Local paths
    ProjectRoot = "D:\tourimate"
    BackendPath = "D:\tourimate\tourimate"
    FrontendPath = "D:\tourimate\tourimate-client"
    
    # VPS configuration
    VpsHost = "103.161.180.247"
    VpsUser = "Administrator"
    VpsPort = 22
    
    # Deployment paths on VPS
    VpsBackendPath = "C:\inetpub\wwwroot\tourimate-production"
    VpsFrontendPath = "C:\inetpub\wwwroot\tourimate-frontend-production"
    
    # Build paths
    BackendBuildPath = "D:\tourimate\publish\backend"
    FrontendBuildPath = "D:\tourimate\publish\frontend"
    
    # Configuration files
    ProductionConfig = "D:\tourimate\tourimate\appsettings.production.json"
    ProductionEnv = "D:\tourimate\tourimate-client\.env.production"
    
    # Logging
    LogFile = "D:\tourimate\deployment\auto-deploy.log"
}

# Ensure log directory exists
$LogDir = Split-Path $Config.LogFile -Parent
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    Write-Host $LogEntry
    Add-Content -Path $Config.LogFile -Value $LogEntry -Encoding UTF8
}

# Error handling
function Handle-Error {
    param(
        [string]$ErrorMessage,
        [string]$Context = ""
    )
    
    Write-Log "ERROR: $ErrorMessage" "ERROR"
    if ($Context) {
        Write-Log "Context: $Context" "ERROR"
    }
    
    if ($Verbose) {
        Write-Host "Press any key to continue..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    
    exit 1
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    # Check if we're in the right directory
    if (!(Test-Path $Config.ProjectRoot)) {
        Handle-Error "Project root not found: $($Config.ProjectRoot)"
    }
    
    # Check if backend project exists
    if (!(Test-Path "$($Config.BackendPath)\tourimate.csproj")) {
        Handle-Error "Backend project not found: $($Config.BackendPath)\tourimate.csproj"
    }
    
    # Check if frontend project exists
    if (!(Test-Path "$($Config.FrontendPath)\package.json")) {
        Handle-Error "Frontend project not found: $($Config.FrontendPath)\package.json"
    }
    
    # Check if production config files exist
    if (!(Test-Path $Config.ProductionConfig)) {
        Handle-Error "Production config not found: $($Config.ProductionConfig)"
    }
    
    if (!(Test-Path $Config.ProductionEnv)) {
        Handle-Error "Production env file not found: $($Config.ProductionEnv)"
    }
    
    # Check if .NET is available
    try {
        $dotnetVersion = dotnet --version 2>&1
        Write-Log "Found .NET version: $dotnetVersion"
    } catch {
        Handle-Error ".NET CLI not found. Please install .NET SDK."
    }
    
    # Check if Node.js is available
    try {
        $nodeVersion = node --version 2>&1
        Write-Log "Found Node.js version: $nodeVersion"
    } catch {
        Handle-Error "Node.js not found. Please install Node.js."
    }
    
    # Check if npm is available
    try {
        $npmVersion = npm --version 2>&1
        Write-Log "Found npm version: $npmVersion"
    } catch {
        Handle-Error "npm not found. Please install npm."
    }
    
    Write-Log "Prerequisites check completed successfully"
}

# Clean build directories
function Clear-BuildDirectories {
    Write-Log "Cleaning build directories..."
    
    $directories = @($Config.BackendBuildPath, $Config.FrontendBuildPath)
    
    foreach ($dir in $directories) {
        if (Test-Path $dir) {
            Write-Log "Removing directory: $dir"
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Write-Log "Creating directory: $dir"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    Write-Log "Build directories cleaned successfully"
}

# Build backend
function Build-Backend {
    Write-Log "Building backend application..."
    
    try {
        # Change to backend directory
        Push-Location $Config.BackendPath
        
        # Restore packages
        Write-Log "Restoring NuGet packages..."
        $restoreOutput = dotnet restore 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to restore packages: $restoreOutput"
        }
        
        # Build and publish with production configuration
        Write-Log "Building and publishing backend with production config..."
        $publishOutput = dotnet publish -c Release -o $Config.BackendBuildPath --no-restore 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to publish backend: $publishOutput"
        }
        
        # Copy production config to build output
        Write-Log "Copying production configuration..."
        Copy-Item -Path $Config.ProductionConfig -Destination "$($Config.BackendBuildPath)\appsettings.Production.json" -Force
        
        Write-Log "Backend build completed successfully"
        
    } finally {
        Pop-Location
    }
}

# Build frontend
function Build-Frontend {
    Write-Log "Building frontend application..."
    
    try {
        # Change to frontend directory
        Push-Location $Config.FrontendPath
        
        # Install dependencies
        Write-Log "Installing npm dependencies..."
        $installOutput = npm install 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to install npm dependencies: $installOutput"
        }
        
        # Copy production env file
        Write-Log "Using production environment file..."
        $envProductionPath = "$($Config.FrontendPath)\.env.production"
        if ($Config.ProductionEnv -ne $envProductionPath) {
            Copy-Item -Path $Config.ProductionEnv -Destination $envProductionPath -Force
        } else {
            Write-Log "Production env file already in correct location"
        }
        
        # Build frontend
        Write-Log "Building frontend for production..."
        $buildOutput = npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to build frontend: $buildOutput"
        }
        
        # Copy build output to publish directory
        $distPath = Join-Path $Config.FrontendPath "dist"
        if (Test-Path $distPath) {
            Write-Log "Copying frontend build to publish directory..."
            
            # Create spa subdirectory
            $spaPath = Join-Path $Config.FrontendBuildPath "spa"
            if (!(Test-Path $spaPath)) {
                New-Item -ItemType Directory -Path $spaPath -Force | Out-Null
            }
            
            Copy-Item -Path "$distPath\*" -Destination $spaPath -Recurse -Force
            Write-Log "Frontend build copied successfully"
        } else {
            Handle-Error "Frontend build output not found: $distPath"
        }
        
        # Copy web.config for URL rewriting (API proxy) to spa folder
        $webConfigSource = Join-Path $Config.FrontendPath "public\web.config"
        if (Test-Path $webConfigSource) {
            Write-Log "Copying web.config for URL rewriting..."
            $spaPath = Join-Path $Config.FrontendBuildPath "spa"
            Copy-Item -Path $webConfigSource -Destination "$spaPath\web.config" -Force
            Write-Log "web.config copied successfully"
        } else {
            Write-Log "web.config not found, skipping..." "WARNING"
        }
        
        Write-Log "Frontend build completed successfully"
        
    } finally {
        Pop-Location
    }
}

# Deploy to VPS via SSH
function Deploy-ToVps {
    Write-Log "Deploying to VPS via SSH..."
    
    try {
        # Create SSH connection string
        $sshConnection = "$($Config.VpsUser)@$($Config.VpsHost)"
        
        # Create deployment script for VPS
        $deployScript = @"
# VPS Deployment Script - Stop services and clean directories
Write-Host "Starting deployment on VPS..."

# Stop IIS application pools
Write-Host "Stopping IIS application pools..."
Import-Module WebAdministration -ErrorAction SilentlyContinue
Stop-WebAppPool -Name "DefaultAppPool" -ErrorAction SilentlyContinue

# Wait for application pool to fully stop
Write-Host "Waiting for application pool to stop..."
Start-Sleep -Seconds 5

# Backup web.config files before cleaning
Write-Host "Backing up configuration files..."
`$backupDir = 'C:\inetpub\wwwroot\backup-temp'
if (!(Test-Path `$backupDir)) {
    New-Item -ItemType Directory -Path `$backupDir -Force | Out-Null
}

# Backup frontend web.config if exists (inside spa folder - IIS physical path)
`$frontendWebConfig = 'C:\inetpub\wwwroot\tourimate-frontend-production\spa\web.config'
if (Test-Path `$frontendWebConfig) {
    Write-Host "Backing up frontend web.config..."
    Copy-Item -Path `$frontendWebConfig -Destination "`$backupDir\frontend-web.config" -Force
}

# Backup backend web.config if exists
`$backendWebConfig = 'C:\inetpub\wwwroot\tourimate-production\web.config'
if (Test-Path `$backendWebConfig) {
    Write-Host "Backing up backend web.config..."
    Copy-Item -Path `$backendWebConfig -Destination "`$backupDir\backend-web.config" -Force
}

# Clean deployment directories (keep directory structure)
Write-Host "Cleaning backend deployment directory..."
Get-ChildItem -Path 'C:\inetpub\wwwroot\tourimate-production' -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

Write-Host "Cleaning frontend deployment directory..."
Get-ChildItem -Path 'C:\inetpub\wwwroot\tourimate-frontend-production' -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

Write-Host "VPS preparation completed. Ready for file transfer."
"@
        
        # Execute deployment script on VPS
        Write-Log "Preparing VPS for deployment..."
        $deployScript | ssh -p $Config.VpsPort $sshConnection "powershell -Command -"
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to prepare VPS for deployment"
        }
        
        # Transfer backend files
        Write-Log "Transferring backend files..."
        $scpBackendCmd = @"
scp -P $($Config.VpsPort) -r `"$($Config.BackendBuildPath)\*`" $($Config.VpsUser)@$($Config.VpsHost):'C:\inetpub\wwwroot\tourimate-production\'
"@
        Write-Log "SCP Command: $scpBackendCmd"
        Invoke-Expression $scpBackendCmd
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to transfer backend files"
        }
        
        # Transfer frontend files
        Write-Log "Transferring frontend files..."
        $scpFrontendCmd = @"
scp -P $($Config.VpsPort) -r `"$($Config.FrontendBuildPath)\*`" $($Config.VpsUser)@$($Config.VpsHost):'C:\inetpub\wwwroot\tourimate-frontend-production\'
"@
        Write-Log "SCP Command: $scpFrontendCmd"
        Invoke-Expression $scpFrontendCmd
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to transfer frontend files"
        }
        
        # Restore web.config files and start IIS
        Write-Log "Restoring configuration files and starting IIS..."
        $restoreScript = @"
# Restore web.config files from backup
Write-Host "Restoring configuration files..."
`$backupDir = 'C:\inetpub\wwwroot\backup-temp'

# Restore frontend web.config if backup exists (to spa folder - IIS physical path)
if (Test-Path "`$backupDir\frontend-web.config") {
    Write-Host "Restoring frontend web.config..."
    Copy-Item -Path "`$backupDir\frontend-web.config" -Destination 'C:\inetpub\wwwroot\tourimate-frontend-production\spa\web.config' -Force
    Write-Host "Frontend web.config restored"
}

# Restore backend web.config if backup exists  
if (Test-Path "`$backupDir\backend-web.config") {
    Write-Host "Restoring backend web.config..."
    Copy-Item -Path "`$backupDir\backend-web.config" -Destination 'C:\inetpub\wwwroot\tourimate-production\web.config' -Force
    Write-Host "Backend web.config restored"
}

# Clean up backup directory
Remove-Item -Path `$backupDir -Recurse -Force -ErrorAction SilentlyContinue

# Start IIS application pools
Write-Host "Starting IIS application pools..."
Import-Module WebAdministration -ErrorAction SilentlyContinue
Start-WebAppPool -Name "DefaultAppPool" -ErrorAction SilentlyContinue
Write-Host "IIS application pools started successfully"
"@
        
        $restoreScript | ssh -p $Config.VpsPort $sshConnection "powershell -Command -"
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to restore configs and start IIS application pools"
        }
        
        Write-Log "Deployment to VPS completed successfully"
        
    } catch {
        Handle-Error "Deployment failed: $($_.Exception.Message)"
    }
}

# Verify deployment
function Verify-Deployment {
    Write-Log "Verifying deployment..."
    
    try {
        # Test backend endpoint
        Write-Log "Testing backend endpoint..."
        $backendResponse = Invoke-WebRequest -Uri "https://tourimate.site:5000/api/health" -Method GET -TimeoutSec 30 -ErrorAction SilentlyContinue
        if ($backendResponse.StatusCode -eq 200) {
            Write-Log "Backend is responding correctly"
        } else {
            Write-Log "Backend response: $($backendResponse.StatusCode)" "WARNING"
        }
        
        # Test frontend endpoint
        Write-Log "Testing frontend endpoint..."
        $frontendResponse = Invoke-WebRequest -Uri "https://tourimate.site" -Method GET -TimeoutSec 30 -ErrorAction SilentlyContinue
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Log "Frontend is responding correctly"
        } else {
            Write-Log "Frontend response: $($frontendResponse.StatusCode)" "WARNING"
        }
        
    } catch {
        Write-Log "Verification failed: $($_.Exception.Message)" "WARNING"
    }
}

# Main execution
function Main {
    Write-Log "Starting TouriMate Auto Build and Deploy"
    Write-Log "Skip Build: $SkipBuild"
    Write-Log "Skip Deploy: $SkipDeploy"
    Write-Log "Force: $Force"
    
    try {
        # Check prerequisites
        Test-Prerequisites
        
        if (!$SkipBuild) {
            # Clean build directories
            Clear-BuildDirectories
            
            # Build backend
            Build-Backend
            
            # Build frontend
            Build-Frontend
        }
        
        if (!$SkipDeploy) {
            # Deploy to VPS
            Deploy-ToVps
            
            # Verify deployment
            Verify-Deployment
        }
        
        Write-Log "Auto Build and Deploy completed successfully!"
        Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
        Write-Host "Backend: https://tourimate.site:5000" -ForegroundColor Cyan
        Write-Host "Frontend: https://tourimate.site" -ForegroundColor Cyan
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Test the application endpoints" -ForegroundColor White
        Write-Host "2. Check IIS logs if there are any issues" -ForegroundColor White
        Write-Host "3. Monitor application performance" -ForegroundColor White
        
    } catch {
        Handle-Error "Pipeline failed: $($_.Exception.Message)"
    }
}

# Run main function
Main