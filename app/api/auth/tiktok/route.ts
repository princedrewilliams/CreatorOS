import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// TikTok OAuth configuration
		const clientKey = process.env.TIKTOK_CLIENT_KEY;
		// Build redirect URI consistently (no trailing slash on base URL)
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		const cleanBaseUrl = baseUrl.replace(/\/$/, "");
		const redirectUri = `${cleanBaseUrl}/api/auth/tiktok/callback`;
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

		// Generate state for CSRF protection
		const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		
		// Add prompt=consent to force consent screen so users can choose scopes
		// This ensures users see and can grant all requested permissions
		const authUrl =
			`https://www.tiktok.com/v2/auth/authorize/` +
			`?client_key=${encodeURIComponent(clientKey)}` +
			`&redirect_uri=${encodeURIComponent(redirectUri)}` +
			`&scope=${encodeURIComponent(scope)}` +
			`&response_type=code` +
			`&state=${encodeURIComponent(state)}` +
			`&prompt=consent`; // Force consent screen

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






