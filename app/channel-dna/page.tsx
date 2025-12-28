"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { MagnifyingGlassIcon, ArrowRightIcon, CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/BackButton";

interface ChannelAnalysis {
	summary: string;
	channelPositioning: {
		niche: string;
		targetAudience: string;
		uniqueValue: string;
	};
	topPerformingContent: {
		types: string[];
		commonElements: string[];
		whyItWorks: string;
	};
	titleStrategy: {
		patterns: string[];
		length: string;
		keywords: string[];
		formula: string;
	};
	thumbnailStrategy: {
		style: string;
		elements: string[];
		colors: string[];
		bestPractices: string[];
	};
	postingStrategy: {
		frequency: string;
		consistency: string;
		optimalTiming: string;
	};
	contentLengthStrategy: {
		optimalLength: string;
		formatMix: string;
		reasoning: string;
	};
	audienceTargeting: {
		signals: string[];
		engagementPatterns: string;
		demographics: string;
	};
	whatMakesItWork: string[];
	takeaways: string[];
}

export default function ChannelDNAPage() {
	const searchParams = useSearchParams();
	const [channelUrl, setChannelUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [analyzing, setAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [analysis, setAnalysis] = useState<ChannelAnalysis | null>(null);
	const [channelData, setChannelData] = useState<any>(null);

	// Read URL parameter from homepage
	useEffect(() => {
		const urlParam = searchParams.get("url");
		if (urlParam) {
			setChannelUrl(decodeURIComponent(urlParam));
		}
	}, [searchParams]);

	const handleAnalyze = async () => {
		if (!channelUrl.trim()) {
			setError("Please enter a YouTube channel URL");
			return;
		}

		setLoading(true);
		setError(null);
		setAnalysis(null);
		setChannelData(null);

		try {
			// Step 1: Fetch channel data
			const fetchResponse = await fetch("/api/channel-dna/fetch", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelUrl: channelUrl.trim() }),
			});

			if (!fetchResponse.ok) {
				const errorData = await fetchResponse.json();
				throw new Error(errorData.error || "Failed to fetch channel data");
			}

			const fetchData = await fetchResponse.json();
			setChannelData(fetchData.data);

			// Step 2: Analyze with AI
			setAnalyzing(true);
			const analyzeResponse = await fetch("/api/channel-dna/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelData: fetchData.data }),
			});

			if (!analyzeResponse.ok) {
				const errorData = await analyzeResponse.json();
				throw new Error(errorData.error || "Failed to analyze channel");
			}

			const analyzeData = await analyzeResponse.json();
			setAnalysis(analyzeData.analysis);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
			setAnalyzing(false);
		}
	};

	return (
		<div className="relative min-h-screen">
			{/* Gradient Background */}
			<div className="fixed inset-0 bg-gradient-to-br from-gray-12 via-blue-12 to-purple-12 -z-10">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.2),transparent_50%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(37,99,235,0.25),transparent_50%)]"></div>
			</div>

			<div className="relative p-4 sm:p-6 lg:p-8">
				<div className="max-w-4xl mx-auto">
					<BackButton />
					<Heading size="7" className="mb-2 mt-6 text-white">Channel Deconstruction Engine</Heading>
					<Text size="3" className="mb-8 text-gray-300">
						Analyze any YouTube channel and extract repeatable success patterns
					</Text>

				{/* Input Section */}
				<Card size="3" variant="surface" className="p-6 mb-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<input
								type="url"
								placeholder="Paste a YouTube channel link"
								value={channelUrl}
								onChange={(e) => setChannelUrl(e.target.value)}
								className="w-full px-4 py-2 rounded-lg border border-gray-a6 dark:border-gray-a6 bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-8"
								disabled={loading}
							/>
							<Text size="1" color="gray" className="mt-2 text-gray-11 dark:text-gray-11">
								Example: youtube.com/@channelname
							</Text>
						</div>
						<Button
							variant="solid"
							color="blue"
							size="3"
							onClick={handleAnalyze}
							disabled={loading || !channelUrl.trim()}
							className="flex-shrink-0"
						>
							{loading ? (
								<>
									<ReloadIcon className="mr-2 w-4 h-4 animate-spin" />
									{analyzing ? "Analyzing..." : "Fetching..."}
								</>
							) : (
								<>
									<MagnifyingGlassIcon className="mr-2 w-4 h-4" />
									Analyze Channel
								</>
							)}
						</Button>
					</div>
					{error && (
						<Text size="2" className="mt-4 text-red-400">
							{error}
						</Text>
					)}
				</Card>

				{/* Channel Data Preview */}
				{channelData && (
					<Card size="3" variant="surface" className="p-6 mb-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
						<Heading size="5" className="mb-4">Channel Overview</Heading>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<div>
								<Text size="1" color="gray" className="mb-1">Subscribers</Text>
								<Text size="4" weight="bold">{channelData.subscriberCount.toLocaleString()}</Text>
							</div>
							<div>
								<Text size="1" color="gray" className="mb-1">Total Videos</Text>
								<Text size="4" weight="bold">{channelData.totalVideos}</Text>
							</div>
							<div>
								<Text size="1" color="gray" className="mb-1">Upload Frequency</Text>
								<Text size="4" weight="bold">{channelData.uploadFrequency}</Text>
							</div>
							<div>
								<Text size="1" color="gray" className="mb-1">Avg Length</Text>
								<Text size="4" weight="bold">{channelData.averageVideoLength}</Text>
							</div>
						</div>
					</Card>
				)}

				{/* Analysis Results */}
				<AnimatePresence>
					{analysis && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							className="space-y-6"
						>
							{/* Summary */}
							<Card size="3" variant="surface" className="p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-3">Summary</Heading>
								<Text size="3" color="gray">{analysis.summary}</Text>
							</Card>

							{/* Channel Positioning */}
							<Card size="3" variant="surface" className="p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-4">Channel Positioning & Niche</Heading>
								<div className="space-y-3">
									<div>
										<Text size="2" weight="medium" className="mb-1">Niche</Text>
										<Text size="3" color="gray">{analysis.channelPositioning.niche}</Text>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Target Audience</Text>
										<Text size="3" color="gray">{analysis.channelPositioning.targetAudience}</Text>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Unique Value</Text>
										<Text size="3" color="gray">{analysis.channelPositioning.uniqueValue}</Text>
									</div>
								</div>
							</Card>

							{/* Top Performing Content */}
							<Card size="3" variant="surface" className="p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-4">What Types of Videos Perform Best</Heading>
								<div className="space-y-3">
									<div>
										<Text size="2" weight="medium" className="mb-2">Content Types</Text>
										<div className="flex flex-wrap gap-2">
											{analysis.topPerformingContent.types.map((type, i) => (
												<Badge key={i} color="blue" variant="soft" size="2">
													{type}
												</Badge>
											))}
										</div>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Common Elements</Text>
										<Text size="3" color="gray">{analysis.topPerformingContent.commonElements.join(", ")}</Text>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Why It Works</Text>
										<Text size="3" color="gray">{analysis.topPerformingContent.whyItWorks}</Text>
									</div>
								</div>
							</Card>

							{/* Title Strategy */}
							<Card size="3" variant="surface" className="p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-4">Title & Thumbnail Strategy</Heading>
								<div className="space-y-3">
									<div>
										<Text size="2" weight="medium" className="mb-1">Title Patterns</Text>
										<div className="flex flex-wrap gap-2 mb-3">
											{analysis.titleStrategy.patterns.map((pattern, i) => (
												<Badge key={i} color="green" variant="soft" size="2">
													{pattern}
												</Badge>
											))}
										</div>
										<Text size="3" color="gray">{analysis.titleStrategy.formula}</Text>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Thumbnail Strategy</Text>
										<Text size="3" color="gray">{analysis.thumbnailStrategy.style}</Text>
										{analysis.thumbnailStrategy.bestPractices.length > 0 && (
											<ul className="mt-2 space-y-1">
												{analysis.thumbnailStrategy.bestPractices.map((practice, i) => (
													<li key={i} className="flex items-start gap-2">
														<CheckIcon className="w-4 h-4 text-green-11 mt-0.5 flex-shrink-0" />
														<Text size="2" color="gray">{practice}</Text>
													</li>
												))}
											</ul>
										)}
									</div>
								</div>
							</Card>

							{/* Posting Strategy */}
							<Card size="3" variant="surface" className="p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-4">Posting Consistency Strategy</Heading>
								<div className="space-y-3">
									<div>
										<Text size="2" weight="medium" className="mb-1">Frequency</Text>
										<Text size="3" color="gray">{analysis.postingStrategy.frequency}</Text>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Consistency</Text>
										<Text size="3" color="gray">{analysis.postingStrategy.consistency}</Text>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Optimal Timing</Text>
										<Text size="3" color="gray">{analysis.postingStrategy.optimalTiming}</Text>
									</div>
								</div>
							</Card>

							{/* Content Length Strategy */}
							<Card size="3" variant="surface" className="p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-4">Content Length Strategy</Heading>
								<div className="space-y-3">
									<div>
										<Text size="2" weight="medium" className="mb-1">Optimal Length</Text>
										<Text size="3" color="gray">{analysis.contentLengthStrategy.optimalLength}</Text>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Format Mix</Text>
										<Text size="3" color="gray">{analysis.contentLengthStrategy.formatMix}</Text>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Reasoning</Text>
										<Text size="3" color="gray">{analysis.contentLengthStrategy.reasoning}</Text>
									</div>
								</div>
							</Card>

							{/* Audience Targeting */}
							<Card size="3" variant="surface" className="p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-4">Audience Targeting Signals</Heading>
								<div className="space-y-3">
									<div>
										<Text size="2" weight="medium" className="mb-2">Key Signals</Text>
										<div className="flex flex-wrap gap-2">
											{analysis.audienceTargeting.signals.map((signal, i) => (
												<Badge key={i} color="purple" variant="soft" size="2">
													{signal}
												</Badge>
											))}
										</div>
									</div>
									<div>
										<Text size="2" weight="medium" className="mb-1">Engagement Patterns</Text>
										<Text size="3" color="gray">{analysis.audienceTargeting.engagementPatterns}</Text>
									</div>
								</div>
							</Card>

							{/* What Makes It Work */}
							<Card size="3" variant="surface" className="p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-4">What Makes This Channel Work</Heading>
								<ul className="space-y-2">
									{analysis.whatMakesItWork.map((insight, i) => (
										<li key={i} className="flex items-start gap-2">
											<CheckIcon className="w-4 h-4 text-green-11 mt-0.5 flex-shrink-0" />
											<Text size="3" color="gray">{insight}</Text>
										</li>
									))}
								</ul>
							</Card>

							{/* Takeaways */}
							<Card size="3" variant="surface" className="p-6 border-blue-a6 bg-blue-a2/95 backdrop-blur-sm">
								<Heading size="5" className="mb-4">Key Takeaways</Heading>
								<ul className="space-y-3">
									{analysis.takeaways.map((takeaway, i) => (
										<li key={i} className="flex items-start gap-2">
											<Text size="4" weight="bold" className="text-blue-11 flex-shrink-0">{i + 1}.</Text>
											<Text size="3" color="gray">{takeaway}</Text>
										</li>
									))}
								</ul>
							</Card>

							{/* Actions */}
							<div className="flex gap-4">
								<Button
									variant="solid"
									color="blue"
									size="3"
									onClick={() => {
										setChannelUrl("");
										setAnalysis(null);
										setChannelData(null);
									}}
									className="flex-1"
								>
									<ReloadIcon className="mr-2 w-4 h-4" />
									Analyze Another Channel
								</Button>
								<Button
									variant="ghost"
									color="gray"
									size="3"
									className="flex-1"
								>
									Save Analysis
								</Button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
				</div>
			</div>
		</div>
	);
}

