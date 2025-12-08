import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { friends, friendRequests } from "./friends/route";

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const otherUserId = searchParams.get("userId");

		if (!otherUserId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		if (otherUserId === user.whop_user_id) {
			return NextResponse.json({
				success: true,
				status: "self",
			});
		}

		const userFriends = friends.get(user.whop_user_id) || new Set();
		const userRequests = friendRequests.get(user.whop_user_id) || new Set();
		const otherRequests = friendRequests.get(otherUserId) || new Set();

		let status: "friends" | "pending_outgoing" | "pending_incoming" | "not_friends" = "not_friends";

		if (userFriends.has(otherUserId)) {
			status = "friends";
		} else if (otherRequests.has(user.whop_user_id)) {
			status = "pending_outgoing";
		} else if (userRequests.has(otherUserId)) {
			status = "pending_incoming";
		}

		return NextResponse.json({
			success: true,
			status,
		});
	} catch (error) {
		console.error("[Get Friend Status] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get friend status" },
			{ status: 500 }
		);
	}
}

