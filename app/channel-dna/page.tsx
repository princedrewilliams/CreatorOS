"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Text, Heading, Card, Button } from "@whop/react/components";

const TABS = [
	"Viral Score",
	"Search & Discovery",
	"Upload Consistency",
	"Thumbnail Performance",
	"Winning Topics",
	"Channel Identity",
];

const TAB_TO_ANALYSIS: Record<string, string> = {
	"Viral Score": "Viral Potential",
	"Search & Discovery": "SEO Strategy",
	"Upload Consistency": "Posting Consistency",
	"Thumbnail Performance": "Thumbnail Strategy",
	"Winning Topics": "Content Clusters",
	"Channel Identity": "Channel Positioning",
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

	const percentile = score?.percentile ?? null;
	const contextLabel = score?.contextLabel ?? null;
	const uploadScore = categories["Upload Consistency"] ?? 50;
	const discoverScore =
		categories["Search & Discoverability"] ??
		categories["Discoverability / SEO"] ??
		50;

	const chartInsight = useMemo(() => {
		if (uploadScore >= 70 && discoverScore >= 70) {
			return "Cadence and discoverability both outperform similar-sized channels.";
		}
		if (uploadScore >= 65 && discoverScore < 65) {
			return "Regular posting; discoverability trails peers of similar size.";
		}
		if (uploadScore < 65 && discoverScore >= 70) {
			return "High discoverability; posting cadence below peer average.";
		}
		return "Cadence and discoverability fluctuate relative to peer benchmarks.";
	}, [uploadScore, discoverScore]);

	return (
		<div className="relative min-h-screen bg-[#05000b]">
			<div className="fixed inset-0 -z-10 overflow-hidden bg-[#05000b]">
				<div className="absolute inset-0 bg-gradient-to-br from-[#0b0018] via-[#090013] to-[#020008]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,66,166,0.45),transparent_38%),radial-gradient(circle_at_80%_25%,rgba(255,130,230,0.38),transparent_42%),radial-gradient(circle_at_50%_78%,rgba(120,0,90,0.3),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,30,140,0.28),transparent_55%)]" />
				<div className="absolute inset-0 opacity-90 bg-[linear-gradient(120deg,rgba(255,52,160,0.45),rgba(255,52,160,0)_38%),linear-gradient(-115deg,rgba(255,105,200,0.4),rgba(255,105,200,0)_32%),linear-gradient(150deg,rgba(255,90,170,0.32),rgba(255,90,170,0)_42%)]" />
				<div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_85%_15%,rgba(255,182,255,0.14),transparent_22%),radial-gradient(circle_at_40%_80%,rgba(255,120,200,0.12),transparent_30%)]" />
			</div>

			<div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							color="gray"
							onClick={() => router.push("/")}
							className="text-white border border-white/10 hover:border-pink-400 hover:text-white"
						>
							← Back
						</Button>
						<Heading size="6" className="text-white flex items-center gap-2">
							<span className="w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_15px_rgba(255,64,170,0.6)]" />
							Channel Analyzer
						</Heading>
					</div>
					<Button
						variant="ghost"
						color="gray"
						onClick={() => router.push("/")}
						className="text-white border border-white/10 hover:border-pink-400 hover:text-white"
					>
						Analyze Another Channel
					</Button>
				</div>

				{/* Tabs (single line, scrollable) */}
				<div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2">
					{TABS.map((tab) => {
						const isActive = activeTab === tab;
						return (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`tab-analyst flex items-center gap-2 ${isActive ? "active" : ""}`}
							>
								{tab}
								{isActive && <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/15">FREE</span>}
							</button>
						);
					})}
				</div>

				{/* Hero (compressed height) */}
				<Card className="p-4 sm:p-5 card-analyst bg-gradient-to-br from-[#140017] via-[#0b0014] to-[#090012] border border-pink-500/15 shadow-[0_0_40px_rgba(255,60,170,0.3)]">
					<div className="flex flex-col lg:flex-row items-center gap-4">
						<div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-pink-400 shadow-[0_0_25px_rgba(255,80,170,0.4)]">
							{baseStats?.thumbnail ? (
								<Image src={baseStats.thumbnail} alt="Avatar" fill className="object-cover" />
							) : (
								<div className="w-full h-full flex items-center justify-center text-white/70 text-xs">No avatar</div>
							)}
						</div>
						<div className="flex-1 space-y-1 text-center lg:text-left">
							<Heading size="6" className="text-white leading-tight">{baseStats?.title || "Channel"}</Heading>
							<Text size="2" className="text-white/80">
								{formatNumber(baseStats?.subscribers)} subscribers • {formatNumber(baseStats?.views)} views
							</Text>
							<Text size="2" className="text-white/70">
								{baseStats?.postingFrequency || "—"} • {baseStats?.niche || "Business & Finance"}
							</Text>
						</div>
						<div className="relative w-32 h-32 flex items-center justify-center">
							<div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 via-pink-500 to-purple-500 opacity-70 blur-md" />
							<div className="absolute inset-1 rounded-full border-2 border-pink-400/80" />
							<div className="relative flex flex-col items-center justify-center w-full h-full rounded-full bg-black/50 text-white shadow-[0_0_25px_rgba(255,60,170,0.35)]">
								<Text size="1" className="text-white/70">Channel</Text>
								<Heading size="7" className="text-white leading-none">{score?.total ?? "—"}</Heading>
								{contextLabel && (
									<Text size="1" className="text-pink-200/90 mt-1">{contextLabel}</Text>
								)}
							</div>
						</div>
					</div>
					<div className="mt-4 space-y-1 text-white/85">
						<Text size="3" className="text-white/90 font-semibold">Performance Snapshot</Text>
						<Text size="2" className="text-white/70">
							Videos consistently outperform peer channels of similar size.
						</Text>
					</div>
					<div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-white">
						<ScoreBar label="Discoverability" value={categories?.["Search & Discovery"] ?? categories?.["Discoverability / SEO"] ?? 0} />
						<ScoreBar label="Consistency" value={categories?.["Upload Consistency"] ?? 0} />
						<ScoreBar label="Engagement" value={categories?.["Audience Engagement"] ?? 0} />
						<ScoreBar label="Winning Topics" value={categories?.["Winning Topics"] ?? categories?.["Content Clusters"] ?? 0} />
					</div>
				</Card>

				{/* Insights + chart row under hero */}
				<div className="grid lg:grid-cols-2 gap-6">
					<Card className="p-5 card-analyst bg-black/30 border border-pink-500/20 backdrop-blur-md space-y-3">
						<Heading size="5" className="text-white">Observed Patterns</Heading>
						<div className="space-y-3">
							{(aiSummary?.recommendations || []).slice(0, 3).map((rec: string, i: number) => (
								<div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/85">
									<Text size="2" className="text-white font-semibold">Pattern {i + 1}</Text>
									<Text size="2" className="text-white/80">{rec}</Text>
								</div>
							))}
						</div>
					</Card>

					<Card className="p-5 card-analyst bg-black/30 border border-white/10 backdrop-blur-md">
						<Heading size="5" className="text-white mb-1">{activeTab} Chart</Heading>
						<Text size="2" className="text-white/60 mb-2">Visualization for this tab</Text>
						{renderChartForTab(activeTab, uploadScore, discoverScore)}
					</Card>
				</div>

				{/* Category detail */}
				<Card className="p-5 card-analyst bg-black/30 border border-white/10 backdrop-blur-md">
					<Heading size="5" className="text-white mb-3">{activeTab}</Heading>
					<TabContent tab={activeTab} analysis={analysis} channelData={channelData} />
				</Card>

				{/* Trending section at bottom */}
				<Card className="mt-8 p-5 card-analyst bg-black/40 border border-white/5 backdrop-blur">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-3">
							<div className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-white text-sm">
								Viral Score: {categories?.["Viral Potential"] ?? "—"}/100
							</div>
							<Heading size="5" className="text-white">Trending Viral Videos</Heading>
						</div>
						<Text size="2" className="text-white/60">Top performers by recency</Text>
					</div>
					<div className="grid md:grid-cols-3 gap-4">
						{trendingVideos.slice(0, 3).map((video) => {
							const href = video.id ? `https://www.youtube.com/watch?v=${video.id}` : undefined;
							return (
								<a
									key={video.id}
									href={href}
									target="_blank"
									rel="noreferrer"
									className="rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-lg block hover:border-pink-400/40 transition-colors"
								>
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
								</a>
							);
						})}
					</div>
				</Card>

				{/* Trending section at very bottom */}
				<Card className="mt-8 p-5 bg-black/40 border border-white/5 backdrop-blur">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-3">
							<div className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/30 text-white text-sm">
								Viral Score: {categories?.["Viral Potential"] ?? "—"}/100
							</div>
							<Heading size="5" className="text-white">Trending Viral Videos</Heading>
						</div>
						<Text size="2" className="text-white/60">Top performers by recency</Text>
					</div>
					<div className="grid md:grid-cols-3 gap-4">
						{trendingVideos.slice(0, 3).map((video) => {
							const href = video.id ? `https://www.youtube.com/watch?v=${video.id}` : undefined;
							return (
								<a
									key={video.id}
									href={href}
									target="_blank"
									rel="noreferrer"
									className="rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-lg block hover:border-pink-400/40 transition-colors"
								>
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
								</a>
							);
						})}
					</div>
				</Card>
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
	const keyInsight = insights?.[0] || summary || "Observed performance pattern is not yet available.";
	const recommended = insights?.[1] || "Observation pending more data.";

	return (
		<div className="space-y-4 text-white">
			<div className="flex items-center justify-between flex-wrap gap-2">
				<Text size="4" className="text-white font-semibold">{tab}</Text>
				<div className="px-3 py-1 rounded-full border border-white/20 bg-white/5 text-sm">
					Score: <span className="font-semibold text-pink-300">{score}</span>/100
				</div>
			</div>
			{/* One chart now shown in the right column above */}
			<ScoreBar label={`${tab} score`} value={Number(score) || 0} />
			{/* One key insight */}
			<Text size="3" className="text-white/80">{keyInsight}</Text>
			{/* One observation sentence (neutral) */}
			<Text size="2" className="text-white/65">Observed: {recommended}</Text>
			{tab === "Viral Score" && (
				<Text size="2" className="text-white/60">
					Viral Score reflects how often videos exceed expected performance for a channel of this size.
				</Text>
			)}
		</div>
	);
}

