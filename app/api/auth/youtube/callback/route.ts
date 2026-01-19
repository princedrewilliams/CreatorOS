import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserSocialConnection } from "@/lib/user-data";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		// Get return URL from cookie (default to /planner)
		const returnUrl = request.cookies.get("youtube_oauth_return_url")?.value || "/planner";

		if (error) {
			const errorRedirect = new URL(returnUrl, request.url);
			errorRedirect.searchParams.set("error", error);
			return NextResponse.redirect(errorRedirect);
		}

		if (!code || !state) {
			const errorRedirect = new URL(returnUrl, request.url);
			errorRedirect.searchParams.set("error", "missing_code_or_state");
			return NextResponse.redirect(errorRedirect);
		}

		// Verify state
		const storedState = request.cookies.get("youtube_oauth_state")?.value;
		if (state !== storedState) {
			const errorRedirect = new URL(returnUrl, request.url);
			errorRedirect.searchParams.set("error", "invalid_state");
			return NextResponse.redirect(errorRedirect);
		}

		const clientId = process.env.YOUTUBE_CLIENT_ID;
		const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/youtube/callback`;
		const oauthEnabled =
			process.env.NEXT_PUBLIC_YOUTUBE_OAUTH_ENABLED === "true" && !!clientId && !!clientSecret;

		if (!oauthEnabled) {
			const errorRedirect = new URL(returnUrl, request.url);
			errorRedirect.searchParams.set("error", "youtube_oauth_disabled");
			return NextResponse.redirect(errorRedirect);
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
			const errorRedirect = new URL(returnUrl, request.url);
			errorRedirect.searchParams.set("error", "token_exchange_failed");
			return NextResponse.redirect(errorRedirect);
		}

		const tokens = await tokenResponse.json();

		// Get user info from YouTube API
		let username = "YouTube User";
		let profilePicture: string | undefined;
		let userPlatformId: string | undefined;
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
					const channel = channelData.items[0];
					userPlatformId = channel.id;
					const snippet = channel.snippet;
					username = snippet?.title || snippet?.customUrl || username;
					profilePicture = snippet?.thumbnails?.high?.url || snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url;
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
					profilePicture = userInfo.picture;
					userPlatformId = userInfo.id;
				}
			} catch (fallbackError) {
				console.warn("Failed to fetch user info:", fallbackError);
			}
		}

		// Get current user to save connection with user ID
		const user = await getCurrentUser();
		
		// Store connection in user data (persists across devices)
		if (user) {
			setUserSocialConnection(user.whop_user_id, {
				userId: user.whop_user_id,
				platform: "youtube",
				connected: true,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
				username,
				userPlatformId,
				profilePicture,
			});
		}
		
		// Store tokens in a secure cookie (in production, use a database)
		const successRedirect = new URL(returnUrl, request.url);
		successRedirect.searchParams.set("connected", "youtube");
		successRedirect.searchParams.set("username", username);
		if (profilePicture) {
			successRedirect.searchParams.set("profilePicture", profilePicture);
		}
		const response = NextResponse.redirect(successRedirect);
		
		// Also store in cookies for immediate access (will sync from user-data on next load)
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

		// Clear OAuth cookies
		response.cookies.delete("youtube_oauth_state");
		response.cookies.delete("youtube_oauth_return_url");

		return response;
	} catch (error) {
		console.error("Error in YouTube OAuth callback:", error);
		// Fallback to planner if we can't get return URL
		return NextResponse.redirect(
			new URL("/planner?error=oauth_callback_failed", request.url)
		);
	}
}






