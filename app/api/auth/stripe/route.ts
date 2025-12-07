import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Stripe OAuth authorization endpoint
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const clientId = process.env.STRIPE_CLIENT_ID;
		if (!clientId) {
			return NextResponse.json(
				{ error: "Stripe OAuth not configured" },
				{ status: 500 }
			);
		}

		// Generate state token for CSRF protection
		const state = `${user.whop_user_id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
		
		// Store state in cookie for verification
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		const redirectUri = `${baseUrl}/api/auth/stripe/callback`;

		// Build OAuth authorization URL
		// Using Stripe Connect OAuth for connecting user accounts
		// This allows creating payment links on behalf of connected accounts
		// For Stripe Apps (marketplace), use: https://marketplace.stripe.com/oauth/v2/authorize
		// For Stripe Connect (user accounts), use: https://connect.stripe.com/oauth/authorize
		const oauthUrl = `https://connect.stripe.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&scope=read_write`;

		const response = NextResponse.redirect(oauthUrl);
		
		// Store state in cookie for verification
		response.cookies.set("stripe_oauth_state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 600, // 10 minutes
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("[Stripe OAuth] Error:", error);
		return NextResponse.json(
			{ error: "Failed to initiate Stripe OAuth" },
			{ status: 500 }
		);
	}
}

