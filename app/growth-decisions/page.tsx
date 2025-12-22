"use client";

import { useEffect, useState } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import {
	LightningBoltIcon,
	ExclamationTriangleIcon,
	CheckIcon,
	Cross2Icon,
	ArrowUpIcon,
	TargetIcon,
} from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

interface PostRecommendation {
	topic: string;
	reason: string;
	expectedImpact: string;
	confidence: "low" | "medium" | "high";
	retentionBoost?: number;
	daysSinceLastPost?: number;
}

interface GrowthLeak {
	videoId: string;
	title: string;
	issue: string;
	severity: "high" | "medium" | "low";
	metrics: {
		ctr?: number;
		channelAvgCTR?: number;
		retention?: number;
		channelAvgRetention?: number;
		watchTimePerImpression?: number;
		channelAvgWatchTimePerImpression?: number;
	};
	fix: string;
}

interface DoubleDownInsight {
	category: "length" | "topic" | "posting_time" | "title_format" | "content_type";
	insight: string;
	performance: {
		metric: string;
		value: number;
		comparison: string;
	};
	examples: string[];
}

export default function GrowthDecisionsPage() {
	const { socialConnections } = useAppStore();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	
	const [postThisNext, setPostThisNext] = useState<PostRecommendation[]>([]);
	const [fixTheseVideos, setFixTheseVideos] = useState<GrowthLeak[]>([]);
	const [doubleDown, setDoubleDown] = useState<DoubleDownInsight[]>([]);

	const youtubeConnected = socialConnections.find((c) => c.platform === "youtube" && c.connected);

	useEffect(() => {
		if (!youtubeConnected) {
			setError("Please connect your YouTube account first");
			setLoading(false);
			return;
		}

		const fetchGrowthDecisions = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/youtube/growth-decisions", { credentials: "include" });

				if (!response.ok) {
					throw new Error("Failed to load growth decisions");
				}

				const data = await response.json();
				if (data.success) {
					setPostThisNext(data.data.postThisNext || []);
					setFixTheseVideos(data.data.fixTheseVideos || []);
					setDoubleDown(data.data.doubleDown || []);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load growth decisions");
			} finally {
				setLoading(false);
			}
		};

		fetchGrowthDecisions();
	}, [youtubeConnected]);

	if (!youtubeConnected) {
		return (
			<div className="min-h-screen bg-gray-1 dark:bg-gray-12 p-4 sm:p-6 lg:p-8">
				<div className="max-w-7xl mx-auto">
					<BackButton />
					<Card size="3" variant="surface" className="p-8 text-center mt-6">
						<Heading size="6" className="mb-4">Growth Decision Engine</Heading>
						<Text size="4" color="gray" className="mb-6">
							Connect your YouTube account to get specific, ranked decisions about what to post, what to fix, and what to stop doing
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
				<Heading size="7" className="mb-2 mt-6">Growth Decision Engine</Heading>
				<Text size="3" color="gray" className="mb-8">
					Specific, ranked decisions backed by your YouTube Analytics data
				</Text>

				{loading && (
					<Card size="3" variant="surface" className="p-8 text-center">
						<Text size="4" color="gray">Analyzing your channel...</Text>
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
						{/* 1. POST THIS NEXT */}
						<Card size="3" variant="surface" className="p-6">
							<div className="flex items-center gap-3 mb-4">
								<LightningBoltIcon className="w-6 h-6 text-yellow-11" />
								<Heading size="5">Post This Next</Heading>
							</div>
							<Text size="2" color="gray" className="mb-6">
								What video should I make next to grow fastest?
							</Text>

							{postThisNext.length > 0 ? (
								<div className="space-y-4">
									{postThisNext.map((rec, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className="p-4 rounded-lg border border-gray-a4 bg-gray-a2"
										>
											<div className="flex items-start justify-between gap-4 mb-2">
												<div className="flex-grow">
													<div className="flex items-center gap-2 mb-2">
														<Badge
															color={rec.confidence === "high" ? "green" : rec.confidence === "medium" ? "yellow" : "gray"}
															size="2"
														>
															{rec.confidence.toUpperCase()} CONFIDENCE
														</Badge>
														<Heading size="4">{rec.topic}</Heading>
													</div>
													<Text size="2" color="gray" className="mb-2">
														{rec.reason}
													</Text>
													<div className="flex items-center gap-4 text-sm text-gray-11">
														{rec.retentionBoost && (
															<span className="flex items-center gap-1">
																<ArrowUpIcon />
																{rec.retentionBoost}% higher retention
															</span>
														)}
														{rec.daysSinceLastPost && (
															<span>Last posted {rec.daysSinceLastPost} days ago</span>
														)}
													</div>
												</div>
												<Badge color="blue" size="2" variant="soft">
													{rec.expectedImpact}
												</Badge>
											</div>
										</motion.div>
									))}
								</div>
							) : (
								<Text size="2" color="gray">No recommendations available yet. Upload more videos to get personalized suggestions.</Text>
							)}
						</Card>

						{/* 2. FIX THESE VIDEOS */}
						<Card size="3" variant="surface" className="p-6">
							<div className="flex items-center gap-3 mb-4">
								<ExclamationTriangleIcon className="w-6 h-6 text-red-11" />
								<Heading size="5">Fix These Videos</Heading>
							</div>
							<Text size="2" color="gray" className="mb-6">
								What's actively hurting my channel growth?
							</Text>

							{fixTheseVideos.length > 0 ? (
								<div className="space-y-4">
									{fixTheseVideos.map((leak, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className={`p-4 rounded-lg border ${
												leak.severity === "high" ? "border-red-6 bg-red-a2" :
												leak.severity === "medium" ? "border-yellow-6 bg-yellow-a2" :
												"border-gray-a4 bg-gray-a2"
											}`}
										>
											<div className="flex items-start gap-2 mb-2">
												{leak.severity === "high" ? (
													<Cross2Icon className="w-5 h-5 text-red-11 flex-shrink-0 mt-0.5" />
												) : (
													<ExclamationTriangleIcon className="w-5 h-5 text-yellow-11 flex-shrink-0 mt-0.5" />
												)}
												<div className="flex-grow">
													<div className="flex items-center gap-2 mb-1">
														<Badge
															color={leak.severity === "high" ? "red" : "yellow"}
															size="2"
														>
															{leak.severity.toUpperCase()}
														</Badge>
														<Text size="2" weight="bold">{leak.title}</Text>
													</div>
													<Text size="1" color="gray" className="mb-2">
														{leak.issue}
													</Text>
													{leak.metrics.ctr !== undefined && leak.metrics.channelAvgCTR !== undefined && (
														<div className="text-sm text-gray-11 mb-2">
															CTR: {leak.metrics.ctr.toFixed(2)}% vs Channel Avg: {leak.metrics.channelAvgCTR.toFixed(2)}%
															<span className="text-red-11 ml-2">
																({((1 - leak.metrics.ctr / leak.metrics.channelAvgCTR) * 100).toFixed(0)}% below average)
															</span>
														</div>
													)}
													<div className="flex items-center gap-2 mt-2">
														<Text size="1" className="text-blue-11">👉</Text>
														<Text size="2" weight="medium">{leak.fix}</Text>
													</div>
												</div>
											</div>
										</motion.div>
									))}
								</div>
							) : (
								<Text size="2" color="gray">No growth leaks detected. Your videos are performing well!</Text>
							)}
						</Card>

						{/* 3. DOUBLE DOWN */}
						<Card size="3" variant="surface" className="p-6">
							<div className="flex items-center gap-3 mb-4">
								<TargetIcon className="w-6 h-6 text-green-11" />
								<Heading size="5">Double Down</Heading>
							</div>
							<Text size="2" color="gray" className="mb-6">
								What should I repeat because it's already working?
							</Text>

							{doubleDown.length > 0 ? (
								<div className="space-y-4">
									{doubleDown.map((insight, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className="p-4 rounded-lg border border-green-6 bg-green-a2"
										>
											<div className="flex items-start gap-2 mb-2">
												<CheckIcon className="w-5 h-5 text-green-11 flex-shrink-0 mt-0.5" />
												<div className="flex-grow">
													<Text size="3" weight="bold" className="mb-2">{insight.insight}</Text>
													<div className="mb-2">
														<Text size="2" weight="medium" className="text-green-11">
															{insight.performance.metric}: {insight.performance.value.toLocaleString()}
														</Text>
														<Text size="1" color="gray" className="ml-2">
															{insight.performance.comparison}
														</Text>
													</div>
													{insight.examples.length > 0 && (
														<div className="mt-3">
															<Text size="1" color="gray" className="mb-1">Examples:</Text>
															<div className="space-y-1">
																{insight.examples.map((example, i) => (
																	<Text key={i} size="1" className="text-gray-11">• {example}</Text>
																))}
															</div>
														</div>
													)}
												</div>
											</div>
										</motion.div>
									))}
								</div>
							) : (
								<Text size="2" color="gray">No patterns detected yet. Upload more videos to identify what's working.</Text>
							)}
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}

