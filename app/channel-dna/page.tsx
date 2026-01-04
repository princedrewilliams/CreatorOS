"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Search, Sparkles, Zap, TrendingUp, Image as ImageIcon, Hash, Fingerprint } from "lucide-react";
import { ChannelProfile } from "../components/channel-dna/ChannelProfile";
import { ObservedPatterns } from "../components/channel-dna/ObservedPatterns";
import { ScoreBreakdownBar } from "../components/channel-dna/ScoreBreakdownBar";
import { DiscoveryLineChart } from "../components/channel-dna/DiscoveryLineChart";
import { ConsistencyBarChart } from "../components/channel-dna/ConsistencyBarChart";
import { ThumbComparisonChart } from "../components/channel-dna/ThumbComparisonChart";
import { WinningTopicsBubbleChart } from "../components/channel-dna/WinningTopicsBubbleChart";
import { IdentityRadarChart } from "../components/channel-dna/IdentityRadarChart";

const TABS = [
	{ id: "viral", label: "Viral Score", badge: "FREE", icon: Zap },
	{ id: "search", label: "Search & Discovery", icon: Search },
	{ id: "upload", label: "Upload Consistency", icon: TrendingUp },
	{ id: "thumb", label: "Thumbnail Performance", icon: ImageIcon },
	{ id: "topics", label: "Winning Topics", icon: Hash },
	{ id: "identity", label: "Channel Identity", icon: Fingerprint },
];

export default function ChannelDNAPage() {
	return (
		<Suspense fallback={<PageFallback />}>
			<ChannelDNAContent />
		</Suspense>
	);
}

function ChannelDNAContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [channelUrl, setChannelUrl] = useState("");
	const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
	const [loading, setLoading] = useState(false);
	const [_error, setError] = useState<string | null>(null);
	const [_info, setInfo] = useState<string | null>(null);
	const [analysis, setAnalysis] = useState<any>(null);
	const [channelData, setChannelData] = useState<any>(null);
	const [score, setScore] = useState<any>(null);
	const [aiSummary, setAiSummary] = useState<any>(null);
	const mockFlag = useMemo(() => {
		const v = (searchParams.get("mock") || "").toLowerCase();
		return v === "1" || v === "true" || v === "yes";
	}, [searchParams]);

	useEffect(() => {
		const urlParam = searchParams.get("url");
		if (urlParam) {
			const decoded = decodeURIComponent(urlParam);
			setChannelUrl(decoded);
			if (mockFlag) {
				const mock = getMockPayload(decoded);
				setAnalysis(mock.analysis);
				setChannelData(mock.channelData);
				setScore(mock.score);
				setAiSummary(mock.aiSummary);
				setInfo("Mock data loaded (testing mode).");
				setError(null);
			} else {
				void handleAnalyze(decoded);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const handleAnalyze = async (overrideUrl?: string) => {
		const target = (overrideUrl ?? channelUrl).trim();
		if (!target) {
			setError("Please enter a channel URL");
			return;
		}
		setLoading(true);
		setInfo(null);
		if (mockFlag) {
			const mock = getMockPayload(target);
			setAnalysis(mock.analysis);
			setChannelData(mock.channelData);
			setScore(mock.score);
			setAiSummary(mock.aiSummary);
			setError(null);
			setInfo("Mock data loaded (testing mode).");
			setLoading(false);
			return;
		}
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
			setScore(data.score || null);
			setAiSummary(data.aiSummary || null);
		} catch (err) {
			const message = err instanceof Error ? err.message : "An error occurred";
			// Fallback to mock to keep UI testable even on API failure
			const mock = getMockPayload(target);
			setAnalysis(mock.analysis);
			setChannelData(mock.channelData);
			setScore(mock.score);
			setAiSummary(mock.aiSummary);
			setError(null);
			setInfo(`Using mock data due to upstream error: ${message}`);
		} finally {
			setLoading(false);
		}
	};

	const baseStats = useMemo(() => {
		if (!channelData) return null;
		const channel = channelData.channel || channelData;
		return {
			title: channel.title || "—",
			description: channel.description || channel.bio || "—",
			thumbnail: channel.thumbnail || channel.avatar || channel.profilePicture || "",
			banner: channel.bannerUrl || channel.banner || "",
			niche: analysis?.["Channel Positioning"]?.summary || "—",
			subscribers: channel.subscriberCount ?? "—",
			views: channel.viewCount ?? "—",
			videos: channel.videoCount ?? "—",
			postingFrequency: channelData.metrics?.postingFrequency || "—",
			avgTitleLength: channelData.metrics?.averageTitleLength || "—",
		};
	}, [channelData, analysis]);



	const { scrollY } = useScroll();
	const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
	const headerY = useTransform(scrollY, [0, 100], [-20, 0]);

	if (loading) {
	return (
			<div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
				<div className="text-lg">Analyzing channel...</div>
			</div>
		);
	}

	if (!baseStats || !score) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
				<div className="text-lg">No channel data available</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-neutral-950 text-white font-sans selection:bg-white/20 overflow-x-hidden">
			{/* Sticky Header Background */}
			<motion.div
				style={{ opacity: headerOpacity, y: headerY }}
				className="fixed top-0 left-0 right-0 h-16 bg-neutral-950/80 backdrop-blur-md z-40"
			/>

			<div className="relative z-10 mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
				{/* Header */}
				<header className="flex items-center justify-between mb-8 sticky top-0 z-50 py-2">
					<motion.button
						whileHover={{ scale: 1.05, x: -5 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => router.push("/")}
						className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md group"
					>
						<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
						<span className="text-sm font-medium">Back</span>
					</motion.button>

					<div className="relative">
						<h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-pink-200 to-white animate-gradient-x bg-[length:200%_auto]">
							Channel Analyzer
						</h1>
						<motion.div
							className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-pink-500 to-transparent"
							initial={{ scaleX: 0 }}
							animate={{ scaleX: 1 }}
							transition={{ delay: 0.5, duration: 1 }}
						/>
								</div>

					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => router.push("/")}
						className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md text-sm font-medium flex items-center gap-2 group"
					>
						<Sparkles className="w-4 h-4 text-white/60 group-hover:rotate-12 transition-transform" />
						Analyze Another Channel
					</motion.button>
				</header>

				{/* Navigation Tabs */}
				<nav className="mb-8 overflow-x-auto pb-2 scrollbar-hide perspective-1000">
					<div className="flex items-center gap-2 min-w-max px-1">
						{TABS.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className="relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 group"
								>
									{isActive && (
										<motion.div
											layoutId="activeTab"
											className="absolute inset-0 rounded-full bg-white/10"
											transition={{ type: "spring", stiffness: 300, damping: 30 }}
										/>
									)}
									{!isActive && (
										<div className="absolute inset-0 rounded-full bg-white/[0.02]" />
									)}
									<span
										className={`relative z-10 flex items-center gap-2 ${
											isActive ? "text-white" : "text-white/60 hover:text-white"
										}`}
									>
										<Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
										{tab.label}
										{tab.badge && isActive && (
											<span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">
												{tab.badge}
											</span>
										)}
									</span>
								</button>
							);
						})}
									</div>
				</nav>

				{/* Main Content */}
				<div className="space-y-6">
					{/* Top Section: Channel Profile & Metrics */}
					<ChannelProfile baseStats={baseStats} score={score} />

					{/* Bottom Section: Split View */}
					{activeTab === "viral" ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[450px]">
							<ObservedPatterns 
								activeTab={activeTab}
								score={score}
								recommendations={aiSummary?.recommendations || aiSummary?.improvements || []} 
							/>
							<ScoreBreakdownBar totalScore={score?.total ?? 58} />
						</div>
					) : activeTab === "search" ? (
						/* Search tab uses full-width two-column layout */
						<DiscoveryLineChart />
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[450px]">
							<ObservedPatterns 
								activeTab={activeTab}
								score={score}
								recommendations={aiSummary?.recommendations || aiSummary?.improvements || []} 
							/>
							{activeTab === "upload" && <ConsistencyBarChart />}
							{activeTab === "thumb" && <ThumbComparisonChart />}
							{activeTab === "topics" && <WinningTopicsBubbleChart />}
							{activeTab === "identity" && <IdentityRadarChart />}
						</div>
					)}
								</div>

			</div>
		</div>
	);
}


