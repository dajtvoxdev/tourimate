# Frontend Deployment Debug Guide

## Problem

When deploying frontend to VPS, extra folders are being copied:
- `server/` folder
- Nested `spa/` folder inside
- Other build artifacts

**Expected:** Only files from `dist/spa/*` → `C:\inetpub\wwwroot\tourimate-frontend-production\spa\`
**Actual:** Extra folders being included

## Root Cause

The build process creates multiple outputs:
```
dist/
├── spa/           ← Frontend SPA files (WHAT WE WANT)
├── server/        ← Server bundle (NOT NEEDED on frontend VPS)
└── other files/
```

If the copy process wasn't specific to `dist/spa/`, it would copy everything.

## Fix Applied

Updated `auto-build-deploy.ps1` to:

### Step 1: Build Frontend
```powershell
npm run build  # Creates dist/spa/
```

### Step 2: Copy to Publish Directory
**Before:**
```powershell
Copy-Item -Path "$distPath\*" -Destination $spaPath  # Copies all of dist/
```

**After:**
```powershell
$distSpaPath = Join-Path $distPath "spa"
Copy-Item -Path "$distSpaPath\*" -Destination $spaPath  # Copies only dist/spa/
```

### Step 3: Deploy to VPS
```powershell
scp -r "$spaBuildPath\*" VPS:'C:\inetpub\wwwroot\tourimate-frontend-production\spa\'
```

## Verification Steps

### 1. Check Local Build Output

```powershell
cd D:\tourimate\tourimate-client

# Build frontend
npm run build

# Check what's in dist folder
dir dist\

# Check spa folder specifically
dir dist\spa\

# Count items (should see index.html, assets/, web.config)
dir dist\spa\ /s /b | Measure-Object
```

**Expected in dist/spa/:**
```
index.html
web.config
assets/
  ├── *.js
  ├── *.css
  └── ...
```

**NOT expected:**
```
spa/  (nested)
server/
```

### 2. Check Publish Directory

```powershell
# After build
dir D:\tourimate\publish\frontend\spa\

# Should have same content as dist/spa/
```

### 3. Debug Mode Deploy

Run with verbose logging:

```powershell
cd D:\tourimate
powershell -ExecutionPolicy Bypass -File "deployment\auto-build-deploy.ps1" -Verbose
```

This will show:
```
Files to be transferred from: D:\tourimate\publish\frontend\spa
Total items to transfer: 45
  - index.html
  - web.config
  - assets/...
```

### 4. Verify on VPS

After deployment:

```powershell
# SSH to VPS
# Check what's in spa folder
dir C:\inetpub\wwwroot\tourimate-frontend-production\spa\

# Should see:
# - index.html
# - web.config
# - assets folder
# - favicon.ico
# - etc.

# NOT see:
# - spa folder (nested)
# - server folder
```

## Troubleshooting

### Issue: Still seeing extra folders

**Check 1:** Verify npm build output
```powershell
cd D:\tourimate\tourimate-client
npm run build
dir dist\
```

If `dist/spa/spa/` exists, there's an issue with vite.config.ts

**Fix:** vite.config.ts should have:
```typescript
build: {
  outDir: "dist/spa",  // ← Must be exactly this
}
```

**Check 2:** Verify copy logic
```powershell
# During build process, log shows:
# "Copying frontend SPA build to publish directory..."
# (NOT "Copying frontend build to publish directory...")

# If you see the second one, the code didn't get updated
```

**Check 3:** Verify SCP transfer
```powershell
# Log should show:
# "Files to be transferred from: D:\tourimate\publish\frontend\spa"

# Count of items should match dist/spa (usually 30-50 items)
```

### Issue: Missing web.config on VPS

**Check:** Is web.config being copied from public/?
```powershell
# Verify web.config exists
Test-Path D:\tourimate\tourimate-client\public\web.config

# Check logs:
# "Copying web.config for URL rewriting..."
# "web.config copied successfully"
```

**Fix:** If missing, manually create on VPS:
```powershell
# SSH to VPS, create web.config
New-Item -Path 'C:\inetpub\wwwroot\tourimate-frontend-production\spa\web.config' -Force
```

(Copy content from `tourimate-client\public\web.config`)

## File Structure After Deploy

### Local (After Build)
```
D:\tourimate\
├── tourimate-client\
│   ├── dist\spa\  ← Vite output
│   └── public\web.config
└── publish\frontend\
    └── spa\       ← Staged for deploy
        ├── index.html
        ├── web.config
        ├── assets\
        │   ├── *.js
        │   ├── *.css
        │   └── ...
        └── ...
```

### VPS (After Deploy)
```
C:\inetpub\wwwroot\
└── tourimate-frontend-production\  ← IIS website path
    └── spa\                         ← Physical path (NOT the IIS path)
        ├── index.html
        ├── web.config
        ├── assets\
        │   ├── *.js
        │   ├── *.css
        │   └── ...
        └── ...
```

## Log Analysis

### Good Deploy Log
```
Copying frontend SPA build to publish directory...
Frontend SPA build copied successfully
Files to be transferred from: D:\tourimate\publish\frontend\spa
Total items to transfer: 47
Transferring frontend files to spa folder...
SCP Command: scp -P 22 -r "D:\tourimate\publish\frontend\spa\*" Administrator@IP:...
```

### Bad Deploy Log
```
Copying frontend build to publish directory...      ← WRONG (should be SPA)
Frontend build copied successfully
Files to be transferred from: D:\tourimate\publish\frontend\spa
Total items to transfer: 3
  - server\
  - spa\
  - ...
```

## Recovery

If extra folders were deployed:

```powershell
# SSH to VPS
Remove-Item -Path 'C:\inetpub\wwwroot\tourimate-frontend-production\spa\server' -Recurse -Force
Remove-Item -Path 'C:\inetpub\wwwroot\tourimate-frontend-production\spa\spa' -Recurse -Force

# Restart IIS
iisreset /noforce
```

## Commands Reference

### Local Testing
```powershell
# Build only
cd D:\tourimate\tourimate-client
npm run build

# Check output structure
tree dist\spa\ /L 3

# Deploy with verbose logging
cd D:\tourimate
.\deployment\auto-build-deploy.ps1 -Verbose
```

### VPS Verification
```powershell
# List spa directory contents
dir 'C:\inetpub\wwwroot\tourimate-frontend-production\spa'

# Count total files
(Get-ChildItem 'C:\inetpub\wwwroot\tourimate-frontend-production\spa' -Recurse).Count

# Check for unwanted folders
Get-ChildItem 'C:\inetpub\wwwroot\tourimate-frontend-production\spa' -Directory
```

## Success Criteria

✅ Deploy is successful when:
- ✓ Only files from `dist/spa/` are transferred
- ✓ No `server/` folder on VPS
- ✓ No nested `spa/` folder on VPS
- ✓ `index.html` accessible at `https://tourimate.site/`
- ✓ `web.config` present for URL rewriting
- ✓ Static assets load correctly

