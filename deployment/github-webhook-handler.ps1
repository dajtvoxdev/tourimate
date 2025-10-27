# TouriMate GitHub Webhook Handler
# This script handles GitHub webhook notifications for automatic deployments

param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 9000,
    
    [Parameter(Mandatory=$false)]
    [string]$Secret = "your-webhook-secret-key",
    
    [Parameter(Mandatory=$false)]
    [string]$DeployScriptPath = "C:\deployment\vps-auto-deploy.ps1"
)

Write-Host "Starting TouriMate GitHub Webhook Handler..." -ForegroundColor Green
Write-Host "Port: $Port" -ForegroundColor White
Write-Host "Secret: $Secret" -ForegroundColor White
Write-Host "Deploy Script: $DeployScriptPath" -ForegroundColor White

# Create logs directory
$LogPath = "C:\logs\tourimate\webhook"
if (!(Test-Path $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
}

# Logging function
function Write-WebhookLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogEntry = "[$Timestamp] [$Level] $Message"
    $LogFile = Join-Path $LogPath "webhook-$(Get-Date -Format 'yyyyMMdd').log"
    
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

# Verify GitHub webhook signature
function Test-GitHubSignature {
    param(
        [string]$Payload,
        [string]$Signature,
        [string]$Secret
    )
    
    if ([string]::IsNullOrEmpty($Signature)) {
        return $false
    }
    
    # Remove 'sha256=' prefix if present
    $Signature = $Signature -replace '^sha256=', ''
    
    # Calculate expected signature
    $Encoding = [System.Text.Encoding]::UTF8
    $KeyBytes = $Encoding.GetBytes($Secret)
    $PayloadBytes = $Encoding.GetBytes($Payload)
    
    $Hmac = New-Object System.Security.Cryptography.HMACSHA256($KeyBytes)
    $ComputedHash = $Hmac.ComputeHash($PayloadBytes)
    $ComputedSignature = [System.BitConverter]::ToString($ComputedHash) -replace '-', '' -replace '^', ''
    
    return $Signature -eq $ComputedSignature
}

# Process GitHub webhook payload
function Process-GitHubWebhook {
    param(
        [string]$Payload
    )
    
    try {
        $WebhookData = $Payload | ConvertFrom-Json
        
        Write-WebhookLog "Received webhook for repository: $($WebhookData.repository.full_name)"
        Write-WebhookLog "Ref: $($WebhookData.ref)"
        Write-WebhookLog "Commit: $($WebhookData.head_commit.id)"
        Write-WebhookLog "Author: $($WebhookData.head_commit.author.name)"
        Write-WebhookLog "Message: $($WebhookData.head_commit.message)"
        
        # Check if this is a push to main branch
        if ($WebhookData.ref -eq "refs/heads/main") {
            Write-WebhookLog "Push to main branch detected - triggering deployment"
            
            # Determine what changed
            $ChangedFiles = @()
            foreach ($commit in $WebhookData.commits) {
                $ChangedFiles += $commit.added
                $ChangedFiles += $commit.modified
                $ChangedFiles += $commit.removed
            }
            
            # Determine components to deploy
            $DeployBackend = $false
            $DeployFrontend = $false
            
            foreach ($file in $ChangedFiles) {
                if ($file -like "tourimate/*" -or $file -like "entities/*") {
                    $DeployBackend = $true
                }
                if ($file -like "tourimate-client/*") {
                    $DeployFrontend = $true
                }
            }
            
            # If no specific changes detected, deploy both
            if (!$DeployBackend -and !$DeployFrontend) {
                $DeployBackend = $true
                $DeployFrontend = $true
            }
            
            # Trigger deployment
            $Component = if ($DeployBackend -and $DeployFrontend) { "both" } 
                        elseif ($DeployBackend) { "backend" } 
                        else { "frontend" }
            
            Write-WebhookLog "Deploying component: $Component"
            
            # Start deployment process
            $DeployProcess = Start-Process -FilePath "PowerShell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$DeployScriptPath`" -Environment production -Component $Component" -PassThru -WindowStyle Hidden
            
            Write-WebhookLog "Deployment process started with PID: $($DeployProcess.Id)"
            
            return @{
                Success = $true
                Message = "Deployment triggered for $Component"
                ProcessId = $DeployProcess.Id
            }
        } else {
            Write-WebhookLog "Push to non-main branch ignored: $($WebhookData.ref)"
            return @{
                Success = $true
                Message = "Push to non-main branch ignored"
            }
        }
    } catch {
        Write-WebhookLog "Error processing webhook: $($_.Exception.Message)" "ERROR"
        return @{
            Success = $false
            Message = "Error processing webhook: $($_.Exception.Message)"
        }
    }
}

# Create HTTP listener
try {
    $Listener = New-Object System.Net.HttpListener
    $Listener.Prefixes.Add("http://+:$Port/")
    $Listener.Start()
    
    Write-WebhookLog "Webhook handler started on port $Port"
    Write-WebhookLog "Listening for GitHub webhooks..."
    
    while ($Listener.IsListening) {
        try {
            # Wait for request
            $Context = $Listener.GetContext()
            $Request = $Context.Request
            $Response = $Context.Response
            
            Write-WebhookLog "Received request: $($Request.HttpMethod) $($Request.Url.AbsolutePath)"
            
            # Handle different HTTP methods
            switch ($Request.HttpMethod) {
                "POST" {
                    # Handle webhook
                    if ($Request.Url.AbsolutePath -eq "/webhook") {
                        # Read payload
                        $Reader = New-Object System.IO.StreamReader($Request.InputStream)
                        $Payload = $Reader.ReadToEnd()
                        $Reader.Close()
                        
                        # Get signature
                        $Signature = $Request.Headers["X-Hub-Signature-256"]
                        
                        # Verify signature
                        if (Test-GitHubSignature -Payload $Payload -Signature $Signature -Secret $Secret) {
                            Write-WebhookLog "Webhook signature verified"
                            
                            # Process webhook
                            $Result = Process-GitHubWebhook -Payload $Payload
                            
                            # Send response
                            $Response.StatusCode = if ($Result.Success) { 200 } else { 500 }
                            $Response.ContentType = "application/json"
                            
                            $ResponseBody = $Result | ConvertTo-Json
                            $ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes($ResponseBody)
                            $Response.OutputStream.Write($ResponseBytes, 0, $ResponseBytes.Length)
                            
                            Write-WebhookLog "Response sent: $($Result.Message)"
                        } else {
                            Write-WebhookLog "Invalid webhook signature" "WARNING"
                            $Response.StatusCode = 401
                            $ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes("Unauthorized")
                            $Response.OutputStream.Write($ResponseBytes, 0, $ResponseBytes.Length)
                        }
                    } else {
                        $Response.StatusCode = 404
                        $ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
                        $Response.OutputStream.Write($ResponseBytes, 0, $ResponseBytes.Length)
                    }
                }
                "GET" {
                    # Health check endpoint
                    if ($Request.Url.AbsolutePath -eq "/health") {
                        $HealthResponse = @{
                            Status = "OK"
                            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                            Service = "TouriMate Webhook Handler"
                            Version = "1.0"
                        } | ConvertTo-Json
                        
                        $Response.StatusCode = 200
                        $Response.ContentType = "application/json"
                        $ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes($HealthResponse)
                        $Response.OutputStream.Write($ResponseBytes, 0, $ResponseBytes.Length)
                        
                        Write-WebhookLog "Health check requested"
                    } else {
                        $Response.StatusCode = 404
                        $ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
                        $Response.OutputStream.Write($ResponseBytes, 0, $ResponseBytes.Length)
                    }
                }
                default {
                    $Response.StatusCode = 405
                    $ResponseBytes = [System.Text.Encoding]::UTF8.GetBytes("Method Not Allowed")
                    $Response.OutputStream.Write($ResponseBytes, 0, $ResponseBytes.Length)
                }
            }
            
            $Response.Close()
        } catch {
            Write-WebhookLog "Error handling request: $($_.Exception.Message)" "ERROR"
        }
    }
} catch {
    Write-WebhookLog "Failed to start webhook handler: $($_.Exception.Message)" "ERROR"
    Write-Host "Make sure you have permission to bind to port $Port" -ForegroundColor Red
    Write-Host "You may need to run as Administrator or configure Windows Firewall" -ForegroundColor Yellow
} finally {
    if ($Listener) {
        $Listener.Stop()
        Write-WebhookLog "Webhook handler stopped"
    }
}

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "Webhook Handler Setup Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Webhook URL: http://your-vps-ip:$Port/webhook" -ForegroundColor White
Write-Host "Health Check: http://your-vps-ip:$Port/health" -ForegroundColor White
Write-Host "Secret Key: $Secret" -ForegroundColor White
Write-Host "`nConfigure this URL in your GitHub repository webhook settings." -ForegroundColor Yellow
Write-Host "Logs are stored in: $LogPath" -ForegroundColor Cyan
