export type AnalyticsPlatform = "youtube" | "tiktok" | "instagram";

export interface PlatformAnalyticsSnapshot {
	views: number;
	followers: number;
	engagement: number;
	revenue: number;
	updatedAt: string;
	trend: {
		views: number;
		followers: number;
		engagement: number;
		revenue: number;
	};
	topContent: Array<{
		title: string;
		views: number;
		engagement: number;
		publishedAt: string;
		thumbnail?: string;
		likes?: number;
		comments?: number;
		shares?: number;
	}>;
	// Additional YouTube metrics
	watchTime?: number; // in minutes
	avgViewDuration?: number; // in seconds
	ctr?: number; // Click-Through Rate percentage
	trafficSources?: Record<string, number>; // Traffic source breakdown
	subscriberGrowth?: number; // Subscriber growth per video
	impressions?: number; // Total impressions
	audienceRetention?: number; // Average retention percentage
}

const now = new Date();

export const analyticsMocks: Record<AnalyticsPlatform, PlatformAnalyticsSnapshot> = {
	youtube: {
		views: 1250000,
		followers: 45200,
		engagement: 4.2,
		revenue: 2450,
		updatedAt: now.toISOString(),
		trend: { views: 12.5, followers: 8.1, engagement: 1.4, revenue: 6.3 },
		topContent: [
			{ title: "How I grew to 100K subs", views: 325000, engagement: 6.1, publishedAt: "2024-10-01" },
			{ title: "Day in the life – Creator", views: 207000, engagement: 5.4, publishedAt: "2024-10-04" },
			{ title: "Behind the scenes Q&A", views: 162000, engagement: 4.8, publishedAt: "2024-10-12" },
		],
	},
	tiktok: {
		views: 850000,
		followers: 32000,
		engagement: 6.8,
		revenue: 1200,
		updatedAt: now.toISOString(),
		trend: { views: 9.6, followers: 11.2, engagement: 2.1, revenue: 4.5 },
		topContent: [
			{ title: "30 sec brand pitch", views: 185000, engagement: 8.5, publishedAt: "2024-10-07" },
			{ title: "Creator productivity hacks", views: 143000, engagement: 7.2, publishedAt: "2024-10-11" },
			{ title: "Morning routine short", views: 119000, engagement: 6.1, publishedAt: "2024-10-13" },
		],
	},
	instagram: {
		views: 520000,
		followers: 28000,
		engagement: 5.1,
		revenue: 980,
		updatedAt: now.toISOString(),
		trend: { views: 7.4, followers: 6.8, engagement: 1.9, revenue: 5.0 },
		topContent: [
			{ title: "Carousel: Studio tour", views: 88000, engagement: 5.9, publishedAt: "2024-10-03" },
			{ title: "Reel: New gear unboxing", views: 74500, engagement: 6.2, publishedAt: "2024-10-08" },
			{ title: "Reel: Viral dance video", views: 69200, engagement: 6.5, publishedAt: "2024-10-10" },
		],
	},
};

export interface AnalyticsResponse {
	platform: AnalyticsPlatform;
	data: PlatformAnalyticsSnapshot;
}

