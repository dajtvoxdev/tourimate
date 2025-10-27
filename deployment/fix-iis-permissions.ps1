# Fix IIS Permissions and Configuration
# Run this script as Administrator to fix 403 Forbidden errors

Write-Host "Fixing IIS permissions and configuration..." -ForegroundColor Green

# Import WebAdministration module
try {
    Import-Module WebAdministration -ErrorAction Stop
    Write-Host "WebAdministration module loaded" -ForegroundColor Green
} catch {
    Write-Host "Failed to load WebAdministration module" -ForegroundColor Red
    exit 1
}

# Fix permissions for frontend
Write-Host "`nFixing permissions for frontend..." -ForegroundColor Yellow
$FrontendPath = "C:\inetpub\wwwroot\tourimate-frontend-production"

if (Test-Path $FrontendPath) {
    # Grant full permissions to IIS_IUSRS
    icacls $FrontendPath /grant "IIS_IUSRS:(OI)(CI)F" /T
    Write-Host "Granted IIS_IUSRS permissions to frontend" -ForegroundColor Green
    
    # Grant permissions to IUSR
    icacls $FrontendPath /grant "IUSR:(OI)(CI)F" /T
    Write-Host "Granted IUSR permissions to frontend" -ForegroundColor Green
    
    # Grant permissions to Application Pool Identity
    icacls $FrontendPath /grant "IIS AppPool\DefaultAppPool:(OI)(CI)F" /T
    Write-Host "Granted Application Pool permissions to frontend" -ForegroundColor Green
} else {
    Write-Host "Frontend path not found: $FrontendPath" -ForegroundColor Red
}

# Fix permissions for backend
Write-Host "`nFixing permissions for backend..." -ForegroundColor Yellow
$BackendPath = "C:\inetpub\wwwroot\tourimate-production"

if (Test-Path $BackendPath) {
    # Grant full permissions to IIS_IUSRS
    icacls $BackendPath /grant "IIS_IUSRS:(OI)(CI)F" /T
    Write-Host "Granted IIS_IUSRS permissions to backend" -ForegroundColor Green
    
    # Grant permissions to IUSR
    icacls $BackendPath /grant "IUSR:(OI)(CI)F" /T
    Write-Host "Granted IUSR permissions to backend" -ForegroundColor Green
    
    # Grant permissions to Application Pool Identity
    icacls $BackendPath /grant "IIS AppPool\TouriMateAPIProduction:(OI)(CI)F" /T
    Write-Host "Granted Application Pool permissions to backend" -ForegroundColor Green
} else {
    Write-Host "Backend path not found: $BackendPath" -ForegroundColor Red
}

# Configure website settings
Write-Host "`nConfiguring website settings..." -ForegroundColor Yellow

# Configure frontend website
try {
    $FrontendSite = Get-Website -Name "TouriMate Frontend Production" -ErrorAction SilentlyContinue
    if ($FrontendSite) {
        # Set default document
        Set-WebConfigurationProperty -Filter "system.webServer/defaultDocument/files" -Name "." -Value @{value="index.html"} -PSPath "IIS:\Sites\TouriMate Frontend Production"
        
        # Enable directory browsing for SPA
        Set-WebConfigurationProperty -Filter "system.webServer/directoryBrowse" -Name "enabled" -Value $true -PSPath "IIS:\Sites\TouriMate Frontend Production"
        
        # Set MIME types for SPA
        Add-WebConfigurationProperty -Filter "system.webServer/staticContent" -Name "." -Value @{fileExtension=".json"; mimeType="application/json"} -PSPath "IIS:\Sites\TouriMate Frontend Production"
        
        Write-Host "Configured frontend website settings" -ForegroundColor Green
    } else {
        Write-Host "Frontend website not found" -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to configure frontend website: $($_.Exception.Message)" -ForegroundColor Red
}

# Configure backend website
try {
    $BackendSite = Get-Website -Name "TouriMate API Production" -ErrorAction SilentlyContinue
    if ($BackendSite) {
        # Set application pool
        Set-ItemProperty -Path "IIS:\Sites\TouriMate API Production" -Name applicationPool -Value "TouriMateAPIProduction"
        
        Write-Host "Configured backend website settings" -ForegroundColor Green
    } else {
        Write-Host "Backend website not found" -ForegroundColor Red
    }
} catch {
    Write-Host "Failed to configure backend website: $($_.Exception.Message)" -ForegroundColor Red
}

# Check website status
Write-Host "`nChecking website status..." -ForegroundColor Yellow
$Websites = @("TouriMate Frontend Production", "TouriMate API Production")

foreach ($SiteName in $Websites) {
    try {
        $Site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
        if ($Site) {
            Write-Host "$SiteName - State: $($Site.State)" -ForegroundColor Green
            Write-Host "  Physical Path: $($Site.PhysicalPath)" -ForegroundColor White
            Write-Host "  Binding: $($Site.Bindings.Collection[0].BindingInformation)" -ForegroundColor White
        } else {
            Write-Host "$SiteName - Not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "$SiteName - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check application pool status
Write-Host "`nChecking application pool status..." -ForegroundColor Yellow
$AppPools = @("DefaultAppPool", "TouriMateAPIProduction")

foreach ($PoolName in $AppPools) {
    try {
        $Pool = Get-WebAppPoolState -Name $PoolName -ErrorAction SilentlyContinue
        if ($Pool) {
            Write-Host "$PoolName - State: $($Pool.Value)" -ForegroundColor Green
        } else {
            Write-Host "$PoolName - Not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "$PoolName - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Restart application pools
Write-Host "`nRestarting application pools..." -ForegroundColor Yellow
foreach ($PoolName in $AppPools) {
    try {
        Restart-WebAppPool -Name $PoolName
        Write-Host "Restarted $PoolName" -ForegroundColor Green
    } catch {
        Write-Host "Failed to restart $PoolName: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Restart IIS
Write-Host "`nRestarting IIS..." -ForegroundColor Yellow
try {
    iisreset
    Write-Host "IIS restarted successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to restart IIS: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Permission fix completed!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Try accessing your website again:" -ForegroundColor White
Write-Host "Frontend: http://tourimate.site:3000" -ForegroundColor Cyan
Write-Host "Backend: http://tourimate.site:5000" -ForegroundColor Cyan
Write-Host "`nIf you still get 403 errors, check:" -ForegroundColor Yellow
Write-Host "1. Windows Firewall settings" -ForegroundColor White
Write-Host "2. IIS Manager - Authentication settings" -ForegroundColor White
Write-Host "3. File permissions in Windows Explorer" -ForegroundColor White
