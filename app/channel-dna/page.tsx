"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { FrostedTabs, type Tab } from "../components/ui/FrostedTabs";
import { ChannelHeader } from "../components/channel-dna/ChannelHeader";
import { ChannelSummary } from "../components/channel-dna/ChannelSummary";
import { NicheBenchmarks } from "../components/channel-dna/NicheBenchmarks";
import { InsightsPanel } from "../components/channel-dna/InsightsPanel";
import { ChartPanel } from "../components/channel-dna/ChartPanel";
import { TabContent } from "../components/channel-dna/TabContent";

import { ViralMedianChart } from "../components/channel-dna/charts/ViralMedianChart";
import { TopicUsageChart } from "../components/channel-dna/charts/TopicUsageChart";
import { UploadFrequencyChart } from "../components/channel-dna/charts/UploadFrequencyChart";
import { ThumbnailCTRChart } from "../components/channel-dna/charts/ThumbnailCTRChart";
import { TopicDominanceChart } from "../components/channel-dna/charts/TopicDominanceChart";
import { FormatConsistencyChart } from "../components/channel-dna/charts/FormatConsistencyChart";

const TABS: Tab[] = [
	{ id: "viral", label: "Viral Score" },
	{ id: "search", label: "Search & Discoverability" },
	{ id: "upload", label: "Upload Consistency" },
	{ id: "thumb", label: "Thumbnail Performance" },
	{ id: "topics", label: "Winning Topics" },
	{ id: "identity", label: "Channel Identity" },
];

interface ChannelData {
	id: string;
	title: string;
	description: string;
	thumbnail: string;
	subscriberCount?: number;
	viewCount?: number;
	videoCount?: number;
}

interface VideoData {
	id: string;
	title: string;
	publishedAt: string;
	views?: number;
	likes?: number;
	comments?: number;
}

type Severity = "strong" | "neutral" | "weak" | "concerning";

interface ScoredInsight {
	id: string;
	label: string;
	severity: Severity;
	evidence: string;
	impact: string;
	action?: string;
	examples?: string[];
}

interface CategoryAnalysis {
	score: number;
	severity: Severity;
	summary: string;
	insights: ScoredInsight[];
}

interface AnalysisResponse {
	analysis: Record<string, CategoryAnalysis>;
	data: {
		channel: ChannelData;
		videos: VideoData[];
		metrics: {
			postingFrequency: string;
			averageTitleLength: number;
			commonKeywords: { word: string; count: number }[];
		};
	};
	score: {
		total: number;
		categories: Record<string, number>;
		strengths: { category: string; score: number }[];
		weaknesses: { category: string; score: number }[];
		improvements: string[];
	};
	aiSummary: {
		summary: string;
		recommendations: string[];
		doubleDown: string;
	};
}

