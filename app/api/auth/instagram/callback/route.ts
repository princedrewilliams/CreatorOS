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
		const storedState = request.cookies.get("instagram_oauth_state")?.value;
		if (state !== storedState) {
			return NextResponse.redirect(
				new URL("/planner?error=invalid_state", request.url)
			);
		}

		const clientId = process.env.INSTAGRAM_CLIENT_ID;
		const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/instagram/callback`;

		if (!clientId || !clientSecret) {
			return NextResponse.redirect(
				new URL("/planner?error=oauth_not_configured", request.url)
			);
		}

		// Exchange code for tokens
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
			const errorData = await tokenResponse.json();
			console.error("Token exchange error:", errorData);
			return NextResponse.redirect(
				new URL("/planner?error=token_exchange_failed", request.url)
			);
		}

		const tokens = await tokenResponse.json();

		// Get user info
		let username = "Instagram User";
		if (tokens.user_id) {
			const userResponse = await fetch(
				`https://graph.instagram.com/${tokens.user_id}?fields=username&access_token=${tokens.access_token}`
			);
			if (userResponse.ok) {
				const userInfo = await userResponse.json();
				username = userInfo.username || username;
			}
		}

		// Store tokens
		const response = NextResponse.redirect(new URL("/planner?connected=instagram", request.url));
		
		response.cookies.set("instagram_access_token", tokens.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 60, // 60 days (Instagram token lifetime)
		});

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






