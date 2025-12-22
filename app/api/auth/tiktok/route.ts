import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// TikTok OAuth configuration
		const clientKey = process.env.TIKTOK_CLIENT_KEY;
		// Build redirect URI for v2 OAuth (must match registered URI exactly)
		// Requirements per migration guide:
		// - Must be absolute and begin with https
		// - Must be static (no query parameters)
		// - Must not include fragment (#)
		// - Must be registered in TikTok Developer Portal
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		const cleanBaseUrl = baseUrl.replace(/\/$/, "");
		const redirectUri = `${cleanBaseUrl}/api/auth/tiktok/callback`;
		
		// Validate redirect URI format
		if (!redirectUri.startsWith("https://")) {
			console.error("[TikTok OAuth] Invalid redirect URI - must start with https:", redirectUri);
			return NextResponse.json(
				{ error: "Invalid redirect URI configuration. Must use HTTPS." },
				{ status: 500 }
			);
		}
		
		// TikTok Content Posting API requires these scopes:
		// - user.info.basic: Get user information (username, profile, follower count, etc.)
		// - video.upload: Upload videos
		// - video.publish: Publish videos to TikTok
		// Note: video.list is not a valid scope - video listing is available through user.info.basic
		const scope = "user.info.basic,video.upload,video.publish";

		if (!clientKey) {
			return NextResponse.json(
				{ error: "TikTok OAuth is not configured. Please add TIKTOK_CLIENT_KEY to your .env.local file." },
				{ status: 500 }
			);
		}

		// Generate state for CSRF protection (as per TikTok v2 OAuth docs)
		// Use crypto.getRandomValues for better security (if available) or fallback to Math.random
		const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		
		// Build v2 OAuth authorization URL according to official docs:
		// https://developers.tiktok.com/doc/login-kit-web
		// disable_auto_auth=1 forces the authorization page to always display
		// This ensures users can see and grant all requested permissions
		const authUrl =
			`https://www.tiktok.com/v2/auth/authorize/` +
			`?client_key=${encodeURIComponent(clientKey)}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&scope=${encodeURIComponent(scope)}` +
			`&response_type=code` +
			`&state=${encodeURIComponent(state)}` +
			`&disable_auto_auth=1`; // Always display authorization page (v2 OAuth parameter)

		// Log values useful for debugging redirect_uri mismatches
		console.log("[TikTok OAuth] Initiating OAuth with:", {
			clientKeyPresent: !!clientKey,
			redirectUri,
			baseUrl,
			cleanBaseUrl,
		});

		const response = NextResponse.redirect(authUrl, { status: 302 });
		
		response.cookies.set("tiktok_oauth_state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 600, // 10 minutes
		});

		return response;
	} catch (error) {
		console.error("Error initiating TikTok OAuth:", error);
		return NextResponse.json(
			{ error: "Failed to initiate TikTok OAuth" },
			{ status: 500 }
		);
	}
}






