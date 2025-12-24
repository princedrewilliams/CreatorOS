export type AnalyticsPlatform = "youtube";

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
	subscriberGrowth?: number; // Subscriber growth per video (from API)
	impressions?: number; // Total impressions
	audienceRetention?: number; // Average retention percentage
	viewsToday?: number; // Actual views today from API (not estimated)
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
};

export interface AnalyticsResponse {
	platform: AnalyticsPlatform;
	data: PlatformAnalyticsSnapshot;
}

