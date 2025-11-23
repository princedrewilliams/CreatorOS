import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		if (error) {
			return NextResponse.redirect(
				new URL(`/planner?error=${encodeURIComponent(error)}`, request.url)
			);
		}

		if (!code || !state) {
			return NextResponse.redirect(
				new URL("/planner?error=missing_code_or_state", request.url)
			);
		}

		// Verify state
		const storedState = request.cookies.get("youtube_oauth_state")?.value;
		if (state !== storedState) {
			return NextResponse.redirect(
				new URL("/planner?error=invalid_state", request.url)
			);
		}

		const clientId = process.env.YOUTUBE_CLIENT_ID;
		const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/youtube/callback`;
		const oauthEnabled =
			process.env.NEXT_PUBLIC_YOUTUBE_OAUTH_ENABLED === "true" && !!clientId && !!clientSecret;

		if (!oauthEnabled) {
			return NextResponse.redirect(
				new URL("/planner?error=youtube_oauth_disabled", request.url)
			);
		}

		// Exchange code for tokens
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				code,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirectUri,
				grant_type: "authorization_code",
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json();
			console.error("Token exchange error:", errorData);
			return NextResponse.redirect(
				new URL("/planner?error=token_exchange_failed", request.url)
			);
		}

		const tokens = await tokenResponse.json();

		// Get user info from YouTube API
		let username = "YouTube User";
		try {
			// First try to get channel info from YouTube Data API v3
			const channelResponse = await fetch(
				`https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
				{
					headers: {
						Authorization: `Bearer ${tokens.access_token}`,
					},
				}
			);
			if (channelResponse.ok) {
				const channelData = await channelResponse.json();
				if (channelData.items && channelData.items.length > 0) {
					username = channelData.items[0].snippet?.title || channelData.items[0].snippet?.customUrl || username;
				}
			}
		} catch (error) {
			console.warn("Failed to fetch YouTube channel info, trying userinfo:", error);
			// Fallback to OAuth2 userinfo
			try {
				const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
					headers: {
						Authorization: `Bearer ${tokens.access_token}`,
					},
				});
				if (userResponse.ok) {
					const userInfo = await userResponse.json();
					username = userInfo.name || userInfo.email || username;
				}
			} catch (fallbackError) {
				console.warn("Failed to fetch user info:", fallbackError);
			}
		}

		// Store tokens in a secure cookie (in production, use a database)
		const response = NextResponse.redirect(
			new URL(`/planner?connected=youtube&username=${encodeURIComponent(username)}`, request.url)
		);
		
		// In production, store tokens in a database associated with the user
		// For MVP, we'll store in a cookie (not ideal for production)
		response.cookies.set("youtube_access_token", tokens.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: tokens.expires_in || 3600,
		});

		if (tokens.refresh_token) {
			response.cookies.set("youtube_refresh_token", tokens.refresh_token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 365, // 1 year
			});
		}

		// Clear state cookie
		response.cookies.delete("youtube_oauth_state");

		return response;
	} catch (error) {
		console.error("Error in YouTube OAuth callback:", error);
		return NextResponse.redirect(
			new URL("/planner?error=oauth_callback_failed", request.url)
		);
	}
}






