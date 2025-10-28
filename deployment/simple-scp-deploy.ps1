# Simple SCP Deploy Script for TouriMate
# This script uses SCP with correct Windows paths
# Usage: .\simple-scp-deploy.ps1

param(
    [switch]$SkipBuild = $false,
    [switch]$Verbose = $false
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
    VpsPassword = "@Sieutoc!ejHBhlTxoKR"
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
    LogFile = "D:\tourimate\deployment\simple-deploy.log"
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

# Build functions (same as before)
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."
    
    if (!(Test-Path $Config.ProjectRoot)) {
        Handle-Error "Project root not found: $($Config.ProjectRoot)"
    }
    
    if (!(Test-Path "$($Config.BackendPath)\tourimate.csproj")) {
        Handle-Error "Backend project not found: $($Config.BackendPath)\tourimate.csproj"
    }
    
    if (!(Test-Path "$($Config.FrontendPath)\package.json")) {
        Handle-Error "Frontend project not found: $($Config.FrontendPath)\package.json"
    }
    
    if (!(Test-Path $Config.ProductionConfig)) {
        Handle-Error "Production config not found: $($Config.ProductionConfig)"
    }
    
    if (!(Test-Path $Config.ProductionEnv)) {
        Handle-Error "Production env file not found: $($Config.ProductionEnv)"
    }
    
    try {
        $dotnetVersion = dotnet --version 2>&1
        Write-Log "Found .NET version: $dotnetVersion"
    } catch {
        Handle-Error ".NET CLI not found. Please install .NET SDK."
    }
    
    try {
        $nodeVersion = node --version 2>&1
        Write-Log "Found Node.js version: $nodeVersion"
    } catch {
        Handle-Error "Node.js not found. Please install Node.js."
    }
    
    try {
        $npmVersion = npm --version 2>&1
        Write-Log "Found npm version: $npmVersion"
    } catch {
        Handle-Error "npm not found. Please install npm."
    }
    
    Write-Log "Prerequisites check completed successfully"
}

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

function Build-Backend {
    Write-Log "Building backend application..."
    
    try {
        Push-Location $Config.BackendPath
        
        Write-Log "Restoring NuGet packages..."
        $restoreOutput = dotnet restore 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to restore packages: $restoreOutput"
        }
        
        Write-Log "Building and publishing backend with production config..."
        $publishOutput = dotnet publish -c Release -o $Config.BackendBuildPath --no-restore 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to publish backend: $publishOutput"
        }
        
        Write-Log "Copying production configuration..."
        Copy-Item -Path $Config.ProductionConfig -Destination "$($Config.BackendBuildPath)\appsettings.Production.json" -Force
        
        Write-Log "Backend build completed successfully"
        
    } finally {
        Pop-Location
    }
}

function Build-Frontend {
    Write-Log "Building frontend application..."
    
    try {
        Push-Location $Config.FrontendPath
        
        Write-Log "Installing npm dependencies..."
        $installOutput = npm install 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to install npm dependencies: $installOutput"
        }
        
        Write-Log "Using production environment file..."
        $envProductionPath = "$($Config.FrontendPath)\.env.production"
        if ($Config.ProductionEnv -ne $envProductionPath) {
            Copy-Item -Path $Config.ProductionEnv -Destination $envProductionPath -Force
        } else {
            Write-Log "Production env file already in correct location"
        }
        
        Write-Log "Building frontend for production..."
        $buildOutput = npm run build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to build frontend: $buildOutput"
        }
        
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

