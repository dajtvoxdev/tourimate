# Windows Server 2019 VPS CI/CD Configuration

## Overview

This configuration sets up CI/CD for your TouriMate project on Windows Server 2019 VPS using:
- **Backend**: .NET 8 Web API deployed to IIS
- **Frontend**: React + TypeScript deployed to IIS
- **Database**: SQL Server with Entity Framework Core
- **Deployment**: GitHub Actions with SSH to Windows VPS

## Prerequisites

### Windows Server 2019 Setup

1. **Install Required Software**:
   - .NET 8 Runtime and SDK
   - IIS with ASP.NET Core Hosting Bundle
   - SQL Server (Express or Full)
   - Git for Windows
   - PowerShell 5.1+ (included)

2. **Enable SSH Server**:
   ```powershell
   # Install OpenSSH Server
   Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
   
   # Start and enable SSH service
   Start-Service sshd
   Set-Service -Name sshd -StartupType 'Automatic'
   
   # Configure firewall
   New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
   ```

3. **Create Deployment User**:
   ```powershell
   # Create deployment user
   New-LocalUser -Name "deploy" -Description "Deployment User" -Password (ConvertTo-SecureString "YourSecurePassword" -AsPlainText -Force)
   
   # Add to IIS_IUSRS group
   Add-LocalGroupMember -Group "IIS_IUSRS" -Member "deploy"
   
   # Add to Administrators group (for deployment operations)
   Add-LocalGroupMember -Group "Administrators" -Member "deploy"
   ```

## IIS Configuration

### Backend API Configuration

1. **Create Application Pool**:
   ```powershell
   Import-Module WebAdministration
   
   # Create staging app pool
   New-WebAppPool -Name "TouriMateAPIStaging" -Force
   Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIStaging" -Name processModel.identityType -Value ApplicationPoolIdentity
   Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIStaging" -Name managedRuntimeVersion -Value ""
   
   # Create production app pool
   New-WebAppPool -Name "TouriMateAPIProduction" -Force
   Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name processModel.identityType -Value ApplicationPoolIdentity
   Set-ItemProperty -Path "IIS:\AppPools\TouriMateAPIProduction" -Name managedRuntimeVersion -Value ""
   ```

2. **Create Websites**:
   ```powershell
   # Create staging website
   New-Website -Name "TouriMate API Staging" -Port 5001 -PhysicalPath "C:\inetpub\wwwroot\tourimate-staging" -ApplicationPool "TouriMateAPIStaging"
   
   # Create production website
   New-Website -Name "TouriMate API Production" -Port 5000 -PhysicalPath "C:\inetpub\wwwroot\tourimate-production" -ApplicationPool "TouriMateAPIProduction"
   ```

