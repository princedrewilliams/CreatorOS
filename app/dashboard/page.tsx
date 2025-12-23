"use client";

import { useEffect, useState, useMemo } from "react";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import {
	CalendarIcon,
	FileTextIcon,
	BarChartIcon,
	ArrowRightIcon,
	LockClosedIcon,
	EyeOpenIcon,
	ChatBubbleIcon,
	LightningBoltIcon,
	TargetIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import type { AnalyticsPlatform, PlatformAnalyticsSnapshot } from "@/lib/mockAnalytics";

const formatCompact = (value: number, style: "decimal" | "currency" = "decimal") =>
	new Intl.NumberFormat("en", {
		notation: "compact",
		maximumFractionDigits: 1,
		...(style === "currency" ? { style: "currency", currency: "USD" } : {}),
	}).format(value);

const formatPercent = (value: number) =>
	new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(value / 100);

const features = [
	{
		title: "Content Planner",
		description: "Plan and schedule your content with an intuitive calendar",
		icon: CalendarIcon,
		href: "/planner",
		color: "blue" as const,
	},
	{
		title: "Sponsor Management",
		description: "Track deals, revenue, and invoices",
		icon: FileTextIcon,
		href: "/sponsors",
		color: "green" as const,
	},
	{
		title: "Analytics Dashboard",
		description: "View performance across YouTube",
		icon: BarChartIcon,
		href: "/analytics",
		color: "cyan" as const,
	},
	{
		title: "YouTube Insights",
		description: "Advanced analytics and recommendations",
		icon: LightningBoltIcon,
		href: "/youtube-insights",
		color: "red" as const,
	},
	{
		title: "Growth Decisions",
		description: "Data-driven decisions on what to post and fix",
		icon: TargetIcon,
		href: "/growth-decisions",
		color: "green" as const,
	},
];

export default function DashboardPage() {
	const { socialConnections, tasks, sponsors, user, setSocialConnection, setIsPro } = useAppStore();
	const [analytics, setAnalytics] = useState<Partial<Record<AnalyticsPlatform, PlatformAnalyticsSnapshot>>>({});
	const [loading, setLoading] = useState(true);

	// Sync user data on mount (social connections, subscription)
	useEffect(() => {
		const syncUserData = async () => {
			if (!user) return;
			
			try {
				const response = await fetch("/api/user/sync", {
					credentials: "include",
				});
				const data = await response.json();
				if (response.ok && data.success) {
					// Update social connections
					data.socialConnections.forEach((conn: any) => {
						setSocialConnection({
							platform: conn.platform,
							connected: conn.connected,
							accessToken: conn.accessToken,
							refreshToken: conn.refreshToken,
							expiresAt: conn.expiresAt,
							username: conn.username,
							userPlatformId: conn.userPlatformId,
							profilePicture: conn.profilePicture,
						});
					});
					
					// Update subscription
					if (data.subscription) {
						setIsPro(data.subscription.isPro);
					}
				}
			} catch (err) {
				console.error("Failed to sync user data:", err);
			}
		};
		
		syncUserData();
	}, [user, setSocialConnection, setIsPro]);

	const connectedPlatforms = useMemo(
		() =>
			socialConnections
				.filter((connection) => connection.connected)
				.map((connection) => connection.platform) as AnalyticsPlatform[],
		[socialConnections]
	);

	// Fetch analytics data
	useEffect(() => {
		const fetchAnalytics = async () => {
			if (connectedPlatforms.length === 0) {
				setAnalytics({});
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const queryParams = new URLSearchParams();
				connectedPlatforms.forEach((platform) => {
					queryParams.append("platform", platform);
				});

				const response = await fetch(`/api/analytics?${queryParams.toString()}`, {
					credentials: "include",
					cache: "no-store",
				});

				if (response.ok) {
					const payload = (await response.json()) as {
						platforms: Array<{ platform: AnalyticsPlatform; data: PlatformAnalyticsSnapshot | null }>;
					};
					const map: Partial<Record<AnalyticsPlatform, PlatformAnalyticsSnapshot>> = {};
					for (const entry of payload.platforms) {
						if (entry.platform && entry.data) {
							map[entry.platform] = entry.data;
						}
					}
					setAnalytics(map);
				}
			} catch (error) {
				console.error("Failed to fetch analytics:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchAnalytics();
	}, [connectedPlatforms]);

	// Calculate stats from real data
	const stats = useMemo(() => {
		// If no accounts are connected, return all zeros for analytics stats
		if (connectedPlatforms.length === 0) {
			return [
				{
					label: "Total Views",
					value: "0",
					change: "+0%",
				},
				{
					label: "Total Followers",
					value: "0",
					change: "+0%",
				},
				{
					label: "Total Revenue",
					value: "$0",
					change: "+0%",
				},
				{
					label: "Active Deals",
					value: sponsors.filter((deal) => deal.status === "active").length.toString(),
					change: sponsors.length > 0 ? `+${sponsors.length}` : "0",
				},
				{
					label: "Content Planned",
					value: tasks.filter((task) => task.status === "planned" || task.status === "scheduled").length.toString(),
					change: tasks.length > 0 ? `+${tasks.length}` : "0",
				},
				{
					label: "Avg Views/Video",
					value: "0",
					change: "+0%",
				},
			];
		}

		// Calculate totals from analytics
		const analyticsSnapshots = Object.values(analytics).filter(Boolean) as PlatformAnalyticsSnapshot[];
		const totalRevenue = analyticsSnapshots.reduce((sum, snapshot) => sum + (snapshot.revenue || 0), 0);
		const totalViews = analyticsSnapshots.reduce((sum, snapshot) => sum + (snapshot.views || 0), 0);
		const totalFollowers = analyticsSnapshots.reduce((sum, snapshot) => sum + (snapshot.followers || 0), 0);

		// Calculate active deals from sponsors
		const activeDeals = sponsors.filter((deal) => deal.status === "active").length;
		const totalDeals = sponsors.length;
		const dealsChange = totalDeals > 0 ? `+${totalDeals}` : "0";

		// Calculate content planned from tasks
		const plannedTasks = tasks.filter((task) => task.status === "planned" || task.status === "scheduled").length;
		const totalTasks = tasks.length;
		const tasksChange = totalTasks > 0 ? `+${totalTasks}` : "0";

		// Calculate average views per video from analytics
		// Sum all views and divide by total number of videos (estimated from topContent)
		const totalVideoViews = analyticsSnapshots.reduce((sum, snapshot) => {
			// Sum views from topContent to get a sample average
			const contentViews = snapshot.topContent?.reduce((s, content) => s + content.views, 0) || 0;
			return sum + contentViews;
		}, 0);
		const totalVideos = analyticsSnapshots.reduce((sum, snapshot) => {
			return sum + (snapshot.topContent?.length || 0);
		}, 0);
		
		// If we have videos, calculate average; otherwise estimate from total views
		let avgViewsPerVideo = 0;
		if (totalVideos > 0) {
			avgViewsPerVideo = totalVideoViews / totalVideos;
		} else if (totalViews > 0) {
			// Estimate: assume at least 3 videos per platform if we have views
			const estimatedVideos = analyticsSnapshots.length * 3;
			avgViewsPerVideo = totalViews / estimatedVideos;
		}
		
		const avgViewsChange = analyticsSnapshots.length > 0 && avgViewsPerVideo > 0
			? formatPercent(analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.trend.views, 0) / analyticsSnapshots.length)
			: "+0%";

		// Calculate trends for views and followers
		const viewsTrend = analyticsSnapshots.length > 0
			? formatPercent(analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.trend.views, 0) / analyticsSnapshots.length)
			: "+0%";
		const followersTrend = analyticsSnapshots.length > 0
			? formatPercent(analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.trend.followers, 0) / analyticsSnapshots.length)
			: "+0%";

		return [
			{
				label: "Total Views",
				value: totalViews > 0 ? formatCompact(totalViews) : "0",
				change: viewsTrend,
			},
			{
				label: "Total Followers",
				value: totalFollowers > 0 ? formatCompact(totalFollowers) : "0",
				change: followersTrend,
			},
			{
				label: "Total Revenue",
				value: totalRevenue > 0 ? formatCompact(totalRevenue, "currency") : "$0",
				change: totalRevenue > 0 ? formatPercent(analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.trend.revenue, 0) / analyticsSnapshots.length) : "+0%",
			},
			{
				label: "Active Deals",
				value: activeDeals.toString(),
				change: dealsChange,
			},
			{
				label: "Content Planned",
				value: plannedTasks.toString(),
				change: tasksChange,
			},
			{
				label: "Avg Views/Video",
				value: avgViewsPerVideo > 0 ? formatCompact(avgViewsPerVideo) : "0",
				change: avgViewsChange,
			},
		];
	}, [analytics, sponsors, tasks, connectedPlatforms.length]);

	const dataUsagePurposes = [
		{
			icon: BarChartIcon,
			title: "Analytics Data",
			description: "Access analytics to display performance dashboards",
		},
		{
			icon: CalendarIcon,
			title: "Content Plans",
			description: "Store your content calendar and scheduled posts",
		},
		{
			icon: ChatBubbleIcon,
			title: "Post Content",
			description: "Use access tokens to post on your behalf",
		},
		{
			icon: LockClosedIcon,
			title: "Account Access",
			description: "Store OAuth tokens for seamless platform access",
		},
	];

	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Info Section at Top */}
			<div className="bg-gradient-to-br from-blue-a2 to-purple-a2 dark:from-blue-a3 dark:to-purple-a3 rounded-lg p-6 sm:p-8">
				<div className="text-center mb-6">
					<Heading size="7" as="h1" className="mb-3 text-gray-12 dark:text-gray-12 sm:text-8">
						CreatorOS
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 max-w-2xl mx-auto mb-4">
						All-in-One Creator Tool for Content Planning, Cross-Platform Posting, and Analytics
					</Text>
				</div>

				{/* Data Usage Transparency */}
				<div className="mt-6">
					<div className="flex items-center justify-center gap-2 mb-4">
						<LockClosedIcon className="w-5 h-5 text-blue-11 dark:text-blue-10" />
						<Heading size="4" as="h2" className="text-gray-12 dark:text-gray-12">
							Data Usage & Privacy
						</Heading>
					</div>
					<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 text-center mb-4 max-w-xl mx-auto block">
						We only access data necessary to provide our services. We never sell your personal data.
					</Text>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
						{dataUsagePurposes.map((purpose, index) => {
							const Icon = purpose.icon;
							return (
								<Card key={index} size="1" variant="surface" className="p-3 text-center bg-white/50 dark:bg-gray-a4/50">
									<div className="flex flex-col items-center gap-2">
										<div className="w-8 h-8 rounded-lg bg-blue-a2 dark:bg-blue-a3 flex items-center justify-center">
											<Icon className="w-4 h-4 text-blue-11 dark:text-blue-10" />
										</div>
										<Text size="1" weight="medium" className="text-gray-12 dark:text-gray-12">
											{purpose.title}
										</Text>
									</div>
								</Card>
							);
						})}
					</div>
					<div className="mt-4 text-center">
						<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
							✓ Disconnect accounts anytime • ✓ Request data deletion • <Link href="/privacy" className="text-blue-10 underline">Privacy Policy</Link>
						</Text>
					</div>
				</div>
			</div>

			<Separator />

			{/* Dashboard Content */}
			<div>
				<Heading size="6" as="h2" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-7">
					Welcome to CreatorOS
				</Heading>
				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4 mb-6">
					Your all-in-one creator toolkit
				</Text>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{stats.map((stat, index) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<Card size="3" variant="surface" className="p-4 sm:p-6">
							<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11 text-xs sm:text-sm">
								{stat.label}
							</Text>
							<div className="flex items-center gap-2 flex-wrap">
								<Text size="5" weight="bold" className="text-gray-12 dark:text-gray-12 sm:text-6 break-words">
									{stat.value}
								</Text>
								<Badge color="green" variant="soft" size="1" className="flex-shrink-0">
									{stat.change}
								</Badge>
							</div>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Features Grid */}
			<div>
				<Heading size="5" as="h2" className="mb-4 sm:mb-6 text-gray-12 dark:text-gray-12 sm:text-6">
					Tools
				</Heading>
				<div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.href}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								whileHover={{ y: -4 }}
							>
								<Card size="3" variant="surface" className="h-full p-6 hover:border-blue-6 transition-colors">
									<Link href={feature.href}>
										<div className="flex flex-col gap-4 h-full">
											<div 
												className="w-12 h-12 rounded-lg flex items-center justify-center"
												style={{ 
													backgroundColor: `var(--${feature.color}-a2)`,
													color: `var(--${feature.color}-11)` 
												}}
											>
												<Icon className="w-6 h-6" />
											</div>
											<div className="flex-1">
												<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
													{feature.title}
												</Heading>
												<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
													{feature.description}
												</Text>
											</div>
											<Button
												variant="ghost"
												color={feature.color}
												size="2"
												className="w-full justify-between"
											>
												Open
												<ArrowRightIcon />
											</Button>
										</div>
									</Link>
								</Card>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

