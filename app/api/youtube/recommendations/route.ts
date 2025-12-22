import { NextRequest, NextResponse } from "next/server";

interface VideoRecommendation {
	topic: string;
	reason: string;
	priority: "high" | "medium" | "low";
	watchTimeMultiplier: number;
	daysSinceLastPost: number;
	estimatedPerformance: string;
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

		// Get recent videos with analytics
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
			description: item.snippet.description,
			publishedAt: item.snippet.publishedAt,
			viewCount: Number(item.statistics.viewCount || 0),
			likeCount: Number(item.statistics.likeCount || 0),
			commentCount: Number(item.statistics.commentCount || 0),
			duration: item.contentDetails.duration,
		})) || [];

		// Get analytics for watch time analysis
		let analyticsData: any = null;
		try {
			const analyticsResponse = await fetch(
				`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}&endDate=${new Date().toISOString().split("T")[0]}&metrics=estimatedMinutesWatched,views&dimensions=video`,
				{
					headers: {
						Authorization: `Bearer ${youtubeAccessToken}`,
					},
				}
			);

			if (analyticsResponse.ok) {
				analyticsData = await analyticsResponse.json();
			}
		} catch (error) {
			console.warn("[YouTube Recommendations] Analytics API not available:", error);
		}

		// Analyze video performance by topic/keyword
		const topicPerformance: Record<string, { totalWatchTime: number; videoCount: number; avgWatchTime: number; lastPostDate: Date | null }> = {};

		videos.forEach((video: any) => {
			// Extract topics from title and description
			const text = `${video.title} ${video.description}`.toLowerCase();
			const keywords = ["ai", "tutorial", "review", "tips", "how to", "guide", "tools", "software", "productivity", "business"];
			
			keywords.forEach((keyword) => {
				if (text.includes(keyword)) {
					if (!topicPerformance[keyword]) {
						topicPerformance[keyword] = {
							totalWatchTime: 0,
							videoCount: 0,
							avgWatchTime: 0,
							lastPostDate: null,
						};
					}
					
					const videoAnalytics = analyticsData?.rows?.find((row: any[]) => row[0] === video.id);
					const watchTime = videoAnalytics ? videoAnalytics[1] : video.viewCount * 2; // Estimate 2 min per view
					
					topicPerformance[keyword].totalWatchTime += watchTime;
					topicPerformance[keyword].videoCount += 1;
					
					const publishDate = new Date(video.publishedAt);
					if (!topicPerformance[keyword].lastPostDate || publishDate > topicPerformance[keyword].lastPostDate) {
						topicPerformance[keyword].lastPostDate = publishDate;
					}
				}
			});
		});

		// Calculate average watch time per topic
		Object.keys(topicPerformance).forEach((topic) => {
			topicPerformance[topic].avgWatchTime = topicPerformance[topic].totalWatchTime / topicPerformance[topic].videoCount;
		});

		// Calculate overall average watch time
		const overallAvgWatchTime = Object.values(topicPerformance).reduce((sum, topic) => sum + topic.avgWatchTime, 0) / Object.keys(topicPerformance).length || 1;

		// Generate recommendations
		const recommendations: VideoRecommendation[] = [];

		Object.entries(topicPerformance).forEach(([topic, data]) => {
			const watchTimeMultiplier = data.avgWatchTime / overallAvgWatchTime;
			const daysSinceLastPost = data.lastPostDate 
				? Math.floor((Date.now() - data.lastPostDate.getTime()) / (24 * 60 * 60 * 1000))
				: 999;

			if (watchTimeMultiplier > 1.2 && daysSinceLastPost > 7) {
				recommendations.push({
					topic: topic.charAt(0).toUpperCase() + topic.slice(1),
					reason: `Your audience watches '${topic}' videos ${Math.round(watchTimeMultiplier * 100)}% longer than average. You haven't posted one in ${daysSinceLastPost} days.`,
					priority: watchTimeMultiplier > 1.5 ? "high" : "medium",
					watchTimeMultiplier,
					daysSinceLastPost,
					estimatedPerformance: watchTimeMultiplier > 1.5 ? "High potential" : "Good potential",
				});
			}
		});

		// Sort by priority and watch time multiplier
		recommendations.sort((a, b) => {
			if (a.priority !== b.priority) {
				return a.priority === "high" ? -1 : 1;
			}
			return b.watchTimeMultiplier - a.watchTimeMultiplier;
		});

		// Return top 3 recommendations
		return NextResponse.json({
			success: true,
			recommendations: recommendations.slice(0, 3),
		});
	} catch (error) {
		console.error("[YouTube Recommendations] Error:", error);
		return NextResponse.json(
			{ error: "Failed to generate recommendations", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

