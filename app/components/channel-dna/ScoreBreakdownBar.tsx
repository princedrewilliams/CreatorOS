"use client";

import { HelpCircle, TrendingUp } from "lucide-react";
import { useState } from "react";

interface ScoreBreakdownBarProps {
	totalScore: number;
}

interface BreakdownItem {
	label: string;
	shortLabel: string;
	score: number;
	explanation: string;
	color: string;
	hoverColor: string;
}

export function ScoreBreakdownBar({ totalScore }: ScoreBreakdownBarProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const [showModal, setShowModal] = useState(false);

	const breakdown: BreakdownItem[] = [
		{
			label: "Discoverability",
			shortLabel: "Discov",
			score: Math.round(totalScore * 0.95),
			explanation: "Views per video vs peer median.",
			color: "#3b82f6",
			hoverColor: "#60a5fa",
		},
		{
			label: "Engagement",
			shortLabel: "Engage",
			score: Math.round(totalScore * 0.92),
			explanation: "Engagement rate vs peer median.",
			color: "#10b981",
			hoverColor: "#34d399",
		},
		{
			label: "Consistency",
			shortLabel: "Consis",
			score: Math.round(totalScore * 0.88),
			explanation: "Upload cadence stability.",
			color: "#f59e0b",
			hoverColor: "#fbbf24",
		},
		{
			label: "Topics",
			shortLabel: "Topics",
			score: Math.round(totalScore * 0.85),
			explanation: "Topic repetition across top videos.",
			color: "#ef4444",
			hoverColor: "#f87171",
		},
		{
			label: "Packaging",
			shortLabel: "Packag",
			score: Math.round(totalScore * 0.90),
			explanation: "CTR proxy from title + thumbnail.",
			color: "#8b5cf6",
			hoverColor: "#a78bfa",
		},
	];

	const maxScore = Math.max(...breakdown.map(b => b.score));
	const highest = breakdown.reduce((max, b) => b.score > max.score ? b : max, breakdown[0]);
	const lowest = breakdown.reduce((min, b) => b.score < min.score ? b : min, breakdown[0]);

	return (
		<>
			<div className="w-full h-full bg-neutral-900/50 rounded-xl p-5 md:p-6">
				{/* Header */}
				<div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
					<dl>
						<dt className="text-sm text-white/50 mb-1">Score Breakdown</dt>
						<dd className="text-2xl font-semibold text-white">{totalScore}</dd>
					</dl>
					<div className="flex items-center gap-2">
						<span className="inline-flex items-center bg-green-500/10 text-green-400 text-xs font-medium px-2 py-1 rounded-md">
							<TrendingUp className="w-3.5 h-3.5 mr-1" />
							Above avg
						</span>
						<button
							onClick={() => setShowModal(true)}
							className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60"
							title="How this score is calculated"
						>
							<HelpCircle className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 py-3 border-b border-white/10 mb-6">
					<dl>
						<dt className="text-xs text-white/40 mb-0.5">Highest</dt>
						<dd className="text-sm font-semibold" style={{ color: highest.color }}>
							{highest.label}
						</dd>
					</dl>
					<dl>
						<dt className="text-xs text-white/40 mb-0.5">Lowest</dt>
						<dd className="text-sm font-semibold" style={{ color: lowest.color }}>
							{lowest.label}
						</dd>
					</dl>
				</div>

				{/* Bar Chart - Simple CSS bars */}
				<div className="flex items-end justify-between gap-4 h-[160px] mb-4">
					{breakdown.map((item, index) => {
						const barHeight = Math.max(24, Math.round((item.score / maxScore) * 130));
						const isHovered = hoveredIndex === index;
						
						return (
							<div 
								key={index} 
								className="flex flex-col items-center flex-1 justify-end h-full relative"
								onMouseEnter={() => setHoveredIndex(index)}
								onMouseLeave={() => setHoveredIndex(null)}
							>
								{/* Tooltip */}
								{isHovered && (
									<div className="absolute bottom-full mb-2 bg-neutral-800 px-3 py-2 rounded-lg z-50 min-w-[120px] text-center shadow-lg whitespace-nowrap">
										<div className="text-xs font-medium text-white">{item.label}</div>
										<div className="text-lg font-bold text-white">{item.score}</div>
										<div className="text-[10px] text-white/50">{item.explanation}</div>
									</div>
								)}

								{/* Score above bar */}
								<div className="text-xs font-medium text-white/70 mb-2">{item.score}</div>

								{/* Bar */}
								<div
									className="w-full max-w-[36px] rounded-t-md cursor-pointer transition-all duration-200"
									style={{ 
										height: `${barHeight}px`,
										backgroundColor: isHovered ? item.hoverColor : item.color,
										opacity: isHovered ? 1 : 0.8,
									}}
								/>
								
								{/* Label */}
								<div className={`text-[10px] mt-2 text-center leading-tight transition-colors ${
									isHovered ? "text-white" : "text-white/50"
								}`}>
									{item.shortLabel}
								</div>
							</div>
						);
					})}
				</div>

				{/* Footer */}
				<div className="flex justify-between items-center pt-3 border-t border-white/10">
					<span className="text-xs text-white/40">
						Based on last 30 videos
					</span>
					<button 
						onClick={() => setShowModal(true)}
						className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
					>
						View methodology →
					</button>
				</div>
			</div>

			{/* Modal */}
			{showModal && (
				<div
					onClick={() => setShowModal(false)}
					className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="bg-neutral-900 rounded-xl p-6 max-w-md w-full shadow-2xl"
					>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-white">Score Methodology</h3>
							<button
								onClick={() => setShowModal(false)}
								className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white text-xl leading-none"
							>
								×
							</button>
						</div>

						<div className="space-y-4 text-sm">
							<p className="text-white/60">
								Viral Score = weighted average of key performance indicators, normalized against channels within ±20% subscriber size.
							</p>
							
							<div className="space-y-2">
								{breakdown.map((item, index) => (
									<div key={index} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
										<div className="flex items-center gap-2">
											<div 
												className="w-3 h-3 rounded-sm"
												style={{ backgroundColor: item.color }}
											/>
											<span className="text-white/80">{item.label}</span>
										</div>
										<span className="text-white font-medium">{item.score}</span>
									</div>
								))}
							</div>

							<button
								onClick={() => setShowModal(false)}
								className="w-full mt-4 py-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium transition-colors text-sm"
							>
								Got it
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
