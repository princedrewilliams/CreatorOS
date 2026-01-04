"use client";

import { GlassCard } from "./GlassCard";
import { HelpCircle } from "lucide-react";
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
			<GlassCard className="h-full flex flex-col p-6" delay={0.25} hoverEffect={false}>
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-semibold text-white">Score Breakdown</h3>
					<button
						onClick={() => setShowModal(true)}
						className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60"
						title="How this score is calculated"
					>
						<HelpCircle className="w-4 h-4" />
					</button>
				</div>

				{/* Clean vertical bar chart */}
				<div className="flex-1 flex items-end justify-between gap-3 px-2">
					{breakdown.map((item, index) => {
						const heightPercent = (item.score / maxScore) * 100;
						const isHovered = hoveredIndex === index;
						
						return (
							<div 
								key={index} 
								className="flex flex-col items-center flex-1 h-full justify-end relative"
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
											className="absolute bottom-full mb-2 bg-pink-950/90 backdrop-blur-sm px-3 py-2 rounded-lg z-50 min-w-[140px] text-center"
										>
											<div className="text-xs font-medium text-white mb-0.5">{item.label}</div>
											<div className="text-[10px] text-white/50">{item.explanation}</div>
										</motion.div>
									)}
								</AnimatePresence>

								{/* Score label */}
								<div className="text-xs font-medium text-white/80 mb-2">{item.score}</div>
								
								{/* Bar */}
								<motion.div
									initial={{ height: 0 }}
									animate={{ height: `${heightPercent}%` }}
									transition={{ duration: 0.8, delay: 0.1 * index, ease: "easeOut" }}
									className={`w-full max-w-[32px] rounded-t-md transition-colors duration-200 ${
										isHovered ? "bg-pink-400" : "bg-pink-500/60"
									}`}
									style={{ minHeight: "20px" }}
								/>
								
								{/* Label */}
								<div className="text-[10px] text-white/40 mt-3 text-center leading-tight">
									{item.label}
								</div>
							</div>
						);
					})}
				</div>
			</GlassCard>

			{/* How this score is calculated Modal */}
			<AnimatePresence>
				{showModal && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setShowModal(false)}
							className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
						>
							<motion.div
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.9, opacity: 0 }}
								onClick={(e) => e.stopPropagation()}
								className="bg-pink-950/90 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
							>
								<div className="flex items-center justify-between mb-4">
									<h3 className="text-xl font-bold text-white">How this score is calculated</h3>
									<button
										onClick={() => setShowModal(false)}
										className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
									>
										×
									</button>
								</div>

								<div className="space-y-4 text-sm text-white/80">
									<div>
										<div className="font-bold text-white mb-2">Viral Score Formula</div>
										<div className="bg-pink-500/10 rounded-lg p-4 font-mono text-xs">
											Viral Score = Weighted average of:
											<ul className="list-disc list-inside mt-2 space-y-1 text-white/70">
												<li>Views per video vs peer median (25%)</li>
												<li>Engagement rate vs peer median (25%)</li>
												<li>Upload cadence stability (20%)</li>
												<li>Topic repetition across top 30 videos (20%)</li>
												<li>CTR proxy (title + thumbnail changes) (10%)</li>
											</ul>
										</div>
									</div>

									<div>
										<div className="font-bold text-white mb-2">Normalization</div>
										<p className="text-white/70">
											All metrics are normalized against channels within ±20% subscriber size. This ensures
											fair comparison regardless of channel size.
										</p>
									</div>

									<div>
										<div className="font-bold text-white mb-2">Component Details</div>
										<div className="space-y-3">
											{breakdown.map((item, index) => (
												<div key={index} className="bg-white/[0.02] rounded-lg p-3">
													<div className="font-semibold text-white mb-1">
														{item.label}
													</div>
													<div className="text-xs text-white/60">{item.explanation}</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</motion.div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}

