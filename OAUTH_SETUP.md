# OAuth Setup Guide

This guide explains how to set up OAuth credentials for YouTube, Instagram, and TikTok to enable social media cross-posting in CreatorOS.

## Prerequisites

1. Developer accounts for each platform:
   - [Google Cloud Console](https://console.cloud.google.com/) for YouTube
   - [Meta for Developers](https://developers.facebook.com/) for Instagram
   - [TikTok for Developers](https://developers.tiktok.com/) for TikTok

2. Your app's base URL (e.g., `http://localhost:3000` for development or your production domain)

## YouTube OAuth Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the YouTube Data API v3

2. **Create OAuth 2.0 Credentials:**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/youtube/callback` (for development)
     - `https://yourdomain.com/api/auth/youtube/callback` (for production)

3. **Get Your Credentials:**
   - Copy the Client ID and Client Secret
   - Add them to your `.env.local` file:
     ```
     YOUTUBE_CLIENT_ID=your_client_id_here
     YOUTUBE_CLIENT_SECRET=your_client_secret_here
     ```

4. **Create a YouTube API Key (for data access):**
   - In "APIs & Services" > "Credentials", click "Create Credentials" > "API key"
   - Restrict the key to YouTube Data API v3 if possible
   - Add it to your `.env.local` file:
     ```
     YOUTUBE_API_KEY=your_api_key_here
     ```

## Instagram OAuth Setup

1. **Create a Meta App:**
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create a new app
   - Add "Instagram Basic Display" product

2. **Configure Instagram Basic Display:**
   - Go to "Instagram Basic Display" > "Basic Display"
   - Add OAuth Redirect URIs:
     - `http://localhost:3000/api/auth/instagram/callback` (for development)
     - `https://yourdomain.com/api/auth/instagram/callback` (for production)
   - Add your app domain

3. **Get Your Credentials:**
   - Copy the App ID and App Secret
   - Add them to your `.env.local` file:
     ```
     INSTAGRAM_CLIENT_ID=your_app_id_here
     INSTAGRAM_CLIENT_SECRET=your_app_secret_here
     ```

## TikTok OAuth Setup

1. **Create a TikTok App:**
   - Go to [TikTok for Developers](https://developers.tiktok.com/)
   - Create a new app
   - Select "Content" as the app type

2. **Configure OAuth:**
   - Go to "Basic Information" > "Platform Information"
   - Add redirect URLs:
     - `http://localhost:3000/api/auth/tiktok/callback` (for development)
     - `https://yourdomain.com/api/auth/tiktok/callback` (for production)

3. **Get Your Credentials:**
   - Copy the Client Key and Client Secret
   - Add them to your `.env.local` file:
     ```
     TIKTOK_CLIENT_KEY=your_client_key_here
     TIKTOK_CLIENT_SECRET=your_client_secret_here
     ```

Notes:
- The app constructs the redirect URI using `NEXT_PUBLIC_APP_URL` (no trailing slash), falling back to request origin.
- Default scopes: `user.info.basic,video.upload` (adjust in `app/api/auth/tiktok/route.ts`).
- Never commit real keys to git. Add them in Vercel → Settings → Environment Variables.

## Environment Variables

Add all OAuth credentials to your `.env.local` file:

```env
# YouTube OAuth
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_API_KEY=your_youtube_api_key

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret

# TikTok OAuth
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing OAuth

1. Start your development server: `pnpm dev`
2. Navigate to `/planner`
3. Click "Connect" for each platform
4. Complete the OAuth flow
5. Verify that the connection status updates

## Notes

- **Development:** Use `http://localhost:3000` as your base URL
- **Production:** Update `NEXT_PUBLIC_APP_URL` to your production domain
- **Token Storage:** Currently, tokens are stored in cookies. For production, consider using a secure database.
- **Permissions:** Ensure you request the necessary scopes for posting content to each platform.

## Troubleshooting

- **"OAuth is not configured" error:** Make sure all environment variables are set in `.env.local`
- **"Invalid redirect URI" error:** Verify that your redirect URIs match exactly in both the OAuth provider and your `.env.local`
- **"Token exchange failed" error:** Check that your client secret is correct and hasn't expired

