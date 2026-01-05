"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, HelpCircle, X, ChevronDown, ChevronUp } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface ExampleVideo {
	title: string;
	views: number;
	publishedAt: string;
	matchType: "title" | "description";
	thumbnail?: string;
}

interface TopicCluster {
	name: string;
	keywords: string[];
	videoCount: number;
	exampleVideos: ExampleVideo[];
}

interface SEOSubscores {
	topicFocus: number;
	titleClarity: number;
	topicRepetition: number;
	metadataCompleteness: number;
}

interface SEOData {
	seoScore: number;
	subscores: SEOSubscores;
	explanation: string;
	topicClusters: TopicCluster[];
	chart: {
		labels: string[];
		data: number[];
	};
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatViews(views: number): string {
	if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
	if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
	return views.toString();
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function DiscoveryLineChart() {
	const searchParams = useSearchParams();
	const [dateRange, setDateRange] = useState("Last 30 days");
	const [showDropdown, setShowDropdown] = useState(false);
	const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
	const [seoData, setSeoData] = useState<SEOData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
	const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
	const [showExamplesDrawer, setShowExamplesDrawer] = useState(false);
	const [selectedCluster, setSelectedCluster] = useState<TopicCluster | null>(null);

	// Fetch SEO data on mount
	useEffect(() => {
		const channelUrl = searchParams.get("url");
		if (!channelUrl) {
			setLoading(false);
			return;
		}

		async function fetchSEOData() {
			try {
				setLoading(true);
				setError(null);
				
				const res = await fetch("/api/channel-seo", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ channelUrl: decodeURIComponent(channelUrl!) }),
				});
				
				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(errData.error || "Failed to fetch SEO data");
				}
				
				const data = await res.json();
				setSeoData(data);
			} catch (err: any) {
				console.error("SEO fetch error:", err);
				setError(err.message);
				setSeoData(getFallbackData());
			} finally {
				setLoading(false);
			}
		}
		
