# Deployment Guide

## Pre-Deployment Checklist

✅ **Build Test**: The project builds successfully (`pnpm build` passed)
✅ **Code Committed**: All changes have been committed and pushed to GitHub
✅ **TikTok API Fixes**: All TikTok API integration issues have been resolved

## Deployment Steps

### 1. Deploy to Vercel

1. Go to [Vercel](https://vercel.com/new) and sign in
2. Click "Add New Project"
3. Import your GitHub repository: `princedrewilliams/CreatorOS`
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install`

### 2. Environment Variables

Add all environment variables from your `.env.local` to Vercel:

**Required Variables:**
```
# Whop API Keys
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
WHOP_API_KEY=your_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret

# TikTok OAuth
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_APP_ID=your_tiktok_app_id

# Replicate API (for thumbnail generation)
REPLICATE_API_TOKEN=your_replicate_api_token

# AIML API (optional - for content calendar)
AIML_API_KEY=your_aiml_api_key

# AssemblyAI (optional - for transcription)
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# TikTok Analytics (RapidAPI - optional)
RAPIDAPI_TIKTOK_ANALYTICS_KEY=your_rapidapi_tiktok_key
RAPIDAPI_TIKTOK_ANALYTICS_HOST=tikapi5.p.rapidapi.com

# Instagram (optional)
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id
```

**Important**: 
- Never commit `.env.local` to Git (it's in `.gitignore`)
- Add all variables in Vercel's Environment Variables section
- Set them for Production, Preview, and Development environments

### 3. Update Whop Dashboard

After deployment, update your Whop App settings:

1. Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer/)
2. Select your app
3. Go to "Hosting" section
4. Update the **Base URL** to your Vercel domain (e.g., `https://your-app.vercel.app`)
5. Verify paths are set:
   - **App path**: `/experiences/[experienceId]`
   - **Dashboard path**: `/dashboard/[companyId]`
   - **Discover path**: `/discover`
6. Update webhook URLs if needed

### 4. Post-Deployment Verification

After deployment, verify:

- [ ] App loads at your Vercel URL
- [ ] TikTok OAuth login works
- [ ] TikTok analytics display correctly
- [ ] Social connections persist across sessions
- [ ] API routes respond correctly
- [ ] Webhooks are receiving events (check Vercel logs)

### 5. Custom Domain (Optional)

If you have a custom domain:

1. In Vercel, go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Whop Base URL to use your custom domain

## Troubleshooting

### Build Fails
- Check Vercel build logs for errors
- Verify all environment variables are set
- Ensure `package.json` has correct build script

### TikTok API Not Working
- Verify `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` are set
- Check TikTok Developer Portal for app status
- Review Vercel function logs for API errors

### Analytics Not Showing
- Ensure TikTok account is connected
- Check browser console for errors
- Verify access token is being stored correctly
- Review API route logs in Vercel

### Environment Variables Not Loading
- Verify variables are set in Vercel dashboard
- Check that variables are set for the correct environment
- Redeploy after adding new variables

## Monitoring

- **Vercel Dashboard**: Monitor deployments, logs, and performance
- **Whop Dashboard**: Check app status and webhook deliveries
- **Browser Console**: Check for client-side errors
- **Vercel Function Logs**: Check server-side API errors

## Rollback

If deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

## Next Steps

After successful deployment:
- Monitor error logs for the first 24 hours
- Test all major features
- Update documentation if needed
- Consider setting up monitoring/alerts


