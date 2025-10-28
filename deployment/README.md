# TouriMate Local CI/CD Pipeline

This CI/CD solution builds your project locally and deploys it to your VPS via SSH when you push to the main branch.

## 🚀 Features

- **Automatic Build**: Builds both backend (.NET) and frontend (React) locally
- **Production Config**: Uses `appsettings.Production.json` for backend and `.env.production` for frontend
- **SSH Deployment**: Deploys built files to VPS via SSH
- **Git Integration**: Automatically triggers on `git push` to main branch
- **Manual Execution**: Can be run manually for testing

## 📁 Files Structure

```
deployment/
├── local-ci-cd.ps1          # Main CI/CD script
├── git-hook.sh              # Git hook script
├── run-ci-cd.bat            # Windows batch runner
├── setup-git-hooks.ps1     # Git hooks setup
├── ci-cd-config.json       # Configuration file
└── README.md               # This file
```

## ⚙️ Setup Instructions

### 1. Prerequisites

Make sure you have installed:
- .NET SDK (for backend build)
- Node.js and npm (for frontend build)
- Git (for version control)
- SSH client (for VPS deployment)

### 2. Configure VPS Access

Ensure you can SSH to your VPS:
```bash
ssh Administrator@tourimate.site
```

### 3. Setup Git Hooks (Automatic CI/CD)

Run the setup script to enable automatic CI/CD on git push:

```powershell
.\deployment\setup-git-hooks.ps1
```

### 4. Manual Testing

Test the CI/CD pipeline manually:

```batch
.\deployment\run-ci-cd.bat
```

Or using PowerShell:

```powershell
.\deployment\local-ci-cd.ps1
```

## 🔧 Configuration

Edit `deployment/ci-cd-config.json` to customize:

- Project paths
- VPS connection details
- Build configurations
- Environment settings

## 📋 How It Works

### 1. Git Push Trigger
When you push to the main branch:
1. Git hook detects the push
2. Pulls latest changes
3. Runs the CI/CD pipeline

### 2. Build Process
1. **Backend Build**:
   - Restores NuGet packages
   - Builds with Release configuration
   - Uses `appsettings.Production.json`
   - Publishes to `D:\tourimate\publish\backend`

2. **Frontend Build**:
   - Installs npm dependencies
   - Creates `.env.production` with VPS API URL
   - Builds for production
   - Copies to `D:\tourimate\publish\frontend`

### 3. Deployment Process
1. **VPS Preparation**:
   - Stops IIS application pools
   - Backs up existing files
   - Creates deployment directories

2. **File Transfer**:
   - Uses SCP to transfer backend files
   - Uses SCP to transfer frontend files

3. **VPS Finalization**:
   - Starts IIS application pools
   - Verifies deployment

## 🎯 Environment Configuration

### Backend (appsettings.Production.json)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "your-production-connection-string"
  },
  "ExternalServices": {
    "SendGrid": {
      "ApiKey": "your-sendgrid-api-key",
      "FromEmail": "noreply@tourimate.site",
      "FromName": "TouriMate"
    }
  }
}
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://tourimate.site:5000
```

## 🚨 Troubleshooting

### Common Issues

1. **SSH Connection Failed**:
   - Check VPS credentials
   - Verify SSH port (22)
   - Test SSH connection manually

2. **Build Failed**:
   - Check .NET SDK installation
   - Check Node.js/npm installation
   - Verify project paths in config

3. **Deployment Failed**:
   - Check VPS disk space
   - Verify IIS permissions
   - Check VPS paths in config

### Logs

Check the log file for detailed information:
```
D:\tourimate\deployment\ci-cd.log
```

## 🔄 Manual Commands

### Build Only (Skip Deployment)
```powershell
.\deployment\local-ci-cd.ps1 -SkipDeploy
```

### Deploy Only (Skip Build)
```powershell
.\deployment\local-ci-cd.ps1 -SkipBuild
```

### Verbose Output
```powershell
.\deployment\local-ci-cd.ps1 -Verbose
```

## 📞 Support

If you encounter issues:
1. Check the log file
2. Verify all prerequisites
3. Test SSH connection manually
4. Run with verbose output for debugging

## 🎉 Success!

After successful deployment:
- **Backend**: https://tourimate.site:5000
- **Frontend**: https://tourimate.site

Your CI/CD pipeline is now ready! 🚀
