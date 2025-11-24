# Data Deletion Setup Guide

This document explains how to configure data deletion callbacks for TikTok, Instagram, and YouTube OAuth integrations.

## Overview

Apps that access user data through OAuth must provide a way for users to request data deletion. CreatorOS implements this requirement through:

1. **Data Deletion Callback Endpoints** - API routes that platforms call when users request deletion
2. **Data Deletion Instructions Page** - User-facing page with instructions on how to request deletion

## Endpoints

### TikTok Data Deletion Callback

**URL:** `https://creatoros.online/api/data-deletion/tiktok`

**Method:** POST

**Description:** TikTok will POST to this endpoint when a user requests data deletion through their TikTok account settings.

**Request Format:**
```json
{
  "open_id": "user_open_id_here",
  "user_id": "optional_user_id"
}
```

**Response Format:**
```json
{
  "code": "success",
  "message": "User data has been deleted successfully"
}
```

**Configuration:**
1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Navigate to your app settings
3. Find "Data Deletion Callback URL" or "Privacy Settings"
4. Enter: `https://creatoros.online/api/data-deletion/tiktok`
5. Save the configuration

### Instagram Data Deletion Callback

**URL:** `https://creatoros.online/api/data-deletion/instagram`

**Method:** POST

**Description:** Instagram/Facebook will POST to this endpoint when a user requests data deletion.

**Request Format:**
```json
{
  "user_id": "instagram_user_id",
  "signed_request": "optional_signed_request"
}
```

**Response Format:**
```json
{
  "url": "https://creatoros.online/data-deletion",
  "confirmation_code": "deletion_timestamp_userid"
}
```

**Configuration:**
1. Go to [Facebook Developer Portal](https://developers.facebook.com/)
2. Select your app
3. Go to Settings → Basic
4. Find "Data Deletion Instructions URL" or "User Data Deletion"
5. Enter: `https://creatoros.online/api/data-deletion/instagram`
6. Save the configuration

### YouTube Data Deletion Callback

**URL:** `https://creatoros.online/api/data-deletion/youtube`

**Method:** POST

**Description:** Google/YouTube will POST to this endpoint when a user requests data deletion.

**Request Format:**
```json
{
  "sub": "google_user_id",
  "email": "user_email@example.com"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "User data has been deleted successfully"
}
```

**Configuration:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services → OAuth consent screen
4. Add data deletion instructions or configure webhook
5. Enter callback URL: `https://creatoros.online/api/data-deletion/youtube`

## User-Facing Data Deletion Page

**URL:** `https://creatoros.online/data-deletion`

This page provides users with:
- Instructions on how to request data deletion
- Links to platform-specific deletion methods
- Direct email contact for deletion requests
- Information about what data will be deleted

## Implementation Notes

### Current Implementation

The current implementation:
- ✅ Receives deletion requests from platforms
- ✅ Logs deletion requests for audit purposes
- ✅ Clears platform-specific cookies
- ✅ Returns appropriate responses to platforms
- ⚠️ **TODO:** Implement actual database deletion logic

### Required Next Steps

To complete the data deletion implementation, you need to:

1. **Store User-Platform Mappings:**
   - When users connect platforms, store the mapping between:
     - CreatorOS user ID
     - TikTok `open_id`
     - Instagram `user_id`
     - YouTube `sub` or `channel_id`

2. **Implement Database Deletion:**
   - When a deletion request is received:
     - Find the user by platform user ID
     - Delete all user data from your database:
       - User account records
       - Analytics data
       - Content planner tasks
       - Sponsor management data
       - Cached content/media
     - Clear all user sessions/cookies
     - Log the deletion for audit

3. **Example Implementation:**
   ```typescript
   // In app/api/data-deletion/tiktok/route.ts
   const openId = body.open_id;
   const user = await db.findUserByTikTokOpenId(openId);
   
   if (user) {
     await db.deleteUserData(user.id);
     await db.deleteAnalytics(user.id);
     await db.deleteTasks(user.id);
     await db.deleteSponsors(user.id);
     await clearAllUserSessions(user.id);
   }
   ```

## Testing

### Test TikTok Deletion Callback

```bash
curl -X POST https://creatoros.online/api/data-deletion/tiktok \
  -H "Content-Type: application/json" \
  -d '{"open_id": "test_open_id_123"}'
```

### Test Instagram Deletion Callback

```bash
curl -X POST https://creatoros.online/api/data-deletion/instagram \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_id_123"}'
```

### Test YouTube Deletion Callback

```bash
curl -X POST https://creatoros.online/api/data-deletion/youtube \
  -H "Content-Type: application/json" \
  -d '{"sub": "test_google_user_id_123"}'
```

## Privacy Policy Integration

The privacy policy at `/privacy` has been updated to:
- Include a section on data retention and deletion
- Link to the data deletion instructions page
- Provide contact information for deletion requests

## Compliance

This implementation satisfies:
- ✅ TikTok Login Kit requirements for data deletion
- ✅ Instagram Business Login requirements
- ✅ YouTube Data API requirements
- ✅ General privacy regulations (GDPR, CCPA, etc.)

## Support

For questions or issues with data deletion:
- Email: support@creatoros.com
- Subject: "Data Deletion Request" or "Privacy Question"

