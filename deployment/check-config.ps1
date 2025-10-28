# Configuration Check Script for TouriMate
# This script verifies that all required configuration files exist and are properly configured
# Usage: .\check-config.ps1

param(
    [switch]$Fix = $false
)

# Configuration
$Config = @{
    ProjectRoot = "D:\tourimate"
    BackendPath = "D:\tourimate\tourimate"
    FrontendPath = "D:\tourimate\tourimate-client"
    ProductionConfig = "D:\tourimate\tourimate\appsettings.production.json"
    ProductionEnv = "D:\tourimate\tourimate-client\.env.production"
    TemplateConfig = "D:\tourimate\tourimate\appsettings.production.json.template"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-ConfigurationFile {
    param(
        [string]$FilePath,
        [string]$FileType
    )
    
    if (Test-Path $FilePath) {
        Write-ColorOutput "✅ $FileType found: $FilePath" "Green"
        
        # Check if file contains placeholder values
        $content = Get-Content $FilePath -Raw
        if ($content -match "YOUR_.*_HERE" -or $content -match "localhost" -or $content -match "123456") {
            Write-ColorOutput "⚠️  $FileType contains placeholder values - please update with real values" "Yellow"
            return $false
        }
        
        return $true
    } else {
        Write-ColorOutput "❌ $FileType not found: $FilePath" "Red"
        return $false
    }
}

function Copy-TemplateFile {
    param(
        [string]$TemplatePath,
        [string]$TargetPath,
        [string]$FileType
    )
    
    if (Test-Path $TemplatePath) {
        Write-ColorOutput "📋 Copying template to $FileType..." "Cyan"
        Copy-Item -Path $TemplatePath -Destination $TargetPath -Force
        Write-ColorOutput "✅ Template copied successfully" "Green"
        Write-ColorOutput "⚠️  Please edit $TargetPath with your actual configuration values" "Yellow"
        return $true
    } else {
        Write-ColorOutput "❌ Template not found: $TemplatePath" "Red"
        return $false
    }
}

function Test-BackendConfig {
    Write-ColorOutput "`n🔧 Checking Backend Configuration..." "Cyan"
    
    $isValid = Test-ConfigurationFile $Config.ProductionConfig "Production Config"
    
    if (!$isValid -and $Fix) {
        $templatePath = $Config.TemplateConfig
        Copy-TemplateFile $templatePath $Config.ProductionConfig "Production Config"
    }
    
    return $isValid
}

function Test-FrontendConfig {
    Write-ColorOutput "`n🎨 Checking Frontend Configuration..." "Cyan"
    
    $isValid = Test-ConfigurationFile $Config.ProductionEnv "Production Environment"
    
    if (!$isValid -and $Fix) {
        # Create .env.production file
        $envContent = @"
# Production API URL (VPS) - API runs on port 5000
VITE_API_BASE_URL=https://tourimate.site:5000
"@
        Write-ColorOutput "📋 Creating production environment file..." "Cyan"
        $envContent | Out-File -FilePath $Config.ProductionEnv -Encoding UTF8
        Write-ColorOutput "✅ Production environment file created" "Green"
        $isValid = $true
    }
    
    return $isValid
}

function Test-Prerequisites {
    Write-ColorOutput "`n🔍 Checking Prerequisites..." "Cyan"
    
    # Check .NET
    try {
        $dotnetVersion = dotnet --version 2>&1
        Write-ColorOutput "✅ .NET SDK: $dotnetVersion" "Green"
    } catch {
        Write-ColorOutput "❌ .NET SDK not found" "Red"
        return $false
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>&1
        Write-ColorOutput "✅ Node.js: $nodeVersion" "Green"
    } catch {
        Write-ColorOutput "❌ Node.js not found" "Red"
        return $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>&1
        Write-ColorOutput "✅ npm: $npmVersion" "Green"
    } catch {
        Write-ColorOutput "❌ npm not found" "Red"
        return $false
    }
    
    return $true
}

function Test-SSHConnection {
    Write-ColorOutput "`n🌐 Testing SSH Connection..." "Cyan"
    
    try {
        $sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes Administrator@103.161.180.247 "echo 'SSH connection successful'" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ SSH connection to VPS successful" "Green"
            return $true
        } else {
            Write-ColorOutput "❌ SSH connection failed: $sshTest" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "❌ SSH connection failed: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Main execution
function Main {
    Write-ColorOutput "🚀 TouriMate Configuration Checker" "Cyan"
    Write-ColorOutput "=================================" "Cyan"
    
    $allValid = $true
    
    # Check prerequisites
    if (!(Test-Prerequisites)) {
        $allValid = $false
    }
    
    # Check backend config
    if (!(Test-BackendConfig)) {
        $allValid = $false
    }
    
    # Check frontend config
    if (!(Test-FrontendConfig)) {
        $allValid = $false
    }
    
    # Test SSH connection
    if (!(Test-SSHConnection)) {
        $allValid = $false
    }
    
    # Summary
    Write-ColorOutput "`n📊 Configuration Check Summary" "Cyan"
    Write-ColorOutput "=============================" "Cyan"
    
    if ($allValid) {
        Write-ColorOutput "✅ All configurations are valid!" "Green"
        Write-ColorOutput "🚀 Ready to run auto-build-deploy.ps1" "Green"
    } else {
        Write-ColorOutput "❌ Some configurations need attention" "Red"
        Write-ColorOutput "🔧 Run with -Fix parameter to auto-fix issues: .\check-config.ps1 -Fix" "Yellow"
    }
    
    Write-ColorOutput "`n📋 Configuration Files:" "Cyan"
    Write-ColorOutput "Backend: $($Config.ProductionConfig)" "White"
    Write-ColorOutput "Frontend: $($Config.ProductionEnv)" "White"
    Write-ColorOutput "Template: $($Config.TemplateConfig)" "White"
}

# Run main function
Main