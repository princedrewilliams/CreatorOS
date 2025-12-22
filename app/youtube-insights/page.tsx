"use client";

import { useEffect, useState } from "react";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import {
	BarChartIcon,
	LightningBoltIcon,
	ExclamationTriangleIcon,
	DollarSignIcon,
	TargetIcon,
	ArrowUpIcon,
	ArrowDownIcon,
	CheckIcon,
	Cross2Icon,
} from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

interface ChannelHealthData {
	videosKillingGrowth: Array<{
		videoId: string;
		title: string;
		issue: string;
		impressions: number;
		ctr: number;
		channelAverageCTR: number;
	}>;
	retentionDropOffs: Array<{
		videoId: string;
		title: string;
		dropOffTime: string;
		percentageLost: number;
	}>;
	algorithmSignals: {
		uploadConsistencyScore: number;
		ctrVsChannelAverage: number;
		watchTimePerImpression: number;
		averageRetention: number;
	};
}

interface Recommendation {
	topic: string;
	reason: string;
	priority: "high" | "medium" | "low";
	watchTimeMultiplier: number;
	daysSinceLastPost: number;
	estimatedPerformance: string;
}

interface RevenueData {
	estimatedRPM: number;
	revenueByVideoType: Array<{
		type: string;
		estimatedRevenue: number;
		views: number;
		rpm: number;
	}>;
	longVsShortProfitability: {
		longForm: { avgRPM: number; totalRevenue: number };
		shortForm: { avgRPM: number; totalRevenue: number };
		recommendation: string;
	};
	topEarningVideos: Array<{
		videoId: string;
		title: string;
		estimatedRevenue: number;
		rpm: number;
		views: number;
	}>;
}

interface SponsorReadinessData {
	score: number;
	channelSize: string;
	averageViews: number;
	engagement: number;
	consistency: number;
	niche: string;
	estimatedDealRange: {
		min: number;
		max: number;
		currency: string;
	};
	recommendations: string[];
	readinessLevel: "ready" | "almost" | "not_ready";
}

