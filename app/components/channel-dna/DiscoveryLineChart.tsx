"use client";

import { useState } from "react";
import { Search, TrendingUp, Target, Zap } from "lucide-react";

export function DiscoveryLineChart() {
	const [dateRange, setDateRange] = useState("Last 30 days");
	const [showDropdown, setShowDropdown] = useState(false);
	const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

	// Mock video data with reach multipliers
	const videoData = [
		{ date: "Dec 5", title: "UFC 310 Full Card Breakdown", views: 2100000, subs: 21700000, multiplier: 0.97 },
		{ date: "Dec 8", title: "Makhachev vs. Tsarukyan Preview", views: 3400000, subs: 21700000, multiplier: 1.57 },
		{ date: "Dec 12", title: "Best Knockouts of 2024", views: 5200000, subs: 21700000, multiplier: 2.40 },
		{ date: "Dec 15", title: "Fighter Interviews Compilation", views: 1800000, subs: 21700000, multiplier: 0.83 },
		{ date: "Dec 18", title: "UFC 311 Announcement", views: 4100000, subs: 21700000, multiplier: 1.89 },
		{ date: "Dec 22", title: "Top 10 Submissions", views: 3800000, subs: 21700000, multiplier: 1.75 },
		{ date: "Dec 26", title: "Year End Recap", views: 2900000, subs: 21700000, multiplier: 1.34 },
		{ date: "Dec 30", title: "2025 Predictions", views: 3200000, subs: 21700000, multiplier: 1.47 },
	];

	const maxMultiplier = Math.max(...videoData.map(d => d.multiplier));
	const chartHeight = 180;
	const chartWidth = 100; // percentage

	// Insights data
	const insights = [
		{
			icon: Target,
			title: "Focused Keyword Themes",
			description: "Most high-performing videos cluster around a small, repeated set of topic keywords.",
		},
		{
			icon: Zap,
			title: "Early Topic Signaling",
			description: "Titles and descriptions consistently clarify the main topic within the first few words.",
		},
		{
			icon: TrendingUp,
			title: "Discovery-Driven Reach",
			description: "Videos frequently exceed expected reach relative to subscriber size.",
		},
	];

	const dateOptions = ["Yesterday", "Last 7 days", "Last 30 days", "Last 90 days"];

	return (
		<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
			{/* Left Column - Insights Panel (35-40% = 2/5) */}
			<div className="lg:col-span-2 bg-neutral-900/50 rounded-xl p-5">
				<div className="flex items-center gap-2 mb-6">
					<Search className="w-5 h-5 text-white/50" />
					<h3 className="text-lg font-semibold text-white">Discovery Insights</h3>
				</div>

				<div className="space-y-4">
					{insights.map((insight, index) => {
						const Icon = insight.icon;
						return (
							<div key={index} className="p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
								<div className="flex items-center gap-2 mb-2">
									<Icon className="w-4 h-4 text-white/40" />
									<h4 className="text-sm font-semibold text-white">{insight.title}</h4>
								</div>
								<p className="text-sm text-white/50 leading-relaxed">
									{insight.description}
								</p>
							</div>
						);
					})}
				</div>
			</div>

			{/* Right Column - Line Chart (60-65% = 3/5) */}
			<div className="lg:col-span-3 bg-neutral-900/50 rounded-xl p-5">
				{/* Header */}
				<div className="flex justify-between items-start mb-4">
					<div>
						<h3 className="text-lg font-semibold text-white mb-1">Discovery Reach Over Time</h3>
						<p className="text-xs text-white/40">How often videos outperform subscriber-based expectations</p>
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
						<span>{maxMultiplier.toFixed(1)}×</span>
						<span>1.0×</span>
						<span>0×</span>
					</div>

					{/* Chart area */}
					<div className="ml-10 relative" style={{ height: chartHeight }}>
						{/* Baseline reference line at 1.0× */}
						<div 
							className="absolute left-0 right-0 border-t border-dashed border-white/20"
							style={{ top: `${chartHeight - (1.0 / maxMultiplier) * chartHeight}px` }}
						>
							<span className="absolute right-0 -top-3 text-[9px] text-white/30 bg-neutral-950 px-1">
								Baseline: Subscriber Reach
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
								d={videoData.map((d, i) => {
									const x = (i / (videoData.length - 1)) * 100;
									const y = chartHeight - (d.multiplier / maxMultiplier) * chartHeight;
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
							{videoData.map((d, i) => {
								const x = (i / (videoData.length - 1)) * 100;
								const y = chartHeight - (d.multiplier / maxMultiplier) * chartHeight;
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
									left: `${(hoveredPoint / (videoData.length - 1)) * 100}%`,
									top: chartHeight - (videoData[hoveredPoint].multiplier / maxMultiplier) * chartHeight - 90,
									transform: 'translateX(-50%)',
									minWidth: '180px',
								}}
							>
								<div className="text-xs font-medium text-white mb-1 truncate">
									{videoData[hoveredPoint].title}
								</div>
								<div className="text-[10px] text-white/50 space-y-0.5">
									<div>Upload: {videoData[hoveredPoint].date}</div>
									<div>Subscribers: {(videoData[hoveredPoint].subs / 1000000).toFixed(1)}M</div>
									<div>Views: {(videoData[hoveredPoint].views / 1000000).toFixed(1)}M</div>
								</div>
								<div className="text-sm font-bold text-blue-400 mt-1">
									{videoData[hoveredPoint].multiplier.toFixed(2)}× reach
								</div>
							</div>
						)}
					</div>

					{/* X-axis labels */}
					<div className="ml-10 mt-2 flex justify-between text-[10px] text-white/30">
						{videoData.filter((_, i) => i % 2 === 0).map((d, i) => (
							<span key={i}>{d.date}</span>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
					<span className="text-xs text-white/40">
						Reach Multiplier = Views ÷ Subscriber Count
					</span>
					<button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
						View full report →
					</button>
				</div>
			</div>
		</div>
	);
}
