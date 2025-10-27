# TouriMate VPS Auto-Deploy Script
# This script automatically pulls code from Git and builds on VPS
# Version: 2.0
# Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("backend", "frontend", "both")]
    [string]$Component = "both",
    
    [Parameter(Mandatory=$false)]
    [string]$Branch = "main",
    
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

# Configuration
$Config = @{
    GitRepository = "C:\Users\Administrator\Desktop\code"
    BackupPath = "C:\backups\tourimate"
    LogPath = "C:\logs\tourimate"
    DeployPath = @{
        BackendStaging = "C:\inetpub\wwwroot\tourimate-staging"
        BackendProduction = "C:\inetpub\wwwroot\tourimate-production"
        FrontendStaging = "C:\inetpub\wwwroot\tourimate-frontend-staging"
        FrontendProduction = "C:\inetpub\wwwroot\tourimate-frontend-production"
    }
    AppPools = @{
        BackendStaging = "TouriMateAPIStaging"
        BackendProduction = "TouriMateAPIProduction"
    }
    Sites = @{
        BackendStaging = "TouriMate API Staging"
        BackendProduction = "TouriMate API Production"
        FrontendStaging = "TouriMate Frontend Staging"
        FrontendProduction = "TouriMate Frontend Production"
    }
}

# Initialize logging
function Initialize-Logging {
    if (!(Test-Path $Config.LogPath)) {
        New-Item -ItemType Directory -Path $Config.LogPath -Force | Out-Null
    }
    
    $LogFile = Join-Path $Config.LogPath "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
    return $LogFile
}

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$LogFile
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    Write-Host $LogEntry
    if ($LogFile) {
        Add-Content -Path $LogFile -Value $LogEntry
    }
}

# Error handling
function Handle-Error {
    param(
        [string]$ErrorMessage,
        [string]$LogFile
    )
    
    Write-Log -Message "ERROR: $ErrorMessage" -Level "ERROR" -LogFile $LogFile
    Write-Host "Deployment failed. Check logs for details." -ForegroundColor Red
    exit 1
}

# Check prerequisites
function Test-Prerequisites {
    param([string]$LogFile)
    
    Write-Log -Message "Checking prerequisites..." -LogFile $LogFile
    
    # Check if Git repository exists
    if (!(Test-Path $Config.GitRepository)) {
        Handle-Error -ErrorMessage "Git repository not found at $($Config.GitRepository)" -LogFile $LogFile
    }
    
    # Check if .NET SDK is installed
    try {
        $dotnetVersion = dotnet --version
        Write-Log -Message "Found .NET SDK version: $dotnetVersion" -LogFile $LogFile
    } catch {
        Handle-Error -ErrorMessage ".NET SDK not found. Please install .NET 8.0 SDK" -LogFile $LogFile
    }
    
    # Check if Node.js is installed (for frontend)
    if ($Component -eq "frontend" -or $Component -eq "both") {
        try {
            $nodeVersion = node --version
            Write-Log -Message "Found Node.js version: $nodeVersion" -LogFile $LogFile
        } catch {
            Handle-Error -ErrorMessage "Node.js not found. Please install Node.js" -LogFile $LogFile
        }
    }
    
    Write-Log -Message "Prerequisites check completed successfully" -LogFile $LogFile
}