export default function YouTubeInsightsPage() {
	const { socialConnections } = useAppStore();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	
	const [healthData, setHealthData] = useState<ChannelHealthData | null>(null);
	const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
	const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
	const [sponsorData, setSponsorData] = useState<SponsorReadinessData | null>(null);

	const youtubeConnected = socialConnections.find((c) => c.platform === "youtube" && c.connected);

	useEffect(() => {
		if (!youtubeConnected) {
			setError("Please connect your YouTube account first");
			setLoading(false);
			return;
		}

		const fetchAllData = async () => {
			setLoading(true);
			setError(null);

			try {
				// Fetch all data in parallel
				const [healthRes, recommendationsRes, revenueRes, sponsorRes] = await Promise.all([
					fetch("/api/youtube/health", { credentials: "include" }),
					fetch("/api/youtube/recommendations", { credentials: "include" }),
					fetch("/api/youtube/revenue", { credentials: "include" }),
					fetch("/api/youtube/sponsor-readiness", { credentials: "include" }),
				]);

				if (healthRes.ok) {
					const health = await healthRes.json();
					if (health.success) {
						setHealthData(health.data);
					}
				}

				if (recommendationsRes.ok) {
					const recs = await recommendationsRes.json();
					if (recs.success) {
						setRecommendations(recs.recommendations || []);
					}
				}

				if (revenueRes.ok) {
					const revenue = await revenueRes.json();
					if (revenue.success) {
						setRevenueData(revenue.data);
					}
				}

				if (sponsorRes.ok) {
					const sponsor = await sponsorRes.json();
					if (sponsor.success) {
						setSponsorData(sponsor.data);
					}
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load insights");
			} finally {
				setLoading(false);
			}
		};

		fetchAllData();
	}, [youtubeConnected]);

	if (!youtubeConnected) {
		return (
			<div className="min-h-screen bg-gray-1 dark:bg-gray-12 p-4 sm:p-6 lg:p-8">
				<div className="max-w-7xl mx-auto">
					<BackButton />
					<Card size="3" variant="surface" className="p-8 text-center mt-6">
						<Heading size="6" className="mb-4">YouTube Insights</Heading>
						<Text size="4" color="gray" className="mb-6">
							Connect your YouTube account to access advanced analytics and insights
						</Text>
						<Link href="/planner">
							<Button size="3" color="red">
								Connect YouTube
							</Button>
						</Link>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-1 dark:bg-gray-12 p-4 sm:p-6 lg:p-8">
			<div className="max-w-7xl mx-auto">
				<BackButton />
				<Heading size="7" className="mb-2 mt-6">YouTube Insights</Heading>
				<Text size="3" color="gray" className="mb-8">
					Advanced analytics and recommendations based on your real YouTube data
				</Text>

				{loading && (
					<Card size="3" variant="surface" className="p-8 text-center">
						<Text size="4" color="gray">Loading insights...</Text>
					</Card>
				)}

				{error && (
					<Card size="3" variant="surface" className="p-6 border-red-6 bg-red-a2">
						<Text size="3" color="red" className="flex items-center gap-2">
							<ExclamationTriangleIcon />
							{error}
						</Text>
					</Card>
				)}

				{!loading && !error && (
					<div className="space-y-6">
						{/* What Should I Post Next */}
						{recommendations.length > 0 && (
							<Card size="3" variant="surface" className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<LightningBoltIcon className="w-6 h-6 text-yellow-11" />
									<Heading size="5">What Should I Post Next?</Heading>
								</div>
								<div className="space-y-4">
									{recommendations.map((rec, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className="p-4 rounded-lg border border-gray-a4 bg-gray-a2"
										>
											<div className="flex items-start justify-between gap-4">
												<div className="flex-grow">
													<div className="flex items-center gap-2 mb-2">
														<Badge
															color={rec.priority === "high" ? "red" : rec.priority === "medium" ? "yellow" : "gray"}
															size="2"
														>
															{rec.priority.toUpperCase()}
														</Badge>
														<Heading size="4">{rec.topic}</Heading>
													</div>
													<Text size="2" color="gray" className="mb-2">
														{rec.reason}
													</Text>
													<div className="flex items-center gap-4 text-sm text-gray-11">
														<span>Watch time: {Math.round(rec.watchTimeMultiplier * 100)}% of average</span>
														<span>•</span>
														<span>{rec.daysSinceLastPost} days since last post</span>
													</div>
												</div>
												<Badge color="green" size="2" variant="soft">
													{rec.estimatedPerformance}
												</Badge>
											</div>
										</motion.div>
									))}
								</div>
							</Card>
						)}

						{/* Channel Health Dashboard */}
						{healthData && (
							<Card size="3" variant="surface" className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<BarChartIcon className="w-6 h-6 text-blue-11" />
									<Heading size="5">Channel Health Dashboard</Heading>
								</div>

								{/* Algorithm Signals */}
								<div className="mb-6">
									<Heading size="4" className="mb-3">Algorithm Signals</Heading>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
										<Card size="2" variant="surface" className="p-4">
											<Text size="1" color="gray" className="mb-1">Upload Consistency</Text>
											<Text size="5" weight="bold">
												{Math.round(healthData.algorithmSignals.uploadConsistencyScore)}%
											</Text>
										</Card>
										<Card size="2" variant="surface" className="p-4">
											<Text size="1" color="gray" className="mb-1">Channel Avg CTR</Text>
											<Text size="5" weight="bold">
												{healthData.algorithmSignals.ctrVsChannelAverage.toFixed(2)}%
											</Text>
										</Card>
										<Card size="2" variant="surface" className="p-4">
											<Text size="1" color="gray" className="mb-1">Watch Time/Impression</Text>
											<Text size="5" weight="bold">
												{Math.round(healthData.algorithmSignals.watchTimePerImpression)}s
											</Text>
										</Card>
										<Card size="2" variant="surface" className="p-4">
											<Text size="1" color="gray" className="mb-1">Avg Retention</Text>
											<Text size="5" weight="bold">
												{Math.round(healthData.algorithmSignals.averageRetention)}%
											</Text>
										</Card>
									</div>
								</div>

								{/* Videos Killing Growth */}
								{healthData.videosKillingGrowth.length > 0 && (
									<div className="mb-6">
										<Heading size="4" className="mb-3 flex items-center gap-2">
											<ExclamationTriangleIcon className="w-5 h-5 text-red-11" />
											Videos Killing Growth
										</Heading>
										<div className="space-y-3">
											{healthData.videosKillingGrowth.slice(0, 5).map((video, index) => (
												<Card key={index} size="2" variant="surface" className="p-4 border-red-6 bg-red-a2">
													<Text size="2" weight="bold" className="mb-1">{video.title}</Text>
													<Text size="1" color="gray">{video.issue}</Text>
													<div className="flex items-center gap-4 mt-2 text-sm">
														<span>CTR: {video.ctr.toFixed(2)}%</span>
														<span>vs</span>
														<span>Channel Avg: {video.channelAverageCTR.toFixed(2)}%</span>
														<span className="text-red-11">
															{((1 - video.ctr / video.channelAverageCTR) * 100).toFixed(0)}% below average
														</span>
													</div>
												</Card>
											))}
										</div>
									</div>
								)}

								{/* Retention Drop-offs */}
								{healthData.retentionDropOffs.length > 0 && (
									<div>
										<Heading size="4" className="mb-3">Retention Drop-off Moments</Heading>
										<div className="space-y-3">
											{healthData.retentionDropOffs.slice(0, 5).map((video, index) => (
												<Card key={index} size="2" variant="surface" className="p-4">
													<Text size="2" weight="bold" className="mb-1">{video.title}</Text>
													<Text size="1" color="gray">
														Most viewers leave at {video.dropOffTime} ({video.percentageLost.toFixed(0)}% lost)
													</Text>
												</Card>
											))}
										</div>
									</div>
								)}
							</Card>
						)}

						{/* Revenue + RPM Tracker */}
						{revenueData && (
							<Card size="3" variant="surface" className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<DollarSignIcon className="w-6 h-6 text-green-11" />
									<Heading size="5">Revenue & RPM Tracker</Heading>
								</div>

								<div className="mb-6">
									<Card size="2" variant="surface" className="p-4 bg-green-a2 border-green-6">
										<Text size="1" color="gray" className="mb-1">Estimated RPM</Text>
										<Text size="6" weight="bold" className="text-green-11">
											${revenueData.estimatedRPM.toFixed(2)} per 1k views
										</Text>
									</Card>
								</div>

								{/* Long vs Short Form */}
								<div className="mb-6">
									<Heading size="4" className="mb-3">Long vs Short Form Profitability</Heading>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<Card size="2" variant="surface" className="p-4">
											<Text size="2" weight="bold" className="mb-2">Long Form (10+ min)</Text>
											<Text size="4" weight="bold" className="text-green-11">
												${revenueData.longVsShortProfitability.longForm.totalRevenue.toFixed(2)}
											</Text>
											<Text size="1" color="gray">RPM: ${revenueData.longVsShortProfitability.longForm.avgRPM.toFixed(2)}</Text>
										</Card>
										<Card size="2" variant="surface" className="p-4">
											<Text size="2" weight="bold" className="mb-2">Short Form</Text>
											<Text size="4" weight="bold" className="text-blue-11">
												${revenueData.longVsShortProfitability.shortForm.totalRevenue.toFixed(2)}
											</Text>
											<Text size="1" color="gray">RPM: ${revenueData.longVsShortProfitability.shortForm.avgRPM.toFixed(2)}</Text>
										</Card>
									</div>
									<Card size="2" variant="surface" className="p-4 mt-4 bg-blue-a2">
										<Text size="2" weight="bold" className="mb-1">💡 Insight</Text>
										<Text size="2">{revenueData.longVsShortProfitability.recommendation}</Text>
									</Card>
								</div>

								{/* Top Earning Videos */}
								{revenueData.topEarningVideos.length > 0 && (
									<div>
										<Heading size="4" className="mb-3">Top Earning Videos</Heading>
										<div className="space-y-2">
											{revenueData.topEarningVideos.map((video, index) => (
												<Card key={index} size="2" variant="surface" className="p-4">
													<div className="flex items-start justify-between">
														<div className="flex-grow">
															<Text size="2" weight="bold" className="mb-1">{video.title}</Text>
															<div className="flex items-center gap-4 text-sm text-gray-11">
																<span>{video.views.toLocaleString()} views</span>
																<span>•</span>
																<span>RPM: ${video.rpm.toFixed(2)}</span>
															</div>
														</div>
														<Text size="4" weight="bold" className="text-green-11">
															${video.estimatedRevenue.toFixed(2)}
														</Text>
													</div>
												</Card>
											))}
										</div>
									</div>
								)}
							</Card>
						)}

						{/* Sponsor Readiness Score */}
						{sponsorData && (
							<Card size="3" variant="surface" className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<TargetIcon className="w-6 h-6 text-purple-11" />
									<Heading size="5">Sponsor Readiness Score</Heading>
								</div>

								<div className="mb-6">
									<div className="flex items-center gap-4 mb-4">
										<div className="flex-1">
											<div className="flex items-center justify-between mb-2">
												<Text size="2" color="gray">Readiness Score</Text>
												<Text size="4" weight="bold">{sponsorData.score}/100</Text>
											</div>
											<div className="w-full bg-gray-a4 rounded-full h-3">
												<div
													className={`h-3 rounded-full ${
														sponsorData.score >= 70 ? "bg-green-9" :
														sponsorData.score >= 50 ? "bg-yellow-9" :
														"bg-red-9"
													}`}
													style={{ width: `${sponsorData.score}%` }}
												/>
											</div>
										</div>
										<Badge
											color={
												sponsorData.readinessLevel === "ready" ? "green" :
												sponsorData.readinessLevel === "almost" ? "yellow" :
												"red"
											}
											size="3"
											variant="soft"
										>
											{sponsorData.readinessLevel === "ready" ? "Ready" :
											 sponsorData.readinessLevel === "almost" ? "Almost Ready" :
											 "Not Ready"}
										</Badge>
									</div>

									<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
										<Card size="2" variant="surface" className="p-4 text-center">
											<Text size="1" color="gray" className="mb-1">Channel Size</Text>
											<Text size="3" weight="bold">{sponsorData.channelSize}</Text>
										</Card>
										<Card size="2" variant="surface" className="p-4 text-center">
											<Text size="1" color="gray" className="mb-1">Avg Views</Text>
											<Text size="3" weight="bold">{sponsorData.averageViews.toLocaleString()}</Text>
										</Card>
										<Card size="2" variant="surface" className="p-4 text-center">
											<Text size="1" color="gray" className="mb-1">Engagement</Text>
											<Text size="3" weight="bold">{sponsorData.engagement.toFixed(1)}%</Text>
										</Card>
										<Card size="2" variant="surface" className="p-4 text-center">
											<Text size="1" color="gray" className="mb-1">Consistency</Text>
											<Text size="3" weight="bold">{sponsorData.consistency}%</Text>
										</Card>
									</div>

									<Card size="2" variant="surface" className="p-4 bg-purple-a2 border-purple-6 mb-4">
										<Text size="2" weight="bold" className="mb-2">Estimated Deal Range</Text>
										<Text size="5" weight="bold" className="text-purple-11">
											${sponsorData.estimatedDealRange.min.toLocaleString()} - ${sponsorData.estimatedDealRange.max.toLocaleString()} per post
										</Text>
										<Text size="1" color="gray" className="mt-1">
											Based on your channel metrics and {sponsorData.niche} niche
										</Text>
									</Card>

									{sponsorData.recommendations.length > 0 && (
										<div>
											<Heading size="4" className="mb-3">Recommendations</Heading>
											<div className="space-y-2">
												{sponsorData.recommendations.map((rec, index) => (
													<div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-gray-a2">
														<Text size="1" className="mt-0.5">•</Text>
														<Text size="2">{rec}</Text>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</Card>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