function renderChartForTab(tab: string, uploadScore: number, discoverScore: number) {
	switch (tab) {
		case "Viral Score":
			return <ViralScatterChart />;
		case "Search & Discovery":
			return <DiscoveryLineChart />;
		case "Upload Consistency":
			return <ConsistencyBarChart />;
		case "Thumbnail Performance":
			return <ThumbComparisonChart />;
		case "Winning Topics":
			return <WinningTopicsBubbleChart />;
		case "Channel Identity":
			return <IdentityRadarChart />;
		default:
			return <ScoreBar label={`${tab} score`} value={0} />;
	}
}

function ViralScatterChart() {
	return (
		<div className="w-full chart-container">
			<div className="chart-title">Viral Scatter</div>
			<svg viewBox="0 0 100 70" className="w-full h-48">
				<defs>
					<linearGradient id="vs-grad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
						<stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
					</linearGradient>
					<radialGradient id="vs-dot" cx="50%" cy="50%" r="50%">
						<stop offset="0%" stopColor="#ff8adf" />
						<stop offset="100%" stopColor="#c0328f" />
					</radialGradient>
				</defs>
				<rect x="0" y="0" width="100" height="70" fill="url(#vs-grad)" rx="4" ry="4" />
				{[20, 40, 60, 80].map((v) => (
					<line key={`v-${v}`} x1={v} y1="6" x2={v} y2="64" stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
				))}
				{[20, 40, 60].map((v) => (
					<line key={`h-${v}`} x1="6" y1={v} x2="94" y2={v} stroke="rgba(255,255,255,0.07)" strokeWidth="0.4" />
				))}
				<circle cx="30" cy="50" r="2.4" fill="#7ce7ff" opacity="0.85">
					<animate attributeName="r" values="2.2;2.6;2.2" dur="3s" repeatCount="indefinite" />
				</circle>
				<circle cx="55" cy="35" r="2.4" fill="#7ce7ff" opacity="0.85">
					<animate attributeName="r" values="2.2;2.6;2.2" dur="3s" begin="0.3s" repeatCount="indefinite" />
				</circle>
				<circle cx="70" cy="25" r="3.2" fill="#ff6acb" opacity="0.95">
					<animate attributeName="r" values="3;3.6;3" dur="3s" begin="0.6s" repeatCount="indefinite" />
				</circle>
				<circle cx="62" cy="30" r="3" fill="#ff6acb" opacity="0.95">
					<animate attributeName="r" values="2.8;3.4;2.8" dur="3s" begin="0.9s" repeatCount="indefinite" />
				</circle>
				<circle cx="45" cy="42" r="2.4" fill="#7ce7ff" opacity="0.85">
					<animate attributeName="r" values="2.2;2.6;2.2" dur="3s" begin="0.5s" repeatCount="indefinite" />
				</circle>
			</svg>
			<Text size="2" className="text-white/75 mt-2">
				This channel consistently produces videos that outperform its own baseline.
			</Text>
		</div>
	);
}

