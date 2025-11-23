# Instagram API Credentials

## Current Credentials

Add these to your `.env.local` file:

```env
# Instagram Business Login (Instagram OAuth - NOT Facebook Login)
# Get these from: App Dashboard > Instagram > API setup with Instagram login > Business login settings
INSTAGRAM_CLIENT_ID=875897914794793
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret
NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED=true

# App URL (REQUIRED for production - must match your production domain)
# This is used to construct the redirect_uri for OAuth
NEXT_PUBLIC_APP_URL=https://creatoros.online

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
   - `https://creatoros.online/api/auth/instagram/callback` (for production)
6. Click **Save Changes**

**Important Notes:**
- The redirect URI must be `/api/auth/instagram/callback` (NOT `/analytics` or any other path)
- Make sure there's NO trailing slash after `/callback`
- Use `https://` for production, `http://` for localhost
- The domain must match exactly (including subdomains)
- **Check server logs** - When you try to connect, the server will log the exact redirect URI being used. Compare this with what's in your Instagram App Dashboard.

**Common Issues:**
- ❌ `https://your-domain.com/api/auth/instagram/callback/` (trailing slash)
- ✅ `https://your-domain.com/api/auth/instagram/callback` (no trailing slash)
- ❌ `http://your-domain.com/api/auth/instagram/callback` (http instead of https in production)
- ✅ `https://your-domain.com/api/auth/instagram/callback` (https for production)

**Without these redirect URIs whitelisted, Instagram will reject the connection with "Invalid redirect_uri" error!**

### How to Find Your Current Redirect URI

1. Check your Vercel/server logs when you click "Connect Instagram"
2. Look for a log line: `[Instagram OAuth] Initiating OAuth with:`
3. The `redirectUri` value shown is what needs to be in your Instagram App Dashboard
4. Copy that exact value and add it to OAuth redirect URIs in the App Dashboard

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

**This is the most common error!** It means Instagram doesn't recognize your app as a valid Instagram platform app. Follow these steps **in order**:

#### Step 1: Add Instagram Product to Your Meta App

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Select your app (the one with App ID `875897914794793`)
3. Look at the left sidebar - do you see **"Instagram"** listed under Products?
4. **If Instagram is NOT listed:**
   - Click **"Add Product"** button (usually at the bottom of the left sidebar)
   - Find **"Instagram"** in the product list
   - Click **"Set up"** next to Instagram
   - This is **REQUIRED** - without this step, you'll always get "Invalid platform app"

#### Step 2: Configure Instagram Business Login

1. After adding Instagram product, go to **Instagram** in the left sidebar
2. Click on **"API setup with Instagram login"**
3. Click **"Set up Instagram business login"** button
4. Complete the setup wizard:
   - Select your Instagram Business or Creator account
   - Grant necessary permissions
   - Complete any verification steps
5. Once setup is complete, you should see **"Business login settings"** page
6. **Verify you see:**
   - **Instagram App ID** (this is your `INSTAGRAM_CLIENT_ID`)
   - **Instagram App Secret** (this is your `INSTAGRAM_CLIENT_SECRET`)
   - **OAuth redirect URIs** section

#### Step 3: Verify You're Using the Correct App ID

⚠️ **CRITICAL:** The Instagram App ID is **DIFFERENT** from the Facebook App ID!

- **Facebook App ID:** Usually shown at the top of your app dashboard
- **Instagram App ID:** Found in **Instagram** → **API setup with Instagram login** → **Business login settings**

**How to get your Instagram App ID:**
1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Click **Instagram** in left sidebar
4. Click **"API setup with Instagram login"**
5. Click **"Set up Instagram business login"** (if not already done)
6. In **"Business login settings"**, you'll see **"Instagram App ID"**
7. Copy this ID - it should be numeric (e.g., `875897914794793`)
8. Make sure this matches your `INSTAGRAM_CLIENT_ID` environment variable

