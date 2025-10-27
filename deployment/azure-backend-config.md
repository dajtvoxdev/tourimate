# Azure App Service Configuration

## Backend Deployment Configuration

### Azure App Service Settings

Create two Azure App Services:
1. **Staging**: `tourimate-api-staging`
2. **Production**: `tourimate-api-production`

### Required Application Settings

Add these settings in Azure App Service Configuration:

#### Database Connection
```
ConnectionStrings__DefaultConnection=<your-sql-server-connection-string>
```

#### JWT Configuration
```
JWT__SecretKey=<your-jwt-secret-key>
JWT__Issuer=TouriMate
JWT__Audience=TouriMate-Users
JWT__ExpirationMinutes=60
```

#### Firebase Configuration
```
Firebase__ProjectId=<your-firebase-project-id>
Firebase__PrivateKey=<your-firebase-private-key>
Firebase__ClientEmail=<your-firebase-client-email>
```

#### Cloudinary Configuration
```
Cloudinary__CloudName=<your-cloudinary-cloud-name>
Cloudinary__ApiKey=<your-cloudinary-api-key>
Cloudinary__ApiSecret=<your-cloudinary-api-secret>
```

#### SePay Configuration
```
SePay__ApiUrl=https://api.sepay.vn
SePay__ApiKey=<your-sepay-api-key>
SePay__ApiSecret=<your-sepay-api-secret>
SePay__WebhookSecret=<your-sepay-webhook-secret>
```

#### Email Configuration
```
Email__SmtpServer=<your-smtp-server>
Email__SmtpPort=587
Email__SmtpUsername=<your-smtp-username>
Email__SmtpPassword=<your-smtp-password>
Email__FromEmail=noreply@tourimate.com
Email__FromName=TouriMate
```

### GitHub Secrets Required

Add these secrets to your GitHub repository:

#### Azure Secrets
```
AZURE_WEBAPP_NAME_STAGING=tourimate-api-staging
AZURE_WEBAPP_NAME_PRODUCTION=tourimate-api-production
AZURE_WEBAPP_PUBLISH_PROFILE_STAGING=<staging-publish-profile>
AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION=<production-publish-profile>
```

#### Database Secrets
```
CONNECTION_STRING_STAGING=<staging-db-connection-string>
CONNECTION_STRING_PRODUCTION=<production-db-connection-string>
```

### Deployment Steps

1. **Create Azure App Services**:
   - Go to Azure Portal
   - Create new App Service for staging and production
   - Choose .NET 8 runtime stack
   - Select appropriate pricing tier

2. **Configure Application Settings**:
   - Add all required configuration values
   - Set up connection strings
   - Configure authentication settings

3. **Get Publish Profiles**:
   - Download publish profiles from Azure App Service
   - Add them as GitHub secrets

4. **Set up GitHub Secrets**:
   - Add all required secrets to your GitHub repository
   - Ensure proper access permissions

### Database Migration

The CI/CD pipeline includes database migration steps. Ensure your connection strings are properly configured in Azure App Service settings.

### Monitoring and Logging

Configure Application Insights for monitoring:
```
APPINSIGHTS_INSTRUMENTATIONKEY=<your-app-insights-key>
APPLICATIONINSIGHTS_CONNECTION_STRING=<your-app-insights-connection-string>
```
