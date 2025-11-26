"use client";

import { useEffect, useState, useMemo } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import {
	CalendarIcon,
	VideoIcon,
	ImageIcon,
	FileTextIcon,
	BarChartIcon,
	ArrowRightIcon,
	DownloadIcon,
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
		title: "Auto Clip",
		description: "Automatically create engaging clips from your videos",
		icon: VideoIcon,
		href: "/autoclip",
		color: "purple" as const,
	},
	{
		title: "Thumbnail Generator",
		description: "Generate eye-catching thumbnails with AI",
		icon: ImageIcon,
		href: "/thumbnail",
		color: "violet" as const,
	},
	{
		title: "Video Downloader",
		description: "Download TikTok, IG Reels, and YouTube Shorts",
		icon: DownloadIcon,
		href: "/video-downloader",
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
		description: "View performance across YouTube, TikTok, and Instagram",
		icon: BarChartIcon,
		href: "/analytics",
		color: "cyan" as const,
	},
];

export default function DashboardPage() {
	const { socialConnections, tasks, sponsors } = useAppStore();
	const [analytics, setAnalytics] = useState<Partial<Record<AnalyticsPlatform, PlatformAnalyticsSnapshot>>>({});
	const [loading, setLoading] = useState(true);

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
						platforms: Array<{ platform: AnalyticsPlatform; data: PlatformAnalyticsSnapshot }>;
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
		// Calculate totals from analytics
		const analyticsSnapshots = Object.values(analytics).filter(Boolean) as PlatformAnalyticsSnapshot[];
		const totalRevenue = analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.revenue, 0);
		const totalViews = analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.views, 0);
		const totalFollowers = analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.followers, 0);

		// Calculate active deals from sponsors
		const activeDeals = sponsors.filter((deal) => deal.status === "active" || deal.status === "pending").length;
		const totalDeals = sponsors.length;
		const dealsChange = totalDeals > 0 ? `+${totalDeals}` : "0";

		// Calculate content planned from tasks
		const plannedTasks = tasks.filter((task) => task.status === "planned" || task.status === "scheduled").length;
		const totalTasks = tasks.length;
		const tasksChange = totalTasks > 0 ? `+${totalTasks}` : "0";

		// Calculate average engagement rate from analytics
		const totalEngagement = analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.engagement, 0);
		const avgEngagement = analyticsSnapshots.length > 0 ? totalEngagement / analyticsSnapshots.length : 0;
		const engagementChange = analyticsSnapshots.length > 0 
			? formatPercent(analyticsSnapshots.reduce((sum, snapshot) => sum + snapshot.trend.engagement, 0) / analyticsSnapshots.length)
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
				label: "Engagement Rate",
				value: avgEngagement > 0 ? `${avgEngagement.toFixed(1)}%` : "0%",
				change: engagementChange,
			},
		];
	}, [analytics, sponsors, tasks]);

	return (
		<div className="space-y-8">
			<div>
				<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
					Welcome to CreatorOS
				</Heading>
				<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
					Your all-in-one creator toolkit
				</Text>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{stats.map((stat, index) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<Card size="3" variant="surface" className="p-6">
							<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
								{stat.label}
							</Text>
							<div className="flex items-center gap-2">
								<Text size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
									{loading && (stat.label === "Total Revenue" || stat.label === "Total Views" || stat.label === "Total Followers" || stat.label === "Engagement Rate") ? "..." : stat.value}
								</Text>
								<Badge color="green" variant="soft" size="1">
									{loading && (stat.label === "Total Revenue" || stat.label === "Total Views" || stat.label === "Total Followers" || stat.label === "Engagement Rate") ? "..." : stat.change}
								</Badge>
							</div>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Features Grid */}
			<div>
				<Heading size="6" as="h2" className="mb-6 text-gray-12 dark:text-gray-12">
					Tools
				</Heading>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

