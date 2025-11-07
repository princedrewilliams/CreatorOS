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
```

## Setup Instructions

1. Copy the `.env.development` file (if it exists) as a starting point
2. Add your Whop API credentials from the [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
3. Add the Replicate API token above
4. Add your YouTube OAuth client ID/secret and API key
5. Save the file as `.env.local` in the root directory

**Note:** Never commit `.env.local` to version control. It contains sensitive API keys.

