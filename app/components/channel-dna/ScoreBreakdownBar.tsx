"use client";

import { HelpCircle, TrendingUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreBreakdownBarProps {
	totalScore: number;
}

interface BreakdownItem {
	label: string;
	score: number;
	explanation: string;
}

export function ScoreBreakdownBar({ totalScore }: ScoreBreakdownBarProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const [showModal, setShowModal] = useState(false);

	const breakdown: BreakdownItem[] = [
		{
			label: "Discoverability",
			score: Math.round(totalScore * 0.95),
			explanation: "Views per video vs peer median.",
		},
		{
			label: "Engagement",
			score: Math.round(totalScore * 0.92),
			explanation: "Engagement rate vs peer median.",
		},
		{
			label: "Consistency",
			score: Math.round(totalScore * 0.88),
			explanation: "Upload cadence stability.",
		},
		{
			label: "Topics",
			score: Math.round(totalScore * 0.85),
			explanation: "Topic repetition across top videos.",
		},
		{
			label: "Packaging",
			score: Math.round(totalScore * 0.90),
			explanation: "CTR proxy from title + thumbnail.",
		},
	];

	const maxScore = Math.max(...breakdown.map(b => b.score));

	return (
		<>
			<div className="w-full h-full bg-white/[0.03] rounded-xl p-5 md:p-6">
				{/* Header */}
				<div className="flex justify-between items-start border-b border-white/10 pb-4">
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
				<div className="grid grid-cols-2 py-4 border-b border-white/10">
					<dl>
						<dt className="text-xs text-white/40 mb-0.5">Highest</dt>
						<dd className="text-base font-semibold text-green-400">
							{breakdown.reduce((max, b) => b.score > max.score ? b : max, breakdown[0]).label}
						</dd>
					</dl>
					<dl>
						<dt className="text-xs text-white/40 mb-0.5">Lowest</dt>
						<dd className="text-base font-semibold text-pink-400">
							{breakdown.reduce((min, b) => b.score < min.score ? b : min, breakdown[0]).label}
						</dd>
					</dl>
				</div>

				{/* Bar Chart */}
				<div className="pt-6 pb-2">
					<div className="flex items-end justify-between gap-3 h-[180px]">
						{breakdown.map((item, index) => {
							const maxBarHeight = 140;
							const barHeight = Math.max(20, Math.round((item.score / maxScore) * maxBarHeight));
							const isHovered = hoveredIndex === index;
							
							// Assign distinct colors to each bar
							const colors = [
								{ base: "bg-blue-500", hover: "bg-blue-400" },
								{ base: "bg-emerald-500", hover: "bg-emerald-400" },
								{ base: "bg-amber-500", hover: "bg-amber-400" },
								{ base: "bg-rose-500", hover: "bg-rose-400" },
								{ base: "bg-violet-500", hover: "bg-violet-400" },
							];
							const color = colors[index % colors.length];
							
							return (
								<div 
									key={index} 
									className="flex flex-col items-center flex-1 justify-end h-full relative cursor-pointer"
									onMouseEnter={() => setHoveredIndex(index)}
									onMouseLeave={() => setHoveredIndex(null)}
								>
									{/* Tooltip */}
									<AnimatePresence>
										{isHovered && (
											<motion.div
												initial={{ opacity: 0, y: 5 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 5 }}
												className="absolute bottom-full mb-2 bg-neutral-900 px-3 py-2 rounded-lg z-50 min-w-[120px] text-center shadow-lg"
											>
												<div className="text-xs font-medium text-white">{item.label}</div>
												<div className="text-lg font-bold text-white">{item.score}</div>
												<div className="text-[10px] text-white/50">{item.explanation}</div>
											</motion.div>
										)}
									</AnimatePresence>

									{/* Score above bar */}
									<div className="text-xs font-medium text-white/70 mb-1">{item.score}</div>

									{/* Bar - using inline style for reliable height */}
									<div
										style={{ height: `${barHeight}px` }}
										className={`w-8 rounded-t transition-all duration-500 ${
											isHovered ? color.hover : color.base
										}`}
									/>
									
									{/* Label */}
									<div className={`text-[10px] mt-2 text-center leading-tight transition-colors ${
										isHovered ? "text-white" : "text-white/40"
									}`}>
										{item.label.slice(0, 6)}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-between items-center pt-3 border-t border-white/10">
					<span className="text-xs text-white/40">
						Based on last 30 videos
					</span>
					<button 
						onClick={() => setShowModal(true)}
						className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
					>
						View methodology →
					</button>
				</div>
			</div>

			{/* Modal */}
			<AnimatePresence>
				{showModal && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setShowModal(false)}
						className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
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
											<span className="text-white/80">{item.label}</span>
											<span className="text-white font-medium">{item.score}</span>
										</div>
									))}
								</div>

								<button
									onClick={() => setShowModal(false)}
									className="w-full mt-4 py-2.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 font-medium transition-colors text-sm"
								>
									Got it
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
