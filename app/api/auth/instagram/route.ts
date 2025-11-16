import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Instagram Business Login - uses Instagram's own OAuth flow
		// See: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
		const clientId = process.env.INSTAGRAM_CLIENT_ID;
		
		// Get the base URL - prefer NEXT_PUBLIC_APP_URL for production, fallback to request origin
		// The redirect URI MUST match exactly what's configured in Instagram App Dashboard
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		// Remove trailing slash if present to ensure consistency
		const cleanBaseUrl = baseUrl.replace(/\/$/, "");
		const redirectUri = `${cleanBaseUrl}/api/auth/instagram/callback`;
		
		// Validate redirect URI format
		try {
			new URL(redirectUri); // This will throw if invalid
		} catch (error) {
			console.error("[Instagram OAuth] Invalid redirect URI:", redirectUri, error);
			return NextResponse.redirect(
				new URL("/planner?error=invalid_redirect_uri", request.url)
			);
		}
		
		// Check if Instagram OAuth is enabled
		const isOAuthEnabled = process.env.NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED === "true";
		
		if (!isOAuthEnabled || !clientId) {
			// Redirect back with error instead of showing JSON error
			return NextResponse.redirect(
				new URL("/planner?error=instagram_oauth_disabled", request.url)
			);
		}

		// Validate client ID format (Instagram App IDs are numeric)
		if (!/^\d+$/.test(clientId)) {
			console.error("[Instagram OAuth] Invalid Instagram App ID format:", clientId);
			return NextResponse.redirect(
				new URL("/planner?error=invalid_app_id", request.url)
			);
		}

		// Log the OAuth request for debugging - this helps identify redirect URI mismatches
		console.log("[Instagram OAuth] Initiating OAuth with:", {
			clientId,
			redirectUri,
			baseUrl,
			cleanBaseUrl,
			requestOrigin: request.nextUrl.origin,
			hasNextPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
		});

		// Generate state for CSRF protection
		const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		
		// Use Instagram Business Login OAuth
		// Endpoint: https://www.instagram.com/oauth/authorize
		// New scope values (replacing deprecated ones):
		// - instagram_business_basic (replaces business_basic)
		// - instagram_business_content_publish (replaces business_content_publish)
		// - instagram_business_manage_messages (replaces business_manage_messages)
		// - instagram_business_manage_comments (replaces business_manage_comments)
		const instagramOAuthUrl = new URL("https://www.instagram.com/oauth/authorize");
		instagramOAuthUrl.searchParams.set("client_id", clientId);
		instagramOAuthUrl.searchParams.set("redirect_uri", redirectUri);
		instagramOAuthUrl.searchParams.set("response_type", "code");
		// Use minimal scopes to start - can add more later if needed
		instagramOAuthUrl.searchParams.set("scope", "instagram_business_basic");
		instagramOAuthUrl.searchParams.set("state", state);
		
		const oauthUrl = instagramOAuthUrl.toString();
		
		// Use a direct HTTP redirect instead of HTML page
		// This avoids "temporary redirect" messages and works better
		// For iframe contexts, the client-side code will handle opening a new window
		const response = NextResponse.redirect(oauthUrl, {
			status: 302,
		});
		
		// Use SameSite=None in production to allow the cookie to be sent back when
		// the flow originates from an embedded/iframe context (cross-site).
		response.cookies.set("instagram_oauth_state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 600, // 10 minutes
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("Error initiating Instagram OAuth:", error);
		return NextResponse.redirect(
			new URL("/planner?error=oauth_init_failed", request.url)
		);
	}
}






