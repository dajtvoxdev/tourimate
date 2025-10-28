# Local CI/CD Script for TouriMate
# Builds locally and deploys to VPS via SSH
# Usage: .\local-ci-cd.ps1

param(
    [string]$Environment = "production",
    [switch]$SkipBuild = $false,
    [switch]$SkipDeploy = $false,
    [switch]$Verbose = $false
)

# Configuration
$Config = @{
    # Local paths
    ProjectRoot = "D:\tourimate"
    BackendPath = "D:\tourimate\tourimate"
    FrontendPath = "D:\tourimate\tourimate-client"
    
    # VPS configuration
    VpsHost = "tourimate.site"
    VpsUser = "Administrator"
    VpsPort = 22
    
    # Deployment paths on VPS
    VpsBackendPath = "C:\inetpub\wwwroot\tourimate-production"
    VpsFrontendPath = "C:\inetpub\wwwroot\tourimate-frontend-production"
    
    # Build paths
    BackendBuildPath = "D:\tourimate\publish\backend"
    FrontendBuildPath = "D:\tourimate\publish\frontend"
    
    # Logging
    LogFile = "D:\tourimate\deployment\ci-cd.log"
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
        
        # Build and publish
        Write-Log "Building and publishing backend..."
        $publishOutput = dotnet publish -c Release -o $Config.BackendBuildPath --no-restore 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to publish backend: $publishOutput"
        }
        
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
        
        # Create production environment file
        Write-Log "Creating production environment file..."
        $envContent = @"
# Production API URL (VPS) - API runs on port 5000
VITE_API_BASE_URL=https://tourimate.site:5000
"@
        $envFile = Join-Path $Config.FrontendPath ".env.production"
        $envContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Log "Created .env.production file with VPS API URL"
        
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
            Copy-Item -Path "$distPath\*" -Destination $Config.FrontendBuildPath -Recurse -Force
            Write-Log "Frontend build copied successfully"
        } else {
            Handle-Error "Frontend build output not found: $distPath"
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
# VPS Deployment Script
Write-Host "Starting deployment on VPS..."

# Stop IIS application pools
Write-Host "Stopping IIS application pools..."
Import-Module WebAdministration -ErrorAction SilentlyContinue
Stop-WebAppPool -Name "tourimate-production" -ErrorAction SilentlyContinue
Stop-WebAppPool -Name "tourimate-frontend-production" -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Backup existing files (optional)
Write-Host "Backing up existing files..."
if (Test-Path "$($Config.VpsBackendPath)") {
    Rename-Item -Path "$($Config.VpsBackendPath)" -NewName "tourimate-production-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -ErrorAction SilentlyContinue
}
if (Test-Path "$($Config.VpsFrontendPath)") {
    Rename-Item -Path "$($Config.VpsFrontendPath)" -NewName "tourimate-frontend-production-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -ErrorAction SilentlyContinue
}

# Create directories
Write-Host "Creating deployment directories..."
New-Item -ItemType Directory -Path "$($Config.VpsBackendPath)" -Force | Out-Null
New-Item -ItemType Directory -Path "$($Config.VpsFrontendPath)" -Force | Out-Null

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
        $scpBackendCmd = "scp -P $($Config.VpsPort) -r `"$($Config.BackendBuildPath)\*`" `"$sshConnection`":`"$($Config.VpsBackendPath)`""
        Invoke-Expression $scpBackendCmd
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to transfer backend files"
        }
        
        # Transfer frontend files
        Write-Log "Transferring frontend files..."
        $scpFrontendCmd = "scp -P $($Config.VpsPort) -r `"$($Config.FrontendBuildPath)\*`" `"$sshConnection`":`"$($Config.VpsFrontendPath)`""
        Invoke-Expression $scpFrontendCmd
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to transfer frontend files"
        }
        
        # Start IIS application pools
        Write-Log "Starting IIS application pools..."
        $startScript = @"
Import-Module WebAdministration -ErrorAction SilentlyContinue
Start-WebAppPool -Name "tourimate-production" -ErrorAction SilentlyContinue
Start-WebAppPool -Name "tourimate-frontend-production" -ErrorAction SilentlyContinue
Write-Host "IIS application pools started successfully"
"@
        
        $startScript | ssh -p $Config.VpsPort $sshConnection "powershell -Command -"
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to start IIS application pools"
        }
        
        Write-Log "Deployment to VPS completed successfully"
        
    } catch {
        Handle-Error "Deployment failed: $($_.Exception.Message)"
    }
}

# Main execution
function Main {
    Write-Log "Starting TouriMate CI/CD Pipeline"
    Write-Log "Environment: $Environment"
    Write-Log "Skip Build: $SkipBuild"
    Write-Log "Skip Deploy: $SkipDeploy"
    
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
        }
        
        Write-Log "CI/CD Pipeline completed successfully!"
        Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
        Write-Host "Backend: https://tourimate.site:5000" -ForegroundColor Cyan
        Write-Host "Frontend: https://tourimate.site" -ForegroundColor Cyan
        
    } catch {
        Handle-Error "Pipeline failed: $($_.Exception.Message)"
    }
}

# Run main function
Main
