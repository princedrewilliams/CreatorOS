import { NextRequest, NextResponse } from "next/server";
import { analyticsMocks, type AnalyticsPlatform, type PlatformAnalyticsSnapshot } from "@/lib/mockAnalytics";

const RAPIDAPI_TIKTOK_ANALYTICS_KEY = process.env.RAPIDAPI_TIKTOK_ANALYTICS_KEY;
const RAPIDAPI_TIKTOK_ANALYTICS_HOST = process.env.RAPIDAPI_TIKTOK_ANALYTICS_HOST || "tikapi5.p.rapidapi.com";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

// Type definitions for API responses
interface TikTokVideoStats {
	playCount?: number;
	play_count?: number;
	viewCount?: number;
	diggCount?: number;
	digg_count?: number;
	likeCount?: number;
	commentCount?: number;
	comment_count?: number;
	shareCount?: number;
	share_count?: number;
}

interface TikTokVideoItem {
	desc?: string;
	description?: string;
	title?: string;
	stats?: TikTokVideoStats;
	statistics?: TikTokVideoStats;
	createTime?: number;
	create_time?: number;
}

interface TikTokUserStats {
	followerCount?: number;
	follower_count?: number;
	videoCount?: number;
	video_count?: number;
	diggCount?: number;
	digg_count?: number;
	likeCount?: number;
	videoPlayCount?: number;
	video_play_count?: number;
	totalPlayCount?: number;
	commentCount?: number;
	comment_count?: number;
	shareCount?: number;
	share_count?: number;
}

interface TikTokApiResponse {
	userInfo?: {
		stats?: TikTokUserStats;
		followerCount?: number;
		videoCount?: number;
	};
	user?: {
		stats?: TikTokUserStats;
		followerCount?: number;
		videoCount?: number;
	};
	itemList?: TikTokVideoItem[];
	videos?: TikTokVideoItem[];
	items?: TikTokVideoItem[];
}

interface InstagramMediaItem {
	id: string;
	like_count?: number;
	comments_count?: number;
	timestamp?: string;
	media_type?: string;
	caption?: string;
}

interface InstagramInsightData {
	name: string;
	values?: Array<{ value: number }>;
}

interface InstagramInsightsResponse {
	data?: InstagramInsightData[];
}

