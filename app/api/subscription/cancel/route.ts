import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSubscription, cancelUserSubscription } from "@/lib/user-data";

export async function POST(_request: NextRequest) {
	const user = await getCurrentUser();
	if (!user) {
		return NextResponse.json({ error: "Authentication required" }, { status: 401 });
	}

	const subscription = getUserSubscription(user.whop_user_id);
	if (!subscription?.isPro) {
		return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
	}

	// In production: Call Whop SDK to cancel the subscription
	const cancelled = cancelUserSubscription(user.whop_user_id);

	return NextResponse.json({
		success: true,
		subscription: cancelled,
		message: "Subscription cancelled successfully",
	});
}
