# TikTok API Fixes

## Issues Fixed

### 1. Missing OAuth Scope
**Problem:** The OAuth scope only included `user.info.basic,video.upload` but TikTok Content Posting API requires `video.publish` scope as well.

**Fix:** Updated `app/api/auth/tiktok/route.ts` to include all required scopes:
```typescript
const scope = "user.info.basic,video.upload,video.publish";
```

### 2. Improved Error Handling
**Problem:** Error messages were not detailed enough to debug API issues.

**Fix:** Added comprehensive error logging and better error message extraction:
- Log full API responses for debugging
- Handle different error response structures
- Better error messages for users

### 3. Status Polling Improvements
**Problem:** Status polling was too aggressive and didn't handle all response structures.

**Fix:** 
- Increased polling interval to 2 seconds (videos take time to process)
- Increased max attempts to 60 seconds
- Handle different status response structures (`PUBLISHED`, `PUBLISHED_SUCCESS`, etc.)
- Better error handling for temporary server errors

### 4. Response Structure Handling
**Problem:** Code assumed a specific response structure that might vary.

**Fix:** Added fallback handling for different response structures:
```typescript
const publishId = initData?.data?.publish_id || initData?.publish_id;
const uploadUrl = initData?.data?.upload_url || initData?.upload_url;
```

## Required Configuration

### Environment Variables
Make sure these are set in your `.env.local` and Vercel:
```
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_APP_ID=your_tiktok_app_id
```

### TikTok Developer Portal Setup
1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Create/Select your app
3. Enable **Content Posting API** product
4. Add redirect URI: `https://your-domain.com/api/auth/tiktok/callback`
5. Request access to Content Posting API (may require approval)

### Required Scopes
When users authenticate, they must grant:
- `user.info.basic` - Get user information
- `video.upload` - Upload videos
- `video.publish` - Publish videos to TikTok

## Testing

1. **Re-authenticate users**: Existing users need to re-authenticate to get the new `video.publish` scope
2. **Test video upload**: Try uploading a video through the app
3. **Check logs**: Monitor Vercel function logs for detailed error messages

## Common Issues

### "Failed to initialize TikTok upload"
- Check that Content Posting API is enabled in TikTok Developer Portal
- Verify access token has `video.publish` scope
- Check that redirect URI matches exactly in TikTok Developer Portal

### "Failed to upload video to TikTok"
- Verify video file size (TikTok has limits)
- Check video format (MP4 recommended)
- Ensure upload URL is valid

### "TikTok video upload timed out"
- Videos can take time to process
- Check TikTok status in Developer Portal
- Video may still be processing - check user's TikTok account

## References

- [TikTok Content Posting API Documentation](https://developers.tiktok.com/doc/content-posting-api)
- [TikTok API v2 Introduction](https://developers.tiktok.com/doc/tiktok-api-v2-introduction/)
- [TikTok Developers Portal](https://developers.tiktok.com/)

