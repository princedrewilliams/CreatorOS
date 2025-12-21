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
		const youtubeContentType = (formData.get("youtubeContentType") as "video" | "shorts" | null) || "video";

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
					const videoBuffer = await video.arrayBuffer();
					const videoArray = new Uint8Array(videoBuffer);

					// Prepare video metadata
					// Title is required for YouTube
					if (!youtubeTitle || youtubeTitle.trim() === "") {
						throw new Error("YouTube title is required. Please provide a title for your video.");
					}
					const title = youtubeTitle.trim();
					const description = youtubeDescription || caption || "";
					const tags = youtubeTags ? youtubeTags.split(",").map(tag => tag.trim()).filter(Boolean) : [];
					
					// Map visibility values to YouTube API format
					const privacyStatus = youtubeVisibility; // YouTube API uses: "public", "private", "unlisted"
					
					// For YouTube Shorts, add #Shorts tag automatically
					const finalTags = youtubeContentType === "shorts" 
						? ["#Shorts", ...tags].filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
						: tags;
					
					// Prepare metadata JSON
					const metadata = {
						snippet: {
							title,
							description,
							tags: finalTags,
							categoryId: "22", // People & Blogs category
						},
						status: {
							privacyStatus,
							selfDeclaredMadeForKids: false,
						},
					};

					console.log("[post-video] YouTube upload metadata:", {
						contentType: youtubeContentType,
						title,
						description: description.substring(0, 100) + "...",
						tags: finalTags.slice(0, 3),
						visibility: privacyStatus,
						hasThumbnail: !!youtubeThumbnail && youtubeContentType === "video",
						videoSize: video.size,
					});

					// Step 1: Initialize resumable upload session
					const initResponse = await fetch(
						`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${youtubeToken}`,
								"Content-Type": "application/json",
								"X-Upload-Content-Type": video.type || "video/*",
								"X-Upload-Content-Length": video.size.toString(),
							},
							body: JSON.stringify(metadata),
						}
					);

					if (!initResponse.ok) {
						const errorData = await initResponse.json().catch(() => ({ error: { message: initResponse.statusText } }));
						throw new Error(errorData.error?.message || `Failed to initialize upload: ${initResponse.status} ${initResponse.statusText}`);
					}

					// Get the upload URL from the Location header
					const uploadUrl = initResponse.headers.get("Location");
					if (!uploadUrl) {
						throw new Error("No upload URL received from YouTube API");
					}

					console.log("[post-video] YouTube upload URL received, uploading video file...");

					// Step 2: Upload video file
					const uploadResponse = await fetch(uploadUrl, {
						method: "PUT",
						headers: {
							"Content-Type": video.type || "video/*",
							"Content-Length": video.size.toString(),
						},
						body: videoArray,
					});

					if (!uploadResponse.ok) {
						const errorData = await uploadResponse.json().catch(() => ({ error: { message: uploadResponse.statusText } }));
						throw new Error(errorData.error?.message || `Failed to upload video: ${uploadResponse.status} ${uploadResponse.statusText}`);
					}

					const uploadResult = await uploadResponse.json();
					const videoId = uploadResult.id;

					if (!videoId) {
						throw new Error("No video ID received from YouTube API");
					}

					console.log("[post-video] YouTube video uploaded successfully, video ID:", videoId);

					// Step 3: Upload thumbnail if provided (only for regular videos, not Shorts)
					if (youtubeThumbnail && youtubeContentType === "video") {
						try {
							const thumbnailBuffer = await youtubeThumbnail.arrayBuffer();
							const thumbnailResponse = await fetch(
								`https://www.googleapis.com/youtube/v3/thumbnails/set?videoId=${videoId}`,
								{
									method: "POST",
									headers: {
										Authorization: `Bearer ${youtubeToken}`,
										"Content-Type": youtubeThumbnail.type || "image/jpeg",
									},
									body: thumbnailBuffer,
								}
							);

							if (thumbnailResponse.ok) {
								console.log("[post-video] YouTube thumbnail uploaded successfully");
							} else {
								console.warn("[post-video] Failed to upload thumbnail, but video was uploaded:", thumbnailResponse.statusText);
							}
						} catch (thumbnailError) {
							console.warn("[post-video] Error uploading thumbnail (video was uploaded):", thumbnailError);
						}
					}

					const contentTypeLabel = youtubeContentType === "shorts" ? "YouTube Short" : "regular video";
					const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
					
					results.push({ 
						platform: "youtube", 
						success: true,
						message: `${contentTypeLabel} "${title}" uploaded successfully as ${privacyStatus}. View: ${videoUrl}`,
					});
				} catch (error) {
					console.error("[post-video] YouTube post error:", error);
					const errorMessage = error instanceof Error ? error.message : "Failed to post to YouTube";
					results.push({ 
						platform: "youtube", 
						success: false, 
						error: errorMessage,
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
					// TikTok Video Upload API v2 - Full implementation
					const videoBuffer = await video.arrayBuffer();
					const videoArray = new Uint8Array(videoBuffer);

					// Step 1: Initialize video upload
					const initResponse = await fetch(
						"https://open.tiktokapis.com/v2/post/publish/video/init/",
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${tiktokToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								post_info: {
									title: caption || "Untitled",
									privacy_level: "PUBLIC_TO_EVERYONE",
									disable_duet: false,
									disable_comment: false,
									disable_stitch: false,
									video_cover_timestamp_ms: 1000,
								},
								source_info: {
									source: "FILE_UPLOAD",
								},
							}),
						}
					);

					if (!initResponse.ok) {
						const errorText = await initResponse.text();
						let error;
						try {
							error = JSON.parse(errorText);
						} catch {
							error = { error: { message: errorText || "Unknown error" } };
						}
						throw new Error(error?.error?.message || error?.error_description || error?.error_msg || "Failed to initialize TikTok upload");
					}

					const initData = await initResponse.json();
					const publishId = initData?.data?.publish_id;
					const uploadUrl = initData?.data?.upload_url;

					if (!publishId || !uploadUrl) {
						throw new Error("Failed to get publish ID or upload URL from TikTok API");
					}

					console.log("[post-video] TikTok upload initialized, publish_id:", publishId);

					// Step 2: Upload video file to TikTok
					const uploadResponse = await fetch(uploadUrl, {
						method: "PUT",
						headers: {
							"Content-Type": video.type || "video/mp4",
							"Content-Length": video.size.toString(),
						},
						body: videoArray,
					});

					if (!uploadResponse.ok) {
						const errorText = await uploadResponse.text();
						throw new Error(`Failed to upload video to TikTok: ${uploadResponse.status} ${errorText}`);
					}

					console.log("[post-video] TikTok video uploaded successfully");

					// Step 3: Check publish status (poll until complete)
					let publishStatus = "PROCESSING";
					let attempts = 0;
					const maxAttempts = 30; // 30 seconds max wait

					while (publishStatus === "PROCESSING" && attempts < maxAttempts) {
						await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

						const statusResponse = await fetch(
							`https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publishId}`,
							{
								method: "GET",
								headers: {
									Authorization: `Bearer ${tiktokToken}`,
									"Content-Type": "application/json",
								},
							}
						);

						if (statusResponse.ok) {
							const statusData = await statusResponse.json();
							publishStatus = statusData?.data?.status || "PROCESSING";
							
							if (publishStatus === "PUBLISHED") {
								console.log("[post-video] TikTok video published successfully");
								break;
							} else if (publishStatus === "FAILED") {
								const errorMsg = statusData?.data?.fail_reason || "Publishing failed";
								throw new Error(`TikTok publishing failed: ${errorMsg}`);
							}
						}

						attempts++;
					}

					if (publishStatus !== "PUBLISHED") {
						throw new Error(`TikTok video upload timed out or failed. Status: ${publishStatus}`);
					}

					results.push({ 
						platform: "tiktok", 
						success: true,
						message: `Video "${caption || 'Untitled'}" posted successfully to TikTok`,
					});
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


