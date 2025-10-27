# Update Frontend API Configuration
# This script updates the frontend to use the correct VPS API URL

Write-Host "Updating frontend API configuration..." -ForegroundColor Green

# Set the API base URL
$ApiBaseUrl = "http://tourimate.site:5000"

# Create .env.production file
$EnvContent = @"
# Production API URL (VPS)
VITE_API_BASE_URL=$ApiBaseUrl
"@

$EnvFile = Join-Path $PSScriptRoot "tourimate-client\.env.production"
$EnvContent | Out-File -FilePath $EnvFile -Encoding UTF8
Write-Host "Created .env.production file with API URL: $ApiBaseUrl" -ForegroundColor Green

# Update package.json build script to use production environment
$PackageJsonPath = Join-Path $PSScriptRoot "tourimate-client\package.json"
if (Test-Path $PackageJsonPath) {
    $PackageJson = Get-Content $PackageJsonPath | ConvertFrom-Json
    
    # Update build script to use production environment
    if ($PackageJson.scripts) {
        $PackageJson.scripts.build = "vite build --mode production"
        $PackageJson.scripts."build:staging" = "vite build --mode staging"
    }
    
    $PackageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $PackageJsonPath -Encoding UTF8
    Write-Host "Updated package.json build scripts" -ForegroundColor Green
}

# Create .env.staging file for staging builds
$StagingEnvContent = @"
# Staging API URL
VITE_API_BASE_URL=http://tourimate.site:5000
"@

$StagingEnvFile = Join-Path $PSScriptRoot "tourimate-client\.env.staging"
$StagingEnvContent | Out-File -FilePath $StagingEnvFile -Encoding UTF8
Write-Host "Created .env.staging file" -ForegroundColor Green

# Create .env.local file for local development
$LocalEnvContent = @"
# Local development API URL
VITE_API_BASE_URL=http://localhost:5000
"@

$LocalEnvFile = Join-Path $PSScriptRoot "tourimate-client\.env.local"
$LocalEnvContent | Out-File -FilePath $LocalEnvFile -Encoding UTF8
Write-Host "Created .env.local file for local development" -ForegroundColor Green

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Frontend API configuration updated!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Environment files created:" -ForegroundColor White
Write-Host "  .env.production - VPS API URL" -ForegroundColor Gray
Write-Host "  .env.staging - VPS API URL" -ForegroundColor Gray
Write-Host "  .env.local - Local API URL" -ForegroundColor Gray
Write-Host "`nNow rebuild the frontend:" -ForegroundColor Yellow
Write-Host "  cd tourimate-client" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host "`nThen redeploy:" -ForegroundColor Yellow
Write-Host "  .\C:\deployment\manual-deploy.ps1 -Component frontend" -ForegroundColor White

