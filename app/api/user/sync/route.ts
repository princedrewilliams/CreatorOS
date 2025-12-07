import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections, getUserSubscription, getUserStripeConnection } from "@/lib/user-data";

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get user's social connections, subscription, and Stripe connection
		const socialConnections = getUserSocialConnections(user.whop_user_id);
		const subscription = getUserSubscription(user.whop_user_id);
		const stripeConnection = getUserStripeConnection(user.whop_user_id);

		return NextResponse.json({
			success: true,
			socialConnections,
			subscription,
			stripeConnection: stripeConnection?.connected ? {
				connected: true,
				stripeAccountId: stripeConnection.stripeAccountId,
				livemode: stripeConnection.livemode,
			} : { connected: false },
		});
	} catch (error) {
		console.error("[Sync User Data] Error:", error);
		return NextResponse.json(
			{ error: "Failed to sync user data" },
			{ status: 500 }
		);
	}
}

