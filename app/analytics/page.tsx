"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { ArrowLeftIcon, BarChartIcon, ReloadIcon, DownloadIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";
import { SocialConnections } from "@/components/SocialConnections";
import { useAppStore, type SocialConnection } from "@/lib/store";
import type { AnalyticsPlatform, PlatformAnalyticsSnapshot } from "@/lib/mockAnalytics";

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

export default function AnalyticsPage() {
	const { socialConnections } = useAppStore();
	const [analytics, setAnalytics] = useState<AnalyticsMap>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

		return snapshots.reduce(
			(acc, snapshot) => ({
				views: acc.views + snapshot.views,
				followers: acc.followers + snapshot.followers,
				revenue: acc.revenue + snapshot.revenue,
				engagement: acc.engagement + snapshot.engagement,
				trend: {
					views: acc.trend.views + snapshot.trend.views,
					followers: acc.trend.followers + snapshot.trend.followers,
					engagement: acc.trend.engagement + snapshot.trend.engagement,
					revenue: acc.trend.revenue + snapshot.trend.revenue,
				},
				count: acc.count + 1,
			}),
			{
				views: 0,
				followers: 0,
				revenue: 0,
				engagement: 0,
				trend: { views: 0, followers: 0, engagement: 0, revenue: 0 },
				count: 0,
			}
		);
	}, [analytics]);

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Link href="/dashboard">
						<Button variant="ghost" size="2" className="mb-3 sm:mb-4">
							<ArrowLeftIcon className="mr-2" />
							Back
						</Button>
					</Link>
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
									<Card size="3" variant="surface" className="p-6">
										<div className="flex flex-col gap-4">
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

					{totals && (
						<Card size="3" variant="surface" className="p-6">
							<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
								Overall performance (connected accounts)
							</Heading>
							<div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
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
					)}
				</>
			)}
		</div>
	);
}