# Git operations
function Update-GitRepository {
    param([string]$LogFile)
    
    Write-Log -Message "Updating Git repository..." -LogFile $LogFile
    
    try {
        Set-Location $Config.GitRepository
        
        # Fetch latest changes
        Write-Log -Message "Fetching latest changes from remote..." -LogFile $LogFile
        git fetch origin
        
        # Check current branch
        $currentBranch = git branch --show-current
        Write-Log -Message "Current branch: $currentBranch" -LogFile $LogFile
        
        # Switch to target branch if needed
        if ($currentBranch -ne $Branch) {
            Write-Log -Message "Switching to branch: $Branch" -LogFile $LogFile
            git checkout $Branch
        }
        
        # Pull latest changes
        Write-Log -Message "Pulling latest changes..." -LogFile $LogFile
        $pullOutput = git pull origin $Branch 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log -Message "Git pull successful" -LogFile $LogFile
            Write-Log -Message "Pull output: $pullOutput" -LogFile $LogFile
        } else {
            Handle-Error -ErrorMessage "Git pull failed: $pullOutput" -LogFile $LogFile
        }
        
        # Get latest commit info
        $commitHash = git rev-parse HEAD
        $commitMessage = git log -1 --pretty=format:"%s"
        Write-Log -Message "Latest commit: $commitHash - $commitMessage" -LogFile $LogFile
        
    } catch {
        Handle-Error -ErrorMessage "Git operations failed: $($_.Exception.Message)" -LogFile $LogFile
    }
}

# Backup current deployment
function Backup-CurrentDeployment {
    param(
        [string]$Environment,
        [string]$Component,
        [string]$LogFile
    )
    
    Write-Log -Message "Creating backup of current deployment..." -LogFile $LogFile
    
    try {
        if (!(Test-Path $Config.BackupPath)) {
            New-Item -ItemType Directory -Path $Config.BackupPath -Force | Out-Null
        }
        
        $deployPath = $Config.DeployPath."$($Component)$Environment"
        
        if (Test-Path $deployPath) {
            $backupName = "$Component-$Environment-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            $backupFullPath = Join-Path $Config.BackupPath $backupName
            
            Write-Log -Message "Backing up $deployPath to $backupFullPath" -LogFile $LogFile
            Copy-Item -Path $deployPath -Destination $backupFullPath -Recurse -Force
            
            # Count files in backup
            $backupFiles = Get-ChildItem $backupFullPath -Recurse -File
            Write-Log -Message "Backup created with $($backupFiles.Count) files" -LogFile $LogFile
            
            return $backupFullPath
        } else {
            Write-Log -Message "No existing deployment found at $deployPath" -LogFile $LogFile
            return $null
        }
    } catch {
        Handle-Error -ErrorMessage "Backup failed: $($_.Exception.Message)" -LogFile $LogFile
    }
}

# Build backend
function Build-Backend {
    param(
        [string]$Environment,
        [string]$LogFile
    )
    
    Write-Log -Message "Building backend for $Environment environment..." -LogFile $LogFile
    
    try {
        Set-Location $Config.GitRepository
        
        # Restore dependencies
        Write-Log -Message "Restoring NuGet packages..." -LogFile $LogFile
        dotnet restore tourimate.sln
        
        # Build solution
        Write-Log -Message "Building solution..." -LogFile $LogFile
        dotnet build tourimate.sln --configuration Release --no-restore
        
        # Publish application
        Write-Log -Message "Publishing application..." -LogFile $LogFile
        $publishPath = Join-Path $Config.GitRepository "publish"
        dotnet publish tourimate/tourimate.csproj --configuration Release --output $publishPath --no-build
        
        # Verify publish
        $publishedFiles = Get-ChildItem $publishPath -Recurse -File
        Write-Log -Message "Published $($publishedFiles.Count) files" -LogFile $LogFile
        
        return $publishPath
    } catch {
        Handle-Error -ErrorMessage "Backend build failed: $($_.Exception.Message)" -LogFile $LogFile
    }
}