#### Step 4: Check App Mode and Test Users

1. Go to **Settings** → **Basic** in your Meta App Dashboard
2. Check **"App Mode"**:
   - **Development Mode:** Only test users can use the app
   - **Live Mode:** Anyone can use the app (requires app review for some permissions)
3. If in Development Mode:
   - Go to **Roles** → **Test Users**
   - Add yourself as a test user
   - Make sure you're logged into Instagram with the account you added

#### Step 5: Verify Redirect URI is Configured

1. In **Instagram** → **API setup with Instagram login** → **Business login settings**
2. Scroll to **"OAuth redirect URIs"**
3. Make sure these are added **EXACTLY**:
   - `https://creatoros.online/api/auth/instagram/callback` (production)
   - `http://localhost:3000/api/auth/instagram/callback` (development, if needed)
4. **No trailing slashes!** Must match exactly.

#### Still Getting the Error?

**Double-check these common mistakes:**

- ❌ Using Facebook App ID instead of Instagram App ID
- ❌ Instagram product not added to the app
- ❌ Business Login not configured (setup wizard not completed)
- ❌ Wrong redirect URI in environment variables
- ❌ App in Development mode but you're not a test user
- ❌ Using an old/deprecated app that doesn't have Instagram product

**Quick verification checklist:**
- [ ] Instagram appears in Products list (left sidebar)
- [ ] Business login is set up and shows Instagram App ID
- [ ] `INSTAGRAM_CLIENT_ID` matches the Instagram App ID (not Facebook App ID)
- [ ] Redirect URI is configured in Business login settings
- [ ] You're using the correct Instagram account (Business/Creator, not Personal)

### Error: "Invalid redirect_uri"

- The redirect URI must match EXACTLY what's in your Instagram App Dashboard
- Check for trailing slashes, http vs https, and exact domain match
- See the redirect URI configuration section above

### Still Not Working?

1. Verify your environment variables are set correctly:
   
   **Bash/Linux/Mac:**
   ```bash
   echo $INSTAGRAM_CLIENT_ID
   echo $INSTAGRAM_CLIENT_SECRET
   ```
   
   **PowerShell (Windows):**
   ```powershell
   $env:INSTAGRAM_CLIENT_ID
   $env:INSTAGRAM_CLIENT_SECRET
   ```

2. Check server logs for detailed error messages

3. Try using the embed URL directly from the App Dashboard to test if the app is configured correctly

4. Test Instagram API with PowerShell:
   
   **PowerShell (Windows) - Single line:**
   ```powershell
   Invoke-RestMethod -Uri "https://graph.instagram.com/v21.0/me?fields=id,username" -Method Get -Headers @{Authorization="Bearer YOUR_ACCESS_TOKEN"}
   ```
   
   **PowerShell (Windows) - Multi-line with backticks:**
   ```powershell
   Invoke-RestMethod `
     -Uri "https://graph.instagram.com/v21.0/me?fields=id,username" `
     -Method Get `
     -Headers @{Authorization="Bearer YOUR_ACCESS_TOKEN"}
   ```
   
   ⚠️ **SECURITY WARNING:** Never commit access tokens to git! If you've exposed a token, revoke it immediately in Meta App Dashboard → Instagram → Access Tokens
   
   **Bash/Linux/Mac (for reference):**
   ```bash
   curl -X GET \
     'https://graph.instagram.com/v21.0/me?fields=id,username' \
     -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
   ```
   
   **Note:** In PowerShell, use backticks `` ` `` for line continuation, NOT backslashes `\`

## Also Add to Vercel Production Environment

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all the above variables with the same values

## What These Enable

- **INSTAGRAM_CLIENT_ID & INSTAGRAM_CLIENT_SECRET**: Enable Instagram OAuth connection flow
- **INSTAGRAM_ACCESS_TOKEN**: Powers Instagram analytics dashboard with real data
- **NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED**: Enables the Instagram Connect button

