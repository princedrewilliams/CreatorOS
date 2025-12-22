import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections, getUserSubscription, getUserStripeConnection, setUserSocialConnection } from "@/lib/user-data";

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
		let socialConnections = getUserSocialConnections(user.whop_user_id);
		const subscription = getUserSubscription(user.whop_user_id);
		const stripeConnection = getUserStripeConnection(user.whop_user_id);

		// Check if there are TikTok tokens in cookies that aren't associated with user yet
		const tiktokAccessToken = request.cookies.get("tiktok_access_token")?.value;
		const tiktokRefreshToken = request.cookies.get("tiktok_refresh_token")?.value;
		
		if (tiktokAccessToken) {
			const existingTiktokConnection = socialConnections.find((c) => c.platform === "tiktok");
			
			// If no TikTok connection exists, or if existing one doesn't have tokens, associate cookies with user
			if (!existingTiktokConnection || !existingTiktokConnection.accessToken) {
				console.log("[Sync] Associating TikTok tokens from cookies with user");
				
				// Try to get user info to get username
				let username = "TikTok User";
				let profilePicture: string | undefined;
				let userPlatformId: string | undefined;
				
				try {
					const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,unique_id", {
						method: "GET",
						headers: {
							Authorization: `Bearer ${tiktokAccessToken}`,
							"Content-Type": "application/json",
						},
					});
					
					if (userResponse.ok) {
						const userInfo = await userResponse.json();
						const user = userInfo.data?.user || userInfo.user || userInfo.data;
						if (user) {
							userPlatformId = user.open_id || user.union_id;
							const rawUsername = user.unique_id || user.username || user.display_name;
							if (rawUsername && rawUsername.trim() !== "") {
								username = rawUsername.trim().replace(/^@/, "");
							}
							profilePicture = user.avatar_url || user.avatar_larger;
						}
					}
				} catch (error) {
					console.warn("[Sync] Failed to fetch TikTok user info:", error);
				}
				
				// Create or update TikTok connection
				const tiktokConnection = {
					userId: user.whop_user_id,
					platform: "tiktok" as const,
					connected: true,
					accessToken: tiktokAccessToken,
					refreshToken: tiktokRefreshToken,
					expiresAt: undefined, // Will be set when we know expires_in
					username,
					userPlatformId,
					profilePicture,
				};
				
				setUserSocialConnection(user.whop_user_id, tiktokConnection);
				socialConnections = getUserSocialConnections(user.whop_user_id); // Refresh
				console.log("[Sync] TikTok connection associated with user");
			}
		}

		// Ensure all social connections have proper structure
		const formattedConnections = socialConnections.map((conn) => ({
			...conn,
			userPlatformId: conn.userPlatformId || conn.userId, // Ensure userPlatformId is set
		}));

		return NextResponse.json({
			success: true,
			socialConnections: formattedConnections,
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