# Build frontend
function Build-Frontend {
    param(
        [string]$Environment,
        [string]$LogFile
    )
    
    Write-Log -Message "Building frontend for $Environment environment..." -LogFile $LogFile
    
    try {
        Set-Location (Join-Path $Config.GitRepository "tourimate-client")
        
        # Install dependencies
        Write-Log -Message "Installing npm dependencies..." -LogFile $LogFile
        npm ci
        
        # Build application
        Write-Log -Message "Building frontend application..." -LogFile $LogFile
        if ($Environment -eq "production") {
            npm run build
        } else {
            npm run build:staging
        }
        
        # Verify build
        $buildPath = Join-Path (Join-Path $Config.GitRepository "tourimate-client") "dist"
        if (Test-Path $buildPath) {
            $buildFiles = Get-ChildItem $buildPath -Recurse -File
            Write-Log -Message "Built $($buildFiles.Count) files" -LogFile $LogFile
            return $buildPath
        } else {
            Handle-Error -ErrorMessage "Frontend build output not found at $buildPath" -LogFile $LogFile
        }
    } catch {
        Handle-Error -ErrorMessage "Frontend build failed: $($_.Exception.Message)" -LogFile $LogFile
    }
}

# Deploy application
function Deploy-Application {
    param(
        [string]$Environment,
        [string]$Component,
        [string]$SourcePath,
        [string]$LogFile
    )
    
    Write-Log -Message "Deploying $Component to $Environment..." -LogFile $LogFile
    
    try {
        $deployPath = $Config.DeployPath."$($Component)$Environment"
        
        # Stop application
        if ($Component -eq "backend") {
            $appPool = $Config.AppPools."$($Component)$Environment"
            $siteName = $Config.Sites."$($Component)$Environment"
            
            Write-Log -Message "Stopping application pool: $appPool" -LogFile $LogFile
            Import-Module WebAdministration
            Stop-Website -Name $siteName -ErrorAction SilentlyContinue
            Stop-WebAppPool -Name $appPool -ErrorAction SilentlyContinue
        }
        
        # Remove existing deployment
        if (Test-Path $deployPath) {
            Write-Log -Message "Removing existing deployment at $deployPath" -LogFile $LogFile
            Remove-Item -Path $deployPath -Recurse -Force
        }
        
        # Create deployment directory
        New-Item -ItemType Directory -Path $deployPath -Force | Out-Null
        
        # Copy files
        Write-Log -Message "Copying files from $SourcePath to $deployPath" -LogFile $LogFile
        Copy-Item -Path "$SourcePath\*" -Destination $deployPath -Recurse -Force
        
        # Set permissions
        Write-Log -Message "Setting file permissions..." -LogFile $LogFile
        icacls $deployPath /grant "IIS_IUSRS:(OI)(CI)F" /T
        
        # Start application
        if ($Component -eq "backend") {
            Write-Log -Message "Starting application pool: $appPool" -LogFile $LogFile
            Start-WebAppPool -Name $appPool
            Start-Website -Name $siteName
            
            # Verify website state
            $siteState = Get-Website -Name $siteName | Select-Object -ExpandProperty State
            Write-Log -Message "Website state: $siteState" -LogFile $LogFile
        }
        
        Write-Log -Message "Deployment completed successfully" -LogFile $LogFile
    } catch {
        Handle-Error -ErrorMessage "Deployment failed: $($_.Exception.Message)" -LogFile $LogFile
    }
}

# Run database migrations
function Invoke-DatabaseMigration {
    param(
        [string]$Environment,
        [string]$LogFile
    )
    
    Write-Log -Message "Running database migrations for $Environment..." -LogFile $LogFile
    
    try {
        $deployPath = $Config.DeployPath."Backend$Environment"
        Set-Location $deployPath
        
        # Get connection string from appsettings
        $appSettingsPath = Join-Path $deployPath "appsettings.json"
        if (Test-Path $appSettingsPath) {
            $appSettings = Get-Content $appSettingsPath | ConvertFrom-Json
            $connectionString = $appSettings.ConnectionStrings.DefaultConnection
            
            if ($connectionString) {
                Write-Log -Message "Running Entity Framework migrations..." -LogFile $LogFile
                dotnet ef database update --connection $connectionString
                Write-Log -Message "Database migrations completed" -LogFile $LogFile
            } else {
                Write-Log -Message "No connection string found in appsettings.json" -Level "WARNING" -LogFile $LogFile
            }
        } else {
            Write-Log -Message "appsettings.json not found at $appSettingsPath" -Level "WARNING" -LogFile $LogFile
        }
    } catch {
        Write-Log -Message "Database migration failed: $($_.Exception.Message)" -Level "WARNING" -LogFile $LogFile
    }
}