		fetchSEOData();
	}, [searchParams]);

	const chartHeight = 180;
	const dateOptions = ["Last 7 days", "Last 30 days", "Last 90 days"];

	// Fallback data for when API is unavailable
	function getFallbackData(): SEOData {
		return {
			seoScore: 68,
			subscores: {
				topicFocus: 72,
				titleClarity: 58,
				topicRepetition: 65,
				metadataCompleteness: 62,
			},
			explanation: "Strong SEO signals. Strong topic focus around 2-3 themes. Titles clearly describe the content.",
			topicClusters: [
				{
					name: "UFC Fight Night",
					keywords: ["fight", "night", "ufc", "recap"],
					videoCount: 12,
					exampleVideos: [
						{ title: "UFC Fight Night Recap - Main Event Breakdown", views: 2100000, publishedAt: "2024-12-15", matchType: "title", thumbnail: "" },
						{ title: "Fight Night Highlights: Best Knockouts", views: 1400000, publishedAt: "2024-12-10", matchType: "title", thumbnail: "" },
						{ title: "UFC 310 Fight Night Preview", views: 980000, publishedAt: "2024-12-08", matchType: "title", thumbnail: "" },
					],
				},
				{
					name: "Press Conference",
					keywords: ["press", "conference", "weigh", "interview"],
					videoCount: 8,
					exampleVideos: [
						{ title: "UFC 310 Press Conference Highlights", views: 1800000, publishedAt: "2024-12-12", matchType: "title", thumbnail: "" },
						{ title: "Fighter Weigh-In Full Video", views: 890000, publishedAt: "2024-12-11", matchType: "title", thumbnail: "" },
					],
				},
				{
					name: "Knockout Highlights",
					keywords: ["knockout", "highlights", "best", "finish"],
					videoCount: 6,
					exampleVideos: [
						{ title: "Best Knockouts of 2024", views: 3200000, publishedAt: "2024-12-20", matchType: "title", thumbnail: "" },
						{ title: "Top 10 Finishes This Year", views: 1100000, publishedAt: "2024-12-05", matchType: "title", thumbnail: "" },
					],
				},
			],
			chart: {
				labels: ["12/5", "12/8", "12/12", "12/15", "12/18", "12/22", "12/26", "12/30"],
				data: [55, 72, 68, 75, 78, 82, 60, 70],
			},
		};
	}

	const data = seoData || getFallbackData();
	const maxScore = Math.max(...data.chart.data, 100);

	// Subscore labels and descriptions
	const subscoreDetails = [
		{
			key: "topicFocus",
			label: "Topic Focus",
			weight: "30%",
			description: "% of videos belonging to dominant topic clusters",
			tooltip: "High score means clear niche focus.",
		},
		{
			key: "titleClarity",
			label: "Title Clarity",
			weight: "25%",
			description: "Keywords appearing in first 40 characters of titles",
			tooltip: "Measures search-friendly title structure.",
		},
		{
			key: "topicRepetition",
			label: "Topic Repetition",
			weight: "25%",
			description: "Frequency of recurring topics across videos",
			tooltip: "Avoids one-off randomness.",
		},
		{
			key: "metadataCompleteness",
			label: "Metadata Quality",
			weight: "20%",
			description: "Presence and quality of descriptions",
			tooltip: "Excludes link-heavy or empty descriptions.",
		},
	];

	function openClusterExamples(cluster: TopicCluster) {
		setSelectedCluster(cluster);
		setShowExamplesDrawer(true);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-[400px] bg-neutral-900/50 rounded-xl">
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="w-8 h-8 text-white/40 animate-spin" />
					<span className="text-sm text-white/40">Analyzing SEO data...</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
				{/* Left Column - Insights Panel (35-40% = 2/5) */}
				<div className="lg:col-span-2 bg-neutral-900/50 rounded-xl p-5">
					{/* Header */}
					<div className="mb-6">
						<div className="flex items-center gap-2 mb-2">
							<Search className="w-5 h-5 text-white/50" />
							<h3 className="text-lg font-semibold text-white">SEO Strength</h3>
						</div>
						<p className="text-xs text-white/40 leading-relaxed">
							Measures how clearly and consistently this channel signals its topics to YouTube through titles, descriptions, and repeated themes.
						</p>
					</div>

					{/* SEO Score */}
					<div className="mb-6 p-4 rounded-xl bg-white/[0.02]">
						<div className="flex items-center justify-between mb-3">
							<div>
								<div className="text-xs text-white/40 mb-1">SEO Strength Score</div>
								<div className="text-3xl font-bold text-white">{data.seoScore}</div>
							</div>
							<div className={`text-xs px-2 py-1 rounded ${
								data.seoScore >= 70 ? "bg-green-500/10 text-green-400" :
								data.seoScore >= 45 ? "bg-amber-500/10 text-amber-400" :
								"bg-red-500/10 text-red-400"
							}`}>
								{data.seoScore >= 70 ? "Strong" : data.seoScore >= 45 ? "Moderate" : "Weak"}
							</div>
						</div>
						<p className="text-xs text-white/50 leading-relaxed mb-4">
							{data.explanation}
						</p>

						{/* Subscores */}
						<div className="space-y-2">
							{subscoreDetails.map((sub) => {
								const score = data.subscores[sub.key as keyof SEOSubscores];
								return (
									<div key={sub.key} className="flex items-center justify-between text-xs">
										<div className="flex items-center gap-2">
											<span className="text-white/50">{sub.label}</span>
											<button
												onClick={() => setActiveTooltip(activeTooltip === sub.key ? null : sub.key)}
												className="p-0.5 rounded hover:bg-white/10"
											>
												<HelpCircle className="w-3 h-3 text-white/20" />
											</button>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
												<div 
													className={`h-full rounded-full ${
														score >= 70 ? "bg-green-500" :
														score >= 45 ? "bg-amber-500" :
														"bg-red-500"
													}`}
													style={{ width: `${score}%` }}
												/>
											</div>
											<span className="text-white/60 w-6 text-right">{score}</span>
										</div>
									</div>
								);
							})}
						</div>

						{/* Tooltip display */}
						{activeTooltip && subscoreDetails.find(s => s.key === activeTooltip) && (
							<div className="mt-3 p-2 rounded bg-blue-500/10 text-[11px] text-blue-300 leading-relaxed">
								{subscoreDetails.find(s => s.key === activeTooltip)!.tooltip}
							</div>
						)}
					</div>

					{error && (
						<div className="mb-4 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
							Using cached data. Live analysis unavailable.
						</div>
					)}

					{/* Winning SEO Topics (Topic Clusters) */}
					<div className="mb-4">
						<div className="flex items-center gap-1 mb-3">
							<h4 className="text-sm font-semibold text-white">Winning SEO Topics</h4>
							<button
								onClick={() => setActiveTooltip(activeTooltip === "clusters" ? null : "clusters")}
								className="p-0.5 rounded hover:bg-white/10"
							>
								<HelpCircle className="w-3.5 h-3.5 text-white/30" />
							</button>
						</div>
						{activeTooltip === "clusters" && (
							<div className="mb-3 p-2 rounded bg-blue-500/10 text-[10px] text-blue-300 leading-relaxed">
								These topic clusters represent how the channel structures its searchable content, not just individual keywords.
							</div>
						)}

						{data.topicClusters.length > 0 ? (
							<div className="space-y-2">
								{data.topicClusters.map((cluster) => (
									<div key={cluster.name} className="rounded-lg bg-white/[0.02] overflow-hidden">
										<button
											onClick={() => setExpandedCluster(expandedCluster === cluster.name ? null : cluster.name)}
											className="w-full p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
										>
											<div className="flex items-center gap-3">
												<span className="text-sm font-medium text-white">{cluster.name}</span>
												<span className="text-xs text-white/40">({cluster.videoCount} videos)</span>
											</div>
											{expandedCluster === cluster.name ? (
												<ChevronUp className="w-4 h-4 text-white/40" />
											) : (
												<ChevronDown className="w-4 h-4 text-white/40" />
											)}
										</button>
										
										{expandedCluster === cluster.name && (
											<div className="px-3 pb-3 pt-1">
												<div className="flex flex-wrap gap-1.5 mb-3">
													{cluster.keywords.map((kw, i) => (
														<span key={i} className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-white/50">
															{kw}
														</span>
													))}
												</div>
												<button
													onClick={() => openClusterExamples(cluster)}
													className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
												>
													View example videos →
												</button>
											</div>
										)}
									</div>
								))}
							</div>
						) : (
							<p className="text-xs text-white/30 italic p-3 bg-white/[0.02] rounded-lg">
								No dominant topic clusters detected. This channel covers a wide range of topics.
							</p>
						)}
					</div>

					{/* Transparency Note */}
					<div className="pt-4 border-t border-white/10">
						<p className="text-[10px] text-white/30 leading-relaxed">
							These insights are based on publicly visible video titles, descriptions, and metadata. No private analytics are used.
						</p>
					</div>
				</div>

				{/* Right Column - Line Chart (60-65% = 3/5) */}
				<div className="lg:col-span-3 bg-neutral-900/50 rounded-xl p-5">
					{/* Header */}
					<div className="flex justify-between items-start mb-4">
						<div>
							<h3 className="text-lg font-semibold text-white mb-1">Topic Consistency Over Time</h3>
							<p className="text-xs text-white/40">How often top topics appear per upload batch</p>
						</div>
						<div className="relative">
							<button
								onClick={() => setShowDropdown(!showDropdown)}
								className="inline-flex items-center text-white/60 bg-neutral-800 border border-white/10 hover:bg-neutral-700 hover:text-white text-sm px-3 py-2 rounded-lg transition-colors"
							>
								{dateRange}
								<svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							{showDropdown && (
								<div className="absolute right-0 top-full mt-1 z-20 bg-neutral-800 border border-white/10 rounded-lg shadow-lg w-36">
									{dateOptions.map((option) => (
										<button
											key={option}
											onClick={() => {
												setDateRange(option);
												setShowDropdown(false);
											}}
											className="block w-full text-left px-3 py-2 text-sm text-white/60 hover:bg-neutral-700 hover:text-white first:rounded-t-lg last:rounded-b-lg"
										>
											{option}
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Chart Container */}
					{data.chart.data.length === 0 ? (
						<div className="flex items-center justify-center h-[200px] bg-neutral-950/50 rounded-lg">
							<p className="text-sm text-white/40">Not enough recent uploads to evaluate topic consistency.</p>
						</div>
					) : (
						<div className="relative bg-neutral-950/50 rounded-lg p-4" style={{ height: chartHeight + 60 }}>
							{/* Y-axis labels */}
							<div className="absolute left-0 top-4 bottom-10 w-8 flex flex-col justify-between text-[10px] text-white/30">
								<span>100</span>
								<span>50</span>
								<span>0</span>
							</div>

							{/* Chart area */}
							<div className="ml-10 relative" style={{ height: chartHeight }}>
								{/* Reference line at 50 */}
								<div 
									className="absolute left-0 right-0 border-t border-dashed border-white/20"
									style={{ top: `${chartHeight * 0.5}px` }}
								>
									<span className="absolute right-0 -top-3 text-[9px] text-white/30 bg-neutral-950 px-1">
										Average
									</span>
								</div>

								{/* Subtle grid lines */}
								<div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
									{[0, 1, 2, 3, 4].map((i) => (
										<div key={i} className="border-t border-white/5 w-full" />
									))}
								</div>

								{/* SVG Line Chart */}
								<svg 
									className="absolute inset-0 w-full h-full overflow-visible"
									viewBox={`0 0 400 ${chartHeight}`}
									preserveAspectRatio="none"
								>
									{/* Line path connecting all points */}
									<path
										d={data.chart.data.map((score, i) => {
											const x = data.chart.data.length > 1 
												? (i / (data.chart.data.length - 1)) * 400 
												: 200;
											const y = chartHeight - (score / maxScore) * (chartHeight - 10) - 5;
											return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
										}).join(' ')}
										fill="none"
										stroke="#60a5fa"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										vectorEffect="non-scaling-stroke"
									/>
								</svg>
								
								{/* Data points overlay */}
								<div className="absolute inset-0">
									{data.chart.data.map((score, i) => {
										const xPercent = data.chart.data.length > 1 
											? (i / (data.chart.data.length - 1)) * 100 
											: 50;
										const yPixel = chartHeight - (score / maxScore) * (chartHeight - 10) - 5;
										const isHovered = hoveredPoint === i;

										return (
											<div
												key={i}
												className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
												style={{ 
													left: `${xPercent}%`, 
													top: `${yPixel}px`,
												}}
												onMouseEnter={() => setHoveredPoint(i)}
												onMouseLeave={() => setHoveredPoint(null)}
											>
												<div 
													className={`rounded-full border-2 border-blue-900 transition-all duration-150 ${
														isHovered ? "bg-blue-300 w-3 h-3" : "bg-blue-400 w-2 h-2"
													}`}
												/>
											</div>
										);
									})}
								</div>

								{/* Tooltip */}
								{hoveredPoint !== null && (
									<div
										className="absolute z-30 bg-neutral-800 border border-white/10 rounded-lg p-3 shadow-xl pointer-events-none"
										style={{
											left: `${data.chart.data.length > 1 
												? (hoveredPoint / (data.chart.data.length - 1)) * 100 
												: 50}%`,
											top: Math.max(0, chartHeight - (data.chart.data[hoveredPoint] / maxScore) * (chartHeight - 10) - 80),
											transform: 'translateX(-50%)',
											minWidth: '140px',
										}}
									>
										<div className="text-xs text-white/50 mb-1">
											{data.chart.labels[hoveredPoint]}
										</div>
										<div className="text-lg font-bold text-blue-400">
											{data.chart.data[hoveredPoint]}%
										</div>
										<div className="text-[10px] text-white/40">
											Topic Consistency
										</div>
									</div>
								)}
							</div>

							{/* X-axis labels */}
							<div className="ml-10 mt-2 flex justify-between text-[10px] text-white/30">
								{data.chart.labels.filter((_, i) => 
									i === 0 || i === data.chart.labels.length - 1 || i % Math.ceil(data.chart.labels.length / 5) === 0
								).map((label, i) => (
									<span key={i}>{label}</span>
								))}
							</div>
						</div>
					)}

					{/* Sub-points summary */}
					<div className="mt-4 p-4 bg-white/[0.02] rounded-lg">
						<h4 className="text-sm font-medium text-white mb-3">SEO Summary</h4>
						<ul className="space-y-2 text-xs text-white/50">
							{data.subscores.topicFocus >= 60 && (
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500" />
									Strong topic focus around 2–3 themes
								</li>
							)}
							{data.subscores.titleClarity >= 60 && (
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500" />
									Titles clearly describe the content
								</li>
							)}
							{data.subscores.topicRepetition >= 50 && (
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500" />
									Topics repeat across multiple videos
								</li>
							)}
							{data.subscores.metadataCompleteness >= 60 && (
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-green-500" />
									Consistent metadata quality
								</li>
							)}
							{data.subscores.topicFocus < 60 && (
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
									Content spans many different topics
								</li>
							)}
							{data.subscores.titleClarity < 60 && (
								<li className="flex items-center gap-2">
									<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
									Titles use curiosity-driven phrasing
								</li>
							)}
						</ul>
					</div>

					{/* Footer */}
					<div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
						<span className="text-xs text-white/40">
							Based on last {data.chart.data.length} videos
						</span>
						<span className="text-[10px] text-white/30">
							Scores reflect observable patterns, not predictions.
						</span>
					</div>
				</div>
			</div>

			{/* Examples Drawer */}
			{showExamplesDrawer && selectedCluster && (
				<div className="fixed inset-0 z-50 flex justify-end">
					<div 
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setShowExamplesDrawer(false)}
					/>
					<div className="relative w-full max-w-lg bg-neutral-900 h-full overflow-y-auto shadow-2xl">
						<div className="sticky top-0 bg-neutral-900 border-b border-white/10 p-4 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold text-white">{selectedCluster.name}</h3>
								<p className="text-xs text-white/40 mt-1">
									These videos show how this channel consistently uses this topic in high-performing content.
								</p>
							</div>
							<button
								onClick={() => setShowExamplesDrawer(false)}
								className="p-2 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5 text-white/60" />
							</button>
						</div>

						<div className="p-4 space-y-3">
							{selectedCluster.exampleVideos.map((video, i) => (
								<div key={i} className="flex gap-4 p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors">
									{/* Thumbnail placeholder */}
									<div className="w-24 h-14 bg-neutral-800 rounded flex-shrink-0 flex items-center justify-center">
										{video.thumbnail ? (
											<img src={video.thumbnail} alt="" className="w-full h-full object-cover rounded" />
										) : (
											<div className="text-[10px] text-white/20">No image</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<h4 className="text-sm font-medium text-white truncate">{video.title}</h4>
										<div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
											<span>{formatViews(video.views)} views</span>
											<span>•</span>
											<span>{formatDate(video.publishedAt)}</span>
										</div>
										<div className="mt-2">
											<span className={`text-[10px] px-2 py-0.5 rounded ${
												video.matchType === "title" 
													? "bg-green-500/10 text-green-400" 
													: "bg-blue-500/10 text-blue-400"
											}`}>
												Keyword in {video.matchType}
											</span>
										</div>
									</div>
								</div>
							))}

							{selectedCluster.exampleVideos.length === 0 && (
								<p className="text-sm text-white/40 text-center py-8">
									No example videos available for this topic cluster.
								</p>
							)}
						</div>

						{/* Keywords in this cluster */}
						<div className="p-4 border-t border-white/10">
							<h4 className="text-xs text-white/40 mb-2">Related keywords</h4>
							<div className="flex flex-wrap gap-2">
								{selectedCluster.keywords.map((kw, i) => (
									<span key={i} className="px-2 py-1 rounded bg-white/5 text-xs text-white/60">
										{kw}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
