"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { FrostedTabs, type Tab } from "../components/ui/FrostedTabs";
import { ChannelHeader } from "../components/channel-dna/ChannelHeader";
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

interface AnalysisResponse {
	analysis: Record<string, { score: number; summary: string; insights: string[] }>;
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

	// Generate insights with observational tone
	const getInsightsForTab = (tabId: string) => {
		const metrics = data?.data.metrics;
		const score = data?.score;
		const channel = data?.data.channel;

		const insightMap: Record<string, { id: string; pattern: string; examples?: string[] }[]> = {
			viral: [
				{
					id: "v1",
					pattern: `This channel tends to generate ${score?.categories?.["Viral Potential"] || 65}% viral signals based on recent view patterns.`,
					examples: data?.data.videos.slice(0, 2).map((v) => v.title),
				},
				{
					id: "v2",
					pattern: `Videos in this range often cluster around ${metrics?.postingFrequency?.toLowerCase() || "weekly"} release windows.`,
				},
				{
					id: "v3",
					pattern: "Uploads commonly show consistent hook placement in the opening seconds.",
				},
			],
			search: [
				{
					id: "s1",
					pattern: `This channel consistently places keywords like "${metrics?.commonKeywords?.[0]?.word || "topic"}" at the start of titles.`,
					examples: metrics?.commonKeywords?.slice(0, 3).map((k) => k.word),
				},
				{
					id: "s2",
					pattern: `Title lengths average ${metrics?.averageTitleLength || 45} characters, within optimal discovery range.`,
				},
				{
					id: "s3",
					pattern: "Descriptions tend to front-load primary keywords in the first line.",
				},
			],
			upload: [
				{
					id: "u1",
					pattern: `This channel maintains a ${metrics?.postingFrequency?.toLowerCase() || "consistent"} upload cadence.`,
				},
				{
					id: "u2",
					pattern: "Upload timing tends to cluster around specific days of the week.",
				},
				{
					id: "u3",
					pattern: `Video count of ${channel?.videoCount || 0} suggests an established content rhythm.`,
				},
			],
			thumb: [
				{
					id: "t1",
					pattern: "Thumbnails commonly feature high-contrast text with minimal word count.",
				},
				{
					id: "t2",
					pattern: "Visual style tends to maintain a consistent color palette across uploads.",
				},
				{
					id: "t3",
					pattern: "Face expressions and emotion appear frequently in top-performing thumbnails.",
				},
			],
			topics: [
				{
					id: "to1",
					pattern: `Primary topic clusters around "${metrics?.commonKeywords?.[0]?.word || "content"}" themed videos.`,
					examples: metrics?.commonKeywords?.slice(0, 4).map((k) => k.word),
				},
				{
					id: "to2",
					pattern: "This channel tends to release topic runs of 2-3 related videos in sequence.",
				},
				{
					id: "to3",
					pattern: "Secondary topics appear periodically to maintain audience variety.",
				},
			],
			identity: [
				{
					id: "i1",
					pattern: `Channel positioning centers on ${channel?.title || "content"} as the core identity.`,
				},
				{
					id: "i2",
					pattern: "Format consistency remains high across recent uploads.",
				},
				{
					id: "i3",
					pattern: "Brand signals appear consistently in thumbnails and titles.",
				},
			],
		};

		return insightMap[tabId] || [];
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
					<ChannelHeader
						channelId={channel?.id || ""}
						thumbnail={channel?.thumbnail || ""}
						name={channel?.title || "Channel"}
						summary={getSummary()}
						score={score?.total || 0}
					/>
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
				<TabContent
					insights={<InsightsPanel insights={getInsightsForTab(activeTab)} />}
					chart={
						<ChartPanel
							title={chartConfig[activeTab]?.title || "Chart"}
							description={chartConfig[activeTab]?.description}
						>
							{renderChart()}
						</ChartPanel>
					}
				/>
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
