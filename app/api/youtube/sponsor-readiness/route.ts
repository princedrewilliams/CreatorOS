import { NextRequest, NextResponse } from "next/server";

interface SponsorReadinessData {
	score: number; // 0-100
	channelSize: string;
	averageViews: number;
	engagement: number;
	consistency: number;
	niche: string;
	estimatedDealRange: {
		min: number;
		max: number;
		currency: string;
	};
	recommendations: string[];
	readinessLevel: "ready" | "almost" | "not_ready";
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

		// Get channel data
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

		const channel = channelData.items[0];
		const channelStats = channel.statistics;
		const channelSnippet = channel.snippet;
		const subscribers = Number(channelStats.subscriberCount || 0);
		const videoCount = Number(channelStats.videoCount || 0);

		// Get recent videos for engagement calculation
		const videosResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=${channel.id}&maxResults=20&order=date`,
			{
				headers: {
					Authorization: `Bearer ${youtubeAccessToken}`,
				},
			}
		);

		let averageViews = 0;
		let averageEngagement = 0;
		let consistency = 0;

		if (videosResponse.ok) {
			const videosData = await videosResponse.json();
			const videoIds = videosData.items?.map((item: any) => item.id.videoId).join(",") || "";

			if (videoIds) {
				const videoStatsResponse = await fetch(
					`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`,
					{
						headers: {
							Authorization: `Bearer ${youtubeAccessToken}`,
						},
					}
				);

				if (videoStatsResponse.ok) {
					const videoStatsData = await videoStatsResponse.json();
					const videos = videoStatsData.items || [];

					if (videos.length > 0) {
						// Calculate average views
						const totalViews = videos.reduce((sum: number, video: any) => sum + Number(video.statistics.viewCount || 0), 0);
						averageViews = totalViews / videos.length;

						// Calculate average engagement (likes + comments per view)
						const totalEngagement = videos.reduce((sum: number, video: any) => {
							const views = Number(video.statistics.viewCount || 1);
							const likes = Number(video.statistics.likeCount || 0);
							const comments = Number(video.statistics.commentCount || 0);
							return sum + ((likes + comments) / views) * 100;
						}, 0);
						averageEngagement = totalEngagement / videos.length;

						// Calculate consistency (based on upload frequency)
						const publishDates = videos
							.map((v: any) => new Date(v.snippet.publishedAt).getTime())
							.sort((a: number, b: number) => b - a);
						
						if (publishDates.length > 1) {
							const intervals: number[] = [];
							for (let i = 0; i < publishDates.length - 1; i++) {
								intervals.push(publishDates[i] - publishDates[i + 1]);
							}
							const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
							const daysBetweenUploads = avgInterval / (24 * 60 * 60 * 1000);
							// Score: 100 if uploading daily, decreases as gap increases
							consistency = Math.max(0, 100 - (daysBetweenUploads - 1) * 10);
						}
					}
				}
			}
		}

		// Determine channel size category
		let channelSize = "Micro";
		if (subscribers >= 1000000) channelSize = "Mega";
		else if (subscribers >= 100000) channelSize = "Macro";
		else if (subscribers >= 10000) channelSize = "Mid-tier";
		else if (subscribers >= 1000) channelSize = "Micro";

		// Determine niche from channel description/title
		const channelText = `${channelSnippet.title} ${channelSnippet.description}`.toLowerCase();
		let niche = "General";
		if (channelText.includes("tech") || channelText.includes("software") || channelText.includes("ai")) niche = "Tech";
		else if (channelText.includes("business") || channelText.includes("entrepreneur")) niche = "Business";
		else if (channelText.includes("education") || channelText.includes("tutorial")) niche = "Education";
		else if (channelText.includes("lifestyle") || channelText.includes("vlog")) niche = "Lifestyle";

		// Calculate sponsor readiness score (0-100)
		let score = 0;
		
		// Subscriber score (40 points max)
		if (subscribers >= 100000) score += 40;
		else if (subscribers >= 50000) score += 30;
		else if (subscribers >= 10000) score += 20;
		else if (subscribers >= 5000) score += 10;
		else if (subscribers >= 1000) score += 5;

		// Average views score (30 points max)
		if (averageViews >= 50000) score += 30;
		else if (averageViews >= 10000) score += 20;
		else if (averageViews >= 5000) score += 15;
		else if (averageViews >= 1000) score += 10;
		else if (averageViews >= 500) score += 5;

		// Engagement score (20 points max)
		if (averageEngagement >= 5) score += 20;
		else if (averageEngagement >= 3) score += 15;
		else if (averageEngagement >= 2) score += 10;
		else if (averageEngagement >= 1) score += 5;

		// Consistency score (10 points max)
		score += Math.min(10, consistency / 10);

		// Estimate deal range based on channel metrics
		// Typical rates: $10-50 per 1k subscribers per post
		const baseRate = subscribers / 1000;
		const viewsMultiplier = averageViews / 1000;
		const engagementMultiplier = Math.min(2, averageEngagement / 2);
		
		const estimatedDealRange = {
			min: Math.round(baseRate * viewsMultiplier * engagementMultiplier * 5),
			max: Math.round(baseRate * viewsMultiplier * engagementMultiplier * 15),
			currency: "USD",
		};

		// Generate recommendations
		const recommendations: string[] = [];
		
		if (subscribers < 10000) {
			recommendations.push("Focus on growing to 10k+ subscribers for better sponsor opportunities");
		}
		if (averageViews < 5000) {
			recommendations.push("Improve video performance to increase average views per video");
		}
		if (averageEngagement < 2) {
			recommendations.push("Increase engagement by asking questions and responding to comments");
		}
		if (consistency < 50) {
			recommendations.push("Upload more consistently - aim for at least 2-3 videos per week");
		}
		if (score >= 70) {
			recommendations.push("You're ready for sponsorships! Start reaching out to brands in your niche");
		}

		const readinessLevel: "ready" | "almost" | "not_ready" = 
			score >= 70 ? "ready" : 
			score >= 50 ? "almost" : 
			"not_ready";

		const sponsorData: SponsorReadinessData = {
			score: Math.min(100, Math.round(score)),
			channelSize,
			averageViews: Math.round(averageViews),
			engagement: Math.round(averageEngagement * 10) / 10,
			consistency: Math.round(consistency),
			niche,
			estimatedDealRange,
			recommendations,
			readinessLevel,
		};

		return NextResponse.json({
			success: true,
			data: sponsorData,
		});
	} catch (error) {
		console.error("[YouTube Sponsor Readiness] Error:", error);
		return NextResponse.json(
			{ error: "Failed to calculate sponsor readiness", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}



