import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const tiktokToken = request.cookies.get("tiktok_access_token")?.value;

		if (!tiktokToken) {
			return NextResponse.json({ error: "TikTok not connected" }, { status: 401 });
		}

		// Fetch user info from TikTok API
		const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,unique_id,follower_count,following_count,likes_count,video_count", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${tiktokToken}`,
				"Content-Type": "application/json",
			},
		});

		if (!userResponse.ok) {
			const errorText = await userResponse.text();
			console.error("[TikTok] Failed to fetch user info:", userResponse.status, errorText);
			return NextResponse.json(
				{ error: "Failed to fetch TikTok user info" },
				{ status: userResponse.status }
			);
		}

		const userInfo = await userResponse.json();
		console.log("[TikTok] User info response:", JSON.stringify(userInfo, null, 2));

		// Check for API errors
		if (userInfo?.error) {
			console.error("[TikTok] API error in user info:", userInfo.error);
			return NextResponse.json(
				{ error: userInfo.error?.message || "Failed to fetch TikTok user info" },
				{ status: 500 }
			);
		}

		// Try different possible response structures
		const user = userInfo.data?.user || userInfo.user || userInfo.data;
		let username = "TikTok User";
		let profilePicture: string | undefined;

		if (user) {
			// Prefer unique_id (handle/@username) over display_name
			// TikTok API returns unique_id as the @username handle
			const rawUsername = user.unique_id || user.username || user.display_name || user.nickname;
			if (rawUsername && rawUsername.trim() !== "") {
				username = rawUsername.trim();
				// Remove @ if present (we'll add it in the UI)
				username = username.replace(/^@/, "");
			}
			// Get profile picture
			profilePicture = user.avatar_url || user.avatar_larger || user.profile_picture_url;
		}

		// Log for debugging
		console.log("[TikTok] Extracted username:", username);

		// Also update the user data store if user is authenticated
		try {
			const { getCurrentUser } = await import("@/lib/auth");
			const { setUserSocialConnection } = await import("@/lib/user-data");
			const user = await getCurrentUser();
			
			if (user && tiktokToken) {
				const socialConnections = (await import("@/lib/user-data")).getUserSocialConnections(user.whop_user_id);
				const existingConnection = socialConnections.find((c) => c.platform === "tiktok");
				
				if (existingConnection) {
					setUserSocialConnection(user.whop_user_id, {
						...existingConnection,
						username,
						profilePicture,
					});
				}
			}
		} catch (error) {
			console.warn("[TikTok] Failed to update user data store:", error);
		}

		return NextResponse.json({ username, profilePicture });
	} catch (error) {
		console.error("[TikTok] Error fetching username:", error);
		return NextResponse.json(
			{ error: "Failed to fetch TikTok username" },
			{ status: 500 }
		);
	}
}

