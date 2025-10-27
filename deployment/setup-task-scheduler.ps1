# TouriMate VPS Task Scheduler Configuration
# This script sets up automated deployments using Windows Task Scheduler

param(
    [Parameter(Mandatory=$false)]
    [string]$TaskName = "TouriMate Auto Deploy",
    
    [Parameter(Mandatory=$false)]
    [int]$IntervalMinutes = 5,
    
    [Parameter(Mandatory=$false)]
    [string]$ScriptPath = "C:\deployment\vps-auto-deploy.ps1"
)

Write-Host "Setting up TouriMate Auto Deploy Task Scheduler..." -ForegroundColor Green

# Create deployment directory if it doesn't exist
$DeployDir = Split-Path $ScriptPath -Parent
if (!(Test-Path $DeployDir)) {
    New-Item -ItemType Directory -Path $DeployDir -Force
    Write-Host "Created deployment directory: $DeployDir" -ForegroundColor Yellow
}

# Copy the deployment script to the deployment directory
$SourceScript = Join-Path $PSScriptRoot "vps-auto-deploy.ps1"
if (Test-Path $SourceScript) {
    Copy-Item -Path $SourceScript -Destination $ScriptPath -Force
    Write-Host "Copied deployment script to: $ScriptPath" -ForegroundColor Yellow
} else {
    Write-Host "Warning: Source script not found at $SourceScript" -ForegroundColor Red
}

# Create the scheduled task
Write-Host "Creating scheduled task: $TaskName" -ForegroundColor Yellow

# Remove existing task if it exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task" -ForegroundColor Yellow
}

# Create task action
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`" -Environment production -Component both"

# Create task trigger (every X minutes)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) -RepetitionDuration (New-TimeSpan -Days 365)

# Create task settings
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Create task principal (run as SYSTEM with highest privileges)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register the task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Automatically deploys TouriMate application from Git repository"

Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
Write-Host "Task Name: $TaskName" -ForegroundColor White
Write-Host "Interval: Every $IntervalMinutes minutes" -ForegroundColor White
Write-Host "Script Path: $ScriptPath" -ForegroundColor White

# Test the task
Write-Host "`nTesting the scheduled task..." -ForegroundColor Yellow
try {
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "✅ Task started successfully" -ForegroundColor Green
    
    # Wait a moment and check status
    Start-Sleep -Seconds 5
    $TaskInfo = Get-ScheduledTask -TaskName $TaskName
    Write-Host "Task Status: $($TaskInfo.State)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to start task: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Task Scheduler Setup Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "The task will run every $IntervalMinutes minutes and automatically" -ForegroundColor White
Write-Host "pull the latest code from Git and deploy to production." -ForegroundColor White
Write-Host "`nTo manage the task:" -ForegroundColor Yellow
Write-Host "  - View: Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  - Start: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  - Stop: Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "  - Remove: Unregister-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "`nLogs are stored in: C:\logs\tourimate\" -ForegroundColor Cyan
