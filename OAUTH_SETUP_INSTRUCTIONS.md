# OAuth Setup Instructions

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Fluenti OAuth"
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`
5. Copy the Client ID (format: `123456789-abcdefg.apps.googleusercontent.com`)
6. Copy the Client Secret

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app:
   - Choose "Consumer" app type
   - Fill in app details (name: "Fluenti")
3. Add Facebook Login product:
   - Go to "Products" → Add "Facebook Login"
   - Settings → Valid OAuth Redirect URIs: `http://localhost:3000`
4. Get your App ID and App Secret from Settings → Basic

## Update .env File

Replace the placeholder values in your .env file:

```bash
# Replace these values with your actual credentials:
GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
FACEBOOK_APP_ID=your-actual-facebook-app-id
FACEBOOK_APP_SECRET=your-actual-facebook-app-secret

# Frontend variables (same as above):
REACT_APP_GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
REACT_APP_FACEBOOK_APP_ID=your-actual-facebook-app-id
```

## Test the Setup

1. Restart your development server: `npm run dev`
2. Open http://localhost:3000
3. Try clicking the Google/Facebook buttons
4. You should see the OAuth popup windows

## Troubleshooting

- Make sure localhost:3000 is in your OAuth redirect URIs
- Check browser console for any JavaScript errors
- Verify the environment variables are loaded correctly
