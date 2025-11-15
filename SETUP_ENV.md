# Environment Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Whop API Keys (from your Whop developer dashboard)
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
WHOP_API_KEY=your_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret

# Replicate API Token (for AI thumbnail generation)
REPLICATE_API_TOKEN=your_replicate_api_token_here

# YouTube OAuth & API access
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_API_KEY=your_youtube_api_key

# Instagram OAuth & API access
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_ACCOUNT_ID=17841471184395059
NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED=true

# App URL (REQUIRED for Instagram OAuth redirect URI)
# Set this to your production domain (e.g., https://your-app.vercel.app)
# For localhost, this can be omitted (will use request origin)
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Facebook SDK (for Instagram OAuth)
NEXT_PUBLIC_FACEBOOK_APP_ID=824615367407370

# TikTok Analytics (RapidAPI)
RAPIDAPI_TIKTOK_ANALYTICS_KEY=your_rapidapi_tiktok_key
RAPIDAPI_TIKTOK_ANALYTICS_HOST=tikapi5.p.rapidapi.com

# Video Downloader APIs (RapidAPI)
RAPIDAPI_TIKTOK_KEY=your_rapidapi_tiktok_key
RAPIDAPI_TIKTOK_HOST=tiktok-video-no-watermark2.p.rapidapi.com
RAPIDAPI_INSTAGRAM_KEY=your_rapidapi_instagram_key
RAPIDAPI_INSTAGRAM_HOST=instagram120.p.rapidapi.com
RAPIDAPI_YOUTUBE_KEY=your_rapidapi_youtube_key
RAPIDAPI_YOUTUBE_HOST=youtube-video-fast-downloader-24-7.p.rapidapi.com
```

## Setup Instructions

1. Copy the `.env.development` file (if it exists) as a starting point
2. Add your Whop API credentials from the [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
3. Add the Replicate API token above
4. Add your YouTube OAuth client ID/secret and API key
5. Save the file as `.env.local` in the root directory

**Note:** Never commit `.env.local` to version control. It contains sensitive API keys.

