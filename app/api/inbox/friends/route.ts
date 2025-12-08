import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userProfilePictures } from "@/app/api/collab/chat/route";

// In-memory stores (replace with database in production)
// Friend requests: Map<userId, Set<requestingUserId>>
export const friendRequests = new Map<string, Set<string>>();
// Friends: Map<userId, Set<friendUserId>>
export const friends = new Map<string, Set<string>>();

// Initialize empty sets for users
function getUserFriendRequests(userId: string): Set<string> {
	if (!friendRequests.has(userId)) {
		friendRequests.set(userId, new Set());
	}
	return friendRequests.get(userId)!;
}

function getUserFriends(userId: string): Set<string> {
	if (!friends.has(userId)) {
		friends.set(userId, new Set());
	}
	return friends.get(userId)!;
}

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
		const type = searchParams.get("type"); // "requests", "friends", or null (all)

		if (type === "requests") {
			// Get incoming friend requests
			const incomingRequests = getUserFriendRequests(user.whop_user_id);
			const requestsList = Array.from(incomingRequests);

			// Get user profiles for incoming requests
			const { userProfiles } = await import("@/app/api/user/profile/route");
			const { creatorProfiles } = await import("@/app/api/collab/creators/route");
			
			const requestsWithProfiles = requestsList.map((requestingUserId) => {
				const userProfile = userProfiles.get(requestingUserId);
				const creatorProfile = creatorProfiles.get(requestingUserId);
				const profilePicture = userProfilePictures.get(requestingUserId) || 
					userProfile?.profilePicture || 
					creatorProfile?.profilePicture || "";

				return {
					userId: requestingUserId,
					username: creatorProfile?.username || userProfile?.username || "Unknown User",
					profilePicture,
				};
			});

			return NextResponse.json({
				success: true,
				requests: requestsWithProfiles,
			});
		} else {
			// Get friends list
			const userFriends = getUserFriends(user.whop_user_id);
			const friendsList = Array.from(userFriends);

			// Get user profiles for friends
			const { userProfiles } = await import("@/app/api/user/profile/route");
			const { creatorProfiles } = await import("@/app/api/collab/creators/route");
			
			const friendsWithProfiles = friendsList.map((friendUserId) => {
				const userProfile = userProfiles.get(friendUserId);
				const creatorProfile = creatorProfiles.get(friendUserId);
				const profilePicture = userProfilePictures.get(friendUserId) || 
					userProfile?.profilePicture || 
					creatorProfile?.profilePicture || "";

				return {
					userId: friendUserId,
					username: creatorProfile?.username || userProfile?.username || "Unknown User",
					profilePicture,
				};
			});

			return NextResponse.json({
				success: true,
				friends: friendsWithProfiles,
			});
		}
	} catch (error) {
		console.error("[Get Friends] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get friends" },
			{ status: 500 }
		);
	}
}

// Send friend request
export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { action, userId } = body; // action: "send", "accept", "decline", "remove"

		if (!action || !userId) {
			return NextResponse.json(
				{ error: "Action and userId are required" },
				{ status: 400 }
			);
		}

		if (userId === user.whop_user_id) {
			return NextResponse.json(
				{ error: "Cannot perform action on yourself" },
				{ status: 400 }
			);
		}

		if (action === "send") {
			// Check if already friends
			const userFriends = getUserFriends(user.whop_user_id);
			if (userFriends.has(userId)) {
				return NextResponse.json(
					{ error: "Already friends with this user" },
					{ status: 400 }
				);
			}

			// Check if request already sent
			const targetRequests = getUserFriendRequests(userId);
			if (targetRequests.has(user.whop_user_id)) {
				return NextResponse.json(
					{ error: "Friend request already sent" },
					{ status: 400 }
				);
			}

			// Send friend request
			targetRequests.add(user.whop_user_id);

			return NextResponse.json({
				success: true,
				message: "Friend request sent",
			});
		} else if (action === "accept") {
			// Check if request exists
			const userRequests = getUserFriendRequests(user.whop_user_id);
			if (!userRequests.has(userId)) {
				return NextResponse.json(
					{ error: "Friend request not found" },
					{ status: 400 }
				);
			}

			// Remove from requests and add to friends (both ways)
			userRequests.delete(userId);
			getUserFriends(user.whop_user_id).add(userId);
			getUserFriends(userId).add(user.whop_user_id);

			return NextResponse.json({
				success: true,
				message: "Friend request accepted",
			});
		} else if (action === "decline") {
			// Remove request
			const userRequests = getUserFriendRequests(user.whop_user_id);
			userRequests.delete(userId);

			return NextResponse.json({
				success: true,
				message: "Friend request declined",
			});
		} else if (action === "remove") {
			// Remove from friends (both ways)
			getUserFriends(user.whop_user_id).delete(userId);
			getUserFriends(userId).delete(user.whop_user_id);

			return NextResponse.json({
				success: true,
				message: "Friend removed",
			});
		} else {
			return NextResponse.json(
				{ error: "Invalid action" },
				{ status: 400 }
			);
		}
	} catch (error) {
		console.error("[Friend Request] Error:", error);
		return NextResponse.json(
			{ error: "Failed to process friend request" },
			{ status: 500 }
		);
	}
}