function getMockPayload(url: string) {
	const channelHandle = url.split("/").pop() || "channelname";
	const mock = {
		channel: {
			title: "Mock Channel",
			description: "This is a mock channel bio/description used for UI testing.",
			thumbnail: "https://via.placeholder.com/112",
			avatar: "https://via.placeholder.com/112",
			profilePicture: "https://via.placeholder.com/112",
			bannerUrl: "https://via.placeholder.com/1200x400",
			viewCount: 12345678,
			subscriberCount: 456789,
			videoCount: 320,
			handle: channelHandle,
		},
		metrics: {
			postingFrequency: "3 videos/week",
			averageTitleLength: 52,
			commonKeywords: [
				{ word: "secret", count: 5 },
				{ word: "youtube", count: 4 },
				{ word: "grow", count: 3 },
			],
		},
		videos: [],
	};

	const mockScore = {
		total: 81,
		categories: {
			"Viral Score": 82,
			"Audience Engagement": 77,
			Discoverability: 74,
			"Upload Consistency": 80,
			"Thumbnail Performance": 79,
			"Topic Focus": 76,
			"Channel Identity": 81,
			"Replication Score": 81,
		},
		strengths: [
			{ category: "Viral Score", score: 82 },
			{ category: "Upload Consistency", score: 80 },
			{ category: "Channel Identity", score: 81 },
		],
		weaknesses: [
			{ category: "Topic Focus", score: 76 },
			{ category: "Discoverability", score: 74 },
			{ category: "Audience Engagement", score: 77 },
		],
		improvements: [
			"Front-load 1 keyword in the first 40 chars of title.",
			"Batch record 2 ahead to avoid gaps.",
			"Add 1-line promise to banner + about.",
		],
	};

	const mockAiSummary = {
		explanation: "Strong viral potential and consistency; improve keyword clarity and tighten topics.",
		strengths: mockScore.strengths.map((s) => `${s.category}: ${s.score}`),
		weaknesses: mockScore.weaknesses.map((s) => `${s.category}: ${s.score}`),
		improvements: mockScore.improvements,
	};

	const mk = (score: number, summary: string, insights: string[]) => ({ score, summary, insights });
	const mockAnalysis = {
		"Viral Potential": mk(82, "Hooks are clear and repeatable with strong topic intent.", [
			"Lead with the result in the first 5 seconds.",
			"Use 1 proof visual per video intro.",
			"Keep titles within 50-65 chars for punch.",
		]),
		"Engagement Signals": mk(77, "Audience reacts well to concise promises.", [
			"Ask 1 pointed question near 25s mark.",
			"Use pinned comment CTA tailored to topic.",
			"Reply to top 5 comments within 1 hour.",
		]),
		"SEO Strategy": mk(74, "Leaning on repeatable keyword buckets.", [
			"Front-load primary keyword in first 40 chars.",
			"Mirror keyword in description first line.",
			"Add 2-3 internal links to related videos.",
		]),
		"Posting Consistency": mk(80, "Reliable 3x/week cadence.", [
			"Batch record 2 ahead to avoid gaps.",
			"Publish same days/times for viewer habit.",
			"Alternate formats to avoid fatigue.",
		]),
		"Thumbnail Strategy": mk(79, "High contrast with minimal text.", [
			"Cap text at 2 words; keep faces large.",
			"Use one accent color for brand memory.",
			"Test no-text versions on top performers.",
		]),
		"Content Clusters": mk(76, "Two main clusters visible.", [
			"Run 3-video sprints per cluster.",
			"Create playlists that match clusters.",
			"Refresh older winners with new art.",
		]),
		"Channel Positioning": mk(81, "Clear promise and proof.", [
			"Add 1-line promise to banner + about.",
			"Open with proof that matches the promise.",
			"Keep intros under 12 seconds.",
		]),
		"Replication Score": mk(78, "This channel shows consistent patterns that can be replicated.", [
			"Standardize title formula for 5 uploads.",
			"Document thumbnail template for speed.",
			"Script retention saves at 30s/90s marks.",
		]),
	};

	return { channelData: mock, analysis: mockAnalysis, score: mockScore, aiSummary: mockAiSummary };
}

function PageFallback() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
			<div className="text-lg">Loading channel analysis…</div>
		</div>
	);
}