async function fetchTikTokAnalytics(secUid: string): Promise<PlatformAnalyticsSnapshot | null> {
	if (!RAPIDAPI_TIKTOK_ANALYTICS_KEY) {
		console.warn("[analytics] TikTok RapidAPI key missing, using mock data");
		return null;
	}

	try {
		// Validate sec_uid format
		if (!secUid || typeof secUid !== "string" || secUid.trim().length === 0) {
			console.warn("[analytics] Invalid TikTok sec_uid provided");
			return null;
		}

		const url = new URL("https://tikapi5.p.rapidapi.com/get_user_profile");
		url.searchParams.set("sec_uid", secUid.trim());

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"X-RapidAPI-Key": RAPIDAPI_TIKTOK_ANALYTICS_KEY,
				"X-RapidAPI-Host": RAPIDAPI_TIKTOK_ANALYTICS_HOST,
			},
			cache: "no-store",
		});

		if (!response.ok) {
			const errorText = await response.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { message: errorText };
			}
			
			console.error("[analytics] TikTok API error", {
				status: response.status,
				statusText: response.statusText,
				error: errorData,
			});
			return null;
		}

		const data = (await response.json()) as TikTokApiResponse;
		
		// Map TikAPI5 response to our PlatformAnalyticsSnapshot format
		// TikAPI5 response structure: { userInfo: { stats: {...}, ... }, itemList: [...] }
		const userInfo = data?.userInfo || data?.user || {};
		const userStats = userInfo?.stats || {};
		const now = new Date();
		
		// Extract stats from various possible locations
		const followerCount = userStats.followerCount || userStats.follower_count || userInfo.followerCount || 0;
		const videoCount = userStats.videoCount || userStats.video_count || userInfo.videoCount || 0;
		const totalLikes = userStats.diggCount || userStats.digg_count || userStats.likeCount || 0;
		const totalViews = userStats.videoPlayCount || userStats.video_play_count || userStats.totalPlayCount || 0;
		
		// Calculate engagement rate (likes + comments + shares / views)
		const totalEngagement = totalLikes + (userStats.commentCount || userStats.comment_count || 0) + (userStats.shareCount || userStats.share_count || 0);
		const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

		// Get top videos if available
		const itemList = data?.itemList || data?.videos || data?.items || [];
		const topContent = itemList.slice(0, 3).map((item: TikTokVideoItem) => {
			const stats = item?.stats || item?.statistics || {};
			const playCount = stats.playCount || stats.play_count || stats.viewCount || 0;
			const diggCount = stats.diggCount || stats.digg_count || stats.likeCount || 0;
			const commentCount = stats.commentCount || stats.comment_count || 0;
			const shareCount = stats.shareCount || stats.share_count || 0;
			const engagement = playCount > 0 
				? ((diggCount + commentCount + shareCount) / playCount) * 100
				: 0;
			
			return {
				title: item?.desc || item?.description || item?.title || "Untitled video",
				views: playCount,
				engagement: Math.min(engagement, 100),
				publishedAt: item?.createTime 
					? new Date(item.createTime * 1000).toISOString() 
					: (item?.create_time ? new Date(item.create_time * 1000).toISOString() : now.toISOString()),
			};
		});

		return {
			views: totalViews || 0,
			followers: followerCount || 0,
			engagement: Math.min(engagementRate, 100), // Cap at 100%
			revenue: 0, // TikTok API doesn't provide revenue data
			updatedAt: now.toISOString(),
			trend: {
				views: 0, // Would need historical data to calculate
				followers: 0,
				engagement: 0,
				revenue: 0,
			},
			topContent: topContent.length > 0 ? topContent : analyticsMocks.tiktok.topContent,
		};
	} catch (error) {
		console.error("[analytics] Error fetching TikTok analytics:", error);
		return null;
	}
}

