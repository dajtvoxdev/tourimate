# Production Configuration Setup

## 🔐 Security Notice

File `appsettings.production.json` chứa các thông tin nhạy cảm (API keys, connection strings) và **KHÔNG** được commit vào Git repository.

## 📋 Setup Instructions

### 1. Copy Template File
```bash
cp tourimate/appsettings.production.json.template tourimate/appsettings.production.json
```

### 2. Configure Production Settings

Mở file `tourimate/appsettings.production.json` và cập nhật các giá trị sau:

#### Database Connection
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=TouriMate;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=true;"
  }
}
```

#### SendGrid Email Service
```json
{
  "ExternalServices": {
    "SendGrid": {
      "ApiKey": "SG.your-actual-sendgrid-api-key-here",
      "FromEmail": "noreply@tourimate.site",
      "FromName": "TouriMate"
    }
  }
}
```

#### Admin Email
```json
{
  "Admin": {
    "Email": "admin@tourimate.site"
  }
}
```

### 3. Verify Git Ignore

Đảm bảo file `appsettings.production.json` được ignore trong `.gitignore`:

```gitignore
# Configuration files with secrets
**/appsettings.production.json
```

### 4. Test Configuration

Sau khi cấu hình, test ứng dụng để đảm bảo:
- Database connection hoạt động
- Email service hoạt động
- Không có lỗi configuration

## 🚨 Important Notes

- **KHÔNG BAO GIỜ** commit file `appsettings.production.json` vào Git
- Sử dụng environment variables hoặc Azure Key Vault cho production
- Backup file config ở nơi an toàn
- Rotate API keys định kỳ

## 🔄 CI/CD Integration

File này sẽ được tự động copy trong quá trình deployment:
- Local CI/CD script sẽ sử dụng file này
- VPS deployment sẽ copy file này vào thư mục production
- Đảm bảo file tồn tại trước khi deploy

## 📞 Support

Nếu gặp vấn đề với configuration:
1. Kiểm tra file template
2. Verify Git ignore rules
3. Test database connection
4. Test email service
