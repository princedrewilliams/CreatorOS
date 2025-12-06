import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserSocialConnection } from "@/lib/user-data";

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
		const storedState = request.cookies.get("instagram_oauth_state")?.value;
		if (!storedState) {
			// In some embedded or cross-site flows, the cookie may be stripped in development.
			// Be strict in production, but be lenient in development to avoid blocking testers.
			if (process.env.NODE_ENV === "production") {
				return NextResponse.redirect(
					new URL("/planner?error=invalid_state", request.url)
				);
			} else {
				console.warn("[Instagram OAuth] Missing state cookie in development; continuing for local testing.");
			}
		} else if (state !== storedState) {
			return NextResponse.redirect(
				new URL("/planner?error=invalid_state", request.url)
			);
		}

		const clientId = process.env.INSTAGRAM_CLIENT_ID;
		const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
		// Use the same base URL logic as the authorization route
		// The redirect URI MUST match exactly what was sent in the authorization request
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		const cleanBaseUrl = baseUrl.replace(/\/$/, "");
		const redirectUri = `${cleanBaseUrl}/api/auth/instagram/callback`;

		if (!clientId || !clientSecret) {
			return NextResponse.redirect(
				new URL("/planner?error=oauth_not_configured", request.url)
			);
		}

		// Exchange authorization code for short-lived Instagram access token
		// Endpoint: https://api.instagram.com/oauth/access_token
		// Response format: { "data": [{ "access_token": "...", "user_id": "...", "permissions": "..." }] }
		const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "authorization_code",
				redirect_uri: redirectUri,
				code,
			}),
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { error_message: errorText };
			}
			
			console.error("[Instagram OAuth] Token exchange error:", {
				status: tokenResponse.status,
				statusText: tokenResponse.statusText,
				error: errorData,
			});
			
			// Check for specific error types
			const errorMessage = errorData.error_message || errorData.error || "";
			if (errorMessage.includes("platform app") || errorMessage.includes("Invalid platform")) {
				return NextResponse.redirect(
					new URL("/planner?error=invalid_platform_app", request.url)
				);
			}
			
			return NextResponse.redirect(
				new URL("/planner?error=token_exchange_failed", request.url)
			);
		}

		const tokenDataRaw = await tokenResponse.json();
		// Handle both possible formats:
		// 1) { data: [ { access_token, user_id, ... } ] }
		// 2) { access_token, user_id, ... }
		const tokenData = tokenDataRaw as {
			data?: Array<{ access_token: string; user_id: string; permissions?: string }>;
			access_token?: string;
			user_id?: string;
			error_type?: string;
			code?: number;
			error_message?: string;
		};

		const tokenInfo = tokenData.data?.[0];
		const shortLivedToken = tokenInfo?.access_token || tokenData.access_token;
		const userId = tokenInfo?.user_id || tokenData.user_id;

		if (!shortLivedToken) {
			console.error("No access token in response:", tokenData);
			return NextResponse.redirect(
				new URL("/planner?error=no_access_token", request.url)
			);
		}

		// Exchange short-lived token for long-lived token (valid for 60 days)
		// Endpoint: https://graph.instagram.com/access_token
		const longLivedTokenResponse = await fetch(
			`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`,
			{ method: "GET" }
		);

		let instagramAccessToken: string | null = shortLivedToken; // Fallback to short-lived if exchange fails
		let username = "Instagram User";

		if (longLivedTokenResponse.ok) {
			const longLivedData = (await longLivedTokenResponse.json()) as {
				access_token?: string;
				token_type?: string;
				expires_in?: number;
			};
			instagramAccessToken = longLivedData.access_token || shortLivedToken;
		} else {
			console.warn("Failed to exchange for long-lived token, using short-lived token");
		}

		// Get Instagram account info using the access token
		let profilePicture: string | undefined;
		if (userId && instagramAccessToken) {
			try {
				const accountInfoResponse = await fetch(
					`https://graph.instagram.com/${userId}?fields=username,account_type,profile_picture_url&access_token=${instagramAccessToken}`
				);
				if (accountInfoResponse.ok) {
					const accountInfo = (await accountInfoResponse.json()) as {
						username?: string;
						account_type?: string;
						profile_picture_url?: string;
					};
					username = accountInfo.username || username;
					profilePicture = accountInfo.profile_picture_url;
				}
			} catch (error) {
				console.warn("Failed to fetch Instagram account info:", error);
			}
		}

		// Get current user to save connection with user ID
		const user = await getCurrentUser();
		
		// Store connection in user data (persists across devices)
		if (user && instagramAccessToken) {
			setUserSocialConnection(user.whop_user_id, {
				userId: user.whop_user_id,
				platform: "instagram",
				connected: true,
				accessToken: instagramAccessToken,
				expiresAt: Date.now() + (60 * 60 * 24 * 60 * 1000), // 60 days
				username,
				userPlatformId: userId,
				profilePicture,
			});
		}
		
		// Store tokens
		const profilePictureParam = profilePicture ? `&profilePicture=${encodeURIComponent(profilePicture)}` : "";
		const response = NextResponse.redirect(
			new URL(`/planner?connected=instagram&username=${encodeURIComponent(username)}${profilePictureParam}`, request.url)
		);
		
		if (instagramAccessToken) {
			response.cookies.set("instagram_access_token", instagramAccessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 60, // 60 days
			});
		}

		// Clear state cookie
		response.cookies.delete("instagram_oauth_state");

		return response;
	} catch (error) {
		console.error("Error in Instagram OAuth callback:", error);
		return NextResponse.redirect(
			new URL("/planner?error=oauth_callback_failed", request.url)
		);
	}
}






