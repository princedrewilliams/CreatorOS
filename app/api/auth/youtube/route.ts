import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// YouTube OAuth 2.0 configuration
		const clientId = process.env.YOUTUBE_CLIENT_ID;
		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/youtube/callback`;
		const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube";
		const oauthEnabled =
			process.env.NEXT_PUBLIC_YOUTUBE_OAUTH_ENABLED === "true" && !!clientId;

		if (!oauthEnabled) {
			const fallback = request.headers.get("referer") || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/planner`;
			const redirectTarget = new URL(fallback);
			redirectTarget.searchParams.set("error", "youtube_oauth_disabled");
			return NextResponse.redirect(redirectTarget);
		}

		// Generate state for CSRF protection
		const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		
		// Store state in a cookie (in production, use a secure session store)
		const response = NextResponse.redirect(
			`https://accounts.google.com/o/oauth2/v2/auth?` +
			`client_id=${encodeURIComponent(clientId)}&` +
			`redirect_uri=${encodeURIComponent(redirectUri)}&` +
			`response_type=code&` +
			`scope=${encodeURIComponent(scope)}&` +
			`access_type=offline&` +
			`prompt=consent&` +
			`state=${state}`
		);
		
		response.cookies.set("youtube_oauth_state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 600, // 10 minutes
		});

		return response;
	} catch (error) {
		console.error("Error initiating YouTube OAuth:", error);
		return NextResponse.json(
			{ error: "Failed to initiate YouTube OAuth" },
			{ status: 500 }
		);
	}
}






