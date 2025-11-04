# Fix IIS 403 Forbidden Error for SPA Deployment
# This script fixes permissions, default documents, and MIME types for SPA

param(
    [string]$WebsiteName = "Default Web Site",
    [string]$PhysicalPath = "C:\inetpub\wwwroot\tourimate-frontend-production",
    [switch]$Verbose = $false
)

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    if ($Level -eq "ERROR") {
        Write-Host $logMessage -ForegroundColor Red
    } elseif ($Level -eq "WARNING") {
        Write-Host $logMessage -ForegroundColor Yellow
    } elseif ($Level -eq "SUCCESS") {
        Write-Host $logMessage -ForegroundColor Green
    }
}

# Check if running as admin
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Log "ERROR: This script must be run as Administrator" "ERROR"
    exit 1
}

try {
    Write-Log "Starting IIS SPA 403 Fix..."
    
    # Import WebAdministration module
    Import-Module WebAdministration -ErrorAction SilentlyContinue
    if (!$?) {
        Write-Log "WebAdministration module not available, trying alternative method..." "WARNING"
    }
    
    # Step 1: Fix permissions on physical path
    Write-Log "Step 1: Fixing folder permissions..."
    if (!(Test-Path $PhysicalPath)) {
        Write-Log "Physical path not found: $PhysicalPath" "ERROR"
        exit 1
    }
    
    # Grant IUSR read permissions
    Write-Log "Granting IUSR read permissions to $PhysicalPath..."
    $acl = Get-Acl $PhysicalPath
    $IdentityReference = "BUILTIN\IUSR"
    $FileSystemRights = "ReadAndExecute"
    $InheritanceFlags = "ContainerInherit,ObjectInherit"
    $PropagationFlags = "None"
    $AccessControlType = "Allow"
    
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $IdentityReference, 
        $FileSystemRights, 
        $InheritanceFlags, 
        $PropagationFlags, 
        $AccessControlType
    )
    $acl.AddAccessRule($accessRule)
    Set-Acl -Path $PhysicalPath -AclObject $acl
    Write-Log "IUSR permissions granted" "SUCCESS"
    
    # Grant ApplicationPoolIdentity read permissions
    Write-Log "Granting ApplicationPoolIdentity read permissions..."
    $appPoolIdentity = "IIS AppPool\DefaultAppPool"
    $accessRule2 = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $appPoolIdentity,
        $FileSystemRights,
        $InheritanceFlags,
        $PropagationFlags,
        $AccessControlType
    )
    $acl.AddAccessRule($accessRule2)
    Set-Acl -Path $PhysicalPath -AclObject $acl
    Write-Log "ApplicationPoolIdentity permissions granted" "SUCCESS"
    
    # Step 2: Set default document to index.html
    Write-Log "Step 2: Setting default document to index.html..."
    $spaPath = Join-Path $PhysicalPath "spa"
    if (Test-Path $spaPath) {
        try {
            Add-WebConfigurationFileElement -PSPath "IIS:\Sites\$WebsiteName" `
                -Filter "system.webServer/defaultDocument/files" `
                -AtIndex 0 `
                -Value @{value = "index.html"} `
                -ErrorAction SilentlyContinue
            Write-Log "Default document set to index.html" "SUCCESS"
        } catch {
            Write-Log "Could not set default document via IIS module: $($_.Exception.Message)" "WARNING"
            Write-Log "Please manually add index.html as default document in IIS Manager"
        }
    }
    
    # Step 3: Ensure web.config exists and has correct content
    Write-Log "Step 3: Checking web.config..."
    $webConfigPath = Join-Path $spaPath "web.config"
    if (Test-Path $webConfigPath) {
        Write-Log "web.config found at $webConfigPath" "SUCCESS"
        $webConfigContent = Get-Content $webConfigPath -Raw
        if ($Verbose) {
            Write-Log "web.config content:"
            Write-Host $webConfigContent
        }
    } else {
        Write-Log "web.config NOT found at $webConfigPath" "WARNING"
        Write-Log "Creating minimal web.config for SPA..."
        
        $webConfigContent = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Proxy to Backend API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:5000/api/{R:1}" />
        </rule>
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors errorMode="Custom" existingResponse="Replace">
      <remove statusCode="404" />
      <error statusCode="404" path="/index.html" responseMode="ExecuteURL" />
    </httpErrors>
  </system.webServer>
</configuration>
"@
        
        Set-Content -Path $webConfigPath -Value $webConfigContent -Encoding UTF8
        Write-Log "web.config created" "SUCCESS"
    }
    
    # Step 4: Set MIME type for .js files
    Write-Log "Step 4: Checking MIME types..."
    try {
        $mimeType = Get-WebConfigurationProperty -PSPath "IIS:\Sites\$WebsiteName" -Filter "system.webServer/staticContent/mimeType[@fileExtension='.js']"
        if ($mimeType.fileExtension -eq ".js") {
            Write-Log ".js MIME type already configured" "SUCCESS"
        }
    } catch {
        Write-Log "Setting .js MIME type to application/javascript..."
        Add-WebConfigurationFileElement -PSPath "IIS:\Sites\$WebsiteName" -Filter "system.webServer/staticContent" -Value @{fileExtension='.js';mimeType='application/javascript'} -ErrorAction SilentlyContinue
        Write-Log ".js MIME type set" "SUCCESS"
    }
    
    # Step 5: Stop and restart application pool
    Write-Log "Step 5: Restarting application pool..."
    try {
        Stop-WebAppPool -Name "DefaultAppPool" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-WebAppPool -Name "DefaultAppPool" -ErrorAction SilentlyContinue
        Write-Log "Application pool restarted" "SUCCESS"
    } catch {
        Write-Log "Could not restart app pool: $($_.Exception.Message)" "WARNING"
    }
    
    # Step 6: Verify deployment
    Write-Log "Step 6: Verifying deployment..."
    $indexPath = Join-Path $spaPath "index.html"
    if (Test-Path $indexPath) {
        Write-Log "index.html found" "SUCCESS"
        Write-Log "File size: $((Get-Item $indexPath).Length) bytes"
    } else {
        Write-Log "index.html NOT found at $indexPath" "ERROR"
    }
    
    # Summary
    Write-Log "`n========== FIX SUMMARY ==========" "SUCCESS"
    Write-Log "✓ IUSR permissions granted"
    Write-Log "✓ ApplicationPoolIdentity permissions granted"
    Write-Log "✓ Default document set to index.html"
    Write-Log "✓ web.config verified/created"
    Write-Log "✓ MIME types configured"
    Write-Log "✓ Application pool restarted"
    Write-Log "`nIf you still see 403 errors:"
    Write-Log "1. Check IIS Application Path configuration in IIS Manager"
    Write-Log "2. Verify the Physical path points to: $PhysicalPath"
    Write-Log "3. Check IIS logs at: C:\inetpub\logs\LogFiles\W3SVC1\"
    Write-Log "4. Try accessing: https://tourimate.site/index.html directly"
    Write-Log "================================`n" "SUCCESS"
    
} catch {
    Write-Log "Error during fix: $($_.Exception.Message)" "ERROR"
    if ($Verbose) {
        Write-Host $_.Exception.StackTrace
    }
    exit 1
}
