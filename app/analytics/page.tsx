"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { BarChartIcon, ReloadIcon, DownloadIcon, HeartIcon, ChatBubbleIcon, Share1Icon, ArrowUpIcon, VideoIcon, LightningBoltIcon, ExclamationTriangleIcon, TrendingUpIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";
import { SocialConnections } from "@/components/SocialConnections";
import { useAppStore, type SocialConnection } from "@/lib/store";
import type { AnalyticsPlatform, PlatformAnalyticsSnapshot } from "@/lib/mockAnalytics";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

type AnalyticsMap = Partial<Record<AnalyticsPlatform, PlatformAnalyticsSnapshot>>;

const PLATFORM_META: Record<
	AnalyticsPlatform,
	{ label: string; color: "red" | "cyan" | "pink"; followerLabel: string }
> = {
	youtube: { label: "YouTube", color: "red", followerLabel: "Subscribers" },
	tiktok: { label: "TikTok", color: "cyan", followerLabel: "Followers" },
	instagram: { label: "Instagram", color: "pink", followerLabel: "Followers" },
};

const formatCompact = (value: number, style: "decimal" | "currency" = "decimal") =>
	new Intl.NumberFormat("en", {
		notation: "compact",
		maximumFractionDigits: 1,
		...(style === "currency" ? { style: "currency", currency: "USD" } : {}),
	}).format(value);

const formatPercent = (value: number) =>
	new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(value / 100);

type ChartType = "bar" | "pie" | "line" | "area";

