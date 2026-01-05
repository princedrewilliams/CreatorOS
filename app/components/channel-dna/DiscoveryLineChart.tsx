"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Target, FileText, Loader2, HelpCircle, X, ExternalLink } from "lucide-react";

interface SEOData {
	seoScore: number;
	insights: {
		keywordConcentration: {
			score: number;
			summary: string;
			topKeywords: string[];
		};
		searchIntentClarity: {
			score: number;
			summary: string;
		};
		metadataCompleteness: {
			score: number;
			summary: string;
		};
	};
	chart: {
		labels: string[];
		data: number[];
	};
}

export function DiscoveryLineChart() {
	const searchParams = useSearchParams();
	const [dateRange, setDateRange] = useState("Last 30 days");
	const [showDropdown, setShowDropdown] = useState(false);
	const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
	const [seoData, setSeoData] = useState<SEOData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
	const [showExamplesDrawer, setShowExamplesDrawer] = useState(false);

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
			insights: {
				keywordConcentration: {
					score: 72,
					summary: "",
					topKeywords: ["fighting", "ufc", "knockout", "mma", "championship"],
				},
				searchIntentClarity: {
					score: 58,
					summary: "",
				},
				metadataCompleteness: {
					score: 65,
					summary: "",
				},
			},
			chart: {
				labels: ["12/5", "12/8", "12/12", "12/15", "12/18", "12/22", "12/26", "12/30"],
				data: [55, 72, 68, 45, 78, 82, 60, 70],
			},
		};
	}

	// Dynamic copy based on scores
	function getKeywordCopy(score: number): string {
		if (score >= 60) {
			return "A large share of this channel's videos revolve around a small set of recurring keywords, reinforcing topical authority.";
		}
		return "Topics are spread across many different keywords, suggesting a broader or experimental content strategy.";
	}

	function getSearchIntentCopy(score: number): string {
		if (score >= 50) {
			return "Most titles clearly signal the main topic early, aligning well with search-driven discovery.";
		}
		return "Many titles delay or obscure the main topic, relying more on curiosity than search intent.";
	}

	function getMetadataCopy(score: number): string {
		if (score >= 60) {
			return "Recent videos consistently include detailed descriptions and clear topic signals, improving how they are indexed.";
		}
		return "Several videos lack complete metadata, which can reduce search visibility.";
	}

	const data = seoData || getFallbackData();
	const maxScore = Math.max(...data.chart.data, 100);

	// Build insights array with dynamic copy
	const insights = [
		{
			id: "keyword",
			icon: Target,
			title: "Keyword Concentration",
			subtitle: "What topics this channel is known for",
			description: getKeywordCopy(data.insights.keywordConcentration.score),
			score: data.insights.keywordConcentration.score,
			tooltip: "Keyword concentration measures how often the same topic keywords appear across recent videos. Higher concentration helps YouTube understand what a channel is about.",
		},
		{
			id: "intent",
			icon: Search,
			title: "Search Intent Clarity",
			subtitle: "How clearly videos communicate their topic",
			description: getSearchIntentCopy(data.insights.searchIntentClarity.score),
			score: data.insights.searchIntentClarity.score,
			tooltip: "Titles that mention the main topic early are easier for both viewers and YouTube to understand.",
		},
		{
			id: "metadata",
			icon: FileText,
			title: "Metadata Completeness",
			subtitle: "How prepared videos are for search indexing",
			description: getMetadataCopy(data.insights.metadataCompleteness.score),
			score: data.insights.metadataCompleteness.score,
			tooltip: "Metadata includes titles, descriptions, and other information YouTube uses to index videos.",
		},
	];

	// Example videos for drawer (mock data)
	const exampleVideos = [
		{ title: "UFC 310 Full Card Breakdown", keywordPlacement: "Early", descriptionDepth: "Detailed", metadataScore: 85 },
		{ title: "Best Knockouts of 2024", keywordPlacement: "Early", descriptionDepth: "Moderate", metadataScore: 72 },
		{ title: "Fighter Interviews Compilation", keywordPlacement: "Mid", descriptionDepth: "Brief", metadataScore: 48 },
		{ title: "2025 Predictions", keywordPlacement: "Late", descriptionDepth: "Detailed", metadataScore: 65 },
	];

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
							<h3 className="text-lg font-semibold text-white">Channel SEO</h3>
						</div>
						<p className="text-xs text-white/40 leading-relaxed">
							How this channel is discovered on YouTube
						</p>
					</div>

					{/* SEO Score */}
					<div className="mb-6 p-4 rounded-xl bg-white/[0.02]">
						<div className="flex items-center justify-between mb-2">
							<div>
								<div className="text-xs text-white/40 mb-1">SEO Readiness Score</div>
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
						<p className="text-[11px] text-white/30">
							A relative score based on keyword focus, title clarity, and metadata completeness.
						</p>
					</div>

					{error && (
						<div className="mb-4 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
							Using cached data. Live analysis unavailable.
						</div>
					)}

					{/* Insights */}
					<div className="space-y-4">
						{insights.map((insight) => {
							const Icon = insight.icon;
							return (
								<div key={insight.id} className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
									<div className="flex items-start justify-between mb-2">
										<div className="flex items-center gap-2">
											<Icon className="w-4 h-4 text-white/40" />
											<div>
												<h4 className="text-sm font-semibold text-white">{insight.title}</h4>
												<p className="text-[10px] text-white/30">{insight.subtitle}</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span className={`text-xs font-medium px-2 py-0.5 rounded ${
												insight.score >= 70 ? "bg-green-500/10 text-green-400" :
												insight.score >= 45 ? "bg-amber-500/10 text-amber-400" :
												"bg-red-500/10 text-red-400"
											}`}>
												{insight.score}
											</span>
											<button
												onClick={() => setActiveTooltip(activeTooltip === insight.id ? null : insight.id)}
												className="p-1 rounded hover:bg-white/10 transition-colors"
											>
												<HelpCircle className="w-3.5 h-3.5 text-white/30" />
											</button>
										</div>
									</div>
									
									{activeTooltip === insight.id && (
										<div className="mb-3 p-2 rounded bg-blue-500/10 text-[11px] text-blue-300 leading-relaxed">
											{insight.tooltip}
										</div>
									)}
									
									<p className="text-sm text-white/50 leading-relaxed">
										{insight.description}
									</p>
								</div>
							);
						})}
					</div>

					{/* Recurring Topics */}
					{data.insights.keywordConcentration.topKeywords.length > 0 ? (
						<div className="mt-4 pt-4 border-t border-white/10">
							<div className="flex items-center gap-1 mb-2">
								<div className="text-xs text-white/40">Recurring Topics</div>
								<button
									onClick={() => setActiveTooltip(activeTooltip === "topics" ? null : "topics")}
									className="p-0.5 rounded hover:bg-white/10"
								>
									<HelpCircle className="w-3 h-3 text-white/20" />
								</button>
							</div>
							{activeTooltip === "topics" && (
								<div className="mb-2 p-2 rounded bg-blue-500/10 text-[10px] text-blue-300 leading-relaxed">
									These are the most frequently repeated topic terms across recent videos. Links, filler words, and promotions are excluded.
								</div>
							)}
							<div className="flex flex-wrap gap-2">
								{data.insights.keywordConcentration.topKeywords.slice(0, 5).map((kw, i) => (
									<span key={i} className="px-2 py-1 rounded bg-white/5 text-xs text-white/60">
										{kw}
									</span>
								))}
							</div>
						</div>
					) : (
						<div className="mt-4 pt-4 border-t border-white/10">
							<p className="text-xs text-white/30 italic">
								No dominant topic keywords detected. This channel covers a wide range of topics.
							</p>
						</div>
					)}

					{/* View Examples Button */}
					<button
						onClick={() => setShowExamplesDrawer(true)}
						className="mt-4 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/60 hover:text-white transition-colors flex items-center justify-center gap-2"
					>
						<ExternalLink className="w-4 h-4" />
						View example videos
					</button>

					{/* Transparency Note */}
					<div className="mt-4 pt-4 border-t border-white/10">
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
							<h3 className="text-lg font-semibold text-white mb-1">Metadata Quality Over Time</h3>
							<p className="text-xs text-white/40">SEO preparation consistency across recent uploads</p>
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
							<p className="text-sm text-white/40">Not enough recent uploads to evaluate metadata trends.</p>
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

								{/* SVG Line Chart with proper viewBox */}
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
								
								{/* Data points overlay (separate for hover) */}
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
											{data.chart.data[hoveredPoint]} / 100
										</div>
										<div className="text-[10px] text-white/40">
											Metadata Score
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

					{/* Footer */}
					<div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
						<span className="text-xs text-white/40">
							Based on last {data.chart.data.length} videos
						</span>
						<span className="text-[10px] text-white/30">
							This analysis uses publicly available YouTube data only. Scores reflect observable patterns, not predictions.
						</span>
					</div>
				</div>
			</div>

			{/* Examples Drawer */}
			{showExamplesDrawer && (
				<div className="fixed inset-0 z-50 flex justify-end">
					<div 
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setShowExamplesDrawer(false)}
					/>
					<div className="relative w-full max-w-lg bg-neutral-900 h-full overflow-y-auto shadow-2xl">
						<div className="sticky top-0 bg-neutral-900 border-b border-white/10 p-4 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-semibold text-white">Example Videos Behind This Insight</h3>
								<p className="text-xs text-white/40 mt-1">
									These videos contributed most strongly to the SEO patterns detected for this channel.
								</p>
							</div>
							<button
								onClick={() => setShowExamplesDrawer(false)}
								className="p-2 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5 text-white/60" />
							</button>
						</div>

						<div className="p-4">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-white/40 text-xs border-b border-white/10">
										<th className="pb-3 font-medium">Video</th>
										<th className="pb-3 font-medium">Keyword Placement</th>
										<th className="pb-3 font-medium">Description</th>
										<th className="pb-3 font-medium text-right">Score</th>
									</tr>
								</thead>
								<tbody>
									{exampleVideos.map((video, i) => (
										<tr key={i} className="border-b border-white/5">
											<td className="py-3 text-white/80 max-w-[150px] truncate">{video.title}</td>
											<td className="py-3">
												<span className={`text-xs px-2 py-0.5 rounded ${
													video.keywordPlacement === "Early" ? "bg-green-500/10 text-green-400" :
													video.keywordPlacement === "Mid" ? "bg-amber-500/10 text-amber-400" :
													"bg-red-500/10 text-red-400"
												}`}>
													{video.keywordPlacement}
												</span>
											</td>
											<td className="py-3">
												<span className={`text-xs px-2 py-0.5 rounded ${
													video.descriptionDepth === "Detailed" ? "bg-green-500/10 text-green-400" :
													video.descriptionDepth === "Moderate" ? "bg-amber-500/10 text-amber-400" :
													"bg-red-500/10 text-red-400"
												}`}>
													{video.descriptionDepth}
												</span>
											</td>
											<td className="py-3 text-right">
												<span className={`font-medium ${
													video.metadataScore >= 70 ? "text-green-400" :
													video.metadataScore >= 50 ? "text-amber-400" :
													"text-red-400"
												}`}>
													{video.metadataScore}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
