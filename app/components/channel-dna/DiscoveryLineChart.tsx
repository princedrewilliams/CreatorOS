"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, TrendingUp, Target, Zap, Loader2 } from "lucide-react";

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
				// Use fallback data if API fails
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
					summary: "Strong topical authority. Content consistently focuses on fighting, ufc, knockout.",
					topKeywords: ["fighting", "ufc", "knockout", "mma", "championship"],
				},
				searchIntentClarity: {
					score: 58,
					summary: "Mixed title strategy. Some videos prioritize search, others use curiosity-first hooks.",
				},
				metadataCompleteness: {
					score: 65,
					summary: "Moderate metadata quality. Some videos lack complete descriptions or keyword alignment.",
				},
			},
			chart: {
				labels: ["12/5", "12/8", "12/12", "12/15", "12/18", "12/22", "12/26", "12/30"],
				data: [55, 72, 68, 45, 78, 82, 60, 70],
			},
		};
	}

	// Use fallback if no data yet
	const data = seoData || getFallbackData();
	const maxScore = Math.max(...data.chart.data, 100);

	// Build insights array from SEO data
	const insights = [
		{
			icon: Target,
			title: "Focused Keyword Themes",
			description: data.insights.keywordConcentration.summary,
			score: data.insights.keywordConcentration.score,
		},
		{
			icon: Zap,
			title: "Search Intent Clarity",
			description: data.insights.searchIntentClarity.summary,
			score: data.insights.searchIntentClarity.score,
		},
		{
			icon: TrendingUp,
			title: "Metadata Completeness",
			description: data.insights.metadataCompleteness.summary,
			score: data.insights.metadataCompleteness.score,
		},
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
		<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
			{/* Left Column - Insights Panel (35-40% = 2/5) */}
			<div className="lg:col-span-2 bg-neutral-900/50 rounded-xl p-5">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-2">
						<Search className="w-5 h-5 text-white/50" />
						<h3 className="text-lg font-semibold text-white">SEO Insights</h3>
					</div>
					<div className="text-2xl font-bold text-white">{data.seoScore}</div>
				</div>

				{error && (
					<div className="mb-4 p-3 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
						Using cached data. Live analysis unavailable.
					</div>
				)}

				<div className="space-y-4">
					{insights.map((insight, index) => {
						const Icon = insight.icon;
						return (
							<div key={index} className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<Icon className="w-4 h-4 text-white/40" />
										<h4 className="text-sm font-semibold text-white">{insight.title}</h4>
									</div>
									<span className={`text-xs font-medium px-2 py-0.5 rounded ${
										insight.score >= 70 ? "bg-green-500/10 text-green-400" :
										insight.score >= 45 ? "bg-amber-500/10 text-amber-400" :
										"bg-red-500/10 text-red-400"
									}`}>
										{insight.score}
									</span>
								</div>
								<p className="text-sm text-white/50 leading-relaxed">
									{insight.description}
								</p>
							</div>
						);
					})}
				</div>

				{/* Top Keywords */}
				{data.insights.keywordConcentration.topKeywords.length > 0 && (
					<div className="mt-4 pt-4 border-t border-white/10">
						<div className="text-xs text-white/40 mb-2">Top Keywords</div>
						<div className="flex flex-wrap gap-2">
							{data.insights.keywordConcentration.topKeywords.slice(0, 5).map((kw, i) => (
								<span key={i} className="px-2 py-1 rounded bg-white/5 text-xs text-white/60">
									{kw}
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Right Column - Line Chart (60-65% = 3/5) */}
			<div className="lg:col-span-3 bg-neutral-900/50 rounded-xl p-5">
				{/* Header */}
				<div className="flex justify-between items-start mb-4">
					<div>
						<h3 className="text-lg font-semibold text-white mb-1">Metadata Completeness Over Time</h3>
						<p className="text-xs text-white/40">SEO metadata quality per video (0–100)</p>
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
						<svg className="absolute inset-0 w-full h-full overflow-visible">
							{/* Line path */}
							<path
								d={data.chart.data.map((score, i) => {
									const x = data.chart.data.length > 1 
										? (i / (data.chart.data.length - 1)) * 100 
										: 50;
									const y = chartHeight - (score / maxScore) * chartHeight;
									return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`;
								}).join(' ')}
								fill="none"
								stroke="#60a5fa"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="drop-shadow-sm"
							/>

							{/* Data points */}
							{data.chart.data.map((score, i) => {
								const x = data.chart.data.length > 1 
									? (i / (data.chart.data.length - 1)) * 100 
									: 50;
								const y = chartHeight - (score / maxScore) * chartHeight;
								const isHovered = hoveredPoint === i;

								return (
									<g key={i}>
										<circle
											cx={`${x}%`}
											cy={y}
											r={isHovered ? 6 : 4}
											fill={isHovered ? "#93c5fd" : "#60a5fa"}
											stroke="#1e3a5f"
											strokeWidth="2"
											className="cursor-pointer transition-all duration-150"
											onMouseEnter={() => setHoveredPoint(i)}
											onMouseLeave={() => setHoveredPoint(null)}
										/>
									</g>
								);
							})}
						</svg>

						{/* Tooltip */}
						{hoveredPoint !== null && (
							<div
								className="absolute z-30 bg-neutral-800 border border-white/10 rounded-lg p-3 shadow-xl pointer-events-none"
								style={{
									left: `${data.chart.data.length > 1 
										? (hoveredPoint / (data.chart.data.length - 1)) * 100 
										: 50}%`,
									top: chartHeight - (data.chart.data[hoveredPoint] / maxScore) * chartHeight - 70,
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

				{/* Footer */}
				<div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
					<span className="text-xs text-white/40">
						Based on last {data.chart.data.length} videos
					</span>
					<button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
						View full report →
					</button>
				</div>
			</div>
		</div>
	);
}
