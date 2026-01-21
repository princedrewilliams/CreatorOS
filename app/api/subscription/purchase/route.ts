import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserSubscription } from "@/lib/user-data";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { planType } = body; // "monthly" or "annual"

		if (!planType || (planType !== "monthly" && planType !== "annual")) {
			return NextResponse.json(
				{ error: "Invalid plan type" },
				{ status: 400 }
			);
		}

		// Try to get authenticated user, fall back to demo mode
		const user = await getCurrentUser();
		const userId = user?.whop_user_id || "demo-user";

		// In production, you would:
		// 1. Create a checkout session with Whop SDK
		// 2. Process payment
		// 3. Update subscription in database
		// 4. Send confirmation email

		// For now, we'll simulate the purchase (demo mode)
		const subscription = setUserSubscription(userId, {
			userId: userId,
			isPro: true,
			planType,
			purchasedAt: new Date().toISOString(),
			expiresAt: planType === "monthly"
				? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
				: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
		});

		return NextResponse.json({
			success: true,
			subscription,
			isPro: true,
			message: "Pro activated successfully!",
		});
	} catch (error) {
		console.error("[Purchase Subscription] Error:", error);
		return NextResponse.json(
			{ error: "Failed to process purchase" },
			{ status: 500 }
		);
	}
}

