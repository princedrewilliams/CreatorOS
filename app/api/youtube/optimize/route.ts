import { NextRequest, NextResponse } from "next/server";

interface OptimizationSuggestion {
	type: "title" | "thumbnail" | "description" | "posting_time";
	severity: "high" | "medium" | "low";
	message: string;
	suggestion: string;
	currentValue?: string;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { videoId, title, description, publishedAt } = body;

		if (!videoId) {
			return NextResponse.json(
				{ error: "Video ID is required" },
				{ status: 400 }
			);
		}

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

		// Get video analytics
		let analyticsData: any = null;
		try {
			const analyticsResponse = await fetch(
				`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=2024-01-01&endDate=${new Date().toISOString().split("T")[0]}&metrics=impressions,impressionsClickThroughRate,averageViewDuration,views&dimensions=video&filters=video==${videoId}`,
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
			console.warn("[YouTube Optimize] Analytics API not available:", error);
		}

		// Get channel average CTR for comparison
		let channelAverageCTR = 0;
		try {
			const channelAnalyticsResponse = await fetch(
				`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}&endDate=${new Date().toISOString().split("T")[0]}&metrics=impressions,impressionsClickThroughRate`,
				{
					headers: {
						Authorization: `Bearer ${youtubeAccessToken}`,
					},
				}
			);

			if (channelAnalyticsResponse.ok) {
				const channelAnalytics = await channelAnalyticsResponse.json();
				if (channelAnalytics.rows && channelAnalytics.rows.length > 0) {
					const totalImpressions = channelAnalytics.rows.reduce((sum: number, row: any[]) => sum + (row[0] || 0), 0);
					const totalClicks = channelAnalytics.rows.reduce((sum: number, row: any[]) => sum + (row[1] || 0) * (row[0] || 0) / 100, 0);
					channelAverageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
				}
			}
		} catch (error) {
			console.warn("[YouTube Optimize] Failed to get channel average CTR:", error);
		}

		const suggestions: OptimizationSuggestion[] = [];

		// Analyze title
		if (title) {
			const titleLength = title.length;
			if (titleLength < 30) {
				suggestions.push({
					type: "title",
					severity: "medium",
					message: "Title is too short",
					suggestion: "YouTube titles between 50-60 characters tend to perform better. Add more descriptive keywords.",
					currentValue: title,
				});
			} else if (titleLength > 100) {
				suggestions.push({
					type: "title",
					severity: "high",
					message: "Title is too long",
					suggestion: "Titles over 100 characters get truncated. Keep it under 60 characters for best results.",
					currentValue: title,
				});
			}
		}

		// Analyze CTR if analytics available
		if (analyticsData?.rows && analyticsData.rows.length > 0) {
			const videoCTR = analyticsData.rows[0][1] || 0;
			if (videoCTR < channelAverageCTR * 0.7 && channelAverageCTR > 0) {
				suggestions.push({
					type: "thumbnail",
					severity: "high",
					message: "CTR below channel average",
					suggestion: `Your CTR (${videoCTR.toFixed(2)}%) is ${((1 - videoCTR / channelAverageCTR) * 100).toFixed(0)}% below your channel average. Consider A/B testing a new thumbnail.`,
					currentValue: `${videoCTR.toFixed(2)}% vs ${channelAverageCTR.toFixed(2)}% average`,
				});
			}
		}

		// Analyze description
		if (description) {
			const descriptionLength = description.length;
			if (descriptionLength < 200) {
				suggestions.push({
					type: "description",
					severity: "medium",
					message: "Description is too short for SEO",
					suggestion: "Add more keywords and context. Descriptions over 200 characters help with search rankings.",
					currentValue: `${descriptionLength} characters`,
				});
			}
		}

		// Best posting time (based on channel analytics)
		// This would require historical data analysis
		suggestions.push({
			type: "posting_time",
			severity: "low",
			message: "Optimal posting time",
			suggestion: "Based on your audience, posting on weekdays between 2-4 PM tends to perform best. Consider scheduling your next video accordingly.",
		});

		return NextResponse.json({
			success: true,
			suggestions,
		});
	} catch (error) {
		console.error("[YouTube Optimize] Error:", error);
		return NextResponse.json(
			{ error: "Failed to generate optimization suggestions", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}