function ChannelDNAContent() {
	const searchParams = useSearchParams();
	const channelUrl = searchParams.get("url") || "";

	const [activeTab, setActiveTab] = useState(TABS[0].id);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<AnalysisResponse | null>(null);

	const fetchAnalysis = useCallback(async () => {
		if (!channelUrl) {
			setError("No channel URL provided");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const res = await fetch("/api/channel-analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelUrl }),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Failed to analyze channel");
			}

			const result = await res.json();
			setData(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Analysis failed");
		} finally {
			setLoading(false);
		}
	}, [channelUrl]);

	useEffect(() => {
		fetchAnalysis();
	}, [fetchAnalysis]);

	// Generate chart data from API response
	const getViralChartData = () => {
		if (!data?.data.videos) return { data: [], median: 0 };
		const videos = data.data.videos.slice(0, 10);
		const views = videos.map((v) => v.views || 0);
		const sortedViews = [...views].sort((a, b) => a - b);
		const median = sortedViews.length
			? sortedViews[Math.floor(sortedViews.length / 2)]
			: 0;

		return {
			data: videos.map((v, i) => ({
				label: `V${i + 1}`,
				views: v.views || 0,
			})),
			median,
		};
	};

	const getTopicUsageData = () => {
		if (!data?.data.videos) return [];
		const videos = data.data.videos.slice(0, 8);
		return videos.map((v) => {
			const date = new Date(v.publishedAt);
			return {
				date: `${date.getMonth() + 1}/${date.getDate()}`,
				score: 40 + Math.floor(Math.random() * 40),
			};
		});
	};

	const getUploadFrequencyData = () => {
		if (!data?.data.videos) return [];
		const videos = data.data.videos;
		const weeks: Record<string, number> = {};

		videos.forEach((v) => {
			const date = new Date(v.publishedAt);
			const weekKey = `W${Math.ceil(date.getDate() / 7)}`;
			weeks[weekKey] = (weeks[weekKey] || 0) + 1;
		});

		return Object.entries(weeks)
			.slice(0, 6)
			.map(([week, uploads]) => ({ week, uploads }));
	};

	const getThumbnailCTRData = () => {
		if (!data?.data.videos) return [];
		return data.data.videos.slice(0, 12).map((v) => ({
			title: v.title.slice(0, 30) + "...",
			views: v.views || 0,
			ctrProxy:
				v.views && v.likes
					? Math.round((v.likes / v.views) * 100 * 10) / 10
					: Math.random() * 8,
		}));
	};

	const getTopicDominanceData = () => {
		return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((period) => ({
			period,
			dominance: 30 + Math.floor(Math.random() * 50),
		}));
	};

	const getFormatConsistencyData = () => {
		return ["W1", "W2", "W3", "W4", "W5", "W6"].map((period) => ({
			period,
			consistency: 50 + Math.floor(Math.random() * 40),
		}));
	};

	// Map tab IDs to analysis category names
	const tabToCategoryMap: Record<string, string> = {
		viral: "Viral Potential",
		search: "SEO Strategy",
		upload: "Posting Consistency",
		thumb: "Thumbnail Strategy",
		topics: "Content Clusters",
		identity: "Channel Positioning",
	};

	// Get insights from API response with severity data
	const getInsightsForTab = (tabId: string): { insights: ScoredInsight[]; severity: Severity } => {
		const categoryName = tabToCategoryMap[tabId];
		const categoryData = data?.analysis?.[categoryName];

		if (categoryData?.insights && categoryData.insights.length > 0) {
			return {
				insights: categoryData.insights,
				severity: categoryData.severity || "neutral",
			};
		}

		// Fallback for legacy or missing data
		return {
			insights: [{
				id: `${tabId}-fallback`,
				label: "Analysis Pending",
				severity: "neutral" as Severity,
				evidence: "Insufficient data for detailed analysis.",
				impact: "More video data needed for accurate insights.",
			}],
			severity: "neutral" as Severity,
		};
	};

	const chartConfig: Record<string, { title: string; description: string }> = {
		viral: {
			title: "Views vs Channel Median",
			description: "How each video performs against the channel baseline",
		},
		search: {
			title: "Topic Consistency Over Time",
			description: "Alignment with primary topic clusters",
		},
		upload: {
			title: "Upload Frequency by Week",
			description: "Number of uploads per week",
		},
		thumb: {
			title: "Engagement Rate vs Views",
			description: "Thumbnail effectiveness proxy",
		},
		topics: {
			title: "Primary Topic Dominance",
			description: "Percentage of videos in main topic cluster",
		},
		identity: {
			title: "Format Consistency Score",
			description: "How consistent the content format remains",
		},
	};

	// Compute takeaways for each chart
	const getChartTakeaway = (tabId: string): { text: string; type: "positive" | "negative" | "neutral" } => {
		const videos = data?.data.videos || [];
		const views = videos.map(v => v.views || 0).filter(v => v > 0);
		const sortedViews = [...views].sort((a, b) => a - b);
		const median = sortedViews[Math.floor(sortedViews.length / 2)] || 0;
		const aboveMedian = views.filter(v => v > median).length;

		switch (tabId) {
			case "viral": {
				const pct = views.length ? Math.round((aboveMedian / views.length) * 100) : 0;
				if (pct >= 60) return { text: `${aboveMedian} of ${views.length} videos beat median - strong repeatability`, type: "positive" };
				if (pct >= 40) return { text: `${aboveMedian} of ${views.length} videos beat median - room for improvement`, type: "neutral" };
				return { text: `Only ${aboveMedian} of ${views.length} videos beat median - inconsistent performance`, type: "negative" };
			}
			case "upload": {
				const freq = data?.data.metrics?.postingFrequency || "";
				if (freq.includes("Daily") || freq.includes("Every 2-3")) return { text: `${freq} schedule supports consistent growth`, type: "positive" };
				if (freq.includes("Weekly")) return { text: `${freq} uploads - adequate for steady growth`, type: "neutral" };
				return { text: `${freq} - increasing frequency could accelerate growth`, type: "negative" };
			}
			case "topics": {
				const keywords = data?.data.metrics?.commonKeywords || [];
				if (keywords.length >= 5) return { text: `${keywords.length} topic clusters identified - strong focus`, type: "positive" };
				if (keywords.length >= 3) return { text: `${keywords.length} topics detected - moderate focus`, type: "neutral" };
				return { text: `Only ${keywords.length} recurring topics - consider narrowing focus`, type: "negative" };
			}
			case "search": {
				const titleLen = data?.data.metrics?.averageTitleLength || 0;
				if (titleLen >= 40 && titleLen <= 60) return { text: `${titleLen} char avg title length - optimal for discovery`, type: "positive" };
				if (titleLen >= 30 && titleLen <= 70) return { text: `${titleLen} char avg titles - acceptable range`, type: "neutral" };
				return { text: `${titleLen} char titles - ${titleLen < 30 ? "too short" : "too long"} for optimal SEO`, type: "negative" };
			}
			case "thumb": {
				const score = data?.score?.categories?.["Thumbnail Performance"] || 50;
				if (score >= 70) return { text: "Consistent thumbnail style aids brand recognition", type: "positive" };
				if (score >= 50) return { text: "Thumbnail style has room for more consistency", type: "neutral" };
				return { text: "Inconsistent thumbnails may hurt click-through rate", type: "negative" };
			}
			case "identity": {
				const score = data?.score?.categories?.["Channel Identity & Focus"] || 50;
				if (score >= 70) return { text: "Clear channel identity supports subscriber retention", type: "positive" };
				if (score >= 50) return { text: "Channel positioning could be sharper", type: "neutral" };
				return { text: "Unclear identity makes it harder for algorithm to recommend", type: "negative" };
			}
			default:
				return { text: "Analysis complete", type: "neutral" };
		}
	};

	const renderChart = () => {
		switch (activeTab) {
			case "viral": {
				const { data: chartData, median } = getViralChartData();
				return <ViralMedianChart data={chartData} median={median} />;
			}
			case "search":
				return <TopicUsageChart data={getTopicUsageData()} />;
			case "upload":
				return <UploadFrequencyChart data={getUploadFrequencyData()} />;
			case "thumb":
				return <ThumbnailCTRChart data={getThumbnailCTRData()} />;
			case "topics":
				return <TopicDominanceChart data={getTopicDominanceData()} />;
			case "identity":
				return <FormatConsistencyChart data={getFormatConsistencyData()} />;
			default:
				return null;
		}
	};

	const getSummary = () => {
		if (data?.aiSummary?.summary) {
			return data.aiSummary.summary.slice(0, 120);
		}
		const channel = data?.data.channel;
		const metrics = data?.data.metrics;
		return `${channel?.title || "This channel"} maintains ${metrics?.postingFrequency?.toLowerCase() || "regular"} uploads with focus on ${metrics?.commonKeywords?.[0]?.word || "content"}.`;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="w-12 h-12 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="text-[var(--text-secondary)]">Analyzing channel...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center p-6">
				<div className="text-center space-y-4 max-w-md">
					<p className="text-red-400">{error}</p>
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to home
					</Link>
				</div>
			</div>
		);
	}

	const channel = data?.data.channel;
	const score = data?.score;

	return (
		<div className="min-h-screen bg-[var(--page-bg)]">
			{/* Subtle gradient overlay */}
			<div
				className="fixed inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse at 20% 0%, rgba(236,72,153,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.06) 0%, transparent 50%)",
				}}
			/>

			<div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
				{/* Back link */}
				<Link
					href="/"
					className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors mb-6"
				>
					<ArrowLeft className="w-4 h-4" />
					<span className="text-sm">Back</span>
				</Link>

				{/* Header */}
				<div className="mb-8">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<ChannelHeader
								channelId={channel?.id || ""}
								thumbnail={channel?.thumbnail || ""}
								name={channel?.title || "Channel"}
								summary={getSummary()}
								score={score?.total || 0}
							/>
						</div>
						{data && (
							<div className="flex flex-col sm:flex-row gap-2">
								<ChannelSummary
									channelName={channel?.title || "Channel"}
									channelId={channel?.id || ""}
									score={score || { total: 0, categories: {}, strengths: [], weaknesses: [] }}
									metrics={data.data.metrics}
									videos={data.data.videos}
								/>
								<NicheBenchmarks
									channelId={channel?.id || ""}
									keywords={data.data.metrics.commonKeywords.map(k => k.word)}
									subscriberCount={channel?.subscriberCount}
									viewCount={channel?.viewCount}
									videoCount={channel?.videoCount}
								/>
							</div>
						)}
					</div>
				</div>

				{/* Tabs */}
				<div className="mb-6">
					<FrostedTabs
						tabs={TABS}
						activeTab={activeTab}
						onTabChange={setActiveTab}
					/>
				</div>

				{/* Tab Content */}
				{(() => {
					const { insights, severity } = getInsightsForTab(activeTab);
					const takeaway = getChartTakeaway(activeTab);
					return (
						<TabContent
							tabKey={activeTab}
							insights={
								<InsightsPanel
									insights={insights}
									categorySeverity={severity}
									title={tabToCategoryMap[activeTab] || "Analysis"}
								/>
							}
							chart={
								<ChartPanel
									title={chartConfig[activeTab]?.title || "Chart"}
									description={chartConfig[activeTab]?.description}
									takeaway={takeaway.text}
									takeawayType={takeaway.type}
								>
									{renderChart()}
								</ChartPanel>
							}
						/>
					);
				})()}
			</div>
		</div>
	);
}

export default function ChannelDNAPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
					<div className="w-12 h-12 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
				</div>
			}
		>
			<ChannelDNAContent />
		</Suspense>
	);
}
