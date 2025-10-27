# CI/CD Setup Instructions

## Overview

This project uses GitHub Actions for CI/CD with the following setup:

- **Backend**: .NET 8 Web API deployed to Azure App Service
- **Frontend**: React + TypeScript deployed to Netlify (with Vercel alternative)
- **Database**: SQL Server with Entity Framework Core
- **No Docker**: Direct deployment without containerization

## Prerequisites

1. **Azure Account** with App Service access
2. **Netlify Account** (or Vercel account)
3. **GitHub Repository** with Actions enabled
4. **SQL Server Database** (Azure SQL or local)

## Setup Steps

### 1. Azure App Service Setup

#### Create App Services
1. Go to [Azure Portal](https://portal.azure.com)
2. Create new App Service for staging:
   - Name: `tourimate-api-staging`
   - Runtime: .NET 8
   - Region: Choose appropriate region
3. Create new App Service for production:
   - Name: `tourimate-api-production`
   - Runtime: .NET 8
   - Region: Same as staging

#### Configure Application Settings
For each App Service, add these settings in Configuration:

```
ConnectionStrings__DefaultConnection=<your-sql-server-connection-string>
JWT__SecretKey=<your-jwt-secret-key>
JWT__Issuer=TouriMate
JWT__Audience=TouriMate-Users
JWT__ExpirationMinutes=60
Firebase__ProjectId=<your-firebase-project-id>
Firebase__PrivateKey=<your-firebase-private-key>
Firebase__ClientEmail=<your-firebase-client-email>
Cloudinary__CloudName=<your-cloudinary-cloud-name>
Cloudinary__ApiKey=<your-cloudinary-api-key>
Cloudinary__ApiSecret=<your-cloudinary-api-secret>
SePay__ApiUrl=https://api.sepay.vn
SePay__ApiKey=<your-sepay-api-key>
SePay__ApiSecret=<your-sepay-api-secret>
SePay__WebhookSecret=<your-sepay-webhook-secret>
Email__SmtpServer=<your-smtp-server>
Email__SmtpPort=587
Email__SmtpUsername=<your-smtp-username>
Email__SmtpPassword=<your-smtp-password>
Email__FromEmail=noreply@tourimate.com
Email__FromName=TouriMate
```

#### Get Publish Profiles
1. Go to each App Service
2. Click "Get publish profile" in the Overview section
3. Download the `.PublishSettings` file
4. You'll need these for GitHub secrets

### 2. Netlify Setup

#### Create Sites
1. Go to [Netlify](https://netlify.com)
2. Create new site for staging
3. Create new site for production
4. Connect both to your GitHub repository

#### Configure Build Settings
- Build command: `npm run build:client`
- Publish directory: `dist/spa`
- Node version: 18

#### Set Environment Variables
For each site, add these environment variables:

```
VITE_API_BASE_URL=https://tourimate-api-staging.azurewebsites.net (staging)
VITE_API_BASE_URL=https://tourimate-api-production.azurewebsites.net (production)
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-firebase-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-firebase-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-sender-id>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your-cloudinary-upload-preset>
VITE_APP_NAME=TouriMate
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=staging (or production)
```

#### Get Netlify Credentials
1. Go to User Settings > Applications
2. Create new access token
3. Note the site IDs from your sites

### 3. GitHub Secrets Configuration

Go to your GitHub repository > Settings > Secrets and variables > Actions

Add these secrets:

#### Azure Secrets
```
AZURE_WEBAPP_NAME_STAGING=tourimate-api-staging
AZURE_WEBAPP_NAME_PRODUCTION=tourimate-api-production
AZURE_WEBAPP_PUBLISH_PROFILE_STAGING=<content-of-staging-publish-profile>
AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION=<content-of-production-publish-profile>
```

#### Netlify Secrets
```
NETLIFY_AUTH_TOKEN=<your-netlify-auth-token>
NETLIFY_SITE_ID_STAGING=<staging-site-id>
NETLIFY_SITE_ID_PRODUCTION=<production-site-id>
```

#### Database Secrets
```
CONNECTION_STRING_STAGING=<staging-db-connection-string>
CONNECTION_STRING_PRODUCTION=<production-db-connection-string>
```

### 4. Database Setup

#### Create Databases
1. Create SQL Server databases:
   - `TouriMateStaging`
   - `TouriMateProduction`

#### Run Migrations
The CI/CD pipeline will handle migrations, but you can run them manually:

```bash
# For staging
dotnet ef database update --project tourimate --connection "your-staging-connection-string"

# For production
dotnet ef database update --project tourimate --connection "your-production-connection-string"
```

### 5. Test the Setup

#### Test Staging Deployment
1. Push changes to `develop` branch
2. Check GitHub Actions tab for workflow execution
3. Verify staging deployments work

#### Test Production Deployment
1. Merge `develop` to `main` branch
2. Check GitHub Actions tab for workflow execution
3. Verify production deployments work

## Workflow Triggers

### Backend Workflow
- **Triggers on**: Push to `main`/`develop`, PR to `main`
- **Paths**: Changes to `tourimate/`, `entities/`, or workflow file
- **Staging**: Deploys to staging on `develop` branch
- **Production**: Deploys to production on `main` branch

### Frontend Workflow
- **Triggers on**: Push to `main`/`develop`, PR to `main`
- **Paths**: Changes to `tourimate-client/` or workflow file
- **Staging**: Deploys to staging on `develop` branch
- **Production**: Deploys to production on `main` branch

## Monitoring and Troubleshooting

### Check Deployment Status
1. Go to GitHub Actions tab
2. Check workflow runs for errors
3. Review logs for specific issues

### Common Issues
1. **Build failures**: Check dependencies and configuration
2. **Deployment failures**: Verify secrets and permissions
3. **Database issues**: Check connection strings and permissions
4. **Environment variables**: Ensure all required variables are set

### Monitoring
- Set up Application Insights for backend monitoring
- Use Netlify analytics for frontend monitoring
- Configure alerts for deployment failures

## Security Considerations

1. **Never commit secrets** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets regularly**
4. **Enable HTTPS** for all environments
5. **Configure CORS** properly for production
6. **Use Azure Key Vault** for production secrets (recommended)

## Next Steps

1. **Set up monitoring** and alerting
2. **Configure backup strategies** for databases
3. **Set up staging environment** for testing
4. **Implement blue-green deployment** for zero-downtime updates
5. **Add performance testing** to CI/CD pipeline
6. **Set up security scanning** in the pipeline
