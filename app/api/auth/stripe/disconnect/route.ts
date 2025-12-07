import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { removeUserStripeConnection } from "@/lib/user-data";

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Remove Stripe connection
		removeUserStripeConnection(user.whop_user_id);

		return NextResponse.json({
			success: true,
			message: "Stripe account disconnected",
		});
	} catch (error) {
		console.error("[Disconnect Stripe] Error:", error);
		return NextResponse.json(
			{ error: "Failed to disconnect Stripe account" },
			{ status: 500 }
		);
	}
}

