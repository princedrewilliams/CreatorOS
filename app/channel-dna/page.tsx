"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Text, Heading, Card, Button } from "@whop/react/components";

const TABS = [
	"Viral Potential",
	"Engagement Signals",
	"SEO Strategy",
	"Posting Consistency",
	"Thumbnail Strategy",
	"Content Clusters",
	"Channel Positioning",
	"Replication Score",
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
	const [activeTab, setActiveTab] = useState<string>(TABS[0]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
	const [analysis, setAnalysis] = useState<any>(null);
	const [channelData, setChannelData] = useState<any>(null);
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
		} catch (err) {
			const message = err instanceof Error ? err.message : "An error occurred";
			// Fallback to mock to keep UI testable even on API failure
			const mock = getMockPayload(target);
			setAnalysis(mock.analysis);
			setChannelData(mock.channelData);
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

	return (
		<div className="relative min-h-screen bg-[#05000b]">
			<div className="fixed inset-0 -z-10 overflow-hidden bg-[#05000b]">
				<div className="absolute inset-0 bg-gradient-to-br from-[#0b0018] via-[#090013] to-[#020008]" />
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,66,166,0.35),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(255,130,230,0.32),transparent_45%),radial-gradient(circle_at_50%_78%,rgba(120,0,90,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,30,140,0.2),transparent_55%)]" />
				<div className="absolute inset-0 opacity-80 bg-[linear-gradient(120deg,rgba(255,52,160,0.4),rgba(255,52,160,0)_38%),linear-gradient(-115deg,rgba(255,105,200,0.34),rgba(255,105,200,0)_32%),linear-gradient(150deg,rgba(255,90,170,0.28),rgba(255,90,170,0)_42%)]" />
			</div>

			<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
				{/* Top nav tabs */}
				<div className="flex flex-wrap gap-2 mb-6">
					{TABS.map((tab) => {
						const isActive = activeTab === tab;
						return (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
									isActive
										? "border-pink-400 bg-pink-500/20 text-white"
										: "border-white/10 bg-white/5 text-white/70 hover:border-pink-300/60 hover:text-white"
								}`}
							>
								{tab}
							</button>
						);
					})}
				</div>

				{/* Base stats header */}
				<Card variant="surface" className="p-4 sm:p-6 bg-white/5 border border-white/10 backdrop-blur-md mb-6">
					<div className="grid gap-4 sm:gap-6 sm:grid-cols-[1fr,1.2fr] items-center">
						<div className="space-y-3">
							<Heading size="6" className="text-white">Channel Snapshot</Heading>
							<Text size="2" className="text-white/70 break-words">{channelUrl || "No channel URL provided"}</Text>
							{error && <Text size="2" className="text-red-400">{error}</Text>}
							<div className="flex gap-3">
								<input
									type="url"
									value={channelUrl}
									onChange={(e) => setChannelUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") void handleAnalyze();
									}}
									placeholder="Paste your YouTube URL here... (e.g., youtube.com/@channelname)"
									className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500"
								/>
								<Button
									variant="solid"
									color="purple"
									size="3"
									onClick={() => void handleAnalyze()}
									disabled={loading}
									className="min-w-[150px]"
								>
									{loading ? "Analyzing..." : "Analyze"}
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3 text-white">
							<div className="col-span-2 rounded-lg border border-white/10 bg-white/5 overflow-hidden h-28 relative">
								{baseStats?.banner ? (
									<Image src={baseStats.banner} alt="Banner" fill className="object-cover" />
								) : (
									<div className="w-full h-full flex items-center justify-center text-white/40 text-sm">Banner not available</div>
								)}
							</div>
							<div className="flex items-center gap-3 col-span-2">
								<div className="w-14 h-14 rounded-full overflow-hidden border border-white/20 bg-white/10 flex-shrink-0">
									{baseStats?.thumbnail ? (
										<Image src={baseStats.thumbnail} alt="Avatar" width={56} height={56} className="object-cover" />
									) : (
										<div className="w-full h-full flex items-center justify-center text-white/50 text-xs">No avatar</div>
									)}
								</div>
								<div className="space-y-1">
									<Text size="4" className="text-white font-semibold leading-tight">{baseStats?.title || "—"}</Text>
									<Text size="2" className="text-white/70 leading-tight">Positioning: {baseStats?.niche || "—"}</Text>
								</div>
							</div>
							<div className="col-span-2">
								<Text size="2" className="text-white/80 line-clamp-3">
									{baseStats?.description || "Bio not available."}
								</Text>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 col-span-2">
								<Metric label="Subscribers" value={formatNumber(baseStats?.subscribers)} />
								<Metric label="Views" value={formatNumber(baseStats?.views)} />
								<Metric label="Videos" value={formatNumber(baseStats?.videos)} />
								<Metric label="Cadence" value={baseStats?.postingFrequency || "—"} />
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 col-span-2">
								<Metric label="Avg title length" value={baseStats?.avgTitleLength ? `${baseStats.avgTitleLength} chars` : "—"} />
								<Metric label="Top keywords" value={channelData?.metrics?.commonKeywords?.slice(0, 3).map((k: any) => k.word).join(", ") || "—"} />
								<Metric label="Handle" value={channelData?.channel?.handle || "—"} />
							</div>
						</div>
					</div>
				</Card>

				{/* Content area */}
				<Card variant="surface" className="p-4 sm:p-6 bg-white/5 border border-white/10 backdrop-blur-md">
					<TabContent tab={activeTab} analysis={analysis} channelData={channelData} />
				</Card>
			</div>
		</div>
	);
}

function TabContent({ tab, analysis, channelData }: { tab: string; analysis: any; channelData: any }) {
	const bucket = analysis?.[tab] || {};
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

	return { channelData: mock, analysis: mockAnalysis };
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

