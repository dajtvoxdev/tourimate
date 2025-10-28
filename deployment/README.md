# TouriMate Deployment

## 🚀 Quick Start

### Single Command Deployment
```bash
.\run-auto-deploy.bat
```

### Manual Deployment
```bash
.\auto-build-deploy.ps1
```

## 📋 Prerequisites

1. **Production Configuration Files:**
   - `tourimate/appsettings.production.json` - Backend production config
   - `tourimate-client/.env.production` - Frontend production config

2. **Required Software:**
   - .NET SDK 8.0+
   - Node.js 18+
   - SSH client (OpenSSH)

3. **VPS Access:**
   - SSH access to `103.161.180.247`
   - Administrator privileges
   - IIS configured with `DefaultAppPool`

## 🔧 Configuration

### VPS Settings (in `auto-build-deploy.ps1`):
```powershell
$Config = @{
    VpsHost = "103.161.180.247"
    VpsUser = "Administrator"
    VpsPort = 22
    VpsBackendPath = "C:\inetpub\wwwroot\tourimate-production"
    VpsFrontendPath = "C:\inetpub\wwwroot\tourimate-frontend-production"
}
```

## 📁 Deployment Process

1. **Build Backend:**
   - Restore NuGet packages
   - Publish with Release configuration
   - Copy `appsettings.production.json`

2. **Build Frontend:**
   - Install npm dependencies
   - Copy `.env.production`
   - Build for production
   - Copy dist files

3. **Deploy to VPS:**
   - Stop IIS application pools
   - Transfer files via SCP
   - Start IIS application pools

4. **Verify Deployment:**
   - Test backend: `https://tourimate.site:5000/api/health`
   - Test frontend: `https://tourimate.site`

## 🛠️ Troubleshooting

### Check Configuration
```bash
.\check-config-simple.ps1
```

### View Logs
```bash
Get-Content .\auto-deploy.log -Tail 50
```

### Common Issues
- **SSH Connection Failed**: Check VPS IP and credentials
- **Build Failed**: Verify .NET SDK and Node.js installation
- **Deploy Failed**: Check IIS permissions and paths

## 📊 Monitoring

- **Logs**: `deployment/auto-deploy.log`
- **Backend**: `https://tourimate.site:5000`
- **Frontend**: `https://tourimate.site`

## 🎯 Success Indicators

✅ Build completed successfully  
✅ Files transferred to VPS  
✅ IIS application pools restarted  
✅ Health endpoints responding  
✅ Frontend accessible  

---

**Note**: This deployment method has been tested and optimized for the TouriMate VPS environment.