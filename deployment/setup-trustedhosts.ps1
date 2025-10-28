# Setup PowerShell Remoting TrustedHosts
# This script configures TrustedHosts for PowerShell Remoting to VPS
# Usage: .\setup-trustedhosts.ps1

param(
    [string]$VpsHost = "103.161.180.247"
)

Write-Host "Setting up PowerShell Remoting TrustedHosts..." -ForegroundColor Cyan

try {
    # Check current TrustedHosts
    $currentTrustedHosts = Get-Item WSMan:\localhost\Client\TrustedHosts
    Write-Host "Current TrustedHosts: $($currentTrustedHosts.Value)" -ForegroundColor Yellow
    
    # Add VPS to TrustedHosts
    if ($currentTrustedHosts.Value -notlike "*$VpsHost*") {
        Write-Host "Adding $VpsHost to TrustedHosts..." -ForegroundColor Green
        
        if ($currentTrustedHosts.Value -eq "") {
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
    Write-Host "You may need to run PowerShell as Administrator" -ForegroundColor Yellow
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. If TrustedHosts setup was successful, you can use: .\deploy-via-remoting.ps1" -ForegroundColor White
Write-Host "2. If not, you can use: .\simple-scp-deploy.ps1" -ForegroundColor White
Write-Host "3. Or manually configure TrustedHosts: winrm set winrm/config/client '@{TrustedHosts=`"$VpsHost`"}'" -ForegroundColor White
