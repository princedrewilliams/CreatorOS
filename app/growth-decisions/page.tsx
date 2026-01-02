"use client";

import { useEffect, useState } from "react";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import {
	ExclamationTriangleIcon,
	ArrowRightIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
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
	explanation?: string;
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
		impressions?: number;
	};
	fix: string;
	explanation?: string;
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
	const [loadingExplanations, setLoadingExplanations] = useState<Record<string, boolean>>({});
	const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

	const youtubeConnected = socialConnections.find((c) => c.platform === "youtube" && c.connected);

	useEffect(() => {
		const fetchGrowthDecisions = async () => {
			if (!youtubeConnected) {
				setError("Please connect your YouTube account first");
				setLoading(false);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/youtube/growth-decisions", { 
					credentials: "include",
					cache: "no-store" 
				});

				if (!response.ok) {
					throw new Error("Failed to load growth decisions");
				}

				const data = await response.json();
				if (data.success) {
					const postThisNextData = data.data?.postThisNext || data.postThisNext || [];
					const fixTheseVideosData = data.data?.fixTheseVideos || data.fixTheseVideos || [];
					const doubleDownData = data.data?.doubleDown || data.doubleDown || [];
					
					setPostThisNext(Array.isArray(postThisNextData) ? postThisNextData : []);
					setFixTheseVideos(Array.isArray(fixTheseVideosData) ? fixTheseVideosData : []);
					setDoubleDown(Array.isArray(doubleDownData) ? doubleDownData : []);
					
					// Log for debugging
					console.log("[Growth Decisions] Data received:", {
						postThisNext: postThisNextData.length,
						fixTheseVideos: fixTheseVideosData.length,
						doubleDown: doubleDownData.length,
					});
				} else {
					console.error("[Growth Decisions] API returned error:", data.error || data.message);
					setError(data.error || data.message || "Failed to load growth decisions");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load growth decisions");
			} finally {
				setLoading(false);
			}
		};

		fetchGrowthDecisions();
	}, [youtubeConnected]);

	const fetchExplanation = async (
		type: "recommendation" | "leak",
		item: PostRecommendation | GrowthLeak,
		index: number
	) => {
		const key = `${type}-${index}`;
		if (loadingExplanations[key] || item.explanation) return;

		setLoadingExplanations((prev) => ({ ...prev, [key]: true }));

		try {
			const metrics: any = {};
			if (type === "recommendation") {
				const rec = item as PostRecommendation;
				metrics.retentionBoost = rec.retentionBoost;
			} else {
				const leak = item as GrowthLeak;
				metrics.ctr = leak.metrics.ctr;
				metrics.channelAvgCTR = leak.metrics.channelAvgCTR;
				metrics.retention = leak.metrics.retention;
				metrics.impressions = leak.metrics.impressions;
			}

			const response = await fetch("/api/youtube/growth-decisions/explain", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					metrics,
					triggeredRules: [type === "recommendation" ? "Post recommendation" : (item as GrowthLeak).issue],
					context: type === "recommendation" ? (item as PostRecommendation).reason : (item as GrowthLeak).fix,
					videoTitle: type === "leak" ? (item as GrowthLeak).title : undefined,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.explanation) {
					if (type === "recommendation") {
						setPostThisNext((prev) => {
							const updated = [...prev];
							updated[index] = { ...updated[index], explanation: data.explanation };
							return updated;
						});
					} else {
						setFixTheseVideos((prev) => {
							const updated = [...prev];
							updated[index] = { ...updated[index], explanation: data.explanation };
							return updated;
						});
					}
				}
			}
		} catch (error) {
			console.error("Failed to fetch explanation:", error);
		} finally {
			setLoadingExplanations((prev) => ({ ...prev, [key]: false }));
		}
	};

	const toggleExplanation = (key: string) => {
		setExpandedExplanations((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const formatCompact = (value: number) => {
		return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
	};

	if (!youtubeConnected) {
		return (
			<div className="min-h-screen bg-gray-1 dark:bg-gray-12 p-4 sm:p-6 lg:p-8">
				<div className="max-w-4xl mx-auto">
					<BackButton />
					<Card size="3" variant="surface" className="p-8 text-center mt-6">
						<Heading size="6" className="mb-4">Growth Decision Engine</Heading>
						<Text size="4" color="gray" className="mb-6">
							Connect your YouTube account to get specific, ranked decisions about what to post, what to fix, and what to repeat.
						</Text>
						<Text size="2" color="gray" className="mb-8">
							Once your YouTube data syncs, this section will show exactly what content to post next based on your channel's performance.
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
			<div className="max-w-4xl mx-auto">
				<BackButton />
				<Heading size="7" className="mb-2 mt-6">Growth Decisions</Heading>
				<Text size="3" color="gray" className="mb-8">
					Specific, ranked decisions backed by your YouTube Analytics data
				</Text>

				{loading && (
					<Card size="3" variant="surface" className="p-8 text-center">
						<Text size="4" color="gray">Analyzing your channel...</Text>
					</Card>
				)}

				{error && (
					<Card size="3" variant="surface" className="p-6 border border-gray-a6 bg-gray-a2">
						<Text size="3" color="gray" className="flex items-center gap-2">
							<ExclamationTriangleIcon />
							{error}
						</Text>
					</Card>
				)}

				{!loading && !error && (
					<div className="space-y-8">
						{/* Section 1: Post This Next - Hero Section */}
						<section>
							<Heading size="5" className="mb-4">Post This Next</Heading>
							<Text size="2" color="gray" className="mb-6">
								Top content recommendations based on your channel's performance patterns
							</Text>

							{postThisNext.length > 0 ? (
								<div className="space-y-4">
									{postThisNext.slice(0, 3).map((rec, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
										>
											<Card size="3" variant="surface" className="p-6 border border-gray-a4">
												<div className="flex items-start justify-between gap-4 mb-4">
													<div className="flex-grow">
														<div className="flex items-center gap-3 mb-3">
															<Badge
																color={
																	rec.confidence === "high" ? "green" :
																	rec.confidence === "medium" ? "yellow" : "gray"
																}
																size="2"
																variant="soft"
															>
																{rec.confidence.toUpperCase()} CONFIDENCE
															</Badge>
															<Heading size="4">{rec.topic}</Heading>
														</div>
														
														<Text size="3" weight="medium" className="mb-3 text-gray-12">
															{rec.expectedImpact}
														</Text>
														
														<Text size="2" color="gray" className="mb-4">
															{rec.reason}
														</Text>

														{rec.explanation && (
															<div className="mb-4">
																<button
																	onClick={() => toggleExplanation(`rec-${index}`)}
																	className="flex items-center gap-2 text-sm text-gray-11 hover:text-gray-12 transition-colors"
																>
																	Why am I seeing this?
																	{expandedExplanations[`rec-${index}`] ? (
																		<ChevronUpIcon className="w-4 h-4" />
																	) : (
																		<ChevronDownIcon className="w-4 h-4" />
																	)}
																</button>
																<AnimatePresence>
																	{expandedExplanations[`rec-${index}`] && (
																		<motion.div
																			initial={{ opacity: 0, height: 0 }}
																			animate={{ opacity: 1, height: "auto" }}
																			exit={{ opacity: 0, height: 0 }}
																			className="mt-2 p-3 rounded bg-gray-a2 border border-gray-a4"
																		>
																			<Text size="1" color="gray" className="mb-1 font-medium">
																				Explanation
																			</Text>
																			<Text size="2" color="gray">
																				{rec.explanation}
																			</Text>
																		</motion.div>
																	)}
																</AnimatePresence>
															</div>
														)}

														{!rec.explanation && (
															<button
																onClick={() => {
																	fetchExplanation("recommendation", rec, index);
																	toggleExplanation(`rec-${index}`);
																}}
																disabled={loadingExplanations[`recommendation-${index}`]}
																className="text-sm text-gray-11 hover:text-gray-12 transition-colors mb-4"
															>
																{loadingExplanations[`recommendation-${index}`] ? "Loading..." : "Why am I seeing this?"}
															</button>
														)}
													</div>
												</div>
												
												<Separator className="my-4" />
												
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4 text-sm text-gray-11">
														{rec.retentionBoost && (
															<span>{rec.retentionBoost}% higher retention</span>
														)}
														{rec.daysSinceLastPost && (
															<span>Last posted {rec.daysSinceLastPost} days ago</span>
														)}
													</div>
													<Link href="/planner">
														<Button size="2" variant="soft">
															Add to Planner
															<ArrowRightIcon className="ml-2 w-4 h-4" />
														</Button>
													</Link>
												</div>
											</Card>
										</motion.div>
									))}
								</div>
							) : (
								<Card size="3" variant="surface" className="p-8 border-dashed border-gray-a5">
									<Text size="3" color="gray" className="text-center">
										Once your YouTube data syncs, this section will show exactly what content to post next based on your channel's performance.
									</Text>
								</Card>
							)}
						</section>

						<Separator />

						{/* Section 2: Fix These Videos */}
						<section>
							<Heading size="5" className="mb-4">Fix These Videos</Heading>
							<Text size="2" color="gray" className="mb-6">
								Opportunities to improve performance and maximize reach
							</Text>

							{fixTheseVideos.length > 0 ? (
								<div className="space-y-4">
									{fixTheseVideos.slice(0, 5).map((leak, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
										>
											<Card 
												size="3" 
												variant="surface" 
												className={`p-6 border ${
													leak.severity === "high" 
														? "border-yellow-6 bg-yellow-a2" 
														: "border-gray-a4 bg-gray-a2"
												}`}
											>
												<div className="flex items-start justify-between gap-4 mb-4">
													<div className="flex-grow">
														<div className="flex items-center gap-3 mb-2">
															<Badge
																color={leak.severity === "high" ? "yellow" : "gray"}
																size="2"
																variant="soft"
															>
																{leak.severity.toUpperCase()}
															</Badge>
															<Text size="3" weight="medium" className="text-gray-12">
																{leak.title}
															</Text>
														</div>
														
														<Text size="2" color="gray" className="mb-3">
															{leak.issue}
														</Text>

														{leak.metrics.ctr !== undefined && leak.metrics.channelAvgCTR !== undefined && (
															<div className="mb-3 p-3 rounded bg-gray-a3 border border-gray-a4">
																<Text size="1" color="gray" className="mb-1">
																	CTR: {leak.metrics.ctr.toFixed(2)}% vs Channel Average: {leak.metrics.channelAvgCTR.toFixed(2)}%
																</Text>
																<Text size="1" color="gray">
																	{((1 - leak.metrics.ctr / leak.metrics.channelAvgCTR) * 100).toFixed(0)}% below average
																</Text>
															</div>
														)}

														<div className="mb-4">
															<Text size="2" weight="medium" className="mb-2">Recommended Fix</Text>
															<Text size="2" color="gray">
																{leak.fix}
															</Text>
														</div>

														{leak.explanation && (
															<div className="mb-4">
																<button
																	onClick={() => toggleExplanation(`leak-${index}`)}
																	className="flex items-center gap-2 text-sm text-gray-11 hover:text-gray-12 transition-colors"
																>
																	Why am I seeing this?
																	{expandedExplanations[`leak-${index}`] ? (
																		<ChevronUpIcon className="w-4 h-4" />
																	) : (
																		<ChevronDownIcon className="w-4 h-4" />
																	)}
																</button>
																<AnimatePresence>
																	{expandedExplanations[`leak-${index}`] && (
																		<motion.div
																			initial={{ opacity: 0, height: 0 }}
																			animate={{ opacity: 1, height: "auto" }}
																			exit={{ opacity: 0, height: 0 }}
																			className="mt-2 p-3 rounded bg-gray-a2 border border-gray-a4"
																		>
																			<Text size="1" color="gray" className="mb-1 font-medium">
																				Explanation
																			</Text>
																			<Text size="2" color="gray">
																				{leak.explanation}
																			</Text>
																		</motion.div>
																	)}
																</AnimatePresence>
															</div>
														)}

														{!leak.explanation && (
															<button
																onClick={() => {
																	fetchExplanation("leak", leak, index);
																	toggleExplanation(`leak-${index}`);
																}}
																disabled={loadingExplanations[`leak-${index}`]}
																className="text-sm text-gray-11 hover:text-gray-12 transition-colors mb-4"
															>
																{loadingExplanations[`leak-${index}`] ? "Loading..." : "Why am I seeing this?"}
															</button>
														)}
													</div>
												</div>
												
												<Separator className="my-4" />
												
												<Button size="2" variant="ghost">
													View Details
													<ArrowRightIcon className="ml-2 w-4 h-4" />
												</Button>
											</Card>
										</motion.div>
									))}
								</div>
							) : (
								<Card size="3" variant="surface" className="p-8 border-dashed border-gray-a5">
									<Text size="3" color="gray" className="text-center">
										No growth leaks detected. Your videos are performing well.
									</Text>
								</Card>
							)}
						</section>

						<Separator />

						{/* Section 3: Double Down */}
						<section>
							<Heading size="5" className="mb-4">Double Down</Heading>
							<Text size="2" color="gray" className="mb-6">
								What's working and should be repeated
							</Text>

							{doubleDown.length > 0 ? (
								<div className="space-y-4">
									{doubleDown.map((insight, index) => (
										<motion.div
											key={index}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
										>
											<Card size="3" variant="surface" className="p-6 border border-gray-a4">
												<div className="mb-4">
													<Text size="3" weight="medium" className="mb-2 text-gray-12">
														{insight.insight}
													</Text>
													<div className="p-3 rounded bg-gray-a2 border border-gray-a4">
														<Text size="2" weight="medium" className="mb-1">
															{insight.performance.metric}: {formatCompact(insight.performance.value)}
														</Text>
														<Text size="1" color="gray">
															{insight.performance.comparison}
														</Text>
													</div>
												</div>

												{insight.examples.length > 0 && (
													<div className="mb-4">
														<Text size="1" color="gray" className="mb-2">
															Examples:
														</Text>
														<div className="space-y-1">
															{insight.examples.slice(0, 3).map((example, i) => (
																<Text key={i} size="1" color="gray" className="pl-2">
																	• {example}
																</Text>
															))}
														</div>
													</div>
												)}

												<Text size="2" color="gray">
													Continue creating content in this format to maintain strong performance.
												</Text>
											</Card>
										</motion.div>
									))}
								</div>
							) : (
								<Card size="3" variant="surface" className="p-8 border-dashed border-gray-a5">
									<Text size="3" color="gray" className="text-center">
										Analyzing your content patterns. Recommendations will appear here once enough data is available.
									</Text>
								</Card>
							)}
						</section>

					</div>
				)}
			</div>
		</div>
	);
}
