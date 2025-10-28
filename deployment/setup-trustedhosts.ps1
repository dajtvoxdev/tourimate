# Setup PowerShell Remoting TrustedHosts
# This script configures TrustedHosts for PowerShell Remoting to VPS
# Usage: .\setup-trustedhosts.ps1
# NOTE: Must run PowerShell as Administrator!

param(
    [string]$VpsHost = "103.161.180.247"
)

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (!$isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "`nAlternative: Use Simple SCP Deploy instead:" -ForegroundColor Cyan
    Write-Host ".\deployment\run-simple-scp.bat" -ForegroundColor White
    exit 1
}

Write-Host "Setting up PowerShell Remoting TrustedHosts..." -ForegroundColor Cyan
Write-Host "Running as Administrator ✅" -ForegroundColor Green

try {
    # Enable WinRM service
    Write-Host "Enabling WinRM service..." -ForegroundColor Yellow
    Enable-PSRemoting -Force -SkipNetworkProfileCheck
    
    # Check current TrustedHosts
    try {
        $currentTrustedHosts = Get-Item WSMan:\localhost\Client\TrustedHosts -ErrorAction Stop
        Write-Host "Current TrustedHosts: $($currentTrustedHosts.Value)" -ForegroundColor Yellow
    } catch {
        Write-Host "TrustedHosts not configured yet" -ForegroundColor Yellow
        $currentTrustedHosts = $null
    }
    
    # Add VPS to TrustedHosts
    if ($currentTrustedHosts -eq $null -or $currentTrustedHosts.Value -notlike "*$VpsHost*") {
        Write-Host "Adding $VpsHost to TrustedHosts..." -ForegroundColor Green
        
        if ($currentTrustedHosts -eq $null -or $currentTrustedHosts.Value -eq "") {
            Set-Item WSMan:\localhost\Client\TrustedHosts -Value $VpsHost -Force
        } else {
            Set-Item WSMan:\localhost\Client\TrustedHosts -Value "$($currentTrustedHosts.Value),$VpsHost" -Force
        }
        
        Write-Host "Successfully added $VpsHost to TrustedHosts" -ForegroundColor Green
    } else {
        Write-Host "$VpsHost is already in TrustedHosts" -ForegroundColor Green
    }
    
    # Verify the change
    $newTrustedHosts = Get-Item WSMan:\localhost\Client\TrustedHosts
    Write-Host "Updated TrustedHosts: $($newTrustedHosts.Value)" -ForegroundColor Cyan
    
    # Test connection
    Write-Host "`nTesting PowerShell Remoting connection..." -ForegroundColor Cyan
    try {
        $session = New-PSSession -ComputerName $VpsHost -Credential (Get-Credential -UserName "Administrator" -Message "Enter password for VPS")
        Write-Host "✅ PowerShell Remoting connection successful!" -ForegroundColor Green
        Remove-PSSession $session
    } catch {
        Write-Host "❌ PowerShell Remoting connection failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "You may need to enable PowerShell Remoting on the VPS" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Failed to setup TrustedHosts: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. If TrustedHosts setup was successful, you can use: .\deploy-via-remoting.ps1" -ForegroundColor White
Write-Host "2. If not, you can use: .\simple-scp-deploy.ps1" -ForegroundColor White
Write-Host "3. Or manually configure TrustedHosts: winrm set winrm/config/client `"@{TrustedHosts='$VpsHost'}`"" -ForegroundColor White
