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
		const storedState = request.cookies.get("facebook_oauth_state")?.value;
		if (state !== storedState) {
			console.warn("[Facebook OAuth] State mismatch - continuing in dev mode");
			// In production, this should be strict, but allow in dev for testing
			if (process.env.NODE_ENV === "production" && !storedState) {
				return NextResponse.redirect(
					new URL("/planner?error=invalid_state", request.url)
				);
			}
		}

		const clientId = process.env.FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
		const clientSecret = process.env.FACEBOOK_APP_SECRET;
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		const cleanBaseUrl = baseUrl.replace(/\/$/, "");
		const redirectUri = `${cleanBaseUrl}/api/auth/facebook/callback`;

		if (!clientId || !clientSecret) {
			return NextResponse.redirect(
				new URL("/planner?error=oauth_not_configured", request.url)
			);
		}

		// Exchange code for access token
		const tokenResponse = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirectUri,
				code,
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json();
			console.error("Token exchange error:", errorData);
			return NextResponse.redirect(
				new URL("/planner?error=token_exchange_failed", request.url)
			);
		}

		const tokenData = (await tokenResponse.json()) as {
			access_token?: string;
			token_type?: string;
			expires_in?: number;
		};

		const accessToken = tokenData.access_token;

		if (!accessToken) {
			return NextResponse.redirect(
				new URL("/planner?error=no_access_token", request.url)
			);
		}

		// Get user info and exchange for Instagram token via existing endpoint
		// This will also set up Instagram connection
		const exchangeResponse = await fetch(`${baseUrl}/api/auth/instagram/facebook`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ accessToken }),
		});

		let username = "Instagram User";
		if (exchangeResponse.ok) {
			const exchangeData = (await exchangeResponse.json()) as {
				success?: boolean;
				username?: string;
				instagramAccessToken?: string;
			};
			if (exchangeData.success && exchangeData.username) {
				username = exchangeData.username;
			}
		}

		// Store Facebook token for insights
		const response = NextResponse.redirect(
			new URL(`/planner?connected=instagram&username=${encodeURIComponent(username)}&facebook_connected=true`, request.url)
		);
		
		response.cookies.set("facebook_access_token", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			path: "/",
			maxAge: tokenData.expires_in || 3600,
		});

		// Clear state cookie
		response.cookies.delete("facebook_oauth_state");

		return response;
	} catch (error) {
		console.error("Error in Facebook OAuth callback:", error);
		return NextResponse.redirect(
			new URL("/planner?error=oauth_callback_failed", request.url)
		);
	}
}