async function fetchInstagramAnalytics(userId?: string): Promise<PlatformAnalyticsSnapshot | null> {
	if (!INSTAGRAM_ACCESS_TOKEN) {
		console.warn("[analytics] Instagram access token missing, using mock data");
		return null;
	}

	try {
		// Use the provided user ID or fetch current user
		const targetUserId = userId || "me";
		
		// Fetch user profile info
		const profileResponse = await fetch(
			`https://graph.instagram.com/${targetUserId}?fields=id,username,account_type&access_token=${INSTAGRAM_ACCESS_TOKEN}`,
			{ cache: "no-store" }
		);

		if (!profileResponse.ok) {
			console.error("[analytics] Instagram profile API error", {
				status: profileResponse.status,
				statusText: profileResponse.statusText,
			});
			return null;
		}

		const profileData = await profileResponse.json();
		const instagramUserId = profileData.id || targetUserId;

		// Fetch media posts
		// Note: Instagram Graph API insights require a Business or Creator account
		// For basic accounts, we'll use media endpoints
		const mediaResponse = await fetch(
			`https://graph.instagram.com/${instagramUserId}/media?fields=id,like_count,comments_count,timestamp,media_type,caption&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=100`,
			{ cache: "no-store" }
		);

		if (!mediaResponse.ok) {
			console.error("[analytics] Instagram media API error", {
				status: mediaResponse.status,
				statusText: mediaResponse.statusText,
			});
			return null;
		}

		const mediaData = (await mediaResponse.json()) as { data?: InstagramMediaItem[] };
		const mediaItems = mediaData.data || [];

		// Calculate totals
		let totalViews = 0;
		let totalLikes = 0;
		let totalComments = 0;
		
		interface ContentItem {
			title: string;
			views: number;
			engagement: number;
			publishedAt: string;
			likes: number;
			comments: number;
		}
		
		const topContent = mediaItems
			.slice(0, 10)
			.map((item: InstagramMediaItem): ContentItem => {
				const likes = item.like_count || 0;
				const comments = item.comments_count || 0;
				const views = likes + comments; // Estimate views from engagement
				totalViews += views;
				totalLikes += likes;
				totalComments += comments;

				const caption = item.caption || "";
				const title = caption.length > 50 ? caption.substring(0, 50) + "..." : (caption || (item.media_type === "VIDEO" ? "Video Post" : "Photo Post"));
				
				return {
					title,
					views: views,
					engagement: views > 0 ? ((likes + comments) / views) * 100 : 0,
					publishedAt: item.timestamp || new Date().toISOString(),
					likes,
					comments,
				};
			})
			.sort((a: ContentItem, b: ContentItem) => b.views - a.views)
			.slice(0, 3)
			.map((item: ContentItem) => ({
				title: item.title,
				views: item.views,
				engagement: Math.min(item.engagement, 100),
				publishedAt: item.publishedAt,
			}));

		// Try to fetch account insights if available (Business/Creator accounts only)
		let followers = 0;
		let engagementRate = 0;
		
		try {
			const insightsResponse = await fetch(
				`https://graph.instagram.com/${instagramUserId}/insights?metric=followers_count,profile_views&period=day&access_token=${INSTAGRAM_ACCESS_TOKEN}`,
				{ cache: "no-store" }
			);

			if (insightsResponse.ok) {
				const insightsData = (await insightsResponse.json()) as InstagramInsightsResponse;
				const followersData = insightsData.data?.find((d: InstagramInsightData) => d.name === "followers_count");
				if (followersData && followersData.values && followersData.values.length > 0) {
					followers = followersData.values[followersData.values.length - 1]?.value || 0;
				}
			}
		} catch (error) {
			// Insights not available for personal accounts, use estimated values
			console.log("[analytics] Instagram insights not available, using estimates");
		}

		// Calculate engagement rate
		if (mediaItems.length > 0) {
			const avgEngagement = (totalLikes + totalComments) / mediaItems.length;
			engagementRate = followers > 0 ? (avgEngagement / followers) * 100 : 0;
		}

		const now = new Date();

		return {
			views: totalViews || 0,
			followers: followers || 0,
			engagement: Math.min(engagementRate, 100),
			revenue: 0, // Instagram API doesn't provide revenue data
			updatedAt: now.toISOString(),
			trend: {
				views: 0, // Would need historical data to calculate
				followers: 0,
				engagement: 0,
				revenue: 0,
			},
			topContent: topContent.length > 0 ? topContent : analyticsMocks.instagram.topContent,
		};
	} catch (error) {
		console.error("[analytics] Error fetching Instagram analytics:", error);
		return null;
	}
}

// Valid platform values
const VALID_PLATFORMS: readonly AnalyticsPlatform[] = ["youtube", "tiktok", "instagram"] as const;

function isValidPlatform(platform: string): platform is AnalyticsPlatform {
	return VALID_PLATFORMS.includes(platform as AnalyticsPlatform);
}

export async function GET(request: NextRequest) {
	try {
		const url = request.nextUrl;
		const requestedPlatforms = url.searchParams.getAll("platform");
		const tiktokSecUid = url.searchParams.get("tiktok_sec_uid"); // Optional sec_uid for TikTok

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
					// Fetch real TikTok data if sec_uid is provided
					if (platform === "tiktok" && tiktokSecUid) {
						const realData = await fetchTikTokAnalytics(tiktokSecUid);
						return {
							platform,
							data: realData || analyticsMocks[platform],
						};
					}
					
					// Fetch real Instagram data if access token is available
					if (platform === "instagram" && INSTAGRAM_ACCESS_TOKEN) {
						const realData = await fetchInstagramAnalytics();
						return {
							platform,
							data: realData || analyticsMocks[platform],
						};
					}
					
					// Use mock data for other platforms or if credentials not provided
					return {
						platform,
						data: analyticsMocks[platform],
					};
				} catch (error) {
					console.error(`[analytics] Error fetching data for ${platform}:`, error);
					// Return mock data on error
					return {
						platform,
						data: analyticsMocks[platform],
					};
				}
			})
		);

		return NextResponse.json({ platforms: payload, generatedAt: new Date().toISOString() });
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