# Cleanup old backups
function Remove-OldBackups {
    param([string]$LogFile)
    
    Write-Log -Message "Cleaning up old backups..." -LogFile $LogFile
    
    try {
        if (Test-Path $Config.BackupPath) {
            $oldBackups = Get-ChildItem $Config.BackupPath -Directory | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-7) }
            
            foreach ($backup in $oldBackups) {
                Write-Log -Message "Removing old backup: $($backup.Name)" -LogFile $LogFile
                Remove-Item -Path $backup.FullName -Recurse -Force
            }
            
            Write-Log -Message "Cleanup completed" -LogFile $LogFile
        }
    } catch {
        Write-Log -Message "Cleanup failed: $($_.Exception.Message)" -Level "WARNING" -LogFile $LogFile
    }
}

# Main deployment function
function Start-Deployment {
    param(
        [string]$Environment,
        [string]$Component,
        [string]$Branch,
        [bool]$Force
    )
    
    $LogFile = Initialize-Logging
    
    Write-Log -Message "===========================================" -LogFile $LogFile
    Write-Log -Message "TouriMate VPS Auto-Deploy Started" -LogFile $LogFile
    Write-Log -Message "Environment: $Environment" -LogFile $LogFile
    Write-Log -Message "Component: $Component" -LogFile $LogFile
    Write-Log -Message "Branch: $Branch" -LogFile $LogFile
    Write-Log -Message "Force: $Force" -LogFile $LogFile
    Write-Log -Message "===========================================" -LogFile $LogFile
    
    try {
        # Check prerequisites
        Test-Prerequisites -LogFile $LogFile
        
        # Update Git repository
        Update-GitRepository -LogFile $LogFile
        
        # Deploy backend
        if ($Component -eq "backend" -or $Component -eq "both") {
            Write-Log -Message "Starting backend deployment..." -LogFile $LogFile
            
            # Backup current deployment
            Backup-CurrentDeployment -Environment $Environment -Component "Backend" -LogFile $LogFile
            
            # Build backend
            $backendPublishPath = Build-Backend -Environment $Environment -LogFile $LogFile
            
            # Deploy backend
            Deploy-Application -Environment $Environment -Component "Backend" -SourcePath $backendPublishPath -LogFile $LogFile
            
            # Run database migrations
            Invoke-DatabaseMigration -Environment $Environment -LogFile $LogFile
        }
        
        # Deploy frontend
        if ($Component -eq "frontend" -or $Component -eq "both") {
            Write-Log -Message "Starting frontend deployment..." -LogFile $LogFile
            
            # Backup current deployment
            Backup-CurrentDeployment -Environment $Environment -Component "Frontend" -LogFile $LogFile
            
            # Build frontend
            $frontendBuildPath = Build-Frontend -Environment $Environment -LogFile $LogFile
            
            # Deploy frontend
            Deploy-Application -Environment $Environment -Component "Frontend" -SourcePath $frontendBuildPath -LogFile $LogFile
        }
        
        # Cleanup
        Remove-OldBackups -LogFile $LogFile
        
        Write-Log -Message "===========================================" -LogFile $LogFile
        Write-Log -Message "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!" -LogFile $LogFile
        Write-Log -Message "===========================================" -LogFile $LogFile
        
        Write-Host "Deployment completed successfully!" -ForegroundColor Green
        Write-Host "Log file: $LogFile" -ForegroundColor Cyan
        
    } catch {
        Handle-Error -ErrorMessage "Deployment failed: $($_.Exception.Message)" -LogFile $LogFile
    }
}

# Execute deployment
Start-Deployment -Environment $Environment -Component $Component -Branch $Branch -Force $Force
