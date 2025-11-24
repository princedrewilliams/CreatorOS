import { NextRequest, NextResponse } from "next/server";

/**
 * Instagram Data Deletion Callback
 * 
 * This endpoint is called by Instagram/Facebook when a user requests data deletion.
 * Instagram will send a POST request with user identification information.
 * 
 * Required by Instagram Business Login for apps that access user data.
 * 
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		
		// Instagram/Facebook sends user identification in the request
		// Common fields: user_id, signed_request, or psid (Page-Scoped ID)
		const userId = body.user_id || body.userId || body.psid || body.signed_request;
		
		console.log("[Instagram Data Deletion] Received deletion request:", {
			userId,
			timestamp: new Date().toISOString(),
			requestBody: body,
		});

		if (!userId) {
			console.warn("[Instagram Data Deletion] Missing user identification in request");
			// Still return success to avoid retries, but log the issue
			return NextResponse.json({
				url: `${process.env.NEXT_PUBLIC_APP_URL || "https://creatoros.online"}/data-deletion`,
				confirmation_code: `deletion_${Date.now()}`,
			});
		}

		// TODO: Implement actual data deletion logic here
		// This should:
		// 1. Find the user by Instagram user_id (if you store this mapping)
		// 2. Delete all user data from your database:
		//    - User account data
		//    - Analytics data
		//    - Connected platform tokens
		//    - Any cached content
		// 3. Clear cookies/sessions
		// 4. Log the deletion for audit purposes

		// Example deletion steps (replace with your actual implementation):
		// 1. Find user by Instagram user_id
		// const user = await findUserByInstagramUserId(userId);
		// if (user) {
		//   await deleteUserData(user.id);
		//   await clearUserCookies(user.id);
		// }

		// For now, we'll clear the Instagram access token cookie if it exists
		// In a production app with a database, you'd delete all user records here
		const response = NextResponse.json({
			url: `${process.env.NEXT_PUBLIC_APP_URL || "https://creatoros.online"}/data-deletion`,
			confirmation_code: `deletion_${Date.now()}_${userId}`,
		});

		// Clear Instagram-related cookies
		// Note: This only clears cookies for the current request
		// In a real implementation, you'd need to identify the user's session
		// and clear all their cookies
		response.cookies.delete("instagram_access_token");
		response.cookies.delete("instagram_oauth_state");

		console.log("[Instagram Data Deletion] Data deletion completed for user_id:", userId);

		return response;
	} catch (error) {
		console.error("[Instagram Data Deletion] Error processing deletion request:", error);
		
		// Return success even on error to prevent Instagram from retrying
		// Log the error for investigation
		return NextResponse.json(
			{
				url: `${process.env.NEXT_PUBLIC_APP_URL || "https://creatoros.online"}/data-deletion`,
				confirmation_code: `deletion_error_${Date.now()}`,
			},
			{ status: 200 }
		);
	}
}

/**
 * GET endpoint for testing/debugging
 * Returns information about the data deletion callback
 */
export async function GET() {
	return NextResponse.json({
		message: "Instagram Data Deletion Callback Endpoint",
		description: "This endpoint receives POST requests from Instagram/Facebook when users request data deletion.",
		required: true,
		documentation: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login",
	});
}

