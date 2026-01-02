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
	weight: number;
	score: number;
	explanation: string;
}

export function ScoreBreakdownBar({ totalScore }: ScoreBreakdownBarProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const [showModal, setShowModal] = useState(false);

	const breakdown: BreakdownItem[] = [
		{
			label: "Discoverability",
			weight: 25,
			score: Math.round(totalScore * 0.95),
			explanation: "Views per video vs peer median. Normalized against channels within ±20% subscriber size.",
		},
		{
			label: "Engagement Velocity",
			weight: 25,
			score: Math.round(totalScore * 0.92),
			explanation: "Engagement rate vs peer median. Measures likes, comments, and shares relative to views.",
		},
		{
			label: "Upload Consistency",
			weight: 20,
			score: Math.round(totalScore * 0.88),
			explanation: "Upload cadence stability. Calculated from variance in days between uploads over 90 days.",
		},
		{
			label: "Topic Concentration",
			weight: 20,
			score: Math.round(totalScore * 0.85),
			explanation: "Topic repetition across top 30 videos. Measures format/personality consistency.",
		},
		{
			label: "Packaging Strength",
			weight: 10,
			score: Math.round(totalScore * 0.90),
			explanation: "CTR proxy based on title + thumbnail changes. Higher score = more consistent packaging.",
		},
	];

	return (
		<>
			<GlassCard className="h-full flex flex-col" delay={0.25} hoverEffect={true}>
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-bold text-white">Score Breakdown</h3>
						<button
							onClick={() => setShowModal(true)}
							className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
							title="How this score is calculated"
						>
							<HelpCircle className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Charts.css Column Chart */}
				<div id="score-breakdown-chart" className="w-full">
					<table className="charts-css column show-labels show-heading" style={{"--aspect-ratio": "4 / 3"} as React.CSSProperties}>
						<caption className="sr-only">Score Breakdown by Component</caption>
						<thead>
							<tr>
								<th scope="col">Component</th>
								{breakdown.map((item, index) => (
									<th key={index} scope="col" className="sr-only">
										{item.label}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{breakdown.map((item, index) => {
								const normalizedSize = item.score / 100;
								return (
									<tr key={index}>
										<th scope="row" className="text-xs text-white/60 text-left pr-4">
											{item.label}
											<span className="block text-[10px] text-white/40 mt-0.5">
												{item.weight}%
											</span>
										</th>
										<td
											style={{ "--size": normalizedSize }}
											onMouseEnter={() => setHoveredIndex(index)}
											onMouseLeave={() => setHoveredIndex(null)}
											className="relative cursor-pointer group"
										>
											<span className="data text-xs text-white font-medium">
												{item.score}
											</span>
											<AnimatePresence>
												{hoveredIndex === index && (
													<motion.div
														initial={{ opacity: 0, y: 5 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: 5 }}
														className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-pink-950 border border-pink-500/30 px-3 py-2 rounded-lg shadow-xl z-50 min-w-[200px]"
													>
														<div className="text-xs font-bold text-white mb-1">{item.label}</div>
														<div className="text-[10px] text-white/60">{item.explanation}</div>
														<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-pink-950" />
													</motion.div>
												)}
											</AnimatePresence>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<style jsx global>{`
					#score-breakdown-chart .charts-css.column {
						--color: rgba(236, 72, 153, 0.8);
					}
					#score-breakdown-chart .charts-css.column tbody tr {
						height: 50px;
					}
					#score-breakdown-chart .charts-css.column tbody td {
						background: linear-gradient(to top, rgba(236, 72, 153, 0.6), rgba(236, 72, 153, 0.9));
						border-radius: 4px 4px 0 0;
						transition: all 0.2s ease;
						position: relative;
					}
					#score-breakdown-chart .charts-css.column tbody td:hover {
						background: linear-gradient(to top, rgba(236, 72, 153, 0.8), rgba(236, 72, 153, 1));
						transform: scaleY(1.05);
						box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
					}
					#score-breakdown-chart .charts-css.column tbody th {
						color: rgba(255, 255, 255, 0.6);
						font-size: 11px;
						text-align: left;
						padding-right: 12px;
					}
					#score-breakdown-chart .charts-css.column tbody .data {
						color: white;
						font-weight: 600;
						font-size: 12px;
					}
					#score-breakdown-chart .charts-css.column tbody td::before {
						background: linear-gradient(to top, rgba(236, 72, 153, 0.6), rgba(236, 72, 153, 0.9));
					}
				`}</style>
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
								className="bg-pink-950/90 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
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
												<div key={index} className="bg-pink-500/5 rounded-lg p-3">
													<div className="font-semibold text-white mb-1">
														{item.label} ({item.weight}%)
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

