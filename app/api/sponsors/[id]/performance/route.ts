import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections } from "@/lib/user-data";

interface VideoPerformance {
	videoId: string;
	title: string;
	views: number;
	watchTime: number;
	ctr: number;
	avgViewDuration: number;
	likes: number;
	comments: number;
	engagement: number;
	thumbnail?: string;
}

export async function GET(
	request: NextRequest
) {
	return handleRequest(request);
}

export async function POST(
	request: NextRequest
) {
	return handleRequest(request);
}

async function handleRequest(
	request: NextRequest
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get YouTube access token
		const youtubeAccessToken = request.cookies.get("youtube_access_token")?.value;
		const socialConnections = getUserSocialConnections(user.whop_user_id);
		const youtubeConnection = socialConnections.find(
			(conn) => conn.platform === "youtube" && conn.connected
		);
		
		const accessToken = youtubeAccessToken || youtubeConnection?.accessToken;
		if (!accessToken) {
			return NextResponse.json(
				{ error: "YouTube not connected" },
				{ status: 400 }
			);
		}

		// Get video IDs from request body or query params
		let videoIds: string[] = [];
		
		// Try to get from request body first (POST)
		if (request.method === "POST") {
			try {
				const requestBody = await request.json();
				if (requestBody.videoIds && Array.isArray(requestBody.videoIds)) {
					videoIds = requestBody.videoIds;
				}
			} catch (error) {
				console.error("[Sponsor Performance] Error parsing request body:", error);
			}
		}
		
		// Fallback to query params
		if (videoIds.length === 0) {
			const videoIdsParam = request.nextUrl.searchParams.get("videoIds");
			if (videoIdsParam) {
				videoIds = videoIdsParam.split(",").filter((id) => id.trim().length > 0);
			}
		}
		
		if (videoIds.length === 0) {
			return NextResponse.json(
				{ error: "Video IDs required. Pass videoIds in query params or request body." },
				{ status: 400 }
			);
		}

		// Get channel ID first
		const channelResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/channels?part=id&mine=true`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!channelResponse.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch channel" },
				{ status: 500 }
			);
		}

		const channelData = await channelResponse.json();
		const channelId = channelData.items?.[0]?.id;
		if (!channelId) {
			return NextResponse.json(
				{ error: "Channel not found" },
				{ status: 404 }
			);
		}

		// Fetch video details
		const videosResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(",")}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!videosResponse.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch videos" },
				{ status: 500 }
			);
		}

		const videosData = await videosResponse.json();
		const videos = videosData.items || [];

		// Fetch analytics for these videos
		const endDate = new Date().toISOString().split("T")[0];
		const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

		const analyticsResponse = await fetch(
			`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched,impressions,impressionsClickThroughRate,averageViewDuration&dimensions=video`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : null;
		const analyticsByVideo: Record<string, any> = {};

		if (analyticsData?.rows) {
			for (const row of analyticsData.rows) {
				const videoId = row[0];
				analyticsByVideo[videoId] = {
					views: row[1] || 0,
					watchTime: row[2] || 0,
					impressions: row[3] || 0,
					ctr: row[4] || 0,
					avgViewDuration: row[5] || 0,
				};
			}
		}

		// Combine video data with analytics
		const videoPerformances: VideoPerformance[] = videos.map((video: any) => {
			const videoId = video.id;
			const analytics = analyticsByVideo[videoId] || {};
			const stats = video.statistics || {};
			const views = analytics.views || parseInt(stats.viewCount || "0", 10);
			const watchTime = analytics.watchTime || 0;
			const ctr = analytics.ctr || 0;
			const avgViewDuration = analytics.avgViewDuration || 0;
			const likes = parseInt(stats.likeCount || "0", 10);
			const comments = parseInt(stats.commentCount || "0", 10);
			const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

			return {
				videoId,
				title: video.snippet?.title || "Untitled",
				views,
				watchTime: Math.round(watchTime),
				ctr: ctr * 100, // Convert to percentage
				avgViewDuration: Math.round(avgViewDuration),
				likes,
				comments,
				engagement,
				thumbnail: video.snippet?.thumbnails?.medium?.url,
			};
		});

		// Calculate totals
		const totalViews = videoPerformances.reduce((sum, v) => sum + v.views, 0);
		const totalWatchTime = videoPerformances.reduce((sum, v) => sum + v.watchTime, 0);
		const averageCTR = videoPerformances.length > 0
			? videoPerformances.reduce((sum, v) => sum + v.ctr, 0) / videoPerformances.length
			: 0;
		const totalEngagement = videoPerformances.length > 0
			? videoPerformances.reduce((sum, v) => sum + v.engagement, 0) / videoPerformances.length
			: 0;

		return NextResponse.json({
			totalViews,
			totalWatchTime,
			averageCTR,
			totalEngagement,
			costPerView: 0, // Will be calculated on frontend with deal value
			costPerMinute: 0, // Will be calculated on frontend with deal value
			videos: videoPerformances,
		});
	} catch (error) {
		console.error("[Sponsor Performance] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch sponsor performance" },
			{ status: 500 }
		);
	}
}
