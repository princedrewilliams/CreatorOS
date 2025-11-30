# Whop Dashboard Setup Guide

## Important: Configure Your Whop App Settings

To ensure the Whop dashboard works correctly at `https://creatoros.online/dashboard/[companyId]`, you **must** configure the following settings in your Whop Developer Dashboard:

### Steps:

1. **Go to your Whop Developer Dashboard**
   - Visit: https://whop.com/dashboard/developer/
   - Select your CreatorOS app

2. **Navigate to the "Hosting" section**

3. **Configure the following settings:**

   - **Base URL**: `https://creatoros.online`
     - This is your production domain
   
   - **Dashboard path**: `/dashboard/[companyId]`
     - ⚠️ **IMPORTANT**: You must type this EXACTLY as shown, including the brackets
     - The `[companyId]` is a dynamic parameter that Whop will replace with the actual company ID
   
   - **App path**: `/experiences/[experienceId]` (if using experiences)
   
   - **Discover path**: `/discover` (if using discover page)

4. **Save the settings**

5. **Verify Environment Variables in Vercel**
   Make sure these are set in your Vercel project:
   - `NEXT_PUBLIC_WHOP_APP_ID` - Your Whop App ID
   - `WHOP_API_KEY` - Your Whop API Key
   - `WHOP_WEBHOOK_SECRET` - Your Whop Webhook Secret (optional but recommended)

## How It Works

When a user accesses the Whop dashboard from within Whop:
1. Whop redirects to: `https://creatoros.online/dashboard/[companyId]`
2. The `[companyId]` is automatically replaced with the actual company ID
3. Your Next.js app handles the route at `app/dashboard/[companyId]/page.tsx`
4. The page verifies the user's authentication and displays the dashboard

## Troubleshooting

**"Not Found" Error:**
- ✅ Verify the Dashboard path is set to `/dashboard/[companyId]` (with brackets)
- ✅ Verify the Base URL is set to `https://creatoros.online`
- ✅ Check that your Vercel deployment is successful
- ✅ Verify environment variables are set in Vercel
- ✅ Make sure you're accessing the dashboard from within a Whop company where you have admin access

**Authentication Errors:**
- ✅ Ensure `WHOP_API_KEY` is set correctly in Vercel
- ✅ Ensure `NEXT_PUBLIC_WHOP_APP_ID` matches your app ID in Whop dashboard

**Access Denied:**
- ✅ You must be an admin of the company to access the dashboard
- ✅ The route checks for `access_level === "admin"` before displaying data

## Testing

After configuration:
1. Go to a Whop company where you're an admin
2. Navigate to the Tools section
3. Click on your CreatorOS app
4. The dashboard should load at `https://creatoros.online/dashboard/[companyId]`

