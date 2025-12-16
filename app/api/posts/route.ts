import { NextRequest, NextResponse } from "next/server";
import type { AnalyticsPlatform } from "@/lib/mockAnalytics";

const RAPIDAPI_TIKTOK_ANALYTICS_KEY = process.env.RAPIDAPI_TIKTOK_ANALYTICS_KEY;
const RAPIDAPI_TIKTOK_ANALYTICS_HOST = process.env.RAPIDAPI_TIKTOK_ANALYTICS_HOST || "tikapi5.p.rapidapi.com";
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

interface Post {
	title: string;
	views: number;
	engagement: number;
	publishedAt: string;
	thumbnail?: string;
	likes?: number;
	comments?: number;
	shares?: number;
	id?: string;
	url?: string;
}

async function fetchTikTokPosts(accessToken: string): Promise<Post[]> {
	try {
		const videosResponse = await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,cover_image_url,video_description,view_count,like_count,comment_count,share_count", {
			method: "GET",
			headers: { 
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!videosResponse.ok) {
			const errorText = await videosResponse.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { error: { message: errorText } };
			}
			console.warn("[posts] TikTok video.list failed", videosResponse.status, errorData);
			return [];
		}

		const videosData = await videosResponse.json();
		
		// Check for API errors in response
		if (videosData?.error) {
			console.warn("[posts] TikTok API error in response:", videosData.error);
			return [];
		}
		const items: any[] = videosData?.data?.videos || videosData?.videos || videosData?.items || [];

		return items.map((item: any) => {
			// TikTok API v2 returns fields directly on the item
			const playCount = Number(item?.view_count ?? item?.statistics?.play_count ?? item?.stats?.play_count ?? 0) || 0;
			const likeCount = Number(item?.like_count ?? item?.statistics?.digg_count ?? item?.stats?.like_count ?? 0) || 0;
			const commentCount = Number(item?.comment_count ?? item?.statistics?.comment_count ?? item?.stats?.comment_count ?? 0) || 0;
			const shareCount = Number(item?.share_count ?? item?.statistics?.share_count ?? item?.stats?.share_count ?? 0) || 0;
			const engagement = playCount > 0 ? ((likeCount + commentCount + shareCount) / playCount) * 100 : 0;

			return {
				id: item?.id || item?.video_id,
				title: item?.title || item?.video_description || item?.desc || "TikTok Video",
				views: playCount,
				engagement: Math.min(engagement, 100),
				publishedAt: item?.create_time
					? new Date(item.create_time * 1000).toISOString()
					: new Date().toISOString(),
				thumbnail: item?.cover_image_url || item?.cover || item?.dynamic_cover || item?.thumbnail,
				likes: likeCount,
				comments: commentCount,
				shares: shareCount,
			};
		});
	} catch (error) {
		console.error("[posts] TikTok posts error:", error);
		return [];
	}
}

async function fetchInstagramPosts(): Promise<Post[]> {
	if (!INSTAGRAM_ACCESS_TOKEN) {
		return [];
	}

	try {
		const targetUserId = INSTAGRAM_ACCOUNT_ID || "me";
		
		// Fetch media posts
		const mediaResponse = await fetch(
			`https://graph.instagram.com/${targetUserId}/media?fields=id,like_count,comments_count,timestamp,media_type,caption&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=100`,
			{ cache: "no-store" }
		);

		if (!mediaResponse.ok) {
			console.warn("[posts] Instagram media API error", mediaResponse.status);
			return [];
		}

		const mediaData = (await mediaResponse.json()) as { data?: Array<{
			id: string;
			like_count?: number;
			comments_count?: number;
			timestamp?: string;
			media_type?: string;
			caption?: string;
		}> };
		const mediaItems = mediaData.data || [];

		// Fetch thumbnails for all media items
		const postsWithThumbnails = await Promise.all(
			mediaItems.map(async (item) => {
				let thumbnail: string | undefined;
				try {
					const mediaDetailResponse = await fetch(
						`https://graph.instagram.com/${item.id}?fields=media_url,thumbnail_url,media_type&access_token=${INSTAGRAM_ACCESS_TOKEN}`,
						{ cache: "no-store" }
					);
					if (mediaDetailResponse.ok) {
						const mediaDetail = await mediaDetailResponse.json();
						thumbnail = mediaDetail.thumbnail_url || mediaDetail.media_url;
					}
				} catch (error) {
					console.warn(`Failed to fetch thumbnail for media ${item.id}:`, error);
				}

				const likes = item.like_count || 0;
				const comments = item.comments_count || 0;
				const views = likes + comments; // Estimate views from engagement

				const caption = item.caption || "";
				const title = caption.length > 50 ? caption.substring(0, 50) + "..." : (caption || (item.media_type === "VIDEO" ? "Video Post" : "Photo Post"));

				return {
					id: item.id,
					title,
					views,
					engagement: views > 0 ? ((likes + comments) / views) * 100 : 0,
					publishedAt: item.timestamp || new Date().toISOString(),
					likes,
					comments,
					thumbnail,
				};
			})
		);

		// Sort by views descending
		return postsWithThumbnails.sort((a: Post, b: Post) => b.views - a.views);
	} catch (error) {
		console.error("[posts] Instagram posts error:", error);
		return [];
	}
}

