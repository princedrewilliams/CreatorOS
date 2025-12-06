import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserSubscription } from "@/lib/user-data";

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required. Please login to purchase a plan." },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { planType } = body; // "monthly" or "annual"

		if (!planType || (planType !== "monthly" && planType !== "annual")) {
			return NextResponse.json(
				{ error: "Invalid plan type" },
				{ status: 400 }
			);
		}

		// In production, you would:
		// 1. Create a checkout session with Whop SDK
		// 2. Process payment
		// 3. Update subscription in database
		// 4. Send confirmation email

		// For now, we'll simulate the purchase
		const subscription = setUserSubscription(user.whop_user_id, {
			userId: user.whop_user_id,
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
			message: "Subscription activated successfully!",
		});
	} catch (error) {
		console.error("[Purchase Subscription] Error:", error);
		return NextResponse.json(
			{ error: "Failed to process purchase" },
			{ status: 500 }
		);
	}
}

