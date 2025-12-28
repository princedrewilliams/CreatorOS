"use client";

import { useState, useEffect, Suspense } from "react";
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

function ChannelDNAContent() {
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
			const decoded = decodeURIComponent(urlParam);
			setChannelUrl(decoded);
			void handleAnalyze(decoded);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const handleAnalyze = async (overrideUrl?: string) => {
		const target = (overrideUrl ?? channelUrl).trim();
		if (!target) {
			setError("Please enter a YouTube channel URL");
			return;
		}

		setLoading(true);
		setAnalyzing(true);
		setError(null);
		setAnalysis(null);
		setChannelData(null);

		try {
			const res = await fetch("/api/channel-analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelUrl: target }),
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Failed to analyze channel");
			}
			const data = await res.json();
			setAnalysis(data.analysis || null);
			setChannelData(data.data || null);
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
				<div className="relative p-[2px] mb-6 rounded-2xl bg-gradient-to-r from-pink-500/50 via-pink-400/20 to-pink-500/50 shadow-[0_0_30px_rgba(255,60,160,0.25)] backdrop-blur-md">
					<div className="relative rounded-[14px] bg-[#0a0013]/90 px-4 py-5 pl-12 pr-44 shadow-[inset_0_0_18px_rgba(0,0,0,0.65)] border border-pink-500/10">
						{/* Icon on far left */}
						<div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200">
							<MagnifyingGlassIcon className="w-5 h-5" />
						</div>

						{/* Example text */}
						<Text size="1" className="absolute left-12 bottom-2 text-white text-[10px] sm:text-[11px]">
							Example: youtube.com/@channelname
						</Text>

						<input
							type="url"
							placeholder="Paste your YouTube URL here... (e.g., https://www.youtube.com/watch?v=PcZ2funGjYM)"
							value={channelUrl}
							onChange={(e) => setChannelUrl(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleAnalyze();
							}}
							className="w-full bg-transparent appearance-none border-0 text-sm sm:text-base text-white placeholder:text-gray-400 focus:outline-none focus:text-white focus:bg-transparent transition-colors pr-48 pt-3 pb-5 leading-snug"
							style={{ backgroundColor: "transparent", color: "#ffffff", WebkitTextFillColor: "#ffffff", caretColor: "#ffffff" }}
							autoComplete="off"
							disabled={loading}
						/>

						<button
							onClick={() => handleAnalyze()}
							disabled={loading}
							className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold shadow-[0_10px_25px_rgba(255,60,160,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{loading ? "Analyzing..." : "Analyze Channel"}
							<span className="ml-1 text-lg">›</span>
						</button>
					</div>
				</div>
				{error && (
					<Text size="2" className="mt-2 text-red-400">
						{error}
					</Text>
				)}

				{/* Channel Data Preview */}
				{channelData && (
					<Card size="3" variant="surface" className="p-6 mb-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
						<Heading size="5" className="mb-4">Channel Overview</Heading>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<div>
								<Text size="1" color="gray" className="mb-1">Subscribers</Text>
								<Text size="4" weight="bold">{channelData?.subscriberCount ? Number(channelData.subscriberCount).toLocaleString() : "—"}</Text>
							</div>
							<div>
								<Text size="1" color="gray" className="mb-1">Total Videos</Text>
								<Text size="4" weight="bold">{channelData?.totalVideos ?? "—"}</Text>
							</div>
							<div>
								<Text size="1" color="gray" className="mb-1">Upload Frequency</Text>
								<Text size="4" weight="bold">{channelData?.uploadFrequency ?? "—"}</Text>
							</div>
							<div>
								<Text size="1" color="gray" className="mb-1">Avg Length</Text>
								<Text size="4" weight="bold">{channelData?.averageVideoLength ?? "—"}</Text>
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

export default function ChannelDNAPage() {
	return (
		<Suspense fallback={
			<div className="relative min-h-screen">
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
							Loading...
						</Text>
					</div>
				</div>
			</div>
		}>
			<ChannelDNAContent />
		</Suspense>
	);
}

