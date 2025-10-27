# Environment Configuration Templates

## Backend Environment Configuration

### appsettings.Development.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=TouriMateDev;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "JWT": {
    "SecretKey": "your-development-secret-key-here",
    "Issuer": "TouriMate",
    "Audience": "TouriMate-Users",
    "ExpirationMinutes": 60
  },
  "Firebase": {
    "ProjectId": "your-firebase-project-id",
    "PrivateKey": "your-firebase-private-key",
    "ClientEmail": "your-firebase-client-email"
  },
  "Cloudinary": {
    "CloudName": "your-cloudinary-cloud-name",
    "ApiKey": "your-cloudinary-api-key",
    "ApiSecret": "your-cloudinary-api-secret"
  },
  "SePay": {
    "ApiUrl": "https://api.sepay.vn",
    "ApiKey": "your-sepay-api-key",
    "ApiSecret": "your-sepay-api-secret",
    "WebhookSecret": "your-sepay-webhook-secret"
  },
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "your-email@gmail.com",
    "SmtpPassword": "your-app-password",
    "FromEmail": "noreply@tourimate.com",
    "FromName": "TouriMate"
  }
}
```

### appsettings.Staging.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-staging-sql-server;Database=TouriMateStaging;User Id=your-username;Password=your-password;TrustServerCertificate=true"
  },
  "JWT": {
    "SecretKey": "your-staging-secret-key-here",
    "Issuer": "TouriMate",
    "Audience": "TouriMate-Users",
    "ExpirationMinutes": 60
  },
  "Firebase": {
    "ProjectId": "your-firebase-project-id",
    "PrivateKey": "your-firebase-private-key",
    "ClientEmail": "your-firebase-client-email"
  },
  "Cloudinary": {
    "CloudName": "your-cloudinary-cloud-name",
    "ApiKey": "your-cloudinary-api-key",
    "ApiSecret": "your-cloudinary-api-secret"
  },
  "SePay": {
    "ApiUrl": "https://api.sepay.vn",
    "ApiKey": "your-sepay-api-key",
    "ApiSecret": "your-sepay-api-secret",
    "WebhookSecret": "your-sepay-webhook-secret"
  },
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "your-email@gmail.com",
    "SmtpPassword": "your-app-password",
    "FromEmail": "noreply@tourimate.com",
    "FromName": "TouriMate"
  }
}
```

### appsettings.Production.json
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-production-sql-server;Database=TouriMateProduction;User Id=your-username;Password=your-password;TrustServerCertificate=true"
  },
  "JWT": {
    "SecretKey": "your-production-secret-key-here",
    "Issuer": "TouriMate",
    "Audience": "TouriMate-Users",
    "ExpirationMinutes": 60
  },
  "Firebase": {
    "ProjectId": "your-firebase-project-id",
    "PrivateKey": "your-firebase-private-key",
    "ClientEmail": "your-firebase-client-email"
  },
  "Cloudinary": {
    "CloudName": "your-cloudinary-cloud-name",
    "ApiKey": "your-cloudinary-api-key",
    "ApiSecret": "your-cloudinary-api-secret"
  },
  "SePay": {
    "ApiUrl": "https://api.sepay.vn",
    "ApiKey": "your-sepay-api-key",
    "ApiSecret": "your-sepay-api-secret",
    "WebhookSecret": "your-sepay-webhook-secret"
  },
  "Email": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SmtpUsername": "your-email@gmail.com",
    "SmtpPassword": "your-app-password",
    "FromEmail": "noreply@tourimate.com",
    "FromName": "TouriMate"
  }
}
```

## Frontend Environment Configuration

### .env.development
```
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset
VITE_APP_NAME=TouriMate
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
```

### .env.staging
```
VITE_API_BASE_URL=https://tourimate-api-staging.azurewebsites.net
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset
VITE_APP_NAME=TouriMate
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=staging
```

### .env.production
```
VITE_API_BASE_URL=https://tourimate-api-production.azurewebsites.net
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset
VITE_APP_NAME=TouriMate
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

## GitHub Secrets Configuration

### Required Secrets for Backend
```
AZURE_WEBAPP_NAME_STAGING=tourimate-api-staging
AZURE_WEBAPP_NAME_PRODUCTION=tourimate-api-production
AZURE_WEBAPP_PUBLISH_PROFILE_STAGING=<staging-publish-profile>
AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION=<production-publish-profile>
CONNECTION_STRING_STAGING=<staging-db-connection-string>
CONNECTION_STRING_PRODUCTION=<production-db-connection-string>
```

### Required Secrets for Frontend
```
NETLIFY_AUTH_TOKEN=<your-netlify-auth-token>
NETLIFY_SITE_ID_STAGING=<staging-site-id>
NETLIFY_SITE_ID_PRODUCTION=<production-site-id>
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

## Setup Instructions

1. **Copy the appropriate configuration files** to your project
2. **Replace placeholder values** with your actual configuration
3. **Add GitHub secrets** to your repository settings
4. **Configure Azure App Service** with the required settings
5. **Set up Netlify/Vercel** with environment variables
6. **Test the deployment** by pushing to develop branch first
7. **Deploy to production** by pushing to main branch

## Security Notes

- Never commit actual secrets to version control
- Use Azure Key Vault for production secrets
- Rotate secrets regularly
- Use different secrets for each environment
- Enable HTTPS for all environments
- Configure CORS properly for production
