# Instagram API Credentials

## Current Credentials

Add these to your `.env.local` file:

```env
# Instagram Business Login (Instagram OAuth - NOT Facebook Login)
# Get these from: App Dashboard > Instagram > API setup with Instagram login > Business login settings
INSTAGRAM_CLIENT_ID=875897914794793
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret
NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED=true

# App URL (REQUIRED for production - must match your Vercel/production domain)
# This is used to construct the redirect_uri for OAuth
NEXT_PUBLIC_APP_URL=https://creator-6osornyt9-andre-williams-projects-15c75ef1.vercel.app

# Instagram Access Token (for Analytics - optional, can be obtained via OAuth)
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token

# Instagram Account ID (for Analytics - optional, specific account to fetch data for)
INSTAGRAM_ACCOUNT_ID=17841471184395059
```

## Instagram Business Login Setup

The app uses **Instagram Business Login** (Instagram's own OAuth flow), not Facebook Login. See the [official documentation](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login).

### Requirements:
1. Your Instagram account must be a **Business** or **Creator** account
2. You need an Instagram App created in the [Meta App Dashboard](https://developers.facebook.com/apps/)
3. The Instagram product must be added to your app
4. Business Login must be configured in the App Dashboard

### **CRITICAL: Configure Redirect URIs in Instagram App**

The redirect URI **MUST match exactly** what's configured in your Instagram App Dashboard. Even a small difference (trailing slash, http vs https, etc.) will cause "Invalid redirect_uri" errors.

**Steps to configure:**

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Instagram** → **API setup with Instagram login** → **Set up Instagram business login**
4. In **Business login settings**, find **OAuth redirect URIs**
5. Add these URIs **EXACTLY as shown** (copy-paste to avoid typos):
   - `http://localhost:3000/api/auth/instagram/callback` (for development)
   - `https://creator-6osornyt9-andre-williams-projects-15c75ef1.vercel.app/api/auth/instagram/callback` (for your Vercel deployment)
   - `https://your-production-domain.com/api/auth/instagram/callback` (for your final production domain)
6. Click **Save Changes**

**Important Notes:**
- The redirect URI must be `/api/auth/instagram/callback` (NOT `/analytics` or any other path)
- Make sure there's NO trailing slash after `/callback`
- Use `https://` for production, `http://` for localhost
- The domain must match exactly (including subdomains)

**Without these redirect URIs whitelisted, Instagram will reject the connection with "Invalid redirect_uri" error!**

### Get Your Instagram App ID and Secret:

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Select your app (or create a new app if you don't have one)
3. **IMPORTANT: Add Instagram Product**
   - In the left sidebar, click **"Add Product"** or go to **Products** → **Instagram**
   - Click **"Set up"** on the Instagram product
   - This is REQUIRED - without this, you'll get "Invalid platform app" errors
4. Go to **Instagram** → **API setup with Instagram login** → **Set up Instagram business login**
5. In **Business login settings**, you'll find:
   - **Instagram App ID** - This is your `INSTAGRAM_CLIENT_ID` (NOT the Facebook App ID)
   - **Instagram App Secret** - This is your `INSTAGRAM_CLIENT_SECRET`

**⚠️ CRITICAL: Make sure you're using the Instagram App ID, NOT the Facebook App ID!**

### How It Works:
1. User clicks "Connect Instagram"
2. Instagram authorization window appears (at `www.instagram.com/oauth/authorize`)
3. User grants permissions for Instagram access
4. System exchanges authorization code for short-lived token
5. System exchanges short-lived token for long-lived token (60 days)
6. Instagram account is connected and ready for analytics

### Scope Values (New - Required after January 27, 2025):

The app uses the new scope values:
- `instagram_business_basic` - Basic account access
- `instagram_business_manage_comments` - Manage comments

Old scope values (deprecated):
- `business_basic` ❌
- `business_content_publish` ❌
- `business_manage_comments` ❌
- `business_manage_messages` ❌

## Troubleshooting

### Error: "Invalid platform app"

This error means Instagram doesn't recognize your app. **Check these steps:**

1. **Instagram Product Must Be Added**
   - Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
   - Select your app
   - Check if **Instagram** appears in the left sidebar under Products
   - If not, click **"Add Product"** → **Instagram** → **Set up**

2. **Business Login Must Be Configured**
   - Go to **Instagram** → **API setup with Instagram login**
   - Click **"Set up Instagram business login"**
   - Complete the setup wizard
   - Make sure **Business login settings** shows your Instagram App ID and Secret

3. **Verify You're Using Instagram App ID**
   - The Instagram App ID is DIFFERENT from the Facebook App ID
   - Get it from: **Instagram** → **API setup with Instagram login** → **Business login settings** → **Instagram App ID**
   - It should be a numeric string (e.g., `875897914794793`)

4. **Check App Status**
   - Make sure your app is not in Development mode restrictions
   - If testing, add yourself as a test user in App Dashboard → Roles → Test Users

### Error: "Invalid redirect_uri"

- The redirect URI must match EXACTLY what's in your Instagram App Dashboard
- Check for trailing slashes, http vs https, and exact domain match
- See the redirect URI configuration section above

### Still Not Working?

1. Verify your environment variables are set correctly:
   ```bash
   echo $INSTAGRAM_CLIENT_ID
   echo $INSTAGRAM_CLIENT_SECRET
   ```

2. Check server logs for detailed error messages

3. Try using the embed URL directly from the App Dashboard to test if the app is configured correctly

## Also Add to Vercel Production Environment

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all the above variables with the same values

## What These Enable

- **INSTAGRAM_CLIENT_ID & INSTAGRAM_CLIENT_SECRET**: Enable Instagram OAuth connection flow
- **INSTAGRAM_ACCESS_TOKEN**: Powers Instagram analytics dashboard with real data
- **NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED**: Enables the Instagram Connect button

