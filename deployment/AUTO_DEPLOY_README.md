# TouriMate Auto Build and Deploy

Script tự động build và deploy ứng dụng TouriMate lên VPS với cấu hình production.

## 🚀 Quick Start

### 1. Chạy Auto Deploy (Đơn giản nhất)
```batch
.\deployment\run-auto-deploy.bat
```

### 2. Chạy với PowerShell
```powershell
.\deployment\auto-build-deploy.ps1
```

## 📋 Prerequisites

### Required Files:
- ✅ `tourimate/appsettings.production.json` - Backend config
- ✅ `tourimate-client/.env.production` - Frontend config
- ✅ SSH access to VPS (103.161.180.247)

### Required Software:
- ✅ .NET SDK
- ✅ Node.js & npm
- ✅ SSH client

## 🔧 Configuration Check

Trước khi deploy, kiểm tra cấu hình:

```powershell
# Kiểm tra cấu hình
.\deployment\check-config.ps1

# Tự động sửa lỗi cấu hình
.\deployment\check-config.ps1 -Fix
```

## 📁 Script Files

| File | Mô tả |
|------|-------|
| `auto-build-deploy.ps1` | Script chính - build và deploy |
| `run-auto-deploy.bat` | Batch file để chạy dễ dàng |
| `check-config.ps1` | Kiểm tra cấu hình trước khi deploy |

## ⚙️ Script Options

### Auto Build Deploy Script:
```powershell
.\deployment\auto-build-deploy.ps1 [OPTIONS]

Options:
  -SkipBuild     Chỉ deploy, không build
  -SkipDeploy    Chỉ build, không deploy  
  -Verbose       Hiển thị chi tiết
  -Force         Force mode
```

### Examples:
```powershell
# Build và deploy đầy đủ
.\deployment\auto-build-deploy.ps1

# Chỉ build, không deploy
.\deployment\auto-build-deploy.ps1 -SkipDeploy

# Chỉ deploy, không build
.\deployment\auto-build-deploy.ps1 -SkipBuild

# Verbose mode
.\deployment\auto-build-deploy.ps1 -Verbose
```

## 🔄 Workflow

### 1. **Prerequisites Check**
- Kiểm tra .NET SDK, Node.js, npm
- Kiểm tra file cấu hình production
- Kiểm tra SSH connection

### 2. **Build Process**
- **Backend**: 
  - Restore NuGet packages
  - Build với Release configuration
  - Copy `appsettings.production.json` vào build output
- **Frontend**:
  - Install npm dependencies
  - Copy `.env.production` file
  - Build với production config

### 3. **Deploy Process**
- Stop IIS application pools
- Backup existing files
- Transfer files via SCP
- Start IIS application pools

### 4. **Verification**
- Test backend endpoint (https://tourimate.site:5000)
- Test frontend endpoint (https://tourimate.site)

## 📊 Build Output

### Backend:
```
D:\tourimate\publish\backend\
├── tourimate.dll
├── appsettings.Production.json
└── ... (other files)
```

### Frontend:
```
D:\tourimate\publish\frontend\
├── index.html
├── assets/
└── ... (built files)
```

## 🌐 VPS Deployment

### Backend Path:
```
C:\inetpub\wwwroot\tourimate-production\
```

### Frontend Path:
```
C:\inetpub\wwwroot\tourimate-frontend-production\
```

## 📝 Logging

Log file: `D:\tourimate\deployment\auto-deploy.log`

Format:
```
[2024-01-01 12:00:00] [INFO] Starting TouriMate Auto Build and Deploy
[2024-01-01 12:00:01] [INFO] Checking prerequisites...
[2024-01-01 12:00:02] [INFO] Prerequisites check completed successfully
```

## 🚨 Troubleshooting

### Common Issues:

#### 1. **SSH Connection Failed**
```bash
# Test SSH connection manually
ssh Administrator@103.161.180.247
```

#### 2. **Build Failed**
- Check .NET SDK version
- Check Node.js/npm version
- Verify project files exist

#### 3. **Deploy Failed**
- Check VPS disk space
- Verify IIS permissions
- Check VPS paths in config

#### 4. **Configuration Missing**
```powershell
# Auto-fix configuration
.\deployment\check-config.ps1 -Fix
```

## 🔒 Security Notes

- File `appsettings.production.json` chứa secrets - không commit vào Git
- File `.env.production` chứa API URLs - không commit vào Git
- SSH keys cần được bảo mật
- VPS credentials cần được bảo vệ

## 📞 Support

Nếu gặp vấn đề:

1. **Check logs**: `D:\tourimate\deployment\auto-deploy.log`
2. **Verify config**: `.\deployment\check-config.ps1`
3. **Test SSH**: `ssh Administrator@103.161.180.247`
4. **Manual build**: Test build locally trước

## 🎯 Success Indicators

Sau khi deploy thành công:
- ✅ Backend: https://tourimate.site:5000/api/health
- ✅ Frontend: https://tourimate.site
- ✅ No errors in logs
- ✅ IIS pools running

---

**Happy Deploying! 🚀**
