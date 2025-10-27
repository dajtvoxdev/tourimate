# Simple test script to verify PowerShell syntax
Write-Host "Testing PowerShell syntax..." -ForegroundColor Green

# Test try-catch block
try {
    Write-Host "Try block works" -ForegroundColor Green
} catch {
    Write-Host "Catch block works" -ForegroundColor Red
}

Write-Host "Script completed successfully!" -ForegroundColor Green
