# TouriMate Frontend Deployment Script
# Version: 1.0
# Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "TouriMate Frontend Deployment Script" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Step 1: Check current directory and files
Write-Host "`n[STEP 1] Checking deployment environment..." -ForegroundColor Yellow
Write-Host "Current directory: $(Get-Location)" -ForegroundColor White
Write-Host "Files in current directory:" -ForegroundColor White
Get-ChildItem | Format-Table Name, Length, LastWriteTime -AutoSize

# Step 2: Change to deploy directory
Write-Host "`n[STEP 2] Changing to deploy directory..." -ForegroundColor Yellow
Set-Location C:\Users\deploy
Write-Host "Changed to: $(Get-Location)" -ForegroundColor Green

# Step 3: Check tar.gz file
Write-Host "`n[STEP 3] Checking deployment package..." -ForegroundColor Yellow
if (Test-Path "frontend-production.tar.gz") {
    $fileSize = (Get-Item "frontend-production.tar.gz").Length
    Write-Host "✅ Package found: frontend-production.tar.gz" -ForegroundColor Green
    Write-Host "   Size: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor White
    
    Write-Host "`nPackage contents:" -ForegroundColor White
    tar -tzf frontend-production.tar.gz | Select-Object -First 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    if ((tar -tzf frontend-production.tar.gz | Measure-Object).Count -gt 10) {
        Write-Host "   ... and $(((tar -tzf frontend-production.tar.gz | Measure-Object).Count - 10)) more files" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ ERROR: frontend-production.tar.gz not found!" -ForegroundColor Red
    Write-Host "Available files:" -ForegroundColor White
    Get-ChildItem | Format-Table Name, Length -AutoSize
    exit 1
}

# Step 4: Stop IIS website
Write-Host "`n[STEP 4] Stopping IIS website..." -ForegroundColor Yellow
try {
    Import-Module WebAdministration -ErrorAction Stop
    Stop-Website -Name "TouriMate Frontend Production" -ErrorAction Stop
    Write-Host "✅ Website stopped successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not stop website (may not exist): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 5: Backup existing deployment
Write-Host "`n[STEP 5] Backing up existing deployment..." -ForegroundColor Yellow
if (Test-Path "C:\inetpub\wwwroot\tourimate-frontend-production") {
    $backupName = "tourimate-frontend-production-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $backupPath = "C:\inetpub\wwwroot\$backupName"
    
    try {
        Move-Item "C:\inetpub\wwwroot\tourimate-frontend-production" $backupPath -Force
        Write-Host "✅ Backed up to: $backupName" -ForegroundColor Green
        
        # Count files in backup
        $backupFiles = Get-ChildItem $backupPath -Recurse -File
        Write-Host "   Backup contains: $($backupFiles.Count) files" -ForegroundColor White
    } catch {
        Write-Host "❌ Error backing up: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ℹ️  No existing deployment to backup" -ForegroundColor Blue
}

# Step 6: Create new directory
Write-Host "`n[STEP 6] Creating new deployment directory..." -ForegroundColor Yellow
try {
    New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\tourimate-frontend-production" -Force | Out-Null
    Write-Host "✅ Directory created: C:\inetpub\wwwroot\tourimate-frontend-production" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating directory: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 7: Extract files
Write-Host "`n[STEP 7] Extracting deployment package..." -ForegroundColor Yellow
try {
    Write-Host "Extracting files..." -ForegroundColor White
    tar -xzf "C:\Users\deploy\frontend-production.tar.gz" -C "C:\inetpub\wwwroot\tourimate-frontend-production" -v
    
    Write-Host "✅ Extraction completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error extracting files: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 8: Verify extraction
Write-Host "`n[STEP 8] Verifying extraction..." -ForegroundColor Yellow
$extractedFiles = Get-ChildItem "C:\inetpub\wwwroot\tourimate-frontend-production" -Recurse -File
Write-Host "✅ Total files extracted: $($extractedFiles.Count)" -ForegroundColor Green

# Check for key files
$keyFiles = @("index.html", "assets", "favicon.ico")
foreach ($file in $keyFiles) {
    if (Test-Path "C:\inetpub\wwwroot\tourimate-frontend-production\$file") {
        Write-Host "   ✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Missing: $file" -ForegroundColor Yellow
    }
}

# Show first 10 files
Write-Host "`nFirst 10 extracted files:" -ForegroundColor White
$extractedFiles | Select-Object -First 10 | ForEach-Object { 
    Write-Host "   $($_.Name) ($([math]::Round($_.Length/1KB, 1)) KB)" -ForegroundColor Gray 
}

# Step 9: Set permissions
Write-Host "`n[STEP 9] Setting file permissions..." -ForegroundColor Yellow
try {
    icacls "C:\inetpub\wwwroot\tourimate-frontend-production" /grant "IIS_IUSRS:(OI)(CI)F" /T
    Write-Host "✅ Permissions set successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error setting permissions: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 10: Start IIS website
Write-Host "`n[STEP 10] Starting IIS website..." -ForegroundColor Yellow
try {
    Start-Website -Name "TouriMate Frontend Production"
    Write-Host "✅ Website started successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error starting website: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "ℹ️  You may need to create the website manually in IIS Manager" -ForegroundColor Blue
}

# Step 11: Verify website state
Write-Host "`n[STEP 11] Verifying website state..." -ForegroundColor Yellow
try {
    $website = Get-Website -Name "TouriMate Frontend Production" -ErrorAction Stop
    Write-Host "✅ Website Status: $($website.State)" -ForegroundColor Green
    Write-Host "   Physical Path: $($website.PhysicalPath)" -ForegroundColor White
    Write-Host "   Binding: $($website.Bindings.Collection[0].BindingInformation)" -ForegroundColor White
} catch {
    Write-Host "⚠️  Could not verify website state: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "🎉 FRONTEND DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Deployment time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
