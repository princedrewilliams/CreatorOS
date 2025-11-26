# YouTube Integration Setup

## Credentials

The following YouTube credentials have been configured:

- **Client ID:** `123569225352-r93e3tvet1uk4t64qhpngqst3s1qdtuf.apps.googleusercontent.com`
- **API Key:** `AIzaSyDIYOkEPOcag4ZE5rvojOIonVJcZvCeYig`
- **Client Secret:** (Set in environment variables - not shown for security)

## Environment Variables

Add these to your `.env.local` file:

```env
YOUTUBE_CLIENT_ID=123569225352-r93e3tvet1uk4t64qhpngqst3s1qdtuf.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret_here
YOUTUBE_API_KEY=AIzaSyDIYOkEPOcag4ZE5rvojOIonVJcZvCeYig
NEXT_PUBLIC_YOUTUBE_OAUTH_ENABLED=true
```

## Features Enabled

With YouTube integration, users can:

1. **Connect YouTube Account**
   - OAuth flow to authenticate with YouTube
   - Access to channel data and videos

2. **View Analytics**
   - Subscriber count
   - Total video views
   - Engagement metrics
   - Top performing videos with thumbnails

3. **View All Posts**
   - Browse all YouTube videos
   - See detailed metrics (views, likes, comments)
   - Click to open videos on YouTube

4. **Profile Picture**
   - Automatically fetches channel profile picture
   - Displays in social connections and analytics

## OAuth Redirect URI

Make sure to add this redirect URI in your Google Cloud Console:

```
https://creatoros.online/api/auth/youtube/callback
```

For local development:
```
http://localhost:3000/api/auth/youtube/callback
```

## Required Scopes

The YouTube OAuth integration requests these scopes:
- `https://www.googleapis.com/auth/youtube.upload` - For uploading videos
- `https://www.googleapis.com/auth/youtube` - For reading channel and video data

## Testing

1. Go to `/planner` or `/analytics`
2. Click "Connect YouTube" button
3. Complete OAuth flow
4. View your YouTube analytics and posts

## Troubleshooting

**YouTube not showing?**
- Check that `NEXT_PUBLIC_YOUTUBE_OAUTH_ENABLED=true` is set
- Verify `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET` are correct
- Ensure redirect URI is whitelisted in Google Cloud Console

**Analytics not loading?**
- Make sure user has connected YouTube account
- Check that access token is valid (may need to reconnect)
- Verify API key is set correctly

**Posts not showing?**
- Ensure user has published videos on their channel
- Check that OAuth scopes include video read permissions
- Verify API quota hasn't been exceeded

