import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const clientId = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
		
		// Get the base URL - prefer NEXT_PUBLIC_APP_URL for production, fallback to request origin
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		const cleanBaseUrl = baseUrl.replace(/\/$/, "");
		const redirectUri = `${cleanBaseUrl}/api/auth/facebook/callback`;
		
		if (!clientId) {
			return NextResponse.redirect(
				new URL("/planner?error=facebook_oauth_disabled", request.url)
			);
		}

		// Generate state for CSRF protection
		const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		
		// Facebook OAuth URL
		const facebookOAuthUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth");
		facebookOAuthUrl.searchParams.set("client_id", clientId);
		facebookOAuthUrl.searchParams.set("redirect_uri", redirectUri);
		facebookOAuthUrl.searchParams.set("response_type", "code");
		facebookOAuthUrl.searchParams.set("scope", "pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights");
		facebookOAuthUrl.searchParams.set("state", state);
		
		const oauthUrl = facebookOAuthUrl.toString();
		
		const response = NextResponse.redirect(oauthUrl, {
			status: 302,
		});
		
		response.cookies.set("facebook_oauth_state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			path: "/",
			maxAge: 600, // 10 minutes
		});

		return response;
	} catch (error) {
		console.error("Error initiating Facebook OAuth:", error);
		return NextResponse.redirect(
			new URL("/planner?error=oauth_init_failed", request.url)
		);
	}
}

