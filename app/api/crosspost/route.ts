import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { taskId, title, description, platforms } = body;

		if (!title || !platforms || platforms.length === 0) {
			return NextResponse.json(
				{ error: "Title and platforms are required" },
				{ status: 400 }
			);
		}

		const results: Record<string, { success: boolean; error?: string }> = {};

		// Post to each platform
		for (const platform of platforms) {
			try {
				if (platform === "youtube") {
					const accessToken = request.cookies.get("youtube_access_token")?.value;
					if (!accessToken) {
						results.youtube = { success: false, error: "Not authenticated" };
						continue;
					}

					// YouTube API v3 - Create a video (simplified for MVP)
					// Note: Actual video upload requires multipart/form-data with video file
					// This is a placeholder for the MVP
					const youtubeResponse = await fetch(
						"https://www.googleapis.com/youtube/v3/videos?part=snippet,status",
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${accessToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								snippet: {
									title,
									description: description || "",
									categoryId: "22", // People & Blogs
								},
								status: {
									privacyStatus: "private", // Start as private
								},
							}),
						}
					);

					if (youtubeResponse.ok) {
						results.youtube = { success: true };
					} else {
						const error = await youtubeResponse.json();
						results.youtube = { success: false, error: error.error?.message || "Unknown error" };
					}
				} else if (platform === "instagram") {
					const accessToken = request.cookies.get("instagram_access_token")?.value;
					if (!accessToken) {
						results.instagram = { success: false, error: "Not authenticated" };
						continue;
					}

					// Instagram Graph API - Create a media container
					// Note: Actual post requires image/video file upload
					// This is a placeholder for the MVP
					const instagramResponse = await fetch(
						`https://graph.instagram.com/me/media?caption=${encodeURIComponent(title + (description ? `\n\n${description}` : ""))}&access_token=${accessToken}`,
						{
							method: "POST",
						}
					);

					if (instagramResponse.ok) {
						results.instagram = { success: true };
					} else {
						const error = await instagramResponse.json();
						results.instagram = { success: false, error: error.error?.message || "Unknown error" };
					}
				} else if (platform === "tiktok") {
					const accessToken = request.cookies.get("tiktok_access_token")?.value;
					if (!accessToken) {
						results.tiktok = { success: false, error: "Not authenticated" };
						continue;
					}

					// TikTok API - Initialize video upload
					// Note: Actual video upload requires file upload
					// This is a placeholder for the MVP
					const tiktokResponse = await fetch(
						"https://open.tiktokapis.com/v2/post/publish/video/init/",
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${accessToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								post_info: {
									title,
									description: description || "",
									privacy_level: "PUBLIC_TO_EVERYONE",
								},
							}),
						}
					);

					if (tiktokResponse.ok) {
						results.tiktok = { success: true };
					} else {
						const error = await tiktokResponse.json();
						results.tiktok = { success: false, error: error.error?.message || "Unknown error" };
					}
				}
			} catch (error) {
				console.error(`Error posting to ${platform}:`, error);
				results[platform] = {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				};
			}
		}

		// Check if at least one post succeeded
		const hasSuccess = Object.values(results).some((result) => result.success);

		if (hasSuccess) {
			return NextResponse.json({
				success: true,
				results,
				message: `Successfully posted to ${Object.entries(results).filter(([_, r]) => r.success).map(([p]) => p).join(", ")}`,
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					results,
					error: "Failed to post to any platform",
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in crosspost:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to cross-post",
			},
			{ status: 500 }
		);
	}
}









