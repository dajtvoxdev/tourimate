# Git Post-Receive Hook for TouriMate CI/CD
# This script runs after a successful git push
# Place this file in: .git\hooks\post-receive (Windows) or .git/hooks/post-receive (Linux/Mac)

#!/bin/bash

# Configuration
PROJECT_ROOT="D:/tourimate"
CI_CD_SCRIPT="$PROJECT_ROOT/deployment/local-ci-cd.ps1"
LOG_FILE="$PROJECT_ROOT/deployment/git-hook.log"

# Logging function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if we're on the main branch
while read oldrev newrev refname; do
    if [[ $refname == "refs/heads/main" ]]; then
        log_message "Push detected on main branch: $oldrev -> $newrev"
        
        # Change to project directory
        cd "$PROJECT_ROOT" || {
            log_message "ERROR: Failed to change to project directory: $PROJECT_ROOT"
            exit 1
        }
        
        # Pull latest changes
        log_message "Pulling latest changes..."
        git pull origin main || {
            log_message "ERROR: Failed to pull latest changes"
            exit 1
        }
        
        # Run CI/CD pipeline
        log_message "Starting CI/CD pipeline..."
        if command -v pwsh >/dev/null 2>&1; then
            pwsh -ExecutionPolicy Bypass -File "$CI_CD_SCRIPT"
        elif command -v powershell >/dev/null 2>&1; then
            powershell -ExecutionPolicy Bypass -File "$CI_CD_SCRIPT"
        else
            log_message "ERROR: PowerShell not found"
            exit 1
        fi
        
        if [ $? -eq 0 ]; then
            log_message "CI/CD pipeline completed successfully"
        else
            log_message "ERROR: CI/CD pipeline failed"
            exit 1
        fi
    fi
done
