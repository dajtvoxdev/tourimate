# Frontend Deployment Configuration

## Netlify Deployment Configuration

### Required Environment Variables

Add these environment variables in Netlify:

#### API Configuration
```
VITE_API_BASE_URL=https://tourimate-api-production.azurewebsites.net
VITE_API_BASE_URL_STAGING=https://tourimate-api-staging.azurewebsites.net
```

#### Firebase Configuration
```
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-firebase-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-firebase-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-sender-id>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
```

#### Cloudinary Configuration
```
VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your-cloudinary-upload-preset>
```

#### Other Configuration
```
VITE_APP_NAME=TouriMate
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

### GitHub Secrets Required

Add these secrets to your GitHub repository:

#### Netlify Secrets
```
NETLIFY_AUTH_TOKEN=<your-netlify-auth-token>
NETLIFY_SITE_ID_STAGING=<staging-site-id>
NETLIFY_SITE_ID_PRODUCTION=<production-site-id>
```

#### Vercel Secrets (Alternative)
```
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

### Deployment Setup Steps

1. **Create Netlify Sites**:
   - Create two sites: staging and production
   - Connect to your GitHub repository
   - Configure build settings

2. **Configure Build Settings**:
   - Build command: `npm run build:client`
   - Publish directory: `dist/spa`
   - Node version: 18

3. **Set Environment Variables**:
   - Add all required environment variables
   - Use different API URLs for staging/production

4. **Configure GitHub Secrets**:
   - Get Netlify auth token from account settings
   - Get site IDs from Netlify dashboard
   - Add secrets to GitHub repository

### Alternative: Vercel Deployment

If you prefer Vercel over Netlify:

1. **Create Vercel Project**:
   - Import your GitHub repository
   - Configure build settings

2. **Set Environment Variables**:
   - Add all required environment variables
   - Configure for both preview and production

3. **Update GitHub Workflow**:
   - Set `if: false` to `if: true` for Vercel deployment
   - Set `if: false` to `if: true` for Netlify deployment

### Build Configuration

The frontend uses Vite with the following build configuration:

- **Client build**: Static files for SPA
- **Server build**: Express server for API routes
- **TypeScript**: Strict type checking enabled
- **Tailwind CSS**: For styling
- **React**: With React Router for navigation

### Performance Optimization

Configure these settings for optimal performance:

1. **Code Splitting**: Automatic with Vite
2. **Asset Optimization**: Images and fonts optimized
3. **Caching**: Configure appropriate cache headers
4. **CDN**: Use Netlify/Vercel CDN for static assets

### Monitoring

Set up monitoring for your frontend:

1. **Error Tracking**: Consider Sentry or similar
2. **Analytics**: Google Analytics or similar
3. **Performance**: Web Vitals monitoring
4. **Uptime**: Monitor site availability
