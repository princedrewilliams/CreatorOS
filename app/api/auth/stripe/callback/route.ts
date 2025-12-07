import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserStripeConnection } from "@/lib/user-data";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		if (error) {
			return NextResponse.redirect(
				new URL(`/sponsors?error=${encodeURIComponent(error)}`, request.url)
			);
		}

		if (!code || !state) {
			return NextResponse.redirect(
				new URL("/sponsors?error=missing_code_or_state", request.url)
			);
		}

		// Verify state
		const storedState = request.cookies.get("stripe_oauth_state")?.value;
		if (state !== storedState) {
			return NextResponse.redirect(
				new URL("/sponsors?error=invalid_state", request.url)
			);
		}

		// Get current user
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.redirect(
				new URL("/sponsors?error=authentication_required", request.url)
			);
		}

		// Exchange authorization code for access token
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
		if (!stripeSecretKey) {
			return NextResponse.redirect(
				new URL("/sponsors?error=stripe_not_configured", request.url)
			);
		}

		// Stripe Connect OAuth token endpoint
		const tokenResponse = await fetch("https://connect.stripe.com/oauth/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_secret: stripeSecretKey,
				code,
				grant_type: "authorization_code",
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json();
			console.error("[Stripe OAuth] Token exchange error:", errorData);
			return NextResponse.redirect(
				new URL("/sponsors?error=token_exchange_failed", request.url)
			);
		}

		const tokens = await tokenResponse.json();

		// Store Stripe connection in user data
		// For Stripe Connect, the access_token is the connected account's access token
		// stripe_user_id is the connected account ID (acct_xxx)
		setUserStripeConnection(user.whop_user_id, {
			userId: user.whop_user_id,
			connected: true,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			stripeAccountId: tokens.stripe_user_id || tokens.stripe_publishable_key?.split("_")[1] || "",
			stripePublishableKey: tokens.stripe_publishable_key,
			livemode: tokens.livemode || false,
			expiresAt: Date.now() + 3600000, // 1 hour (though Connect tokens don't expire the same way)
			connectedAt: new Date().toISOString(),
		});

		// Clear state cookie
		const response = NextResponse.redirect(
			new URL("/sponsors?stripe_connected=true", request.url)
		);
		response.cookies.delete("stripe_oauth_state");

		return response;
	} catch (error) {
		console.error("[Stripe OAuth Callback] Error:", error);
		return NextResponse.redirect(
			new URL("/sponsors?error=oauth_callback_failed", request.url)
		);
	}
}

