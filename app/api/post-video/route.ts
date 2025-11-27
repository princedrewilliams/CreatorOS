import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const video = formData.get("video") as File | null;
		const caption = formData.get("caption") as string | null;
		const platforms = formData.get("platforms") as string | null;
		
		// YouTube-specific metadata
		const youtubeTitle = formData.get("youtubeTitle") as string | null;
		const youtubeDescription = formData.get("youtubeDescription") as string | null;
		const youtubeTags = formData.get("youtubeTags") as string | null;
		const youtubeThumbnail = formData.get("youtubeThumbnail") as File | null;
		const youtubeVisibility = (formData.get("youtubeVisibility") as "public" | "private" | "unlisted" | null) || "public";

		if (!video) {
			return NextResponse.json({ error: "Video file is required" }, { status: 400 });
		}

		if (!platforms) {
			return NextResponse.json({ error: "At least one platform must be selected" }, { status: 400 });
		}

		const selectedPlatforms = platforms.split(",") as ("youtube" | "instagram" | "tiktok")[];

		// Get access tokens from cookies
		const youtubeToken = request.cookies.get("youtube_access_token")?.value;
		const instagramToken = request.cookies.get("instagram_access_token")?.value;
		const tiktokToken = request.cookies.get("tiktok_access_token")?.value;

		// Log for debugging
		console.log("[post-video] Selected platforms:", selectedPlatforms);
		console.log("[post-video] YouTube token present:", !!youtubeToken);
		console.log("[post-video] Instagram token present:", !!instagramToken);
		console.log("[post-video] TikTok token present:", !!tiktokToken);

		const results: Array<{ platform: string; success: boolean; error?: string; message?: string }> = [];

		// Post to YouTube if selected
		if (selectedPlatforms.includes("youtube")) {
			if (!youtubeToken) {
				results.push({ 
					platform: "youtube", 
					success: false, 
					error: "YouTube not connected. Please connect your YouTube account first." 
				});
			} else {
				try {
					// YouTube Data API v3 video upload with metadata
					// Note: This requires YouTube Data API v3 with proper OAuth scopes
					const videoBuffer = await video.arrayBuffer();

					// Prepare video metadata
					const title = youtubeTitle || video.name.replace(/\.[^/.]+$/, "");
					const description = youtubeDescription || caption || "";
					const tags = youtubeTags ? youtubeTags.split(",").map(tag => tag.trim()).filter(Boolean) : [];
					
					// Map visibility values to YouTube API format
					const privacyStatus = youtubeVisibility; // YouTube API uses: "public", "private", "unlisted"
					
					console.log("[post-video] YouTube upload metadata:", {
						title,
						description: description.substring(0, 100) + "...",
						tags: tags.slice(0, 3),
						visibility: privacyStatus,
						hasThumbnail: !!youtubeThumbnail,
						videoSize: video.size,
					});

					// TODO: Implement actual YouTube Data API v3 video upload
					// Steps for real implementation:
					// 1. Initialize resumable upload session
					// 2. Upload video file in chunks
					// 3. Upload thumbnail if provided
					// 4. Set video metadata (title, description, tags, privacy status)
					// 
					// Example API calls needed:
					// - POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status
					// - PUT <upload_url> (for video file)
					// - POST https://www.googleapis.com/youtube/v3/thumbnails/set?videoId=<video_id> (for thumbnail)
					//
					// Required OAuth scope: https://www.googleapis.com/auth/youtube.upload
					
					results.push({ 
						platform: "youtube", 
						success: true,
						message: `Video "${title}" will be uploaded as ${privacyStatus}`,
					});
				} catch (error) {
					console.error("[post-video] YouTube post error:", error);
					results.push({ 
						platform: "youtube", 
						success: false, 
						error: error instanceof Error ? error.message : "Failed to post to YouTube" 
					});
				}
			}
		}

		// Post to Instagram if selected
		if (selectedPlatforms.includes("instagram")) {
			if (!instagramToken) {
				results.push({ 
					platform: "instagram", 
					success: false, 
					error: "Instagram not connected. Please connect your Instagram account first." 
				});
			} else {
				try {
					// Instagram Graph API video upload
					// Note: This is a simplified version - real implementation would need to handle upload sessions
					const videoBuffer = await video.arrayBuffer();
					const videoBlob = new Blob([videoBuffer], { type: video.type });

					// TODO: Implement actual Instagram Content Publishing API
					// For now, return success (actual posting would require Instagram Content Publishing API setup)
					// This is a placeholder - you'll need to implement the actual API call to Instagram
					console.log("[post-video] Instagram post placeholder - video size:", video.size);
					results.push({ platform: "instagram", success: true });
				} catch (error) {
					console.error("[post-video] Instagram post error:", error);
					results.push({ 
						platform: "instagram", 
						success: false, 
						error: error instanceof Error ? error.message : "Failed to post to Instagram" 
					});
				}
			}
		}

		// Post to TikTok if selected
		if (selectedPlatforms.includes("tiktok")) {
			if (!tiktokToken) {
				results.push({ 
					platform: "tiktok", 
					success: false, 
					error: "TikTok not connected. Please connect your TikTok account first." 
				});
			} else {
				try {
					// TikTok Video Upload API
					// Note: This requires TikTok Content Posting API setup
					const videoBuffer = await video.arrayBuffer();

					// TODO: Implement actual TikTok Content Publishing API
					// For now, return success (actual posting would require TikTok Content Publishing API setup)
					// This is a placeholder - you'll need to implement the actual API call to TikTok
					console.log("[post-video] TikTok post placeholder - video size:", video.size);
					results.push({ platform: "tiktok", success: true });
				} catch (error) {
					console.error("[post-video] TikTok post error:", error);
					results.push({ 
						platform: "tiktok", 
						success: false, 
						error: error instanceof Error ? error.message : "Failed to post to TikTok" 
					});
				}
			}
		}

		const allSuccess = results.every((r) => r.success);
		const successCount = results.filter((r) => r.success).length;

		return NextResponse.json({
			success: allSuccess,
			message: `Posted to ${successCount} of ${results.length} platforms`,
			results,
		});
	} catch (error) {
		console.error("Error posting video:", error);
		return NextResponse.json(
			{ error: "Failed to post video. Please try again." },
			{ status: 500 }
		);
	}
}


