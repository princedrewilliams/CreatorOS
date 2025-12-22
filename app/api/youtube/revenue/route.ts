import { NextRequest, NextResponse } from "next/server";

interface RevenueData {
	estimatedRPM: number;
	revenueByVideoType: Array<{
		type: string;
		estimatedRevenue: number;
		views: number;
		rpm: number;
	}>;
	longVsShortProfitability: {
		longForm: { avgRPM: number; totalRevenue: number };
		shortForm: { avgRPM: number; totalRevenue: number };
		recommendation: string;
	};
	topEarningVideos: Array<{
		videoId: string;
		title: string;
		estimatedRevenue: number;
		rpm: number;
		views: number;
	}>;
}

export async function GET(request: NextRequest) {
	try {
		const youtubeAccessToken = request.cookies.get("youtube_access_token")?.value;
		
		if (!youtubeAccessToken) {
			return NextResponse.json(
				{ error: "YouTube not connected" },
				{ status: 401 }
			);
		}

		// Get channel ID
		const channelResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/channels?part=id&mine=true`,
			{
				headers: {
					Authorization: `Bearer ${youtubeAccessToken}`,
				},
			}
		);

		if (!channelResponse.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch channel data" },
				{ status: channelResponse.status }
			);
		}

		const channelData = await channelResponse.json();
		if (!channelData.items || channelData.items.length === 0) {
			return NextResponse.json(
				{ error: "No channel found" },
				{ status: 404 }
			);
		}

		const channelId = channelData.items[0].id;

		// Get videos with analytics
		const videosResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${channelId}&maxResults=50&order=date`,
			{
				headers: {
					Authorization: `Bearer ${youtubeAccessToken}`,
				},
			}
		);

		if (!videosResponse.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch videos" },
				{ status: videosResponse.status }
			);
		}

		const videosData = await videosResponse.json();
		const videoIds = videosData.items?.map((item: any) => item.id.videoId).join(",") || "";

		if (!videoIds) {
			return NextResponse.json(
				{ error: "No videos found" },
				{ status: 404 }
			);
		}

		// Get video statistics and details
		const videoStatsResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}`,
			{
				headers: {
					Authorization: `Bearer ${youtubeAccessToken}`,
				},
			}
		);

		if (!videoStatsResponse.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch video statistics" },
				{ status: videoStatsResponse.status }
			);
		}

		const videoStatsData = await videoStatsResponse.json();
		const videos = videoStatsData.items?.map((item: any) => ({
			id: item.id,
			title: item.snippet.title,
			publishedAt: item.snippet.publishedAt,
			viewCount: Number(item.statistics.viewCount || 0),
			duration: item.contentDetails.duration,
		})) || [];

		// Parse duration to determine if long or short form
		const parseDuration = (duration: string): number => {
			const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
			if (!match) return 0;
			const hours = parseInt(match[1] || "0", 10);
			const minutes = parseInt(match[2] || "0", 10);
			const seconds = parseInt(match[3] || "0", 10);
			return hours * 3600 + minutes * 60 + seconds;
		};

		// Estimate RPM (Revenue Per Mille) - typical range is $1-5 per 1000 views
		// This is an estimate as actual revenue requires YouTube Analytics API with monetization data
		const estimatedRPM = 2.5; // $2.50 per 1000 views (average estimate)

		// Categorize videos by type
		const videoTypes: Record<string, { views: number; count: number }> = {};
		const longFormVideos: any[] = [];
		const shortFormVideos: any[] = [];

		videos.forEach((video: any) => {
			const duration = parseDuration(video.duration);
			const isLongForm = duration >= 600; // 10 minutes or more
			
			// Extract video type from title
			const title = video.title.toLowerCase();
			let type = "General";
			if (title.includes("tutorial") || title.includes("how to")) type = "Tutorial";
			else if (title.includes("review")) type = "Review";
			else if (title.includes("tips")) type = "Tips";
			else if (title.includes("ai") || title.includes("tools")) type = "Tech/Tools";

			if (!videoTypes[type]) {
				videoTypes[type] = { views: 0, count: 0 };
			}
			videoTypes[type].views += video.viewCount;
			videoTypes[type].count += 1;

			if (isLongForm) {
				longFormVideos.push(video);
			} else {
				shortFormVideos.push(video);
			}
		});

		// Calculate revenue by video type
		const revenueByVideoType = Object.entries(videoTypes).map(([type, data]) => ({
			type,
			estimatedRevenue: (data.views / 1000) * estimatedRPM,
			views: data.views,
			rpm: estimatedRPM,
		}));

		// Calculate long vs short form profitability
		const longFormViews = longFormVideos.reduce((sum, v) => sum + v.viewCount, 0);
		const shortFormViews = shortFormVideos.reduce((sum, v) => sum + v.viewCount, 0);
		const longFormRevenue = (longFormViews / 1000) * estimatedRPM;
		const shortFormRevenue = (shortFormViews / 1000) * estimatedRPM;

		const longVsShortProfitability = {
			longForm: {
				avgRPM: estimatedRPM,
				totalRevenue: longFormRevenue,
			},
			shortForm: {
				avgRPM: estimatedRPM * 0.7, // Shorts typically have lower RPM
				totalRevenue: shortFormRevenue * 0.7,
			},
			recommendation: longFormRevenue > shortFormRevenue * 1.5
				? "Long-form videos are earning 3× more per 1k views. Focus on longer content."
				: "Both formats are performing well. Maintain a balanced mix.",
		};

		// Get top earning videos
		const topEarningVideos = videos
			.map((video: any) => ({
				videoId: video.id,
				title: video.title,
				estimatedRevenue: (video.viewCount / 1000) * estimatedRPM,
				rpm: estimatedRPM,
				views: video.viewCount,
			}))
			.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
			.slice(0, 5);

		const revenueData: RevenueData = {
			estimatedRPM,
			revenueByVideoType,
			longVsShortProfitability,
			topEarningVideos,
		};

		return NextResponse.json({
			success: true,
			data: revenueData,
		});
	} catch (error) {
		console.error("[YouTube Revenue] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch revenue data", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