function DiscoveryLineChart() {
	return (
		<div className="w-full chart-container">
			<div className="chart-title">Discovery Velocity</div>
			<svg viewBox="0 0 100 60" className="w-full h-44">
				<defs>
					<linearGradient id="dl-fill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="rgba(255,106,203,0.25)" />
						<stop offset="100%" stopColor="rgba(255,106,203,0.05)" />
					</linearGradient>
				</defs>
				<polyline
					points="5,45 20,38 35,30 50,34 65,26 80,20 95,18"
					fill="none"
					stroke="#ff7fd6"
					strokeWidth="2"
				/>
				<polygon points="5,60 5,45 20,38 35,30 50,34 65,26 80,20 95,18 95,60" fill="url(#dl-fill)" />
			</svg>
			<Text size="2" className="text-white/75 mt-2">
				Recent uploads show strong early momentum, indicating favorable algorithm pickup.
			</Text>
		</div>
	);
}

function ConsistencyBarChart() {
	return (
		<div className="w-full chart-container">
			<div className="chart-title">Posting Rhythm</div>
			<svg viewBox="0 0 100 50" className="w-full h-40">
				{[0, 1, 2, 3].map((i) => (
					<rect key={i} x={15 + i * 20} y={15 + (i % 2) * 5} width="12" height={30 - (i % 2) * 5} fill="#ff7fd6" opacity="0.8" rx="2" />
				))}
				<rect x="75" y="18" width="12" height="27" fill="#ff3ea7" opacity="0.9" rx="2" />
			</svg>
			<Text size="2" className="text-white/75 mt-2">
				Uploads follow a predictable cadence with minimal gaps.
			</Text>
			<Text size="2" className="text-white/60">
				Consistency is measured relative to this channel’s historical behavior — not an external standard.
			</Text>
		</div>
	);
}

