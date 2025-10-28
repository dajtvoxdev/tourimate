# Simple Configuration Check Script for TouriMate
param(
    [switch]$Fix = $false
)

$Config = @{
    ProjectRoot = "D:\tourimate"
    BackendPath = "D:\tourimate\tourimate"
    FrontendPath = "D:\tourimate\tourimate-client"
    ProductionConfig = "D:\tourimate\tourimate\appsettings.production.json"
    ProductionEnv = "D:\tourimate\tourimate-client\.env.production"
    TemplateConfig = "D:\tourimate\tourimate\appsettings.production.json.template"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-ConfigurationFile {
    param([string]$FilePath, [string]$FileType)
    
    if (Test-Path $FilePath) {
        Write-ColorOutput "OK: $FileType found" "Green"
        return $true
    } else {
        Write-ColorOutput "ERROR: $FileType not found" "Red"
        return $false
    }
}

function Test-BackendConfig {
    Write-ColorOutput "`nChecking Backend Configuration..." "Cyan"
    return Test-ConfigurationFile $Config.ProductionConfig "Production Config"
}

function Test-FrontendConfig {
    Write-ColorOutput "`nChecking Frontend Configuration..." "Cyan"
    return Test-ConfigurationFile $Config.ProductionEnv "Production Environment"
}

function Test-Prerequisites {
    Write-ColorOutput "`nChecking Prerequisites..." "Cyan"
    
    try {
        $dotnetVersion = dotnet --version 2>&1
        Write-ColorOutput "OK: .NET SDK found" "Green"
    } catch {
        Write-ColorOutput "ERROR: .NET SDK not found" "Red"
        return $false
    }
    
    try {
        $nodeVersion = node --version 2>&1
        Write-ColorOutput "OK: Node.js found" "Green"
    } catch {
        Write-ColorOutput "ERROR: Node.js not found" "Red"
        return $false
    }
    
    return $true
}

function Main {
    Write-ColorOutput "TouriMate Configuration Checker" "Cyan"
    Write-ColorOutput "===============================" "Cyan"
    
    $allValid = $true
    
    if (!(Test-Prerequisites)) { $allValid = $false }
    if (!(Test-BackendConfig)) { $allValid = $false }
    if (!(Test-FrontendConfig)) { $allValid = $false }
    
    Write-ColorOutput "`nSummary:" "Cyan"
    if ($allValid) {
        Write-ColorOutput "All configurations are valid!" "Green"
        Write-ColorOutput "Ready to run auto-build-deploy.ps1" "Green"
    } else {
        Write-ColorOutput "Some configurations need attention" "Red"
    }
}

Main
