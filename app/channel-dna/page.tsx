"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Text, Heading, Card, Button } from "@whop/react/components";

const TABS = [
	"Viral Score",
	"Audience Engagement",
	"Search & Discoverability",
	"Upload Consistency",
	"Thumbnail Performance",
	"Winning Topics",
	"Channel Identity",
	"Replication Score",
];

const TAB_TO_ANALYSIS: Record<string, string> = {
	"Viral Score": "Viral Potential",
	"Audience Engagement": "Engagement Signals",
	"Search & Discoverability": "SEO Strategy",
	"Upload Consistency": "Posting Consistency",
	"Thumbnail Performance": "Thumbnail Strategy",
	"Winning Topics": "Content Clusters",
	"Channel Identity": "Channel Positioning",
	"Replication Score": "Replication Score",
};

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
	const [activeTab, setActiveTab] = useState<string>(TABS[0]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
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

	const trendingVideos = useMemo(() => {
		const videos = (channelData?.videos || []) as any[];
		const mapped = videos.slice(0, 3).map((v) => ({
			id: v.id,
			title: v.title,
			views: v.views || v.statistics?.viewCount,
			publishedAt: v.publishedAt,
			thumbnail: v.thumbnails?.high?.url || v.thumbnails?.medium?.url || v.thumbnails?.default?.url,
			score: analysis?.["Viral Potential"]?.score ?? 0,
		}));
		if (mapped.length) return mapped;
		return [
			{
				id: "mock-1",
				title: "This Negotiation Trick Makes You Rich",
				views: 1928715,
				publishedAt: "4 weeks ago",
				thumbnail: "https://via.placeholder.com/320x180",
				score: 87,
			},
			{
				id: "mock-2",
				title: "10 Websites to Make Easy Money",
				views: 3162850,
				publishedAt: "2 months ago",
				thumbnail: "https://via.placeholder.com/320x180",
				score: 82,
			},
			{
				id: "mock-3",
				title: "9 Mistakes Killing Your Wealth",
				views: 981209,
				publishedAt: "1 month ago",
				thumbnail: "https://via.placeholder.com/320x180",
				score: 78,
			},
		];
	}, [channelData, analysis]);

	const categories = useMemo<Record<string, number>>(() => {
		return (score?.categories as Record<string, number>) || {};
	}, [score]);

	return (
		<div className="relative min-h-screen bg-[#05000b]">
			<div className="fixed inset-0 -z-10 overflow-hidden bg-[#05000b]">
				<div className="absolute inset-0 bg-gradient-to-br from-[#0b0018] via-[#090013] to-[#020008]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,66,166,0.35),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(255,130,230,0.32),transparent_45%),radial-gradient(circle_at_50%_78%,rgba(120,0,90,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,30,140,0.2),transparent_55%)]" />
				<div className="absolute inset-0 opacity-80 bg-[linear-gradient(120deg,rgba(255,52,160,0.4),rgba(255,52,160,0)_38%),linear-gradient(-115deg,rgba(255,105,200,0.34),rgba(255,105,200,0)_32%),linear-gradient(150deg,rgba(255,90,170,0.28),rgba(255,90,170,0)_42%)]" />
			</div>

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
				<div className="flex items-center justify-between mb-4">
					<Heading size="6" className="text-white flex items-center gap-2">
						<span className="w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_15px_rgba(255,64,170,0.6)]" />
						Channel Analyzer
					</Heading>
					<Button
						variant="ghost"
						color="gray"
						onClick={() => router.push("/")}
						className="text-white border border-white/10 hover:border-pink-400 hover:text-white"
					>
						Analyze Another Channel
					</Button>
				</div>

				{/* Top nav tabs */}
				<div className="flex flex-wrap gap-2 mb-6">
					{TABS.map((tab) => {
						const isActive = activeTab === tab;
						return (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`px-4 py-2 text-sm rounded-full border transition-colors flex items-center gap-2 ${
									isActive
										? "border-pink-400 bg-gradient-to-r from-pink-500/60 via-pink-500/40 to-purple-500/50 text-white shadow-[0_0_25px_rgba(255,80,180,0.35)]"
										: "border-white/10 bg-white/5 text-white/80 hover:border-pink-300/60 hover:text-white"
								}`}
							>
								{tab}
								{isActive && <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 border border-white/20">FREE</span>}
							</button>
						);
					})}
				</div>

				{/* Main content */}
				<div className="grid lg:grid-cols-[1.65fr,0.85fr] gap-5">
					{/* Left: Hero + Trending */}
					<div className="space-y-4">
						<Card className="p-5 sm:p-6 bg-gradient-to-br from-[#140017] via-[#0c0014] to-[#090012] border border-pink-500/20 shadow-[0_0_40px_rgba(255,60,170,0.25)]">
							<div className="flex flex-col lg:flex-row gap-6">
								<div className="flex items-center gap-4 flex-1">
									<div className="relative">
										<div className="absolute inset-0 rounded-full bg-pink-500/40 blur-xl" />
										<div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-pink-400 shadow-[0_0_30px_rgba(255,80,170,0.5)]">
											{baseStats?.thumbnail ? (
												<Image src={baseStats.thumbnail} alt="Avatar" fill className="object-cover" />
											) : (
												<div className="w-full h-full flex items-center justify-center text-white/70 text-xs">No avatar</div>
											)}
										</div>
									</div>
									<div className="space-y-1">
										<Heading size="6" className="text-white leading-tight">{baseStats?.title || "Channel"}</Heading>
										<Text size="2" className="text-white/70 leading-tight">
											{formatNumber(baseStats?.subscribers)} subscribers • {formatNumber(baseStats?.views)} views
										</Text>
										<Text size="2" className="text-white/70 leading-tight">
											{baseStats?.postingFrequency || "—"} • {baseStats?.niche || "Business & Finance"}
										</Text>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<div className="relative w-24 h-24 flex items-center justify-center">
										<div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500 opacity-60 blur-md" />
										<div className="absolute inset-1 rounded-full border border-pink-400/60" />
										<div className="relative flex flex-col items-center justify-center w-full h-full rounded-full bg-black/40 text-white">
											<Text size="1" className="text-white/70">Channel</Text>
											<Heading size="7" className="text-white leading-none">
												{score?.total ?? "—"}
											</Heading>
										</div>
									</div>
									<div className="space-y-2">
										<Button
											variant="soft"
											color="purple"
											size="2"
											className="bg-pink-500/20 border border-pink-400/40 text-white hover:bg-pink-500/30"
											onClick={() => window?.scrollTo({ top: 0, behavior: "smooth" })}
										>
											Share Report
										</Button>
										<Button
											variant="ghost"
											color="gray"
											size="2"
											className="text-white border border-white/15 hover:border-pink-400"
											onClick={() => void handleAnalyze()}
										>
											Refresh
										</Button>
									</div>
								</div>
							</div>

							<div className="mt-6 grid md:grid-cols-[1.3fr,0.7fr] gap-5 items-start">
								<div>
									<Heading size="5" className="text-white mb-2">Your Top 10% Viral Channel</Heading>
									<Text size="3" className="text-white/80">
										{analysis?.["Viral Potential"]?.summary || "This channel repeatedly produces videos that perform beyond its subscriber base."}
									</Text>
									<div className="mt-4 space-y-2">
										{(analysis?.["Viral Potential"]?.insights || []).slice(0, 3).map((item: string, i: number) => (
											<div key={i} className="flex items-start gap-2 text-white/85">
												<span className="mt-1 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_10px_rgba(255,80,170,0.6)]" />
												<Text size="3">{item}</Text>
											</div>
										))}
									</div>
								</div>
								<Card className="bg-black/30 border border-pink-500/20 p-4 space-y-2">
									<Heading size="4" className="text-white flex items-center gap-2">AI Insights</Heading>
									{(analysis?.[TAB_TO_ANALYSIS[activeTab]]?.insights || []).slice(0, 3).map((item: string, i: number) => (
										<div key={i} className="flex items-start gap-2 text-white/85">
											<span className="mt-1 w-1.5 h-1.5 rounded-full bg-pink-300" />
											<Text size="2" className="text-white/80">{item}</Text>
										</div>
									))}
								</Card>
							</div>
						</Card>

						<Card className="p-5 bg-black/30 border border-white/10 backdrop-blur-md">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-white text-sm">
										Viral Score: {categories?.["Viral Score"] ?? "—"}/100
									</div>
									<Heading size="5" className="text-white">Trending Viral Videos</Heading>
								</div>
								<Text size="2" className="text-white/60">Top performers by recency</Text>
							</div>
							<div className="grid md:grid-cols-3 gap-4">
								{trendingVideos.map((video) => (
									<div key={video.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-lg">
										<div className="relative aspect-[16/9]">
											<Image
												src={video.thumbnail}
												alt={video.title}
												fill
												className="object-cover"
											/>
											<div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
												{video.score ? `${video.score}%` : "Top"}
											</div>
										</div>
										<div className="p-3 space-y-1">
											<Text size="3" className="text-white font-semibold leading-snug line-clamp-2">
												{video.title}
											</Text>
											<Text size="2" className="text-white/70">
												{formatNumber(video.views)} views • {video.publishedAt || "recently"}
											</Text>
										</div>
									</div>
								))}
							</div>
						</Card>
					</div>

					{/* Right: Score + detail */}
					<div className="space-y-4">
						<Card className="p-5 bg-black/30 border border-pink-500/20 backdrop-blur-md">
							<div className="flex gap-4 items-center">
								<div className="relative w-28 h-28 flex items-center justify-center">
									<div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500 opacity-50 blur-md" />
									<div className="absolute inset-1 rounded-full border border-pink-400/60" />
									<div className="relative flex flex-col items-center justify-center w-full h-full rounded-full bg-black/40 text-white">
										<Text size="1" className="text-white/70">Score</Text>
										<Heading size="7" className="text-white leading-none">{score?.total ?? "—"}</Heading>
									</div>
								</div>
								<div className="flex-1 space-y-2">
									<Heading size="5" className="text-white">Channel Score</Heading>
									<Text size="3" className="text-white/75">
										{aiSummary?.explanation || "Deterministic score based on viral performance, engagement, discoverability, cadence, thumbnails, focus, and identity."}
									</Text>
								</div>
							</div>
							<div className="mt-4 space-y-2">
								{Object.entries(categories).map(([label, val]) => (
									<ScoreBar key={label} label={label} value={Number(val ?? 0)} />
								))}
							</div>
							<div className="mt-4 grid grid-cols-2 gap-3">
								<Metric label="Subscribers" value={formatNumber(baseStats?.subscribers)} />
								<Metric label="Views" value={formatNumber(baseStats?.views)} />
								<Metric label="Videos" value={formatNumber(baseStats?.videos)} />
								<Metric label="Cadence" value={baseStats?.postingFrequency || "—"} />
							</div>
						</Card>

						<Card className="p-5 bg-black/30 border border-white/10 backdrop-blur-md">
							<Heading size="5" className="text-white mb-3">Why this score?</Heading>
							<div className="space-y-2">
								<Text size="3" className="text-white/80">{aiSummary?.explanation || "Based on weighted performance across key growth levers."}</Text>
								<div className="grid sm:grid-cols-2 gap-3">
									<div>
										<Text size="2" className="text-white/70 mb-1">Top strengths</Text>
										<ul className="list-disc list-inside text-white/80 space-y-1">
											{(aiSummary?.strengths || score?.strengths || []).slice(0, 3).map((s: any, i: number) => (
												<li key={i}>{typeof s === "string" ? s : `${s.category}: ${s.score}`}</li>
											))}
										</ul>
									</div>
									<div>
										<Text size="2" className="text-white/70 mb-1">Top weaknesses</Text>
										<ul className="list-disc list-inside text-white/80 space-y-1">
											{(aiSummary?.weaknesses || score?.weaknesses || []).slice(0, 3).map((s: any, i: number) => (
												<li key={i}>{typeof s === "string" ? s : `${s.category}: ${s.score}`}</li>
											))}
										</ul>
									</div>
								</div>
								<div className="mt-2">
									<Text size="2" className="text-white/70 mb-1">High-impact improvements</Text>
									<ul className="list-disc list-inside text-white/80 space-y-1">
										{(aiSummary?.improvements || score?.improvements || []).slice(0, 3).map((s: any, i: number) => (
											<li key={i}>{s}</li>
										))}
									</ul>
								</div>
							</div>
						</Card>

						<Card className="p-5 bg-black/30 border border-pink-500/20 backdrop-blur-md">
							<TabContent tab={activeTab} analysis={analysis} channelData={channelData} />
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

function TabContent({ tab, analysis, channelData }: { tab: string; analysis: any; channelData: any }) {
	const analysisKey = TAB_TO_ANALYSIS[tab] || tab;
	const bucket = analysis?.[analysisKey] || {};
	const score = bucket.score ?? "—";
	const summary = bucket.summary || "No summary yet.";
	const insights: string[] = bucket.insights || [];

	return (
		<div className="space-y-4 text-white">
			<div className="flex items-center justify-between flex-wrap gap-2">
				<Text size="4" className="text-white font-semibold">{tab}</Text>
				<div className="px-3 py-1 rounded-full border border-white/20 bg-white/5 text-sm">
					Score: <span className="font-semibold text-pink-300">{score}</span>/100
				</div>
			</div>
			<Text size="3" className="text-white/80">{summary}</Text>
			<div className="space-y-2">
				{insights.length ? (
					<ul className="list-disc list-inside space-y-1 text-white/80">
						{insights.map((item, i) => (
							<li key={i}>{item}</li>
						))}
					</ul>
				) : (
					<Text size="2" className="text-white/60">Insights will appear after analysis.</Text>
				)}
			</div>
			{tab === "Posting Consistency" && channelData?.metrics && (
				<div className="grid sm:grid-cols-3 gap-3">
					<Metric label="Cadence" value={channelData.metrics.postingFrequency} />
					<Metric label="Avg title length" value={`${channelData.metrics.averageTitleLength ?? "—"} chars`} />
					<Metric
						label="Top keywords"
						value={channelData.metrics.commonKeywords?.slice(0, 4).map((k: any) => k.word).join(", ") || "—"}
					/>
				</div>
			)}
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
		"Replication Score": mk(78, "Strong foundation; polish packaging.", [
			"Standardize title formula for 5 uploads.",
			"Document thumbnail template for speed.",
			"Script retention saves at 30s/90s marks.",
		]),
	};

	return { channelData: mock, analysis: mockAnalysis, score: mockScore, aiSummary: mockAiSummary };
}

function PageFallback() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-[#05000b] text-white">
			<Text size="3">Loading channel analysis…</Text>
		</div>
	);
}

function Metric({ label, value }: { label: string; value: any }) {
	return (
		<div className="rounded-lg border border-white/10 bg-white/5 p-3">
			<Text size="1" className="text-white/60">{label}</Text>
			<Text size="3" className="text-white font-semibold">{value ?? "—"}</Text>
		</div>
	);
}

function formatNumber(val: any) {
	if (val === null || val === undefined) return "—";
	if (typeof val === "string") return val;
	if (typeof val === "number") {
		if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
		if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
		return `${val}`;
	}
	return `${val}`;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
	return (
		<div>
			<div className="flex justify-between text-white/75 text-sm mb-1">
				<span>{label}</span>
				<span>{value ?? "—"}/100</span>
			</div>
			<div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
				<div
					className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
					style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
				/>
			</div>
		</div>
	);
}