function ThumbComparisonChart() {
	return (
		<div className="w-full chart-container">
			<div className="chart-title">Thumbnail Performance</div>
			<svg viewBox="0 0 100 50" className="w-full h-40">
				<rect x="20" y="15" width="20" height="30" fill="#7ce7ff" rx="2" opacity="0.8" />
				<rect x="60" y="5" width="20" height="40" fill="#ff7fd6" rx="2" opacity="0.95" />
			</svg>
			<Text size="2" className="text-white/75 mt-2">
				High-performing thumbnails correlate with significantly higher view velocity.
			</Text>
			<Text size="2" className="text-white/60">
				Performance is inferred from post-publish view acceleration, not CTR estimates.
			</Text>
		</div>
	);
}

function WinningTopicsBubbleChart() {
	return (
		<div className="w-full chart-container">
			<div className="chart-title">Winning Topics</div>
			<svg viewBox="0 0 100 55" className="w-full h-44">
				<circle cx="25" cy="30" r="8" fill="#7ce7ff" opacity="0.85" />
				<circle cx="55" cy="24" r="11" fill="#ff7fd6" opacity="0.95" />
				<circle cx="80" cy="32" r="6" fill="#c9a8ff" opacity="0.7" />
				<text x="18" y="45" fontSize="6" fill="#ffb3e5">Top cluster</text>
				<text x="48" y="12" fontSize="6" fill="#ffb3e5">Dominant</text>
			</svg>
			<Text size="2" className="text-white/75 mt-2">
				This channel consistently wins by repeating a small set of high-performing topics.
			</Text>
			<Text size="2" className="text-white/60">
				Topics are inferred using title and description semantic similarity.
			</Text>
		</div>
	);
}

