# IIS 403 Forbidden Error Troubleshooting Guide

## Common Causes of 403 Errors

1. **Missing Permissions**: IIS identity (IUSR or ApplicationPoolIdentity) doesn't have read access
2. **Wrong Physical Path**: IIS website points to wrong directory
3. **Missing index.html**: Not deployed or not set as default document
4. **Missing web.config**: URL rewriting not configured
5. **Directory Listing**: Directory browsing enabled without default document
6. **File Permissions**: Files are read-only or locked

## Quick Fix

Run the automated fix script as Administrator:

```powershell
cd D:\tourimate\deployment
powershell -ExecutionPolicy Bypass -File "fix-iis-spa-403.ps1"
```

## Manual Fix Steps

### Step 1: Check Permissions

```powershell
# Run as Administrator
$path = "C:\inetpub\wwwroot\tourimate-frontend-production"

# Grant IUSR read permissions
icacls $path /grant "BUILTIN\IUSR:(OI)(CI)RX" /T

# Grant ApplicationPoolIdentity permissions
icacls $path /grant "IIS AppPool\DefaultAppPool:(OI)(CI)RX" /T
```

### Step 2: Verify IIS Configuration

1. **Open IIS Manager** (inetmgr)
2. **Expand Sites** in the left tree
3. **Find your website** (tourimate or similar)
4. **Check the Physical Path** in the right panel:
   - Should point to: `C:\inetpub\wwwroot\tourimate-frontend-production`
   - The SPA files are in a `spa` subfolder inside this

5. **Set Default Document**:
   - Double-click **Default Document**
   - Add `index.html` if not present
   - Move it to the top of the list
   - Click **Apply**

### Step 3: Check web.config

The `web.config` should be in the SPA directory:
`C:\inetpub\wwwroot\tourimate-frontend-production\spa\web.config`

If missing, create it with this content:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Enable URL Rewriting module -->
    <rewrite>
      <rules>
        <!-- Proxy API requests to backend -->
        <rule name="Proxy to Backend API" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:5000/api/{R:1}" />
        </rule>
        
        <!-- SPA Fallback - all other requests go to index.html -->
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
    
    <!-- Ensure index.html is served for 404s (SPA routing) -->
    <httpErrors errorMode="Custom" existingResponse="Replace">
      <remove statusCode="404" />
      <error statusCode="404" path="/index.html" responseMode="ExecuteURL" />
    </httpErrors>
  </system.webServer>
</configuration>
```

### Step 4: Enable URL Rewriting (if not installed)

1. **IIS Manager** → Click the server name
2. **Look for URL Rewrite** in the features list
3. If not present: Download and install **IIS URL Rewrite Module**
   - https://www.iis.net/downloads/microsoft/url-rewrite

### Step 5: Restart IIS

```powershell
# Option 1: Restart Application Pool
iisreset /noforce

# Option 2: Stop and start application pool in IIS Manager
Stop-WebAppPool -Name "DefaultAppPool"
Start-Sleep -Seconds 3
Start-WebAppPool -Name "DefaultAppPool"
```

## Diagnostic Steps

### Test Direct File Access

1. Try accessing: `https://tourimate.site/index.html`
   - If this works, the files are there and readable
   - The 403 is only when accessing the root path

2. Check IIS logs for 403 errors:
   - `C:\inetpub\logs\LogFiles\W3SVC1\`
   - Search for "403" or "Forbidden"

3. Check Event Viewer:
   - **Windows Logs** → **System**
   - Look for IIS-related errors

### Verify File Deployment

```powershell
# Check if files exist
dir C:\inetpub\wwwroot\tourimate-frontend-production\spa\

# Check file permissions
icacls C:\inetpub\wwwroot\tourimate-frontend-production\spa\

# Verify index.html exists and has content
Get-Content C:\inetpub\wwwroot\tourimate-frontend-production\spa\index.html | Select-Object -First 20
```

## Advanced Troubleshooting

### Check if URL Rewrite is working

1. Add a test rule in `web.config`:
```xml
<rule name="Test Rewrite" stopProcessing="true">
  <match url="^test$" />
  <action type="Rewrite" url="/index.html" />
</rule>
```

2. Access: `https://tourimate.site/test`
   - Should show index.html content
   - If you get 404, URL Rewrite isn't working

### Check Handler Mappings

1. **IIS Manager** → Click server → **Handler Mappings**
2. Verify these are present:
   - StaticFile (for .html, .js, .css, etc.)
   - DefaultDocumentModule (for index.html)

### Disable Directory Listing

1. **IIS Manager** → Select your site
2. Double-click **Directory Browsing**
3. Click **Disable** in the actions pane

## Network Troubleshooting

```powershell
# Test connectivity to backend
Test-NetConnection -ComputerName localhost -Port 5000

# Test if backend is running
curl https://localhost:5000/api/health

# Test frontend from command line
curl https://tourimate.site -v
```

## File Structure Verification

Expected structure:
```
C:\inetpub\wwwroot\tourimate-frontend-production\
├── spa\
│   ├── index.html
│   ├── assets\
│   │   ├── *.js
│   │   ├── *.css
│   │   └── ...
│   ├── web.config
│   └── ... (other build files)
└── ... (other files from deploy)
```

## Common Error Codes

- **403.1**: Execute access forbidden (permission issue)
- **403.2**: Read access forbidden (permission issue)
- **403.3**: Write access forbidden (read-only file)
- **403.4**: SSL required (but you're using HTTPS)
- **403.6**: IP address denied (firewall rule)
- **403.9**: Too many users connected
- **403.14**: Directory listing denied (and no default document)

## Still Having Issues?

1. **Check IIS Manager** for application configuration
2. **Review IIS logs** in `C:\inetpub\logs\LogFiles\`
3. **Verify backend connectivity**: Can frontend reach `http://localhost:5000/api/*`?
4. **Test with curl**: `curl -v https://tourimate.site`
5. **Check browser console**: Open DevTools (F12) for actual errors
6. **Contact support** with:
   - IIS log entries
   - web.config content
   - Physical path verification
   - File listing output
