# Setup Git Hooks for TouriMate CI/CD
# This script sets up automatic CI/CD on git push

param(
    [switch]$Force = $false
)

$ProjectRoot = "D:\tourimate"
$GitHooksDir = Join-Path $ProjectRoot ".git\hooks"
$HookFile = Join-Path $GitHooksDir "post-receive"
$HookScript = Join-Path $ProjectRoot "deployment\git-hook.sh"

Write-Host "Setting up Git hooks for TouriMate CI/CD..." -ForegroundColor Green

# Check if we're in a git repository
if (!(Test-Path (Join-Path $ProjectRoot ".git"))) {
    Write-Host "ERROR: Not in a git repository. Please run this from the project root." -ForegroundColor Red
    exit 1
}

# Check if hooks directory exists
if (!(Test-Path $GitHooksDir)) {
    Write-Host "Creating git hooks directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $GitHooksDir -Force | Out-Null
}

# Check if hook already exists
if ((Test-Path $HookFile) -and !$Force) {
    Write-Host "Git hook already exists. Use -Force to overwrite." -ForegroundColor Yellow
    exit 0
}

# Copy the hook script
Write-Host "Installing git hook..." -ForegroundColor Yellow
Copy-Item -Path $HookScript -Destination $HookFile -Force

# Make the hook executable (for Git Bash)
$hookContent = Get-Content $HookFile -Raw
$hookContent = $hookContent -replace "#!/bin/bash", "#!/bin/bash`n"
Set-Content -Path $HookFile -Value $hookContent -Encoding UTF8

Write-Host "Git hook installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now when you push to the main branch, the CI/CD pipeline will run automatically." -ForegroundColor Cyan
Write-Host ""
Write-Host "To test manually, run:" -ForegroundColor Yellow
Write-Host "  .\deployment\run-ci-cd.bat" -ForegroundColor White
Write-Host ""
Write-Host "Or use PowerShell:" -ForegroundColor Yellow
Write-Host "  .\deployment\local-ci-cd.ps1" -ForegroundColor White