export default function AnalyticsPage() {
	const { socialConnections } = useAppStore();
	const [analytics, setAnalytics] = useState<AnalyticsMap>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [viewsChartType, setViewsChartType] = useState<ChartType>("bar");
	const [followersChartType, setFollowersChartType] = useState<ChartType>("bar");
	const [engagementChartType, setEngagementChartType] = useState<ChartType>("line");
	const [revenueChartType, setRevenueChartType] = useState<ChartType>("pie");
	const [autoInsightsEnabled, setAutoInsightsEnabled] = useState(true);
	const [autoAlertsEnabled, setAutoAlertsEnabled] = useState(true);
	const [autoCompareEnabled, setAutoCompareEnabled] = useState(true);
	const [trendAutomationEnabled, setTrendAutomationEnabled] = useState(true);
	const [dailyInsights, setDailyInsights] = useState<any>(null);
	const [alerts, setAlerts] = useState<any[]>([]);
	const [loadingInsights, setLoadingInsights] = useState(false);

	const connectedPlatforms = useMemo(
		() =>
			socialConnections
				.filter((connection) => connection.connected)
				.map((connection) => connection.platform) as AnalyticsPlatform[],
		[socialConnections]
	);

	const fetchAnalytics = useCallback(async () => {
		if (connectedPlatforms.length === 0) {
			setAnalytics({});
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Get TikTok sec_uid from connection if available
			const tiktokConnection = socialConnections.find(
				(conn) => conn.platform === "tiktok" && conn.connected
			);
			const tiktokSecUid = tiktokConnection?.userId; // Store sec_uid in userId field
			
			const queryParams = new URLSearchParams();
			connectedPlatforms.forEach((platform) => {
				queryParams.append("platform", platform);
			});
			if (tiktokSecUid) {
				queryParams.set("tiktok_sec_uid", tiktokSecUid);
			}
			
			const response = await fetch(`/api/analytics?${queryParams.toString()}`, { cache: "no-store" });

			if (!response.ok) {
				throw new Error("Failed to load analytics data");
			}

			const payload = (await response.json()) as {
				platforms: Array<{ platform: AnalyticsPlatform; data: PlatformAnalyticsSnapshot }>;
			};

			const map: AnalyticsMap = {};
			for (const entry of payload.platforms) {
				map[entry.platform] = entry.data;
			}

			setAnalytics(map);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unexpected error");
			setAnalytics({});
		} finally {
			setLoading(false);
		}
	}, [connectedPlatforms, socialConnections]);

	useEffect(() => {
		void fetchAnalytics();
	}, [fetchAnalytics]);

	const totals = useMemo(() => {
		const snapshots = Object.values(analytics).filter(Boolean) as PlatformAnalyticsSnapshot[];

		if (snapshots.length === 0) {
			return null;
		}

		const totalsData = snapshots.reduce(
			(acc, snapshot) => {
				// Calculate total interactions (likes + comments + shares)
				const totalInteractions = snapshot.topContent.reduce((sum, content) => {
					return sum + (content.likes || 0) + (content.comments || 0) + (content.shares || 0);
				}, 0);
				
				// Calculate total videos/posts
				const totalVideos = snapshot.topContent.length;
				
				// Calculate average views per video
				const avgViewsPerVideo = totalVideos > 0 
					? snapshot.topContent.reduce((sum, content) => sum + content.views, 0) / totalVideos
					: 0;

				return {
					views: acc.views + snapshot.views,
					followers: acc.followers + snapshot.followers,
					revenue: acc.revenue + snapshot.revenue,
					engagement: acc.engagement + snapshot.engagement,
					interactions: acc.interactions + totalInteractions,
					totalVideos: acc.totalVideos + totalVideos,
					totalViewsFromContent: acc.totalViewsFromContent + snapshot.topContent.reduce((sum, c) => sum + c.views, 0),
					trend: {
						views: acc.trend.views + snapshot.trend.views,
						followers: acc.trend.followers + snapshot.trend.followers,
						engagement: acc.trend.engagement + snapshot.trend.engagement,
						revenue: acc.trend.revenue + snapshot.trend.revenue,
					},
					count: acc.count + 1,
				};
			},
			{
				views: 0,
				followers: 0,
				revenue: 0,
				engagement: 0,
				interactions: 0,
				totalVideos: 0,
				totalViewsFromContent: 0,
				trend: { views: 0, followers: 0, engagement: 0, revenue: 0 },
				count: 0,
			}
		);

		// Calculate average views per video across all platforms
		const avgViewsPerVideo = totalsData.totalVideos > 0 
			? totalsData.totalViewsFromContent / totalsData.totalVideos 
			: 0;

		return {
			...totalsData,
			avgViewsPerVideo,
		};
	}, [analytics]);

	// Prepare chart data
	const chartData = useMemo(() => {
		const snapshots = Object.values(analytics).filter(Boolean) as PlatformAnalyticsSnapshot[];
		if (snapshots.length === 0) return [];

		return connectedPlatforms
			.map((platform) => {
				const snapshot = analytics[platform];
				const meta = PLATFORM_META[platform];
				if (!snapshot) return null;

				return {
					platform: meta.label,
					views: snapshot.views,
					followers: snapshot.followers,
					engagement: snapshot.engagement,
					revenue: snapshot.revenue,
					color: meta.color,
				};
			})
			.filter(Boolean) as Array<{
				platform: string;
				views: number;
				followers: number;
				engagement: number;
				revenue: number;
				color: "red" | "cyan" | "pink";
			}>;
	}, [analytics, connectedPlatforms]);

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						Analytics Dashboard
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Track performance across YouTube, TikTok, and Instagram
					</Text>
				</div>
				<div className="flex gap-2 sm:gap-3 flex-shrink-0">
					<Button variant="soft" size="2" color="gray" onClick={() => fetchAnalytics()} disabled={loading || connectedPlatforms.length === 0}>
						<ReloadIcon className="mr-2" />
						Refresh
					</Button>
					<Button 
						variant="soft" 
						size="2" 
						color="green" 
						onClick={async () => {
							const queryParams = new URLSearchParams();
							connectedPlatforms.forEach((platform) => {
								queryParams.append("platform", platform);
							});
							const url = `/api/export-analytics?${queryParams.toString()}`;
							const response = await fetch(url);
							const blob = await response.blob();
							const downloadUrl = window.URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = downloadUrl;
							a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.csv`;
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							window.URL.revokeObjectURL(downloadUrl);
						}}
						disabled={connectedPlatforms.length === 0}
					>
						<DownloadIcon className="mr-2" />
						Export to Google Sheets
					</Button>
				</div>
			</div>

			<SocialConnections />

			{/* Automation Features */}
			{connectedPlatforms.length > 0 && (
				<Card size="3" variant="surface" className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<LightningBoltIcon className="w-5 h-5 text-purple-9" />
						<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12">
							Automation Features
						</Heading>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card size="2" variant="surface" className="p-4">
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<BarChartIcon className="w-4 h-4 text-purple-9" />
										<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
											Auto Daily Insights
										</Text>
									</div>
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
										Get growth summary, underperforming videos, and recommendations daily
									</Text>
								</div>
							</div>
							<Button
								variant={autoInsightsEnabled ? "soft" : "outline"}
								color={autoInsightsEnabled ? "green" : "gray"}
								size="2"
								onClick={() => setAutoInsightsEnabled(!autoInsightsEnabled)}
								className="w-full"
							>
								{autoInsightsEnabled ? "Enabled" : "Enable"}
							</Button>
						</Card>
						<Card size="2" variant="surface" className="p-4">
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<ExclamationTriangleIcon className="w-4 h-4 text-purple-9" />
										<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
											Auto Alerts
										</Text>
									</div>
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
										Get alerts for underperforming videos with optimization suggestions
									</Text>
								</div>
							</div>
							<Button
								variant={autoAlertsEnabled ? "soft" : "outline"}
								color={autoAlertsEnabled ? "green" : "gray"}
								size="2"
								onClick={() => setAutoAlertsEnabled(!autoAlertsEnabled)}
								className="w-full"
							>
								{autoAlertsEnabled ? "Enabled" : "Enable"}
							</Button>
						</Card>
						<Card size="2" variant="surface" className="p-4">
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<TrendingUpIcon className="w-4 h-4 text-purple-9" />
										<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
											Auto-Compare
										</Text>
									</div>
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
										Compare CTR and engagement across platforms with suggestions
									</Text>
								</div>
							</div>
							<Button
								variant={autoCompareEnabled ? "soft" : "outline"}
								color={autoCompareEnabled ? "green" : "gray"}
								size="2"
								onClick={() => setAutoCompareEnabled(!autoCompareEnabled)}
								className="w-full"
							>
								{autoCompareEnabled ? "Enabled" : "Enable"}
							</Button>
						</Card>
						<Card size="2" variant="surface" className="p-4">
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-2">
										<VideoIcon className="w-4 h-4 text-purple-9" />
										<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
											Trend Automation
										</Text>
									</div>
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
										Detect trending sounds/hashtags and auto-suggest content ideas
									</Text>
								</div>
							</div>
							<Button
								variant={trendAutomationEnabled ? "soft" : "outline"}
								color={trendAutomationEnabled ? "green" : "gray"}
								size="2"
								onClick={() => setTrendAutomationEnabled(!trendAutomationEnabled)}
								className="w-full"
							>
								{trendAutomationEnabled ? "Enabled" : "Enable"}
							</Button>
						</Card>
					</div>
				</Card>
			)}

			{/* Daily Insights */}
			{dailyInsights && autoInsightsEnabled && connectedPlatforms.length > 0 && (
				<Card size="3" variant="surface" className="p-6">
					<Heading size="5" as="h3" className="mb-4 text-gray-12 dark:text-gray-12">
						Daily Insights
					</Heading>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
						<Card size="2" variant="surface" className="p-4">
							<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
								Followers Growth
							</Text>
							<Text size="4" weight="bold" className={`${dailyInsights.growthSummary?.followers?.trend === "up" ? "text-green-11" : "text-red-11"}`}>
								{dailyInsights.growthSummary?.followers?.trend === "up" ? "+" : ""}
								{formatCompact(dailyInsights.growthSummary?.followers?.change || 0)} ({dailyInsights.growthSummary?.followers?.percent?.toFixed(1)}%)
							</Text>
						</Card>
						<Card size="2" variant="surface" className="p-4">
							<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
								Views Growth
							</Text>
							<Text size="4" weight="bold" className={`${dailyInsights.growthSummary?.views?.trend === "up" ? "text-green-11" : "text-red-11"}`}>
								{dailyInsights.growthSummary?.views?.trend === "up" ? "+" : ""}
								{formatCompact(dailyInsights.growthSummary?.views?.change || 0)} ({dailyInsights.growthSummary?.views?.percent?.toFixed(1)}%)
							</Text>
						</Card>
						<Card size="2" variant="surface" className="p-4">
							<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
								Engagement Growth
							</Text>
							<Text size="4" weight="bold" className={`${dailyInsights.growthSummary?.engagement?.trend === "up" ? "text-green-11" : "text-red-11"}`}>
								{dailyInsights.growthSummary?.engagement?.trend === "up" ? "+" : ""}
								{dailyInsights.growthSummary?.engagement?.change?.toFixed(1)}% ({dailyInsights.growthSummary?.engagement?.percent?.toFixed(1)}%)
							</Text>
						</Card>
					</div>
					{dailyInsights.recommendations && dailyInsights.recommendations.length > 0 && (
						<div className="space-y-2">
							<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
								Recommendations
							</Text>
							{dailyInsights.recommendations.map((rec: string, i: number) => (
								<Card key={i} size="1" variant="surface" className="p-3">
									<Text size="2" className="text-gray-11 dark:text-gray-11">
										• {rec}
									</Text>
								</Card>
							))}
						</div>
					)}
				</Card>
			)}

			{/* Alerts */}
			{alerts.length > 0 && autoAlertsEnabled && connectedPlatforms.length > 0 && (
				<Card size="3" variant="surface" className="p-6 border-amber-a6 bg-amber-a2">
					<div className="flex items-center gap-2 mb-4">
						<ExclamationTriangleIcon className="w-5 h-5 text-amber-11" />
						<Heading size="5" as="h3" className="text-amber-11">
							Performance Alerts
						</Heading>
					</div>
					<div className="space-y-3">
						{alerts.map((alert: any, i: number) => (
							<Card key={i} size="2" variant="surface" className="p-4">
								<Text size="3" weight="medium" className="mb-2 text-gray-12 dark:text-gray-12">
									{alert.message}
								</Text>
								{alert.suggestions && (
									<ul className="space-y-1 mt-2">
										{alert.suggestions.map((suggestion: string, j: number) => (
											<li key={j} className="text-sm text-gray-11 dark:text-gray-11">
												• {suggestion}
											</li>
										))}
									</ul>
								)}
							</Card>
						))}
					</div>
				</Card>
			)}

			{connectedPlatforms.length === 0 ? (
				<Card size="3" variant="surface" className="p-8 border-dashed border-gray-a5">
					<Heading size="5" as="h2" className="mb-3 text-gray-12 dark:text-gray-12">
						Connect an account to view analytics
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 max-w-2xl">
						Link your YouTube, TikTok, or Instagram profile using the social connections panel above.
						We&apos;ll pull in your latest reach, engagement, and revenue numbers automatically.
					</Text>
				</Card>
			) : (
				<>
					{error && (
						<Card size="2" variant="surface" className="p-4 border border-red-a6 bg-red-a2">
							<Text size="2" color="red" className="text-red-11 dark:text-red-10">
								{error}
							</Text>
						</Card>
					)}

					<div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{connectedPlatforms.map((platform, index) => {
							const analyticsSnapshot = analytics[platform];
							const meta = PLATFORM_META[platform];

							return (
								<motion.div
									key={platform}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<Card size="3" variant="surface" className="p-4 sm:p-6">
										<div className="flex flex-col gap-3 sm:gap-4">
											<div className="flex items-center gap-3">
												{(() => {
													const connection = socialConnections.find((c) => c.platform === platform && c.connected);
													return connection?.profilePicture ? (
														<img
															src={connection.profilePicture}
															alt={`${connection.username || meta.label} profile`}
															className="w-12 h-12 rounded-lg object-cover border-2"
															style={{ borderColor: `var(--${meta.color}-a6)` }}
														/>
													) : (
														<div
															className="w-12 h-12 rounded-lg flex items-center justify-center"
															style={{
																backgroundColor: `var(--${meta.color}-a2)`,
																color: `var(--${meta.color}-11)`,
															}}
														>
															<BarChartIcon className="w-6 h-6" />
														</div>
													);
												})()}
												<div>
													<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
														{meta.label}
													</Heading>
													<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
														{(() => {
															const connection = socialConnections.find((c) => c.platform === platform && c.connected);
															return connection?.username ? `@${connection.username}` : "Updated " + (analyticsSnapshot ? new Date(analyticsSnapshot.updatedAt).toLocaleString() : "—");
														})()}
													</Text>
												</div>
											</div>
											<Separator />
											{!analyticsSnapshot && (
												<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
													{loading ? "Fetching analytics..." : "No analytics available yet."}
												</Text>
											)}
											{analyticsSnapshot && (
												<div className="space-y-4">
													<div className="grid grid-cols-2 gap-4">
														<div>
															<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
																Views
															</Text>
															<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
																{formatCompact(analyticsSnapshot.views)}
															</Text>
															<Badge color="green" size="1" variant="soft" className="mt-1">
																{formatPercent(analyticsSnapshot.trend.views)}
															</Badge>
														</div>
														<div>
															<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
																{meta.followerLabel}
															</Text>
															<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
																{formatCompact(analyticsSnapshot.followers)}
															</Text>
															<Badge color="green" size="1" variant="soft" className="mt-1">
																{formatPercent(analyticsSnapshot.trend.followers)}
															</Badge>
														</div>
														<div>
															<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
																Engagement
															</Text>
															<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
																{analyticsSnapshot.engagement.toFixed(1)}%
															</Text>
															<Badge color="green" size="1" variant="soft" className="mt-1">
																{formatPercent(analyticsSnapshot.trend.engagement)}
															</Badge>
														</div>
														<div>
															<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
																Revenue
															</Text>
															<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
																{formatCompact(analyticsSnapshot.revenue, "currency")}
															</Text>
															<Badge color="green" size="1" variant="soft" className="mt-1">
																{formatPercent(analyticsSnapshot.trend.revenue)}
															</Badge>
														</div>
													</div>
													
													{/* Additional KPIs */}
													<Separator />
													<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
														<div>
															<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11 flex items-center gap-1">
																<VideoIcon className="w-3 h-3" />
																Posts
															</Text>
															<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
																{analyticsSnapshot.topContent.length}
															</Text>
														</div>
														<div>
															<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11 flex items-center gap-1">
																<ArrowUpIcon className="w-3 h-3" />
																Avg Views/Post
															</Text>
															<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
																{analyticsSnapshot.topContent.length > 0
																	? formatCompact(
																			analyticsSnapshot.topContent.reduce((sum, c) => sum + c.views, 0) /
																				analyticsSnapshot.topContent.length
																	  )
																	: "0"}
															</Text>
														</div>
														<div>
															<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11 flex items-center gap-1">
																<HeartIcon className="w-3 h-3" />
																Total Interactions
															</Text>
															<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
																{formatCompact(
																	analyticsSnapshot.topContent.reduce(
																		(sum, c) => sum + (c.likes || 0) + (c.comments || 0) + (c.shares || 0),
																		0
																	)
																)}
															</Text>
														</div>
													</div>
													<div>
														<div className="flex items-center justify-between mb-2">
															<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12">
																Top performing content
															</Text>
															<Button
																variant="ghost"
																size="1"
																asChild
															>
																<Link href={`/analytics/posts?platform=${platform}`}>
																	View All
																</Link>
															</Button>
														</div>
														<div className="space-y-2">
															{analyticsSnapshot.topContent.map((piece) => (
																<div
																	key={`${platform}-${piece.title}`}
																	className="rounded-lg border border-gray-a4 dark:border-gray-a6 p-3 flex gap-3"
																>
																	{piece.thumbnail && (
																		<img
																			src={piece.thumbnail}
																			alt={piece.title}
																			className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
																		/>
																	)}
																	<div className="flex-1 min-w-0">
																		<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12 line-clamp-2">
																			{piece.title}
																		</Text>
																		<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
																			{formatCompact(piece.views)} views · {piece.engagement.toFixed(1)}% engagement
																		</Text>
																		{(piece.likes !== undefined || piece.comments !== undefined || piece.shares !== undefined) && (
																			<div className="flex gap-2 mt-1">
																				{piece.likes !== undefined && (
																					<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
																						❤️ {formatCompact(piece.likes)}
																					</Text>
																				)}
																				{piece.comments !== undefined && (
																					<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
																						💬 {formatCompact(piece.comments)}
																					</Text>
																				)}
																				{piece.shares !== undefined && (
																					<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
																						🔁 {formatCompact(piece.shares)}
																					</Text>
																				)}
																			</div>
																		)}
																		<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
																			{new Date(piece.publishedAt).toLocaleDateString()}
																		</Text>
																	</div>
																</div>
															))}
														</div>
													</div>
												</div>
											)}
										</div>
									</Card>
								</motion.div>
							);
						})}
					</div>

					{/* Charts Section */}
					{chartData.length > 0 && (
						<>
							<Card size="3" variant="surface" className="p-4 sm:p-6">
								<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
									Analytics Charts
								</Heading>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									{/* Views Chart */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12">
												Views
											</Text>
											<div className="flex gap-1">
												{(["bar", "pie", "line", "area"] as ChartType[]).map((type) => (
													<Button
														key={type}
														variant={viewsChartType === type ? "soft" : "ghost"}
														size="1"
														onClick={() => setViewsChartType(type)}
														className="capitalize text-xs px-1.5 py-0.5"
													>
														{type.charAt(0)}
													</Button>
												))}
											</div>
										</div>
										<div className="h-32 sm:h-40">
											<ResponsiveContainer width="100%" height="100%">
												{viewsChartType === "bar" ? (
											<BarChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Bar dataKey="views" fill="var(--blue-9)" name="Views" />
											</BarChart>
										) : viewsChartType === "pie" ? (
											<PieChart>
												<Pie
													data={chartData}
													dataKey="views"
													nameKey="platform"
													cx="50%"
													cy="50%"
													outerRadius={60}
													label={(entry: any) => `${entry.platform}: ${formatCompact(entry.views)}`}
												>
													{chartData.map((entry: { color: "red" | "cyan" | "pink" }, index: number) => (
														<Cell key={`cell-${index}`} fill={`var(--${entry.color}-9)`} />
													))}
												</Pie>
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
											</PieChart>
										) : viewsChartType === "line" ? (
											<LineChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Line type="monotone" dataKey="views" stroke="var(--blue-9)" strokeWidth={2} name="Views" />
											</LineChart>
										) : (
											<AreaChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Area type="monotone" dataKey="views" stroke="var(--blue-9)" fill="var(--blue-a3)" name="Views" />
											</AreaChart>
												)}
											</ResponsiveContainer>
										</div>
									</div>

									{/* Followers Chart */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12">
												Followers
											</Text>
											<div className="flex gap-1">
												{(["bar", "pie", "line", "area"] as ChartType[]).map((type) => (
													<Button
														key={type}
														variant={followersChartType === type ? "soft" : "ghost"}
														size="1"
														onClick={() => setFollowersChartType(type)}
														className="capitalize text-xs px-1.5 py-0.5"
													>
														{type.charAt(0)}
													</Button>
												))}
											</div>
										</div>
										<div className="h-32 sm:h-40">
											<ResponsiveContainer width="100%" height="100%">
												{followersChartType === "bar" ? (
											<BarChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Bar dataKey="followers" fill="var(--green-9)" name="Followers" />
											</BarChart>
										) : followersChartType === "pie" ? (
											<PieChart>
												<Pie
													data={chartData}
													dataKey="followers"
													nameKey="platform"
													cx="50%"
													cy="50%"
													outerRadius={60}
													label={(entry: any) => `${entry.platform}: ${formatCompact(entry.followers)}`}
												>
													{chartData.map((entry: { color: "red" | "cyan" | "pink" }, index: number) => (
														<Cell key={`cell-${index}`} fill={`var(--${entry.color}-9)`} />
													))}
												</Pie>
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
											</PieChart>
										) : followersChartType === "line" ? (
											<LineChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Line type="monotone" dataKey="followers" stroke="var(--green-9)" strokeWidth={2} name="Followers" />
											</LineChart>
										) : (
											<AreaChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Area type="monotone" dataKey="followers" stroke="var(--green-9)" fill="var(--green-a3)" name="Followers" />
											</AreaChart>
												)}
											</ResponsiveContainer>
										</div>
									</div>

									{/* Engagement Chart */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12">
												Engagement
											</Text>
											<div className="flex gap-1">
												{(["bar", "pie", "line", "area"] as ChartType[]).map((type) => (
													<Button
														key={type}
														variant={engagementChartType === type ? "soft" : "ghost"}
														size="1"
														onClick={() => setEngagementChartType(type)}
														className="capitalize text-xs px-1.5 py-0.5"
													>
														{type.charAt(0)}
													</Button>
												))}
											</div>
										</div>
										<div className="h-32 sm:h-40">
											<ResponsiveContainer width="100%" height="100%">
												{engagementChartType === "bar" ? (
											<BarChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Bar dataKey="engagement" fill="var(--purple-9)" name="Engagement %" />
											</BarChart>
										) : engagementChartType === "pie" ? (
											<PieChart>
												<Pie
													data={chartData}
													dataKey="engagement"
													nameKey="platform"
													cx="50%"
													cy="50%"
													outerRadius={60}
													label={(entry: any) => `${entry.platform}: ${entry.engagement.toFixed(1)}%`}
												>
													{chartData.map((entry: { color: "red" | "cyan" | "pink" }, index: number) => (
														<Cell key={`cell-${index}`} fill={`var(--${entry.color}-9)`} />
													))}
												</Pie>
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
											</PieChart>
										) : engagementChartType === "line" ? (
											<LineChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Line type="monotone" dataKey="engagement" stroke="var(--purple-9)" strokeWidth={2} name="Engagement %" />
											</LineChart>
										) : (
											<AreaChart data={chartData}>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
												<XAxis dataKey="platform" stroke="var(--gray-11)" />
												<YAxis stroke="var(--gray-11)" />
												<Tooltip
													contentStyle={{
														backgroundColor: "var(--gray-a2)",
														border: "1px solid var(--gray-a6)",
														borderRadius: "8px",
													}}
												/>
												<Legend />
												<Area type="monotone" dataKey="engagement" stroke="var(--purple-9)" fill="var(--purple-a3)" name="Engagement %" />
											</AreaChart>
										)}
									</ResponsiveContainer>
										</div>
									</div>

									{/* Revenue Chart */}
									{chartData.some((d: { revenue: number }) => d.revenue > 0) && (
										<div>
											<div className="flex items-center justify-between mb-2">
												<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12">
													Revenue
												</Text>
												<div className="flex gap-1">
													{(["bar", "pie", "line", "area"] as ChartType[]).map((type) => (
														<Button
															key={type}
															variant={revenueChartType === type ? "soft" : "ghost"}
															size="1"
															onClick={() => setRevenueChartType(type)}
															className="capitalize text-xs px-1.5 py-0.5"
														>
															{type.charAt(0)}
														</Button>
													))}
												</div>
											</div>
											<div className="h-32 sm:h-40">
												<ResponsiveContainer width="100%" height="100%">
													{revenueChartType === "bar" ? (
												<BarChart data={chartData}>
													<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
													<XAxis dataKey="platform" stroke="var(--gray-11)" />
													<YAxis stroke="var(--gray-11)" />
													<Tooltip
														contentStyle={{
															backgroundColor: "var(--gray-a2)",
															border: "1px solid var(--gray-a6)",
															borderRadius: "8px",
														}}
														formatter={(value: number) => formatCompact(value, "currency")}
													/>
													<Legend />
													<Bar dataKey="revenue" fill="var(--green-9)" name="Revenue" />
												</BarChart>
											) : revenueChartType === "pie" ? (
												<PieChart>
													<Pie
														data={chartData.filter((d: { revenue: number }) => d.revenue > 0)}
														dataKey="revenue"
														nameKey="platform"
														cx="50%"
														cy="50%"
														outerRadius={60}
														label={(entry: any) => `${entry.platform}: ${formatCompact(entry.revenue, "currency")}`}
													>
														{chartData.map((entry, index) => (
															<Cell key={`cell-${index}`} fill={`var(--${entry.color}-9)`} />
														))}
													</Pie>
													<Tooltip
														contentStyle={{
															backgroundColor: "var(--gray-a2)",
															border: "1px solid var(--gray-a6)",
															borderRadius: "8px",
														}}
														formatter={(value: number) => formatCompact(value, "currency")}
													/>
												</PieChart>
											) : revenueChartType === "line" ? (
												<LineChart data={chartData}>
													<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
													<XAxis dataKey="platform" stroke="var(--gray-11)" />
													<YAxis stroke="var(--gray-11)" />
													<Tooltip
														contentStyle={{
															backgroundColor: "var(--gray-a2)",
															border: "1px solid var(--gray-a6)",
															borderRadius: "8px",
														}}
														formatter={(value: number) => formatCompact(value, "currency")}
													/>
													<Legend />
													<Line type="monotone" dataKey="revenue" stroke="var(--green-9)" strokeWidth={2} name="Revenue" />
												</LineChart>
											) : (
												<AreaChart data={chartData}>
													<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a4)" />
													<XAxis dataKey="platform" stroke="var(--gray-11)" />
													<YAxis stroke="var(--gray-11)" />
													<Tooltip
														contentStyle={{
															backgroundColor: "var(--gray-a2)",
															border: "1px solid var(--gray-a6)",
															borderRadius: "8px",
														}}
														formatter={(value: number) => formatCompact(value, "currency")}
													/>
													<Legend />
													<Area type="monotone" dataKey="revenue" stroke="var(--green-9)" fill="var(--green-a3)" name="Revenue" />
												</AreaChart>
											)}
												</ResponsiveContainer>
											</div>
										</div>
									)}
								</div>
							</Card>
						</>
					)}

					{totals && (
						<>
							<Card size="3" variant="surface" className="p-6">
								<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
									Overall Performance (All Platforms)
								</Heading>
								<div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
									<div>
										<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
											Total Views
										</Text>
										<Heading size="7" weight="bold" className="text-gray-12 dark:text-gray-12">
											{formatCompact(totals.views)}
										</Heading>
										<Badge color="green" size="1" variant="soft" className="mt-2">
											{formatPercent(totals.trend.views / totals.count)}
										</Badge>
									</div>
									<div>
										<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
											Total Followers
										</Text>
										<Heading size="7" weight="bold" className="text-gray-12 dark:text-gray-12">
											{formatCompact(totals.followers)}
										</Heading>
										<Badge color="green" size="1" variant="soft" className="mt-2">
											{formatPercent(totals.trend.followers / totals.count)}
										</Badge>
									</div>
									<div>
										<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
											Avg Engagement
										</Text>
										<Heading size="7" weight="bold" className="text-gray-12 dark:text-gray-12">
											{(totals.engagement / totals.count).toFixed(1)}%
										</Heading>
										<Badge color="green" size="1" variant="soft" className="mt-2">
											{formatPercent(totals.trend.engagement / totals.count)}
										</Badge>
									</div>
									<div>
										<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
											Total Revenue
										</Text>
										<Heading size="7" weight="bold" className="text-gray-12 dark:text-gray-12">
											{formatCompact(totals.revenue, "currency")}
										</Heading>
										<Badge color="green" size="1" variant="soft" className="mt-2">
											{formatPercent(totals.trend.revenue / totals.count)}
										</Badge>
									</div>
								</div>
							</Card>

							{/* Additional Overall KPIs */}
							<Card size="3" variant="surface" className="p-6">
								<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
									Content & Engagement Metrics
								</Heading>
								<div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-4">
									<div>
										<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11 flex items-center gap-1">
											<VideoIcon className="w-4 h-4" />
											Total Posts
										</Text>
										<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
											{totals.totalVideos}
										</Heading>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
											Across all platforms
										</Text>
									</div>
									<div>
										<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11 flex items-center gap-1">
											<ArrowUpIcon className="w-4 h-4" />
											Avg Views/Post
										</Text>
										<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
											{formatCompact(totals.avgViewsPerVideo || 0)}
										</Heading>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
											Per content piece
										</Text>
									</div>
									<div>
										<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11 flex items-center gap-1">
											<HeartIcon className="w-4 h-4" />
											Total Interactions
										</Text>
										<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
											{formatCompact(totals.interactions)}
										</Heading>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
											Likes + Comments + Shares
										</Text>
									</div>
									<div>
										<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11 flex items-center gap-1">
											<BarChartIcon className="w-4 h-4" />
											Connected Platforms
										</Text>
										<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
											{connectedPlatforms.length}
										</Heading>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
											Active accounts
										</Text>
									</div>
								</div>
							</Card>

							{/* Best Performing Platform */}
							{connectedPlatforms.length > 1 && (
								<Card size="3" variant="surface" className="p-6">
									<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
										Best Performing Platform
									</Heading>
									{(() => {
										const platformStats = connectedPlatforms
											.map((platform) => {
												const snapshot = analytics[platform];
												if (!snapshot) return null;
												return {
													platform,
													views: snapshot.views,
													followers: snapshot.followers,
													engagement: snapshot.engagement,
													meta: PLATFORM_META[platform],
												};
											})
											.filter(Boolean) as Array<{
												platform: AnalyticsPlatform;
												views: number;
												followers: number;
												engagement: number;
												meta: { label: string; color: "red" | "cyan" | "pink"; followerLabel: string };
											}>;

										if (platformStats.length === 0) return null;

										const bestByViews = [...platformStats].sort((a, b) => b.views - a.views)[0];
										const bestByFollowers = [...platformStats].sort((a, b) => b.followers - a.followers)[0];
										const bestByEngagement = [...platformStats].sort((a, b) => b.engagement - a.engagement)[0];

										return (
											<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
												<div className="p-4 rounded-lg border border-gray-a4 dark:border-gray-a6">
													<Text size="1" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
														Most Views
													</Text>
													<div className="flex items-center gap-2">
														<div
															className="w-8 h-8 rounded-lg flex items-center justify-center"
															style={{
																backgroundColor: `var(--${bestByViews.meta.color}-a2)`,
																color: `var(--${bestByViews.meta.color}-11)`,
															}}
														>
															<BarChartIcon className="w-4 h-4" />
														</div>
														<div>
															<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
																{bestByViews.meta.label}
															</Text>
															<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
																{formatCompact(bestByViews.views)} views
															</Text>
														</div>
													</div>
												</div>
												<div className="p-4 rounded-lg border border-gray-a4 dark:border-gray-a6">
													<Text size="1" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
														Most Followers
													</Text>
													<div className="flex items-center gap-2">
														<div
															className="w-8 h-8 rounded-lg flex items-center justify-center"
															style={{
																backgroundColor: `var(--${bestByFollowers.meta.color}-a2)`,
																color: `var(--${bestByFollowers.meta.color}-11)`,
															}}
														>
															<ArrowUpIcon className="w-4 h-4" />
														</div>
														<div>
															<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
																{bestByFollowers.meta.label}
															</Text>
															<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
																{formatCompact(bestByFollowers.followers)} {bestByFollowers.meta.followerLabel.toLowerCase()}
															</Text>
														</div>
													</div>
												</div>
												<div className="p-4 rounded-lg border border-gray-a4 dark:border-gray-a6">
													<Text size="1" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
														Highest Engagement
													</Text>
													<div className="flex items-center gap-2">
														<div
															className="w-8 h-8 rounded-lg flex items-center justify-center"
															style={{
																backgroundColor: `var(--${bestByEngagement.meta.color}-a2)`,
																color: `var(--${bestByEngagement.meta.color}-11)`,
															}}
														>
															<HeartIcon className="w-4 h-4" />
														</div>
														<div>
															<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
																{bestByEngagement.meta.label}
															</Text>
															<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
																{bestByEngagement.engagement.toFixed(1)}% engagement
															</Text>
														</div>
													</div>
												</div>
											</div>
										);
									})()}
								</Card>
							)}
						</>
					)}
				</>
			)}
		</div>
	);
}