function IdentityRadarChart() {
	return (
		<div className="w-full chart-container">
			<div className="chart-title">Channel Identity</div>
			<svg viewBox="0 0 100 70" className="w-full h-44">
				<polygon
					points="50,5 85,20 75,60 25,60 15,20"
					fill="rgba(255,106,203,0.15)"
					stroke="#ff7fd6"
					strokeWidth="1"
				/>
				<polygon
					points="50,15 78,28 70,52 30,52 22,28"
					fill="rgba(124,231,255,0.18)"
					stroke="#7ce7ff"
					strokeWidth="1"
				/>
			</svg>
			<Text size="2" className="text-white/75 mt-2">
				The channel maintains a clear and repeatable content identity.
			</Text>
			<Text size="2" className="text-white/60">
				Identity strength reflects how predictable the channel’s content promise is to viewers.
			</Text>
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

function Chip({ label, value }: { label: string; value: string | number | null | undefined }) {
	return (
		<div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm flex items-center gap-2">
			<span className="text-white/60">{label}:</span>
			<span className="text-white">{value ?? "—"}</span>
		</div>
	);
}

function ChannelScatter({ x, y }: { x: number; y: number }) {
	const clampedX = Math.max(0, Math.min(100, x));
	const clampedY = Math.max(0, Math.min(100, y));
	const cx = (clampedX / 100) * 100;
	const cy = 100 - (clampedY / 100) * 100;

	return (
		<div className="w-full h-60 bg-black/50 border border-white/10 rounded-xl p-3">
			<svg viewBox="0 0 100 100" className="w-full h-full text-white/50">
				<defs>
					<linearGradient id="gridLine" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
						<stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
					</linearGradient>
				</defs>
				{/* grid */}
				{[25, 50, 75].map((v) => (
					<line key={`v-${v}`} x1={v} y1="0" x2={v} y2="100" stroke="url(#gridLine)" strokeWidth="0.3" />
				))}
				{[25, 50, 75].map((v) => (
					<line key={`h-${v}`} x1="0" y1={v} x2="100" y2={v} stroke="url(#gridLine)" strokeWidth="0.3" />
				))}
				{/* quadrants labels */}
				<text x="50" y="6" textAnchor="middle" fontSize="6" fill="#ff9ddf">Scale Faster</text>
				<text x="50" y="98" textAnchor="middle" fontSize="6" fill="#ff9ddf">Post More</text>
				<text x="4" y="6" textAnchor="start" fontSize="6" fill="#ff9ddf">Fix Packaging</text>
				<text x="96" y="98" textAnchor="end" fontSize="6" fill="#ff9ddf">Unstable Growth</text>
				{/* point */}
				<circle cx={cx} cy={cy} r="2.4" fill="#ff6acb" stroke="#ffb3e5" strokeWidth="0.6" />
			</svg>
		</div>
	);
}