async function fetchYouTubePosts(accessToken: string): Promise<Post[]> {
	try {
		// Get channel ID first
		const channelResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/channels?part=id&mine=true`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);

		if (!channelResponse.ok) {
			console.warn("[posts] YouTube channel fetch failed", channelResponse.status);
			return [];
		}

		const channelData = await channelResponse.json();
		const channelId = channelData.items?.[0]?.id;

		if (!channelId) {
			return [];
		}

		// Get all videos from the channel
		let allVideos: any[] = [];
		let nextPageToken: string | undefined;

		do {
			const videosResponse = await fetch(
				`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=50&order=date${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`,
				{
					headers: { Authorization: `Bearer ${accessToken}` },
				}
			);

			if (!videosResponse.ok) {
				break;
			}

			const videosData = await videosResponse.json();
			allVideos = [...allVideos, ...(videosData.items || [])];
			nextPageToken = videosData.nextPageToken;
		} while (nextPageToken);

		// Get detailed statistics for all videos
		const videoIds = allVideos.map((item) => item.id.videoId).join(",");
		
		if (!videoIds) {
			return [];
		}

		const videoStatsResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`,
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);

		if (!videoStatsResponse.ok) {
			return [];
		}

		const videoStatsData = await videoStatsResponse.json();
		
		return (videoStatsData.items || []).map((item: any) => {
			const stats = item.statistics;
			const views = Number(stats.viewCount || 0);
			const likes = Number(stats.likeCount || 0);
			const comments = Number(stats.commentCount || 0);
			const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

			return {
				id: item.id,
				title: item.snippet?.title || "Untitled Video",
				views,
				engagement: Math.min(engagement, 100),
				publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
				thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
				likes,
				comments,
				url: `https://www.youtube.com/watch?v=${item.id}`,
			};
		}).sort((a: Post, b: Post) => b.views - a.views);
	} catch (error) {
		console.error("[posts] YouTube posts error:", error);
		return [];
	}
}

export async function GET(request: NextRequest) {
	try {
		const url = request.nextUrl;
		const platform = url.searchParams.get("platform") as AnalyticsPlatform | null;
		
		if (!platform || !["youtube", "tiktok", "instagram"].includes(platform)) {
			return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
		}

		let posts: Post[] = [];

		if (platform === "tiktok") {
			const tiktokAccessToken = request.cookies.get("tiktok_access_token")?.value;
			if (tiktokAccessToken) {
				posts = await fetchTikTokPosts(tiktokAccessToken);
			}
		} else if (platform === "instagram") {
			if (INSTAGRAM_ACCESS_TOKEN) {
				posts = await fetchInstagramPosts();
			}
		} else if (platform === "youtube") {
			const youtubeAccessToken = request.cookies.get("youtube_access_token")?.value;
			if (youtubeAccessToken) {
				posts = await fetchYouTubePosts(youtubeAccessToken);
			}
		}

		return NextResponse.json({ platform, posts, count: posts.length });
	} catch (error) {
		console.error("[posts] Error fetching posts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch posts", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