3. **Configure web.config**:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <location path="." inheritInChildApplications="false">
       <system.webServer>
         <handlers>
           <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
         </handlers>
         <aspNetCore processPath="dotnet" arguments=".\tourimate.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
       </system.webServer>
     </location>
   </configuration>
   ```

### Frontend Configuration

1. **Create Websites**:
   ```powershell
   # Create staging website
   New-Website -Name "TouriMate Frontend Staging" -Port 3001 -PhysicalPath "C:\inetpub\wwwroot\tourimate-frontend-staging" -ApplicationPool "DefaultAppPool"
   
   # Create production website
   New-Website -Name "TouriMate Frontend Production" -Port 3000 -PhysicalPath "C:\inetpub\wwwroot\tourimate-frontend-production" -ApplicationPool "DefaultAppPool"
   ```

2. **Configure URL Rewrite** (for SPA routing):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="React Router" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

## Database Configuration

### SQL Server Setup

1. **Create Databases**:
   ```sql
   -- Create staging database
   CREATE DATABASE TouriMateStaging;
   
   -- Create production database
   CREATE DATABASE TouriMateProduction;
   
   -- Create deployment user
   CREATE LOGIN [deploy] WITH PASSWORD = 'YourSecurePassword';
   
   -- Grant permissions
   USE TouriMateStaging;
   CREATE USER [deploy] FOR LOGIN [deploy];
   ALTER ROLE db_owner ADD MEMBER [deploy];
   
   USE TouriMateProduction;
   CREATE USER [deploy] FOR LOGIN [deploy];
   ALTER ROLE db_owner ADD MEMBER [deploy];
   ```

2. **Connection Strings**:
   ```
   # Staging
   Server=localhost;Database=TouriMateStaging;User Id=deploy;Password=YourSecurePassword;TrustServerCertificate=true
   
   # Production
   Server=localhost;Database=TouriMateProduction;User Id=deploy;Password=YourSecurePassword;TrustServerCertificate=true
   ```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

### VPS Connection Secrets
```
VPS_HOST=your-vps-ip-address
VPS_USERNAME=deploy
VPS_SSH_KEY=<your-ssh-private-key>
VPS_PORT=22
```

### Database Secrets
```
CONNECTION_STRING_STAGING=Server=localhost;Database=TouriMateStaging;User Id=deploy;Password=YourSecurePassword;TrustServerCertificate=true
CONNECTION_STRING_PRODUCTION=Server=localhost;Database=TouriMateProduction;User Id=deploy;Password=YourSecurePassword;TrustServerCertificate=true
```

### Application Secrets
```
JWT_SECRET_KEY=<your-jwt-secret-key>
FIREBASE_PROJECT_ID=<your-firebase-project-id>
FIREBASE_PRIVATE_KEY=<your-firebase-private-key>
FIREBASE_CLIENT_EMAIL=<your-firebase-client-email>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
SEPAY_API_KEY=<your-sepay-api-key>
SEPAY_API_SECRET=<your-sepay-api-secret>
SEPAY_WEBHOOK_SECRET=<your-sepay-webhook-secret>
EMAIL_SMTP_SERVER=<your-smtp-server>
EMAIL_SMTP_USERNAME=<your-smtp-username>
EMAIL_SMTP_PASSWORD=<your-smtp-password>
```

## Deployment Process

### Backend Deployment
1. **Build**: .NET application is built and published
2. **Package**: Application is packaged into tar.gz
3. **Deploy**: Package is uploaded via SSH and extracted
4. **Configure**: IIS permissions are set
5. **Start**: Application is started via Windows Service

### Frontend Deployment
1. **Build**: React application is built
2. **Package**: Static files are packaged into tar.gz
3. **Deploy**: Package is uploaded via SSH and extracted
4. **Configure**: IIS permissions are set
5. **Start**: IIS website is started

## Security Considerations

1. **Firewall Configuration**:
   ```powershell
   # Allow HTTP/HTTPS
   New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
   New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
   
   # Allow custom ports
   New-NetFirewallRule -DisplayName "API Staging" -Direction Inbound -Protocol TCP -LocalPort 5001 -Action Allow
   New-NetFirewallRule -DisplayName "API Production" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
   New-NetFirewallRule -DisplayName "Frontend Staging" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
   New-NetFirewallRule -DisplayName "Frontend Production" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

2. **SSL Certificate**:
   - Install SSL certificate for HTTPS
   - Configure IIS to use HTTPS
   - Redirect HTTP to HTTPS

3. **User Permissions**:
   - Use least privilege principle
   - Separate deployment user from application user
   - Regular security updates

## Monitoring and Logging

1. **Application Logs**:
   - Configure logging in appsettings.json
   - Set up log file rotation
   - Monitor error logs

2. **IIS Logs**:
   - Enable IIS logging
   - Configure log file location
   - Set up log analysis

3. **Performance Monitoring**:
   - Use Windows Performance Monitor
   - Set up alerts for critical metrics
   - Monitor disk space and memory usage

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   ```powershell
   # Fix IIS permissions
   icacls "C:\inetpub\wwwroot\tourimate-staging" /grant "IIS_IUSRS:(OI)(CI)F" /T
   icacls "C:\inetpub\wwwroot\tourimate-production" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

2. **Application Pool Issues**:
   ```powershell
   # Restart application pools
   Restart-WebAppPool -Name "TouriMateAPIStaging"
   Restart-WebAppPool -Name "TouriMateAPIProduction"
   ```

3. **Database Connection Issues**:
   - Check SQL Server service status
   - Verify connection strings
   - Check firewall rules

4. **SSH Connection Issues**:
   - Verify SSH service is running
   - Check firewall rules
   - Verify SSH key permissions

## Next Steps

1. **Set up monitoring** and alerting
2. **Configure backup strategies** for databases
3. **Implement SSL certificates** for HTTPS
4. **Set up log aggregation** and analysis
5. **Configure automated backups** of application and database
6. **Set up health checks** and monitoring endpoints
