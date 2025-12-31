import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserStripeConnection, setUserStripeConnection } from "@/lib/user-data";

export async function POST() {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const stripeConnection = getUserStripeConnection(user.whop_user_id);
		
		if (!stripeConnection?.connected || !stripeConnection.refreshToken) {
			return NextResponse.json(
				{ error: "No Stripe connection found" },
				{ status: 400 }
			);
		}

		// Exchange refresh token for new access token
		const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
		if (!stripeSecretKey) {
			return NextResponse.json(
				{ error: "Stripe not configured" },
				{ status: 500 }
			);
		}

		// Stripe Connect refresh token endpoint
		const tokenResponse = await fetch("https://connect.stripe.com/oauth/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_secret: stripeSecretKey,
				refresh_token: stripeConnection.refreshToken,
				grant_type: "refresh_token",
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json();
			console.error("[Stripe Refresh] Error:", errorData);
			return NextResponse.json(
				{ error: "Failed to refresh token" },
				{ status: 500 }
			);
		}

		const tokens = await tokenResponse.json();

		// Update Stripe connection with new tokens
		setUserStripeConnection(user.whop_user_id, {
			...stripeConnection,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token, // New refresh token
			expiresAt: Date.now() + 3600000, // 1 hour
		});

		return NextResponse.json({
			success: true,
			message: "Token refreshed",
		});
	} catch (error) {
		console.error("[Refresh Stripe Token] Error:", error);
		return NextResponse.json(
			{ error: "Failed to refresh token" },
			{ status: 500 }
		);
	}
}

