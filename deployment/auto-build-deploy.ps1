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
        $distSpaPath = Join-Path $distPath "spa"
        
        if (Test-Path $distSpaPath) {
            Write-Log "Copying frontend SPA build to publish directory..."
            
            # Create spa subdirectory
            $spaPath = Join-Path $Config.FrontendBuildPath "spa"
            if (!(Test-Path $spaPath)) {
                New-Item -ItemType Directory -Path $spaPath -Force | Out-Null
            }
            
            # Copy only files from dist/spa (not dist itself, and not dist/server)
            Copy-Item -Path "$distSpaPath\*" -Destination $spaPath -Recurse -Force
            Write-Log "Frontend SPA build copied successfully"
        } elseif (Test-Path $distPath) {
            # Fallback: if dist/spa doesn't exist, copy from dist
            Write-Log "dist/spa not found, using dist folder directly..."
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
        $spaPath = Join-Path $Config.FrontendBuildPath "spa"
        $spaWebConfigPath = Join-Path $spaPath "web.config"

        if (Test-Path $webConfigSource) {
            Write-Log "Copying web.config for URL rewriting..."
            Copy-Item -Path $webConfigSource -Destination $spaWebConfigPath -Force
            Write-Log "web.config copied successfully"
        } else {
            Write-Log "web.config not found in public/. Will generate a minimal one." "WARNING"
            @'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <webSocket enabled="true" />
    <rewrite>
      <rules>
        <rule name="Proxy API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:5000/api/{R:1}" logRewrittenUrl="true" />
          <serverVariables>
            <set name="HTTP_X_Forwarded_Proto" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="tourimate.site" />
          </serverVariables>
        </rule>
        <rule name="Proxy SignalR Hubs" stopProcessing="true">
          <match url="^hubs/(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:5000/hubs/{R:1}" logRewrittenUrl="true" />
          <serverVariables>
            <set name="HTTP_X_Forwarded_Proto" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="tourimate.site" />
          </serverVariables>
        </rule>
      </rules>
    </rewrite>
    <handlers>
      <remove name="WebDAV" />
    </handlers>
    <modules>
      <remove name="WebDAVModule" />
    </modules>
  </system.webServer>
</configuration>
'@ | Set-Content -Path $spaWebConfigPath -Encoding UTF8
            Write-Log "Generated minimal web.config with API and SignalR rules"
        }

        # Inject/ensure SignalR hubs proxy rule in spa web.config (derive upstream from existing /api rule)
        try {
            if (Test-Path $spaWebConfigPath) {
                [xml]$xml = Get-Content -Path $spaWebConfigPath -Encoding UTF8

                # Ensure configuration/system.webServer exists
                if (-not $xml.configuration) { $xml.AppendChild($xml.CreateElement('configuration')) | Out-Null }
                $sw = $xml.configuration['system.webServer']
                if (-not $sw) { $sw = $xml.CreateElement('system.webServer'); $xml.configuration.AppendChild($sw) | Out-Null }

                # Ensure webSocket enabled
                $ws = $sw.webSocket
                if (-not $ws) { $ws = $xml.CreateElement('webSocket'); $sw.AppendChild($ws) | Out-Null }
                $ws.SetAttribute('enabled','true')

                # Ensure rewrite/rules exists
                $rewrite = $sw.rewrite
                if (-not $rewrite) { $rewrite = $xml.CreateElement('rewrite'); $sw.AppendChild($rewrite) | Out-Null }
                $rules = $rewrite.rules
                if (-not $rules) { $rules = $xml.CreateElement('rules'); $rewrite.AppendChild($rules) | Out-Null }

                # Detect upstream from existing API rule action url (strip /api/{R:1})
                $upstream = 'http://127.0.0.1:5000'
                $apiRule = $rules.rule | Where-Object { $_.name -like 'Proxy API*' -or $_.match.url -match '^\^?api/' } | Select-Object -First 1
                if ($apiRule -and $apiRule.action -and $apiRule.action.url) {
                    $u = [string]$apiRule.action.url
                    if ($u -match '/api/\{R:1\}$') { $upstream = $u -replace '/api/\{R:1\}$','' }
                }

                # Remove existing hubs rule if present
                $existingHubs = @($rules.rule) | Where-Object { $_.name -eq 'Proxy SignalR Hubs' }
                foreach ($r in $existingHubs) { [void]$rules.RemoveChild($r) }

                # Create hubs rule
                $rule = $xml.CreateElement('rule')
                $rule.SetAttribute('name','Proxy SignalR Hubs')
                $rule.SetAttribute('stopProcessing','true')
                $match = $xml.CreateElement('match'); $match.SetAttribute('url','^hubs/(.*)'); $rule.AppendChild($match) | Out-Null
                $action = $xml.CreateElement('action'); $action.SetAttribute('type','Rewrite'); $action.SetAttribute('url',"$upstream/hubs/{R:1}"); $action.SetAttribute('logRewrittenUrl','true'); $rule.AppendChild($action) | Out-Null
                $sv = $xml.CreateElement('serverVariables')
                $sv1 = $xml.CreateElement('set'); $sv1.SetAttribute('name','HTTP_X_Forwarded_Proto'); $sv1.SetAttribute('value','https'); $sv.AppendChild($sv1) | Out-Null
                $sv2 = $xml.CreateElement('set'); $sv2.SetAttribute('name','HTTP_X_FORWARDED_HOST'); $sv2.SetAttribute('value','tourimate.site'); $sv.AppendChild($sv2) | Out-Null
                $rule.AppendChild($sv) | Out-Null
                # Insert hubs rule as the first rule to ensure it wins before SPA fallback
                if ($rules.HasChildNodes) { [void]$rules.InsertBefore($rule, $rules.FirstChild) } else { [void]$rules.AppendChild($rule) }

                # Ensure WebDAV removals exist
                $handlers = $sw.handlers; if (-not $handlers) { $handlers = $xml.CreateElement('handlers'); $sw.AppendChild($handlers) | Out-Null }
                $removeDavH = $xml.CreateElement('remove'); $removeDavH.SetAttribute('name','WebDAV'); $handlers.AppendChild($removeDavH) | Out-Null
                $modules = $sw.modules; if (-not $modules) { $modules = $xml.CreateElement('modules'); $sw.AppendChild($modules) | Out-Null }
                $removeDavM = $xml.CreateElement('remove'); $removeDavM.SetAttribute('name','WebDAVModule'); $modules.AppendChild($removeDavM) | Out-Null

                # Ensure SPA fallback excludes /hubs/
                $spaFallback = @($rules.rule) | Where-Object { $_.name -eq 'SPA Fallback' } | Select-Object -First 1
                if ($spaFallback) {
                    if (-not $spaFallback.conditions) { $spaFallback.AppendChild($xml.CreateElement('conditions')) | Out-Null }
                    $conds = @($spaFallback.conditions.add)
                    $hasHubsExclusion = $false
                    foreach ($c in $conds) {
                        if ($c.input -eq '{REQUEST_URI}' -and $c.pattern -eq '^/hubs/' -and $c.negate -eq 'true') { $hasHubsExclusion = $true; break }
                    }
                    if (-not $hasHubsExclusion) {
                        $add = $xml.CreateElement('add');
                        $add.SetAttribute('input','{REQUEST_URI}')
                        $add.SetAttribute('pattern','^/hubs/')
                        $add.SetAttribute('negate','true')
                        $spaFallback.conditions.AppendChild($add) | Out-Null
                    }
                }

                $xml.Save($spaWebConfigPath)
                Write-Log "Ensured SignalR hubs proxy rule in spa web.config (upstream: $upstream)"
            }
        } catch {
            Write-Log "Failed to update spa web.config for SignalR hubs: $($_.Exception.Message)" "WARNING"
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

# Ensure server-level prerequisites for ARR/WebSockets and unlock needed sections
Write-Host "Ensuring server-level ARR proxy and WebSockets..."
$appcmd = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
& $appcmd set config -section:system.webServer/proxy /enabled:"True" /reverseRewriteHostInResponseHeaders:"True" /commit:apphost | Out-Null
& $appcmd set config -section:system.webServer/webSocket /enabled:"True" /commit:apphost | Out-Null
& $appcmd unlock config /section:system.webServer/webSocket | Out-Null
& $appcmd unlock config /section:system.webServer/proxy | Out-Null
& $appcmd unlock config /section:system.webServer/handlers | Out-Null
& $appcmd unlock config /section:system.webServer/modules | Out-Null
# Remove WebDAV globally to avoid 405
Remove-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter 'system.webServer/modules' -name '.' -AtElement @{name='WebDAVModule'} -ErrorAction SilentlyContinue
Remove-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter 'system.webServer/handlers' -name '.' -AtElement @{name='WebDAV'} -ErrorAction SilentlyContinue

# Wait for application pool to fully stop
Write-Host "Waiting for application pool to stop..."
Start-Sleep -Seconds 5

# Clean frontend spa directory (will be replaced with new files)
Write-Host "Cleaning frontend SPA directory..."
Remove-Item -Path 'C:\inetpub\wwwroot\tourimate-frontend-production\spa\*' -Recurse -Force -ErrorAction SilentlyContinue

# Clean backend directory
Write-Host "Cleaning backend deployment directory..."
Get-ChildItem -Path 'C:\inetpub\wwwroot\tourimate-production' -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

Write-Host "VPS preparation completed. Ready for file transfer."
"@
        
        # Execute deployment script on VPS
        Write-Log "Preparing VPS for deployment..."
        $deployScript | ssh -p $Config.VpsPort $sshConnection "powershell -Command -"
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to prepare VPS for deployment"
        }
        
        # Package artifacts into zip files to avoid SCP wildcard/dot edge cases
        Write-Log "Packaging backend build into zip..."
        $backendZip = Join-Path $env:TEMP "tourimate-backend.zip"
        if (Test-Path $backendZip) { Remove-Item -Path $backendZip -Force -ErrorAction SilentlyContinue }
        Compress-Archive -Path (Join-Path $Config.BackendBuildPath "*") -DestinationPath $backendZip -Force
        if (!(Test-Path $backendZip)) { Handle-Error "Failed to create backend zip" }

        Write-Log "Packaging frontend SPA into zip..."
        $spaBuildPath = Join-Path $Config.FrontendBuildPath "spa"
        if (!(Test-Path $spaBuildPath)) { Handle-Error "SPA build path not found: $spaBuildPath" }
        $frontendZip = Join-Path $env:TEMP "tourimate-frontend-spa.zip"
        if (Test-Path $frontendZip) { Remove-Item -Path $frontendZip -Force -ErrorAction SilentlyContinue }
        Compress-Archive -Path (Join-Path $spaBuildPath "*") -DestinationPath $frontendZip -Force
        if (!(Test-Path $frontendZip)) { Handle-Error "Failed to create frontend zip" }

        # Transfer zip files
        Write-Log "Transferring backend zip..."
        $remoteBackendZip = "C:/inetpub/wwwroot/tourimate-production/backend.zip"
        $scpCmdBackend = @"
scp -P $($Config.VpsPort) -p -q `"$backendZip`" $($Config.VpsUser)@$($Config.VpsHost):`"$remoteBackendZip`"
"@
        Write-Log "SCP Command: $scpCmdBackend"
        Invoke-Expression $scpCmdBackend
        if ($LASTEXITCODE -ne 0) { Handle-Error "Failed to transfer backend zip" }

        Write-Log "Transferring frontend zip..."
        $remoteFrontendZip = "C:/inetpub/wwwroot/tourimate-frontend-production/spa/spa.zip"
        $scpCmdFrontend = @"
scp -P $($Config.VpsPort) -p -q `"$frontendZip`" $($Config.VpsUser)@$($Config.VpsHost):`"$remoteFrontendZip`"
"@
        Write-Log "SCP Command: $scpCmdFrontend"
        Invoke-Expression $scpCmdFrontend
        if ($LASTEXITCODE -ne 0) { Handle-Error "Failed to transfer frontend zip" }
        
        # Expand zips on server and start IIS
        Write-Log "Expanding artifacts and starting IIS application pools..."
        $startScript = @'
# Expand backend and frontend artifacts on VPS using .NET ZipFile for reliability
Import-Module WebAdministration -ErrorAction SilentlyContinue
Add-Type -AssemblyName 'System.IO.Compression.FileSystem' -ErrorAction SilentlyContinue

$backendZip = 'C:\inetpub\wwwroot\tourimate-production\backend.zip'
$backendDest = 'C:\inetpub\wwwroot\tourimate-production'
$frontendZip = 'C:\inetpub\wwwroot\tourimate-frontend-production\spa\spa.zip'
$frontendDest = 'C:\inetpub\wwwroot\tourimate-frontend-production\spa'

Write-Host "Backend zip exists: $([IO.File]::Exists($backendZip)) Size: $(if (Test-Path $backendZip) {(Get-Item $backendZip).Length} else {0})"
Write-Host "Frontend zip exists: $([IO.File]::Exists($frontendZip)) Size: $(if (Test-Path $frontendZip) {(Get-Item $frontendZip).Length} else {0})"

try {
  if (Test-Path $backendZip) {
    # Clean destination (keep the zip itself until after extract)
    Get-ChildItem -Path $backendDest -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'backend.zip' } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    [System.IO.Compression.ZipFile]::ExtractToDirectory($backendZip, $backendDest)
    Remove-Item $backendZip -Force -ErrorAction SilentlyContinue
    Write-Host 'Backend extracted successfully.'
  } else { Write-Host 'Backend zip not found.' }
} catch { Write-Host "Error extracting backend: $($_.Exception.Message)" }

try {
  if (Test-Path $frontendZip) {
    Get-ChildItem -Path $frontendDest -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'spa.zip' } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    [System.IO.Compression.ZipFile]::ExtractToDirectory($frontendZip, $frontendDest)
    Remove-Item $frontendZip -Force -ErrorAction SilentlyContinue
    Write-Host 'Frontend extracted successfully.'
  } else { Write-Host 'Frontend zip not found.' }
} catch { Write-Host "Error extracting frontend: $($_.Exception.Message)" }

Write-Host 'Starting IIS application pools...'
Start-WebAppPool -Name 'DefaultAppPool' -ErrorAction SilentlyContinue
Write-Host 'IIS application pools started successfully'
'@

        $startScript | ssh -p $Config.VpsPort $sshConnection "powershell -Command -"
        
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "Failed to start IIS application pools"
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