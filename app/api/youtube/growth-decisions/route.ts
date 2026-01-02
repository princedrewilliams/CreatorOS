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

interface PostRecommendation {
	topic: string;
	reason: string;
	expectedImpact: string;
	confidence: "low" | "medium" | "high";
	retentionBoost?: number;
	daysSinceLastPost?: number;
	ctrPotential?: number;
	subscriberConversion?: number;
}

interface GrowthLeak {
	videoId: string;
	title: string;
	issue: string;
	severity: "high" | "medium" | "low";
	metrics: {
		ctr?: number;
		channelAvgCTR?: number;
		retention?: number;
		channelAvgRetention?: number;
		watchTimePerImpression?: number;
		channelAvgWatchTimePerImpression?: number;
		impressions?: number;
	};
	fix: string;
}

interface DoubleDownInsight {
	category: "length" | "topic" | "posting_time" | "title_format" | "content_type";
	insight: string;
	performance: {
		metric: string;
		value: number;
		comparison: string;
	};
	examples: string[];
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
			`https://www.googleapis.com/youtube/v3/channels?part=id,statistics&mine=true`,
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

		// Get videos
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

		// Get analytics data if available - comprehensive metrics
		let analyticsData: any = null;
		try {
			// Get comprehensive video analytics
			const analyticsResponse = await fetch(
				`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}&endDate=${new Date().toISOString().split("T")[0]}&metrics=views,estimatedMinutesWatched,impressions,impressionsClickThroughRate,averageViewDuration,subscribersGained&dimensions=video`,
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
			console.warn("[Growth Decisions] Analytics API not available:", error);
		}

		// Process analytics to calculate channel averages
		let channelAvgCTR = 0;
		let channelAvgWatchTimePerImpression = 0;
		let channelMedianImpressions = 0;
		let channelAvgSubscriberConversion = 0;
		const videoAnalyticsMap: Record<string, any> = {};

		if (analyticsData?.rows) {
			// Row format: [videoId, views, watchTime, impressions, ctr, avgViewDuration]
			const totalImpressions = analyticsData.rows.reduce((sum: number, row: any[]) => sum + (row[3] || 0), 0);
			const totalClicks = analyticsData.rows.reduce((sum: number, row: any[]) => {
				const impressions = row[3] || 0;
				const ctr = row[4] || 0;
				return sum + (impressions * ctr / 100);
			}, 0);
			channelAvgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

			const totalWatchTime = analyticsData.rows.reduce((sum: number, row: any[]) => sum + (row[2] || 0), 0);
			channelAvgWatchTimePerImpression = totalImpressions > 0 ? totalWatchTime / totalImpressions : 0;

			// Calculate median impressions
			const impressionsArray = analyticsData.rows.map((row: any[]) => row[3] || 0).sort((a: number, b: number) => a - b);
			channelMedianImpressions = impressionsArray.length > 0 
				? impressionsArray[Math.floor(impressionsArray.length / 2)]
				: 0;

			// Map analytics to videos and calculate additional metrics
			// Row format: [videoId, views, watchTime, impressions, ctr, avgViewDuration]
			analyticsData.rows.forEach((row: any[]) => {
				const videoId = row[0];
				const views = row[1] || 0;
				const watchTime = row[2] || 0;
				const impressions = row[3] || 0;
				const ctr = row[4] || 0;
				const avgViewDuration = row[5] || 0;
				
				videoAnalyticsMap[videoId] = {
					views,
					watchTime,
					impressions,
					ctr,
					avgViewDuration,
					subscribersGained: 0, // Will be estimated if not available
				};
			});

			// Calculate average subscriber conversion (estimated from views)
			// Note: Actual subscriber data requires additional API calls
			const totalViews = analyticsData.rows.reduce((sum: number, row: any[]) => sum + (row[1] || 0), 0);
			channelAvgSubscriberConversion = totalViews > 0 ? 0.02 : 0; // Estimate 2% conversion
		}

		// Helper function to parse duration
		const parseDuration = (duration: string): number => {
			const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
			if (!match) return 0;
			const hours = parseInt(match[1] || "0", 10);
			const minutes = parseInt(match[2] || "0", 10);
			const seconds = parseInt(match[3] || "0", 10);
			return hours * 3600 + minutes * 60 + seconds;
		};

		// Calculate Growth Score for each video
		// Growth Score = (Watch Time per Impression * 0.4) + (CTR vs Channel Avg * 0.3) + (Subscriber Conversion * 0.2) + (Revenue per View * 0.1)
		// Include videos even if they don't have analytics data (use viewCount as fallback)
		const videosWithScores = videos.map((video: any) => {
			const analytics = videoAnalyticsMap[video.id];
			
			// If no analytics data, use basic video stats as fallback
			if (!analytics) {
				// Use viewCount from video statistics as a basic metric
				const basicScore = video.viewCount > 0 ? Math.log10(video.viewCount + 1) * 0.1 : 0;
				return {
					video,
					analytics: {
						views: video.viewCount || 0,
						watchTime: 0,
						impressions: 0,
						ctr: 0,
						avgViewDuration: 0,
					},
					growthScore: basicScore,
					watchTimePerImpression: 0,
					subscriberConversion: 0,
				};
			}

			// Skip videos with no impressions (they haven't been shown to users yet)
			if (analytics.impressions === 0) {
				return null;
			}

			const watchTimePerImpression = analytics.watchTime / analytics.impressions;
			const watchTimeScore = channelAvgWatchTimePerImpression > 0
				? (watchTimePerImpression / channelAvgWatchTimePerImpression) * 0.4
				: watchTimePerImpression * 0.4; // Fallback if no channel average

			const ctrVsAvg = channelAvgCTR > 0 
				? (analytics.ctr / channelAvgCTR) * 0.3 
				: analytics.ctr * 0.3; // Fallback

			// Subscriber conversion (use actual data if available, otherwise estimate)
			const subscriberConversion = analytics.subscribersGained > 0 && analytics.views > 0
				? (analytics.subscribersGained / analytics.views) * 100
				: channelAvgSubscriberConversion * 100;
			const subscriberScore = channelAvgSubscriberConversion > 0
				? (subscriberConversion / (channelAvgSubscriberConversion * 100)) * 0.2
				: subscriberConversion * 0.2;

			// Revenue per view (estimated, would need actual revenue data)
			const revenuePerView = 0.002; // $0.002 per view estimate
			const revenueScore = (revenuePerView / 0.002) * 0.1;

			const growthScore = watchTimeScore + ctrVsAvg + subscriberScore + revenueScore;

			return {
				video,
				analytics,
				growthScore,
				watchTimePerImpression,
				subscriberConversion,
			};
		}).filter(Boolean);

		// 1. POST THIS NEXT - Content Direction Engine (Pattern Matching + Ranking)
		let postRecommendations: PostRecommendation[] = [];

		// Use Growth Score to identify top performers (top 20%, or at least top 3 if fewer videos)
		const topPerformersCount = Math.max(3, Math.ceil(videosWithScores.length * 0.2));
		const topPerformers = videosWithScores
			.sort((a: any, b: any) => b.growthScore - a.growthScore)
			.slice(0, topPerformersCount);

		// Extract topics from top performers
		const topicPerformance: Record<string, { count: number; avgWatchTimePerImpression: number; lastPostDate: Date | null }> = {};
		
		topPerformers.forEach((item: any) => {
			const video = item.video;
			const text = `${video.title} ${video.description}`.toLowerCase();
			
			// Extract topics - expanded keyword list for better detection
			const keywords = ["ai", "tutorial", "review", "tips", "how to", "guide", "tools", "software", "productivity", "business", "freelance", "automation", "strategy", "mistakes", "beginner", "advanced", "comparison", "vs", "best", "top", "list"];
			
			keywords.forEach((keyword) => {
				if (text.includes(keyword)) {
					if (!topicPerformance[keyword]) {
						topicPerformance[keyword] = {
							count: 0,
							avgWatchTimePerImpression: 0,
							lastPostDate: null,
						};
					}
					
					topicPerformance[keyword].count += 1;
					topicPerformance[keyword].avgWatchTimePerImpression += item.watchTimePerImpression;
					
					const publishDate = new Date(video.publishedAt);
					if (!topicPerformance[keyword].lastPostDate || publishDate > topicPerformance[keyword].lastPostDate) {
						topicPerformance[keyword].lastPostDate = publishDate;
					}
				}
			});
		});

		// Calculate averages and find recommendations
		Object.keys(topicPerformance).forEach((topic) => {
			const data = topicPerformance[topic];
			data.avgWatchTimePerImpression = data.avgWatchTimePerImpression / data.count;
			
			const daysSinceLastPost = data.lastPostDate 
				? Math.floor((Date.now() - data.lastPostDate.getTime()) / (24 * 60 * 60 * 1000))
				: 999;

			// Lower threshold when channel average is not available, or recommend based on relative performance
			const shouldRecommend = channelAvgWatchTimePerImpression > 0
				? (daysSinceLastPost > 14 && data.avgWatchTimePerImpression > channelAvgWatchTimePerImpression)
				: (daysSinceLastPost > 7 && data.count >= 1); // Fallback: recommend if not posted in 7+ days

			if (shouldRecommend) {
				const retentionBoost = channelAvgWatchTimePerImpression > 0
					? ((data.avgWatchTimePerImpression / channelAvgWatchTimePerImpression - 1) * 100) || 0
					: 0;
				
				// Calculate confidence based on performance gap and consistency
				let confidence: "low" | "medium" | "high" = "low";
				if (channelAvgWatchTimePerImpression > 0) {
					if (retentionBoost > 30 && data.count >= 3) {
						confidence = "high";
					} else if (retentionBoost > 15 && data.count >= 2) {
						confidence = "medium";
					} else if (data.count >= 2) {
						confidence = "medium";
					}
				} else {
					// Fallback confidence when no channel average
					confidence = data.count >= 2 ? "medium" : "low";
				}
				
				const topicLabel = topic.charAt(0).toUpperCase() + topic.slice(1) + 
					(topic.includes("ai") ? " tools" : 
					 topic.includes("how to") ? " guide" : 
					 topic.includes("tutorial") ? " tutorial" : 
					 topic.includes("tips") ? " tips" : "");
				
				postRecommendations.push({
					topic: topicLabel,
					reason: channelAvgWatchTimePerImpression > 0
						? `${Math.round(retentionBoost)}% higher watch time per impression than channel average. Last posted ${daysSinceLastPost} days ago.`
						: `Based on your top performing videos. Last posted ${daysSinceLastPost} days ago.`,
					expectedImpact: retentionBoost > 30 ? "High views & watch time" : retentionBoost > 15 ? "Good views" : data.count >= 2 ? "Good potential" : "Moderate views",
					confidence,
					retentionBoost: Math.round(retentionBoost),
					daysSinceLastPost,
				});
			}
		});

		// If no topic-based recommendations, provide general recommendations based on best performing videos
		if (postRecommendations.length === 0 && topPerformers.length > 0) {
			// Get the best performing video
			const bestVideo = topPerformers[0];
			const daysSinceBestVideo = Math.floor((Date.now() - new Date(bestVideo.video.publishedAt).getTime()) / (24 * 60 * 60 * 1000));
			
			// Extract a general topic from the best video
			const bestVideoText = `${bestVideo.video.title} ${bestVideo.video.description}`.toLowerCase();
			let generalTopic = "Similar content";
			
			if (bestVideoText.includes("tutorial") || bestVideoText.includes("how to")) {
				generalTopic = "Tutorial content";
			} else if (bestVideoText.includes("review")) {
				generalTopic = "Review content";
			} else if (bestVideoText.includes("tips")) {
				generalTopic = "Tips & advice";
			} else if (bestVideoText.includes("ai") || bestVideoText.includes("tools")) {
				generalTopic = "Tools & software";
			}
			
			postRecommendations.push({
				topic: generalTopic,
				reason: `Your best performing video is "${bestVideo.video.title.substring(0, 50)}${bestVideo.video.title.length > 50 ? '...' : ''}". Create similar content to leverage what's working.`,
				expectedImpact: "Good potential based on top performer",
				confidence: "medium",
				daysSinceLastPost: daysSinceBestVideo,
			});
		}

		// Sort by confidence and retention boost
		postRecommendations.sort((a, b) => {
			const confidenceOrder = { high: 3, medium: 2, low: 1 };
			if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
				return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
			}
			return (b.retentionBoost || 0) - (a.retentionBoost || 0);
		});

