// Get user's owned YouTube channels

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections } from "@/lib/user-data";
import type { UserYouTubeChannel } from "@/lib/replicate/types";

export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get user's YouTube connection
		const connections = getUserSocialConnections(user.whop_user_id);
		const youtubeConnection = connections.find((c) => c.platform === "youtube" && c.connected);

		if (!youtubeConnection || !youtubeConnection.accessToken) {
			return NextResponse.json({
				connected: false,
				channels: [],
				message: "YouTube account not connected",
			});
		}

		// Fetch user's channels from YouTube API
		try {
			const response = await fetch(
				"https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
				{
					headers: {
						Authorization: `Bearer ${youtubeConnection.accessToken}`,
					},
				}
			);

			if (!response.ok) {
				// Token might be expired
				if (response.status === 401) {
					return NextResponse.json({
						connected: false,
						channels: [],
						message: "YouTube token expired. Please reconnect your account.",
						needsReauth: true,
					});
				}
				throw new Error(`YouTube API error: ${response.status}`);
			}

			const data = await response.json();

			const channels: UserYouTubeChannel[] = (data.items || []).map((item: any) => ({
				id: item.id,
				title: item.snippet?.title || "Unknown Channel",
				thumbnail:
					item.snippet?.thumbnails?.high?.url ||
					item.snippet?.thumbnails?.medium?.url ||
					item.snippet?.thumbnails?.default?.url ||
					"",
				subscriberCount: parseInt(item.statistics?.subscriberCount || "0", 10),
			}));

			return NextResponse.json({
				connected: true,
				channels,
			});
		} catch (apiError) {
			console.error("[YouTube Channels] API Error:", apiError);

			// Return cached connection info if available
			if (youtubeConnection.userPlatformId) {
				return NextResponse.json({
					connected: true,
					channels: [
						{
							id: youtubeConnection.userPlatformId,
							title: youtubeConnection.username || "Your Channel",
							thumbnail: youtubeConnection.profilePicture || "",
						},
					],
				});
			}

			return NextResponse.json({
				connected: true,
				channels: [],
				message: "Could not fetch channel details",
			});
		}
	} catch (error) {
		console.error("[YouTube Channels] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch channels" },
			{ status: 500 }
		);
	}
}
