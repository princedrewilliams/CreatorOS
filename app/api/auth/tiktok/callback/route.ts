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
		const storedState = request.cookies.get("tiktok_oauth_state")?.value;
		if (state !== storedState) {
			return NextResponse.redirect(
				new URL("/planner?error=invalid_state", request.url)
			);
		}

		const clientKey = process.env.TIKTOK_CLIENT_KEY;
		const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/tiktok/callback`;

		if (!clientKey || !clientSecret) {
			return NextResponse.redirect(
				new URL("/planner?error=oauth_not_configured", request.url)
			);
		}

		// Exchange code for tokens
		const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_key: clientKey,
				client_secret: clientSecret,
				code,
				grant_type: "authorization_code",
				redirect_uri: redirectUri,
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

		// Get user info
		let username = "TikTok User";
		if (tokens.data?.access_token) {
			const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${tokens.data.access_token}`,
				},
			});
			if (userResponse.ok) {
				const userInfo = await userResponse.json();
				username = userInfo.data?.user?.display_name || username;
			}
		}

		// Store tokens
		const response = NextResponse.redirect(new URL("/planner?connected=tiktok", request.url));
		
		if (tokens.data?.access_token) {
			response.cookies.set("tiktok_access_token", tokens.data.access_token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: tokens.data.expires_in || 3600,
			});

			if (tokens.data?.refresh_token) {
				response.cookies.set("tiktok_refresh_token", tokens.data.refresh_token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 60 * 60 * 24 * 365, // 1 year
				});
			}
		}

		// Clear state cookie
		response.cookies.delete("tiktok_oauth_state");

		return response;
	} catch (error) {
		console.error("Error in TikTok OAuth callback:", error);
		return NextResponse.redirect(
			new URL("/planner?error=oauth_callback_failed", request.url)
		);
	}
}


