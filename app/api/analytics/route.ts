import { NextRequest, NextResponse } from "next/server";
import { analyticsMocks, type AnalyticsPlatform } from "@/lib/mockAnalytics";

// Valid platform values
const VALID_PLATFORMS: readonly AnalyticsPlatform[] = ["youtube"] as const;

function isValidPlatform(platform: string): platform is AnalyticsPlatform {
	return VALID_PLATFORMS.includes(platform as AnalyticsPlatform);
}

export async function GET(request: NextRequest) {
	try {
		const url = request.nextUrl;
		const requestedPlatforms = url.searchParams.getAll("platform");

		// Validate and filter platforms
		const validPlatforms = requestedPlatforms
			.filter(isValidPlatform)
			.filter((platform) => platform in analyticsMocks);

		const platforms: AnalyticsPlatform[] =
			validPlatforms.length > 0
				? validPlatforms
				: (Object.keys(analyticsMocks) as AnalyticsPlatform[]);

		// Log invalid platforms if any were provided
		const invalidPlatforms = requestedPlatforms.filter((p) => !isValidPlatform(p));
		if (invalidPlatforms.length > 0) {
			console.warn("[analytics] Invalid platforms provided:", invalidPlatforms);
		}

		const payload = await Promise.all(
			platforms.map(async (platform) => {
				try {
					// Only YouTube is supported now
					if (platform === "youtube") {
				const youtubeAccessToken = request.cookies.get("youtube_access_token")?.value;
				if (youtubeAccessToken) {
					try {
						// Get channel ID first
						const channelResponse = await fetch(
							`https://www.googleapis.com/youtube/v3/channels?part=id,statistics,snippet&mine=true`,
							{
								headers: {
									Authorization: `Bearer ${youtubeAccessToken}`,
								},
							}
						);
						
						if (channelResponse.ok) {
							const channelData = await channelResponse.json();
							if (channelData.items && channelData.items.length > 0) {
								const channel = channelData.items[0];
								const channelId = channel.id;
								const stats = channel.statistics;
								const subscribers = Number(stats.subscriberCount || 0);
								const videoCount = Number(stats.videoCount || 0);
								
								// Get YouTube Analytics data for detailed metrics
								let totalWatchTime = 0;
								let totalImpressions = 0;
								let totalClicks = 0;
								let totalViews = 0;
								let avgViewDuration = 0;
								let trafficSources: Record<string, number> = {};
								
								try {
									const analyticsResponse = await fetch(
										`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}&endDate=${new Date().toISOString().split("T")[0]}&metrics=views,estimatedMinutesWatched,impressions,impressionsClickThroughRate,averageViewDuration&dimensions=video`,
										{
											headers: {
												Authorization: `Bearer ${youtubeAccessToken}`,
											},
										}
									);
									
									if (analyticsResponse.ok) {
										const analyticsData = await analyticsResponse.json();
										if (analyticsData.rows && analyticsData.rows.length > 0) {
											analyticsData.rows.forEach((row: any[]) => {
												totalViews += row[0] || 0;
												totalWatchTime += row[1] || 0; // minutes watched
												totalImpressions += row[2] || 0;
												totalClicks += (row[2] || 0) * (row[3] || 0) / 100; // impressions * CTR
												avgViewDuration += row[4] || 0;
											});
											avgViewDuration = analyticsData.rows.length > 0 ? avgViewDuration / analyticsData.rows.length : 0;
										} else {
											console.log("[analytics] YouTube Analytics API returned no rows");
										}
									} else {
										const errorData = await analyticsResponse.json().catch(() => ({}));
										console.warn("[analytics] YouTube Analytics API error:", analyticsResponse.status, errorData);
									}
									
									// Get traffic sources
									const trafficResponse = await fetch(
										`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}&endDate=${new Date().toISOString().split("T")[0]}&metrics=views&dimensions=insightTrafficSourceType`,
										{
											headers: {
												Authorization: `Bearer ${youtubeAccessToken}`,
											},
										}
									);
									
									if (trafficResponse.ok) {
										const trafficData = await trafficResponse.json();
										if (trafficData.rows) {
											trafficData.rows.forEach((row: any[]) => {
												const source = row[0] || "unknown";
												const views = row[1] || 0;
												trafficSources[source] = (trafficSources[source] || 0) + views;
											});
										}
									}
									
									// Get views today and subscriber growth from Analytics API
									try {
										const today = new Date().toISOString().split("T")[0];
										const todayResponse = await fetch(
											`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${today}&endDate=${today}&metrics=views,subscribersGained`,
											{
												headers: {
													Authorization: `Bearer ${youtubeAccessToken}`,
												},
											}
										);
										
										if (todayResponse.ok) {
											const todayData = await todayResponse.json();
											if (todayData.rows && todayData.rows.length > 0) {
												// Sum all views and subscribers gained for today
												todayData.rows.forEach((row: any[]) => {
													viewsToday += row[0] || 0;
													subscriberGrowth += row[1] || 0;
												});
											}
										}
									} catch (error) {
										console.warn("[analytics] Failed to fetch today's analytics:", error);
									}
								} catch (error) {
									console.warn("[analytics] YouTube Analytics API not available:", error);
								}
								
								// Get recent videos
								const videosResponse = await fetch(
									`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&forMine=true&maxResults=10&order=viewCount`,
									{
										headers: {
											Authorization: `Bearer ${youtubeAccessToken}`,
										},
									}
								);
								
								let topContent: Array<{ title: string; views: number; engagement: number; publishedAt: string; thumbnail?: string; likes?: number; comments?: number; shares?: number }> = [];
								let subscriberGrowth = 0;
								let viewsToday = 0;
								
								if (videosResponse.ok) {
									const videosData = await videosResponse.json();
									const videoIds = videosData.items?.map((item: any) => item.id.videoId).join(",") || "";
									
									if (videoIds) {
										// Get detailed video statistics
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
											topContent = (videoStatsData.items || []).slice(0, 3).map((item: any) => {
												const videoStats = item.statistics;
												const views = Number(videoStats.viewCount || 0);
												const likes = Number(videoStats.likeCount || 0);
												const comments = Number(videoStats.commentCount || 0);
												const shares = Number(videoStats.shareCount || 0);
												const engagement = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;
												
												return {
													title: item.snippet?.title || "Untitled Video",
													views,
													engagement: Math.min(engagement, 100),
													publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
													thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
													likes,
													comments,
													shares,
												};
											});
										}
									}
								}
								
								// Calculate CTR
								const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
								
								// subscriberGrowth and viewsToday are now fetched from API above
								// If not available, set to 0 (don't estimate)
								
								// Calculate engagement rate
								const engagement = subscribers > 0 && videoCount > 0 
									? (totalViews / subscribers / videoCount) * 100 
									: 0;
								
								// If watch time is 0 but we have views, estimate watch time (average 2.5 minutes per view)
								if (totalWatchTime === 0 && totalViews > 0) {
									totalWatchTime = totalViews * 2.5;
								}
								
								// If avg view duration is 0 but we have watch time and views, calculate it
								if (avgViewDuration === 0 && totalViews > 0 && totalWatchTime > 0) {
									avgViewDuration = (totalWatchTime * 60) / totalViews; // Convert minutes to seconds, then divide by views
								}
								
								console.log("[analytics] YouTube data:", {
									totalViews,
									totalWatchTime,
									subscribers,
									videoCount,
									topContentCount: topContent.length,
								});
								
								const now = new Date();
								return {
									platform,
									data: {
										views: totalViews,
										followers: subscribers,
										engagement: engagement,
										revenue: 0,
										updatedAt: now.toISOString(),
										trend: { views: 0, followers: 0, engagement: 0, revenue: 0 },
										topContent: topContent.length > 0 ? topContent : analyticsMocks.youtube.topContent,
										// Additional metrics
										watchTime: totalWatchTime, // in minutes
										avgViewDuration: avgViewDuration, // in seconds
										ctr: ctr, // percentage
										trafficSources: trafficSources,
										subscriberGrowth: subscriberGrowth, // from API, not estimated
										impressions: totalImpressions,
										viewsToday: viewsToday, // actual views today from API
									},
								};
							}
						}
					} catch (error) {
						console.error("[analytics] YouTube analytics error:", error);
					}
				}
			}
					
					// Return null for platforms without real data - don't use mock data
					console.warn(`[analytics] No real data available for ${platform}`);
					return {
						platform,
						data: null,
					};
				} catch (error) {
					console.error(`[analytics] Error fetching data for ${platform}:`, error);
					// Return null on error - don't use mock data
					return {
						platform,
						data: null,
					};
				}
			})
		);

		// Filter out platforms with null data (no real data available)
		const validPayload = payload.filter((item) => item.data !== null);
		
		// Log if any platforms failed
		const failedPlatforms = payload.filter((item) => item.data === null);
		if (failedPlatforms.length > 0) {
			console.warn("[analytics] Platforms with no real data:", failedPlatforms.map((p) => p.platform));
		}
		
		return NextResponse.json({ platforms: validPayload, generatedAt: new Date().toISOString() });
	} catch (error) {
		console.error("[analytics] Error in GET handler:", error);
		return NextResponse.json(
			{ 
				error: "Failed to fetch analytics data",
				message: error instanceof Error ? error.message : "Unknown error"
			},
			{ status: 500 }
		);
	}
}