# Deploy using SCP with Windows paths
function Deploy-ViaSCP {
    Write-Log "Deploying to VPS via SCP..."
    
    try {
        # Create SSH connection string
        $sshConnection = "$($Config.VpsUser)@$($Config.VpsHost)"
        
        # Stop IIS application pools first
        Write-Log "Stopping IIS application pools..."
        $stopScript = "Import-Module WebAdministration -ErrorAction SilentlyContinue; Stop-WebAppPool -Name 'DefaultAppPool' -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2"
        $stopScript | ssh -p $Config.VpsPort $sshConnection "powershell -Command -"
        
        # Transfer backend files using Windows paths
        Write-Log "Transferring backend files..."
        $scpBackendCmd = "scp -P $($Config.VpsPort) -r `"$($Config.BackendBuildPath)\*`" `"$sshConnection`:'C:\\inetpub\\wwwroot\\tourimate-production\\'"
        Write-Log "SCP Command: $scpBackendCmd"
        
        # Use sshpass or expect for password authentication
        $env:SSHPASS = $Config.VpsPassword
        $scpBackendCmdWithPass = "sshpass -e scp -P $($Config.VpsPort) -r `"$($Config.BackendBuildPath)\*`" `"$sshConnection`:'C:\\inetpub\\wwwroot\\tourimate-production\\'"
        
        # Try with sshpass first, fallback to regular scp
        try {
            Invoke-Expression $scpBackendCmdWithPass
        } catch {
            Write-Log "sshpass not available, trying regular scp..."
            Invoke-Expression $scpBackendCmd
        }
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to transfer backend files"
        }
        
        # Transfer frontend files
        Write-Log "Transferring frontend files..."
        $scpFrontendCmd = "scp -P $($Config.VpsPort) -r `"$($Config.FrontendBuildPath)\*`" `"$sshConnection`:'C:\\inetpub\\wwwroot\\tourimate-frontend-production\\'"
        Write-Log "SCP Command: $scpFrontendCmd"
        
        $scpFrontendCmdWithPass = "sshpass -e scp -P $($Config.VpsPort) -r `"$($Config.FrontendBuildPath)\*`" `"$sshConnection`:'C:\\inetpub\\wwwroot\\tourimate-frontend-production\\'"
        
        try {
            Invoke-Expression $scpFrontendCmdWithPass
        } catch {
            Write-Log "sshpass not available, trying regular scp..."
            Invoke-Expression $scpFrontendCmd
        }
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to transfer frontend files"
        }
        
        # Start IIS application pools
        Write-Log "Starting IIS application pools..."
        $startScript = "Import-Module WebAdministration -ErrorAction SilentlyContinue; Start-WebAppPool -Name 'DefaultAppPool' -ErrorAction SilentlyContinue"
        $startScript | ssh -p $Config.VpsPort $sshConnection "powershell -Command -"
        
        Write-Log "Deployment via SCP completed successfully"
        
    } catch {
        Handle-Error "Deployment via SCP failed: $($_.Exception.Message)"
    }
}

# Verify deployment
function Verify-Deployment {
    Write-Log "Verifying deployment..."
    
    try {
        Write-Log "Testing backend endpoint..."
        $backendResponse = Invoke-WebRequest -Uri "https://tourimate.site:5000/api/health" -Method GET -TimeoutSec 30 -ErrorAction SilentlyContinue
        if ($backendResponse.StatusCode -eq 200) {
            Write-Log "Backend is responding correctly"
        } else {
            Write-Log "Backend response: $($backendResponse.StatusCode)" "WARNING"
        }
        
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
    Write-Log "Starting TouriMate Simple SCP Deploy"
    Write-Log "Skip Build: $SkipBuild"
    
    try {
        Test-Prerequisites
        
        if (!$SkipBuild) {
            Clear-BuildDirectories
            Build-Backend
            Build-Frontend
        }
        
        Deploy-ViaSCP
        Verify-Deployment
        
        Write-Log "Simple SCP Deploy completed successfully!"
        Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
        Write-Host "Backend: https://tourimate.site:5000" -ForegroundColor Cyan
        Write-Host "Frontend: https://tourimate.site" -ForegroundColor Cyan
        
    } catch {
        Handle-Error "Pipeline failed: $($_.Exception.Message)"
    }
}

# Run main function
Main
