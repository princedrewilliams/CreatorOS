import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy initialization - only create client when needed
function getOpenAIClient() {
	if (!process.env.OPENAI_API_KEY) {
		return null;
	}
	return new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});
}

interface YouTubeVideo {
	id: string;
	title: string;
	publishedAt: string;
	viewCount: number;
	likeCount: number;
	commentCount: number;
	impressions?: number;
	ctr?: number;
	averageViewDuration?: number;
	watchTime?: number;
	retentionData?: number[];
}

interface ChannelHealthData {
	videosKillingGrowth: Array<{
		videoId: string;
		title: string;
		issue: string;
		impressions: number;
		ctr: number;
		channelAverageCTR: number;
	}>;
	retentionDropOffs: Array<{
		videoId: string;
		title: string;
		dropOffTime: string;
		percentageLost: number;
	}>;
	algorithmSignals: {
		uploadConsistencyScore: number;
		ctrVsChannelAverage: number;
		watchTimePerImpression: number;
		averageRetention: number;
	};
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
			`https://www.googleapis.com/youtube/v3/channels?part=id,statistics,snippet&mine=true`,
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

		// Get videos with analytics data
		// First, get video list
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

		// Get video statistics
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
		const videos: YouTubeVideo[] = videoStatsData.items?.map((item: any) => ({
			id: item.id,
			title: item.snippet.title,
			publishedAt: item.snippet.publishedAt,
			viewCount: Number(item.statistics.viewCount || 0),
			likeCount: Number(item.statistics.likeCount || 0),
			commentCount: Number(item.statistics.commentCount || 0),
		})) || [];

		// Get analytics data (requires YouTube Analytics API)
		// Note: This requires additional OAuth scope: youtube.readonly
		let analyticsData: any = null;
		try {
			const analyticsResponse = await fetch(
				`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=2024-01-01&endDate=${new Date().toISOString().split("T")[0]}&metrics=views,estimatedMinutesWatched,impressions,impressionsClickThroughRate,averageViewDuration&dimensions=video`,
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
			console.warn("[YouTube Health] Analytics API not available:", error);
		}

		// Process analytics data if available
		const healthData: ChannelHealthData = {
			videosKillingGrowth: [],
			retentionDropOffs: [],
			algorithmSignals: {
				uploadConsistencyScore: 0,
				ctrVsChannelAverage: 0,
				watchTimePerImpression: 0,
				averageRetention: 0,
			},
		};

		if (analyticsData?.rows) {
			// Calculate channel average CTR
			const totalImpressions = analyticsData.rows.reduce((sum: number, row: any[]) => sum + (row[2] || 0), 0);
			const totalClicks = analyticsData.rows.reduce((sum: number, row: any[]) => sum + (row[3] || 0) * (row[2] || 0) / 100, 0);
			const channelAverageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

			// Find videos with high impressions but low CTR
			analyticsData.rows.forEach((row: any[]) => {
				const videoId = row[0];
				const impressions = row[2] || 0;
				const ctr = row[3] || 0;
				const video = videos.find((v) => v.id === videoId);

				if (video && impressions > 1000 && ctr < channelAverageCTR * 0.7) {
					healthData.videosKillingGrowth.push({
						videoId,
						title: video.title,
						issue: "High impressions, low CTR - title/thumbnail issue",
						impressions,
						ctr,
						channelAverageCTR,
					});
				}
			});

			// Calculate algorithm signals
			const totalWatchTime = analyticsData.rows.reduce((sum: number, row: any[]) => sum + (row[1] || 0), 0);
			healthData.algorithmSignals.watchTimePerImpression = totalImpressions > 0 ? totalWatchTime / totalImpressions : 0;
			healthData.algorithmSignals.ctrVsChannelAverage = channelAverageCTR;
		}

		// Calculate upload consistency (based on video publish dates)
		const publishDates = videos.map((v) => new Date(v.publishedAt).getTime()).sort((a, b) => b - a);
		if (publishDates.length > 1) {
			const intervals: number[] = [];
			for (let i = 0; i < publishDates.length - 1; i++) {
				intervals.push(publishDates[i] - publishDates[i + 1]);
			}
			const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
			const consistency = Math.max(0, 100 - (avgInterval / (7 * 24 * 60 * 60 * 1000)) * 10); // Penalize gaps > 7 days
			healthData.algorithmSignals.uploadConsistencyScore = Math.min(100, consistency);
		}

		// Enhance with AI insights if OpenAI is available
		const openai = getOpenAIClient();
		if (openai) {
			try {
				const aiPrompt = `You are a YouTube growth advisor. Analyze this channel health data and provide insights:

Videos Killing Growth: ${healthData.videosKillingGrowth.length} videos with high impressions but low CTR
Retention Drop-offs: ${healthData.retentionDropOffs.length} videos with significant drop-offs
Upload Consistency: ${healthData.algorithmSignals.uploadConsistencyScore.toFixed(0)}/100
CTR vs Channel Average: ${healthData.algorithmSignals.ctrVsChannelAverage.toFixed(2)}%
Watch Time per Impression: ${healthData.algorithmSignals.watchTimePerImpression.toFixed(1)} minutes

Provide a brief summary (2-3 sentences) of the channel's health and top priority action item.

Format as JSON:
{
  "summary": "Brief health summary",
  "priorityAction": "Top action item"
}`;

				const completion = await openai.chat.completions.create({
					model: "gpt-4o-mini",
					messages: [
						{
							role: "system",
							content: "You are a YouTube growth advisor. Analyze channel health data and provide actionable insights. Return only valid JSON.",
						},
						{
							role: "user",
							content: aiPrompt,
						},
					],
					max_tokens: 200,
					temperature: 0.7,
					response_format: { type: "json_object" },
				});

				const aiResponse = completion.choices[0]?.message?.content;
				if (aiResponse) {
					try {
						const parsed = JSON.parse(aiResponse);
						// Add AI insights to response
						(healthData as any).aiInsights = {
							summary: parsed.summary || "",
							priorityAction: parsed.priorityAction || "",
						};
					} catch (parseError) {
						console.warn("[YouTube Health] Failed to parse AI response:", parseError);
					}
				}
			} catch (aiError) {
				console.warn("[YouTube Health] AI analysis failed:", aiError);
			}
		}

		return NextResponse.json({
			success: true,
			data: healthData,
		});
	} catch (error) {
		console.error("[YouTube Health] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch channel health data", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