		// Enhance recommendations with AI analysis if OpenAI is available
		const openai = getOpenAIClient();
		if (openai && postRecommendations.length > 0) {
			try {
				// Prepare analytics summary for AI
				const topVideos = videosWithScores
					.sort((a: any, b: any) => b.growthScore - a.growthScore)
					.slice(0, 5)
					.map((v: any) => ({
						title: v.video.title,
						views: videoAnalyticsMap[v.video.id]?.views || v.video.viewCount,
						watchTime: videoAnalyticsMap[v.video.id]?.watchTime || 0,
						ctr: videoAnalyticsMap[v.video.id]?.ctr || 0,
						avgViewDuration: videoAnalyticsMap[v.video.id]?.avgViewDuration || 0,
						subscribersGained: videoAnalyticsMap[v.video.id]?.subscribersGained || 0,
					}));

				const channelStats = {
					totalViews: videos.reduce((sum: number, v: any) => sum + (videoAnalyticsMap[v.id]?.views || v.viewCount || 0), 0),
					totalWatchTime: videos.reduce((sum: number, v: any) => sum + (videoAnalyticsMap[v.id]?.watchTime || 0), 0),
					avgCTR: channelAvgCTR,
					avgWatchTimePerImpression: channelAvgWatchTimePerImpression,
					topTopics: postRecommendations.slice(0, 3).map(r => r.topic),
				};

				const aiPrompt = `You are a YouTube growth advisor. Analyze the following channel analytics and suggest the top 3 specific video topics the creator should post next.

Channel Performance:
- Total Views: ${channelStats.totalViews.toLocaleString()}
- Total Watch Time: ${(channelStats.totalWatchTime / 60).toFixed(0)} hours
- Average CTR: ${channelStats.avgCTR.toFixed(2)}%
- Average Watch Time per Impression: ${channelStats.avgWatchTimePerImpression.toFixed(1)} minutes

Top 5 Performing Videos:
${topVideos.map((v: { title: string; views: number; watchTime: number; ctr: number }, i: number) => `${i + 1}. "${v.title}" - ${v.views.toLocaleString()} views, ${(v.watchTime / 60).toFixed(0)} min watch time, ${v.ctr.toFixed(2)}% CTR`).join("\n")}

Current Recommended Topics: ${channelStats.topTopics.join(", ")}

Based on this data, suggest 3 SPECIFIC video topics (not generic categories) that would likely perform well. Consider:
1. What topics/formats are working best
2. What gaps exist in the content
3. What the audience is responding to
4. What would build on successful patterns

Format your response as a JSON object with a "recommendations" key containing an array:
{
  "recommendations": [
    {
      "topic": "Specific video topic/title idea",
      "reason": "Why this topic will work based on the data",
      "expectedImpact": "What improvement to expect (e.g., 'Higher retention', 'More subscribers', 'Better CTR')",
      "confidence": "high"
    }
  ]
}

Only return the JSON object, no other text.`;

				const completion = await openai.chat.completions.create({
					model: "gpt-4o-mini",
					messages: [
						{
							role: "system",
							content: "You are a YouTube growth advisor. Analyze analytics data and suggest specific video topics. Return only valid JSON objects. Never make up metrics or predict virality.",
						},
						{
							role: "user",
							content: aiPrompt,
						},
					],
					max_tokens: 500,
					temperature: 0.7,
					response_format: { type: "json_object" },
				});

				const aiResponse = completion.choices[0]?.message?.content;
				if (aiResponse) {
					try {
						const parsed = JSON.parse(aiResponse);
						// If AI returns recommendations, merge them with existing ones
						if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
							// Add AI recommendations at the top, but keep deterministic ones as fallback
							postRecommendations = [
								...parsed.recommendations.slice(0, 3).map((r: any) => ({
									topic: r.topic,
									reason: r.reason,
									expectedImpact: r.expectedImpact || "Improved performance",
									confidence: r.confidence || "medium" as "low" | "medium" | "high",
								})),
								...postRecommendations.slice(0, 2), // Keep top 2 deterministic recommendations
							].slice(0, 5); // Limit to top 5 total
						}
					} catch (parseError) {
						console.warn("[Growth Decisions] Failed to parse AI response:", parseError);
						// Continue with deterministic recommendations
					}
				}
			} catch (aiError) {
				console.warn("[Growth Decisions] AI analysis failed, using deterministic recommendations:", aiError);
				// Continue with deterministic recommendations
			}
		}

		// Helper function for formatting
		const formatCompact = (value: number) => {
			return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
		};

		// 2. FIX THESE VIDEOS - Growth Leak Detection (Decision Rules)
		const growthLeaks: GrowthLeak[] = [];

		videos.forEach((video: any) => {
			const analytics = videoAnalyticsMap[video.id];
			if (!analytics) return;

			// Rule: Fix Thumbnail/Title
			// Trigger: High impressions AND CTR significantly below channel average
			if (analytics.impressions > channelMedianImpressions && 
				analytics.ctr < (channelAvgCTR * 0.8) && 
				channelAvgCTR > 0) {
				const ctrGap = ((channelAvgCTR - analytics.ctr) / channelAvgCTR) * 100;
				growthLeaks.push({
					videoId: video.id,
					title: video.title,
					issue: "Title/Thumbnail issue",
					severity: analytics.ctr < (channelAvgCTR * 0.6) ? "high" : "medium",
					metrics: {
						ctr: analytics.ctr,
						channelAvgCTR,
						impressions: analytics.impressions,
					},
					fix: `Fix thumbnail/title - CTR is ${ctrGap.toFixed(0)}% below channel average despite high impressions (${formatCompact(analytics.impressions)}). This indicates a mismatch between what the thumbnail promises and what the video delivers.`,
				});
			}

			// Rule: Fix Hook/Structure
			// Trigger: First 30-60s retention below threshold OR low average view duration
			const videoLength = parseDuration(video.duration);
			if (videoLength > 30) {
				// Estimate retention from average view duration vs video length
				const estimatedRetention = analytics.avgViewDuration > 0
					? (analytics.avgViewDuration / videoLength) * 100
					: 0;
				
				// Check if retention drops in first 30-60 seconds
				if (estimatedRetention < 65 && analytics.avgViewDuration < 60) {
					const dropOffTime = Math.round(analytics.avgViewDuration);
					growthLeaks.push({
						videoId: video.id,
						title: video.title,
						issue: "Weak opening",
						severity: estimatedRetention < 50 ? "high" : "medium",
						metrics: {
							retention: estimatedRetention,
							channelAvgRetention: 70, // Estimated
						},
						fix: `Improve opening hook - Most viewers leave around ${dropOffTime} seconds. Your first 30 seconds need a stronger hook to keep viewers engaged.`,
					});
				}
			}

			// Rule: Low watch time per impression (wasting impressions)
			if (analytics.impressions > 500) {
				const watchTimePerImpression = analytics.watchTime / analytics.impressions;
				if (watchTimePerImpression < channelAvgWatchTimePerImpression * 0.6 && channelAvgWatchTimePerImpression > 0) {
					growthLeaks.push({
						videoId: video.id,
						title: video.title,
						issue: "Low watch time per impression",
						severity: watchTimePerImpression < channelAvgWatchTimePerImpression * 0.4 ? "high" : "medium",
						metrics: {
							watchTimePerImpression,
							channelAvgWatchTimePerImpression,
							impressions: analytics.impressions,
						},
						fix: "Improve opening hook and pacing - You're getting impressions but viewers aren't staying. This wastes potential reach.",
					});
				}
			}

			// Rule: Videos pulling down channel average (growth leaks)
			if (analytics.impressions > 1000) {
				const videoScore = videosWithScores.find((v: any) => v.video.id === video.id);
				if (videoScore) {
					const avgScore = videosWithScores.reduce((sum: number, v: any) => sum + v.growthScore, 0) / videosWithScores.length;
					if (videoScore.growthScore < avgScore * 0.7) {
						growthLeaks.push({
							videoId: video.id,
							title: video.title,
							issue: "Pulling down channel average",
							severity: videoScore.growthScore < avgScore * 0.5 ? "high" : "medium",
							metrics: {
								watchTimePerImpression: videoScore.watchTimePerImpression,
								channelAvgWatchTimePerImpression,
							},
							fix: "This video's performance is significantly below your channel average. Consider unlisting it or creating a new version with improvements.",
						});
					}
				}
			}
		});

		// Sort by severity
		growthLeaks.sort((a, b) => {
			const severityOrder = { high: 3, medium: 2, low: 1 };
			return severityOrder[b.severity] - severityOrder[a.severity];
		});

		// 3. DOUBLE DOWN - What's Working
		const doubleDownInsights: DoubleDownInsight[] = [];

		// Analyze video length performance
		const lengthPerformance: Record<string, { count: number; totalWatchTime: number; totalViews: number }> = {};
		
		videos.forEach((video: any) => {
			const analytics = videoAnalyticsMap[video.id];
			if (!analytics) return;

			// Parse duration
			const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
			if (!match) return;
			const hours = parseInt(match[1] || "0", 10);
			const minutes = parseInt(match[2] || "0", 10);
			const seconds = parseInt(match[3] || "0", 10);
			const totalSeconds = hours * 3600 + minutes * 60 + seconds;
			const totalMinutes = totalSeconds / 60;

			let lengthCategory = "short";
			if (totalMinutes >= 10) lengthCategory = "long";
			else if (totalMinutes >= 5) lengthCategory = "medium";

			if (!lengthPerformance[lengthCategory]) {
				lengthPerformance[lengthCategory] = { count: 0, totalWatchTime: 0, totalViews: 0 };
			}
			lengthPerformance[lengthCategory].count += 1;
			lengthPerformance[lengthCategory].totalWatchTime += analytics.watchTime;
			lengthPerformance[lengthCategory].totalViews += analytics.views || video.viewCount;
		});

		// Find best performing length
		const bestLength = Object.entries(lengthPerformance)
			.map(([category, data]) => ({
				category,
				avgWatchTime: data.totalWatchTime / data.count,
				avgViews: data.totalViews / data.count,
			}))
			.sort((a, b) => b.avgWatchTime - a.avgWatchTime)[0];

		if (bestLength) {
			const lengthLabel = bestLength.category === "long" ? "8-11 minutes" : bestLength.category === "medium" ? "5-10 minutes" : "Under 5 minutes";
			const avgWatchTime = Object.values(lengthPerformance).reduce((sum, d) => sum + d.totalWatchTime / d.count, 0) / Object.keys(lengthPerformance).length;
			const boostPercent = Math.round(((bestLength.avgWatchTime / avgWatchTime) - 1) * 100);
			doubleDownInsights.push({
				category: "length",
				insight: `Videos between ${lengthLabel} perform best`,
				performance: {
					metric: "Watch time",
					value: Math.round(bestLength.avgWatchTime),
					comparison: `${boostPercent}% above average`,
				},
				examples: videos
					.filter((v: any) => {
						const analytics = videoAnalyticsMap[v.id];
						return analytics && analytics.watchTime > bestLength.avgWatchTime * 0.8;
					})
					.slice(0, 3)
					.map((v: any) => v.title),
			});
		}

		// Analyze title format
		const titleFormats: Record<string, { count: number; totalWatchTime: number }> = {};
		
		videos.forEach((video: any) => {
			const analytics = videoAnalyticsMap[video.id];
			if (!analytics) return;

			const title = video.title.toLowerCase();
			let format = "other";
			if (title.startsWith("how") || title.includes("how to")) format = "how-to";
			else if (title.startsWith("why") || title.includes("why")) format = "why";
			else if (title.includes("day in") || title.includes("vlog")) format = "story";

			if (!titleFormats[format]) {
				titleFormats[format] = { count: 0, totalWatchTime: 0 };
			}
			titleFormats[format].count += 1;
			titleFormats[format].totalWatchTime += analytics.watchTime;
		});

		const bestFormat = Object.entries(titleFormats)
			.map(([format, data]) => ({
				format,
				avgWatchTime: data.totalWatchTime / data.count,
			}))
			.sort((a, b) => b.avgWatchTime - a.avgWatchTime)[0];

		if (bestFormat && bestFormat.format !== "other") {
			const formatLabel = bestFormat.format === "how-to" ? "How-to" : bestFormat.format === "why" ? "Why" : "Story";
			const comparison = Object.values(titleFormats).reduce((sum, d) => sum + d.totalWatchTime / d.count, 0) / Object.keys(titleFormats).length;
			const boost = ((bestFormat.avgWatchTime / comparison) - 1) * 100;
			
		// Rule: Double Down
		// IF watch time per impression > channel avg + 25% AND subscribers gained > channel avg
		// (Here we're checking if format boost is significant)
		if (boost > 25 && bestFormat.avgWatchTime > 0) {
				doubleDownInsights.push({
					category: "title_format",
					insight: `"${formatLabel}" titles outperform other formats by ${Math.round(boost)}%`,
					performance: {
						metric: "Watch time",
						value: Math.round(bestFormat.avgWatchTime),
						comparison: `${Math.round(boost)}% above average`,
					},
					examples: videos
						.filter((v: any) => {
							const title = v.title.toLowerCase();
							return (bestFormat.format === "how-to" && (title.startsWith("how") || title.includes("how to"))) ||
								   (bestFormat.format === "why" && (title.startsWith("why") || title.includes("why"))) ||
								   (bestFormat.format === "story" && (title.includes("day in") || title.includes("vlog")));
						})
						.slice(0, 3)
						.map((v: any) => v.title),
				});
			}
		}

		return NextResponse.json({
			success: true,
			data: {
				postThisNext: postRecommendations.slice(0, 5),
				fixTheseVideos: growthLeaks.slice(0, 10),
				doubleDown: doubleDownInsights,
			},
		});
	} catch (error) {
		console.error("[Growth Decisions] Error:", error);
		return NextResponse.json(
			{ error: "Failed to generate growth decisions", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

