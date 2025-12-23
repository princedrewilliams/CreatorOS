import { NextRequest, NextResponse } from "next/server";
import type { AnalyticsPlatform } from "@/lib/mockAnalytics";

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
		
		if (!platform || platform !== "youtube") {
			return NextResponse.json({ error: "Invalid platform. Only YouTube is supported." }, { status: 400 });
		}

		let posts: Post[] = [];

		// Only YouTube is supported now
		const youtubeAccessToken = request.cookies.get("youtube_access_token")?.value;
		if (youtubeAccessToken) {
			posts = await fetchYouTubePosts(youtubeAccessToken);
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

