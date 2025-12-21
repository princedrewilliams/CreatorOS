import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections } from "@/lib/user-data";
import { analyticsMocks, type AnalyticsPlatform, type PlatformAnalyticsSnapshot } from "@/lib/mockAnalytics";

const RAPIDAPI_TIKTOK_ANALYTICS_KEY = process.env.RAPIDAPI_TIKTOK_ANALYTICS_KEY;
const RAPIDAPI_TIKTOK_ANALYTICS_HOST = process.env.RAPIDAPI_TIKTOK_ANALYTICS_HOST || "tikapi5.p.rapidapi.com";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID; // Optional: specific account ID to use

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
		const followerCount = Number(userStats.followerCount ?? userStats.follower_count ?? userInfo.followerCount ?? 0) || 0;
		const videoCount = Number(userStats.videoCount ?? userStats.video_count ?? userInfo.videoCount ?? 0) || 0;
		const totalLikes = Number(userStats.diggCount ?? userStats.digg_count ?? userStats.likeCount ?? 0) || 0;

		// Some TikTok APIs do not return an aggregate view count on the profile.
		// Fall back to summing recent item's play counts when aggregate is missing.
		let totalViews =
			Number(userStats.videoPlayCount ?? userStats.video_play_count ?? userStats.totalPlayCount ?? 0) || 0;

		const itemList = data?.itemList || data?.videos || data?.items || [];
		if (!totalViews && Array.isArray(itemList) && itemList.length > 0) {
			totalViews = itemList.reduce((acc: number, item: TikTokVideoItem) => {
				const stats = item?.stats || item?.statistics || {};
				const playCount =
					Number(stats.playCount ?? stats.play_count ?? stats.viewCount ?? 0) || 0;
				return acc + playCount;
			}, 0);
		}
		
		// Calculate engagement rate (likes + comments + shares / views)
		const totalEngagement = totalLikes + (userStats.commentCount || userStats.comment_count || 0) + (userStats.shareCount || userStats.share_count || 0);
		const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

		// Get top videos if available
		const topContent = itemList.slice(0, 3).map((item: TikTokVideoItem) => {
			const stats = item?.stats || item?.statistics || {};
			const playCount = Number(stats.playCount ?? stats.play_count ?? stats.viewCount ?? 0) || 0;
			const diggCount = Number(stats.diggCount ?? stats.digg_count ?? stats.likeCount ?? 0) || 0;
			const commentCount = Number(stats.commentCount ?? stats.comment_count ?? 0) || 0;
			const shareCount = Number(stats.shareCount ?? stats.share_count ?? 0) || 0;
			const engagement = playCount > 0 
				? ((diggCount + commentCount + shareCount) / playCount) * 100
				: 0;
			
			// Get thumbnail from item (TikTok API may provide cover or dynamic_cover)
			const thumbnail = (item as any)?.cover || (item as any)?.dynamic_cover || (item as any)?.thumbnail;
			
			return {
				title: item?.desc || item?.description || item?.title || "Untitled video",
				views: playCount,
				engagement: Math.min(engagement, 100),
				publishedAt: item?.createTime 
					? new Date(item.createTime * 1000).toISOString() 
					: (item?.create_time ? new Date(item.create_time * 1000).toISOString() : now.toISOString()),
				thumbnail,
				likes: diggCount,
				comments: commentCount,
				shares: shareCount,
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
		// Use the provided user ID, environment variable account ID, or "me" as fallback
		const targetUserId = userId || INSTAGRAM_ACCOUNT_ID || "me";
		
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
			thumbnail?: string;
		}
		
		// Fetch media with thumbnails
		const mediaWithThumbnails = await Promise.all(
			mediaItems.slice(0, 10).map(async (item: InstagramMediaItem) => {
				let thumbnail: string | undefined;
				try {
					// Fetch media details to get thumbnail
					const mediaDetailResponse = await fetch(
						`https://graph.instagram.com/${item.id}?fields=media_url,thumbnail_url,media_type&access_token=${INSTAGRAM_ACCESS_TOKEN}`,
						{ cache: "no-store" }
					);
					if (mediaDetailResponse.ok) {
						const mediaDetail = await mediaDetailResponse.json();
						thumbnail = mediaDetail.thumbnail_url || mediaDetail.media_url;
					}
				} catch (error) {
					console.warn(`Failed to fetch thumbnail for media ${item.id}:`, error);
				}
				
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
					thumbnail,
				};
			})
		);
		
		const topContent = mediaWithThumbnails
			.sort((a: ContentItem, b: ContentItem) => b.views - a.views)
			.slice(0, 3)
			.map((item: ContentItem) => ({
				title: item.title,
				views: item.views,
				engagement: Math.min(item.engagement, 100),
				publishedAt: item.publishedAt,
				thumbnail: item.thumbnail,
				likes: item.likes,
				comments: item.comments,
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

async function fetchTikTokAnalyticsWithAccessToken(accessToken: string): Promise<PlatformAnalyticsSnapshot | null> {
	try {
		// Fetch user profile (to get follower count, etc.)
		const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count", {
			method: "GET",
			headers: { 
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!userResponse.ok) {
			const errorText = await userResponse.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { error: { message: errorText } };
			}
			console.warn("[analytics] TikTok user.info failed", userResponse.status, errorData);
			return null;
		}

		const userData = (await userResponse.json()) as any;
		
		// Check for API errors in response
		if (userData?.error) {
			console.warn("[analytics] TikTok API error in user response:", userData.error);
			return null;
		}
		const user = userData?.data?.user || userData?.user || {};
		const followers = Number(user?.follower_count ?? user?.followers_count ?? 0) || 0;

		// Try to list recent videos to compute total views and top content
		let totalViews = 0;
		let topContent: Array<{ 
			title: string; 
			views: number; 
			engagement: number; 
			publishedAt: string;
			likes?: number;
			comments?: number;
			shares?: number;
			thumbnail?: string;
		}> = [];

		try {
			// Try to fetch video list - this endpoint may require specific permissions
			// If it fails due to scope, we'll fall back to user info only
			const videosResponse = await fetch("https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,cover_image_url,video_description,view_count,like_count,comment_count,share_count", {
				method: "GET",
				headers: { 
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
				cache: "no-store",
			});

			if (videosResponse.ok) {
				const videosData = (await videosResponse.json()) as any;
				
				// Check for API errors in response
				if (videosData?.error) {
					console.warn("[analytics] TikTok API error in videos response:", videosData.error);
				} else {
					const items: any[] = videosData?.data?.videos || videosData?.videos || videosData?.items || [];

					topContent = items.slice(0, 10).map((item: any) => {
					// TikTok API v2 returns fields directly on the item
					const playCount = Number(item?.view_count ?? item?.statistics?.play_count ?? item?.stats?.play_count ?? 0) || 0;
					const likeCount = Number(item?.like_count ?? item?.statistics?.digg_count ?? item?.stats?.like_count ?? 0) || 0;
					const commentCount = Number(item?.comment_count ?? item?.statistics?.comment_count ?? item?.stats?.comment_count ?? 0) || 0;
					const shareCount = Number(item?.share_count ?? item?.statistics?.share_count ?? item?.stats?.share_count ?? 0) || 0;
					const engagement = playCount > 0 ? ((likeCount + commentCount + shareCount) / playCount) * 100 : 0;
					totalViews += playCount;
					
					// Get thumbnail from TikTok video item
					const thumbnail = item?.cover_image_url || item?.cover || item?.dynamic_cover || item?.thumbnail;
					
					return {
						title: item?.title || item?.video_description || item?.desc || "TikTok Video",
						views: playCount,
						engagement: Math.min(engagement, 100),
						publishedAt: item?.create_time
							? new Date(item.create_time * 1000).toISOString()
							: new Date().toISOString(),
						thumbnail,
						likes: likeCount,
						comments: commentCount,
						shares: shareCount,
					};
				}).slice(0, 3);
				}
			} else {
				const errorText = await videosResponse.text();
				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { error: { message: errorText } };
				}
				console.error("[analytics] TikTok video.list failed", {
					status: videosResponse.status,
					statusText: videosResponse.statusText,
					error: errorData,
					errorText: errorText.substring(0, 500), // First 500 chars
				});
				
				// If it's a scope/permission error, log it clearly
				if (videosResponse.status === 403 || videosResponse.status === 401) {
					console.error("[analytics] TikTok video.list requires additional permissions. Check TikTok Developer Portal for required scopes.");
				}
			}
		} catch (error) {
			console.warn("[analytics] TikTok video.list error", error);
		}

		// Calculate engagement rate from top content
		let engagementRate = 0;
		if (topContent.length > 0 && totalViews > 0) {
			const totalEngagement = topContent.reduce(
				(sum, item) => sum + (item.likes || 0) + (item.comments || 0) + (item.shares || 0),
				0
			);
			engagementRate = (totalEngagement / totalViews) * 100;
		}

		const now = new Date();
		
		// Only return data if we have real data - don't fall back to mocks
		// If we have followers but no videos, that's still valid data
		if (followers === 0 && totalViews === 0 && topContent.length === 0) {
			console.warn("[analytics] TikTok: No real data available, returning null");
			return null;
		}
		
		return {
			views: totalViews,
			followers,
			engagement: Math.min(engagementRate, 100),
			revenue: 0,
			updatedAt: now.toISOString(),
			trend: { views: 0, followers: 0, engagement: 0, revenue: 0 },
			topContent: topContent, // Return empty array if no videos, not mock data
		};
	} catch (error) {
		console.error("[analytics] TikTok access-token analytics error:", error);
		return null;
	}
}

async function fetchYouTubeAnalytics(accessToken: string): Promise<PlatformAnalyticsSnapshot | null> {
	// This function is now integrated inline in the GET handler
	// Keeping this as a placeholder for potential future refactoring
	return null;
}

export async function GET(request: NextRequest) {
	try {
		const url = request.nextUrl;
		const requestedPlatforms = url.searchParams.getAll("platform");
		const tiktokSecUid = url.searchParams.get("tiktok_sec_uid"); // Optional sec_uid for TikTok
		
		// Get TikTok access token from cookies first
		let tiktokAccessToken = request.cookies.get("tiktok_access_token")?.value;
		
		// Also check user data store for access token (more reliable for cross-device sync)
		try {
			const user = await getCurrentUser();
			if (user) {
				const socialConnections = getUserSocialConnections(user.whop_user_id);
				const tiktokConnection = socialConnections.find(
					(conn) => conn.platform === "tiktok" && conn.connected && conn.accessToken
				);
				if (tiktokConnection?.accessToken) {
					// Check if token is expired
					const isExpired = tiktokConnection.expiresAt && tiktokConnection.expiresAt < Date.now();
					if (!isExpired) {
						tiktokAccessToken = tiktokConnection.accessToken;
					} else {
						console.warn("[analytics] TikTok access token expired, will try sec_uid fallback");
					}
				}
			}
		} catch (error) {
			console.warn("[analytics] Error getting user data for TikTok token:", error);
		}

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
					// TikTok: Prefer server-side access token if available; fallback to RapidAPI via sec_uid
					if (platform === "tiktok") {
						// Try access token method first
						if (tiktokAccessToken) {
							console.log("[analytics] Attempting TikTok analytics with access token");
							const tokenData = await fetchTikTokAnalyticsWithAccessToken(tiktokAccessToken);
							if (tokenData) {
								console.log("[analytics] TikTok analytics fetched successfully with access token");
								return { platform, data: tokenData };
							}
							console.warn("[analytics] TikTok access token method failed, trying sec_uid fallback");
						} else {
							console.warn("[analytics] TikTok access token not available");
						}
						
						// Fallback to sec_uid method if access token method failed or not available
						if (tiktokSecUid) {
							console.log("[analytics] Attempting TikTok analytics with sec_uid");
							const realData = await fetchTikTokAnalytics(tiktokSecUid);
							if (realData) {
								console.log("[analytics] TikTok analytics fetched successfully with sec_uid");
								return {
									platform,
									data: realData,
								};
							}
							console.warn("[analytics] TikTok sec_uid method also failed");
						} else {
							console.warn("[analytics] TikTok sec_uid not available");
						}
						
						// If both methods failed, return null - don't use mock data
						console.error("[analytics] Both TikTok methods failed - no real data available. User needs to reconnect TikTok account.");
						return {
							platform,
							data: null, // Return null instead of mock data
						};
					}
					
			// Fetch real Instagram data if access token is available
			if (platform === "instagram" && INSTAGRAM_ACCESS_TOKEN) {
				// Use specific account ID if provided, otherwise use "me" or userId from OAuth
				const accountId = INSTAGRAM_ACCOUNT_ID || undefined;
				const realData = await fetchInstagramAnalytics(accountId);
				if (realData) {
					return {
						platform,
						data: realData,
					};
				}
				// Return null if no real data - don't use mock
				return {
					platform,
					data: null,
				};
			}
			
			// Fetch real YouTube data if access token is available
			if (platform === "youtube") {
				const youtubeAccessToken = request.cookies.get("youtube_access_token")?.value;
				if (youtubeAccessToken) {
					try {
						// Get channel statistics and videos
						const channelResponse = await fetch(
							`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`,
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
								const stats = channel.statistics;
								const subscribers = Number(stats.subscriberCount || 0);
								const videoCount = Number(stats.videoCount || 0);
								
								// Get recent videos
								const videosResponse = await fetch(
									`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&forMine=true&maxResults=10&order=viewCount`,
									{
										headers: {
											Authorization: `Bearer ${youtubeAccessToken}`,
										},
									}
								);
								
								let topContent: Array<{ title: string; views: number; engagement: number; publishedAt: string; thumbnail?: string; likes?: number; comments?: number }> = [];
								let totalViews = 0;
								
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
												const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
												totalViews += views;
												
												return {
													title: item.snippet?.title || "Untitled Video",
													views,
													engagement: Math.min(engagement, 100),
													publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
													thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
													likes,
													comments,
												};
											});
										}
									}
								}
								
								const now = new Date();
								return {
									platform,
									data: {
										views: totalViews,
										followers: subscribers,
										engagement: subscribers > 0 ? (totalViews / subscribers / videoCount) * 100 : 0,
										revenue: 0,
										updatedAt: now.toISOString(),
										trend: { views: 0, followers: 0, engagement: 0, revenue: 0 },
										topContent: topContent.length > 0 ? topContent : analyticsMocks.youtube.topContent,
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

