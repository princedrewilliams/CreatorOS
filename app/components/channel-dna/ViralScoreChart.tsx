"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { TrendingUp, Info, Maximize2 } from "lucide-react";

export function ViralScoreChart() {
	const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

	const points = [
		{ x: 20, y: 30, color: "bg-pink-400", label: "Video A", views: "1.2M" },
		{ x: 35, y: 45, color: "bg-pink-400", label: "Video B", views: "2.4M" },
		{ x: 50, y: 55, color: "bg-pink-500", label: "Video C", views: "3.1M" },
		{ x: 65, y: 70, color: "bg-pink-500", label: "Video D", views: "5.8M" },
		{ x: 80, y: 85, color: "bg-pink-600", label: "Video E", views: "8.2M" },
	];

	return (
		<GlassCard className="h-full flex flex-col" delay={0.3} hoverEffect={true}>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
						<TrendingUp className="w-5 h-5 text-pink-400" />
					</div>
					<h3 className="text-xl font-bold text-white">Viral Score Chart</h3>
				</div>
				<button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white">
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<p className="text-sm text-white/40 mb-6 flex items-center gap-2">
				Visualization for this tab
				<Info className="w-3 h-3" />
			</p>

			<div className="relative flex-1 rounded-2xl bg-pink-500/5 border border-pink-500/10 p-6 overflow-hidden group">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#ec489912_1px,transparent_1px),linear-gradient(to_bottom,#ec489912_1px,transparent_1px)] bg-[size:24px_24px]" />
					<motion.div
						animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
						transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
						className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(255,255,255,0.05),transparent)]"
					/>
				</div>

				<h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 relative z-10">
					Viral Scatter
				</h4>

				<div className="relative h-48 w-full z-10">
					{points.map((point, i) => (
						<motion.div
							key={i}
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{
								delay: 0.8 + i * 0.1,
								type: "spring",
								stiffness: 200,
							}}
							onMouseEnter={() => setHoveredPoint(i)}
							onMouseLeave={() => setHoveredPoint(null)}
							className={`absolute w-4 h-4 rounded-full ${point.color} shadow-[0_0_15px_rgba(236,72,153,0.5)] cursor-pointer border-2 border-white/20 z-20`}
							style={{
								left: `${point.x}%`,
								bottom: `${point.y}%`,
								transform: "translate(-50%, 50%)",
							}}
							whileHover={{ scale: 1.5, zIndex: 50 }}
						>
							<AnimatePresence>
								{hoveredPoint === i && (
									<motion.div
										initial={{ opacity: 0, y: 10, scale: 0.8 }}
										animate={{ opacity: 1, y: -10, scale: 1 }}
										exit={{ opacity: 0, y: 10, scale: 0.8 }}
										className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a24] border border-white/10 px-3 py-2 rounded-xl shadow-xl whitespace-nowrap min-w-[100px]"
									>
										<div className="text-xs font-bold text-white mb-0.5">{point.label}</div>
										<div className="text-[10px] text-white/60 flex justify-between">
											<span>Score: {point.y}</span>
											<span className="text-green-400">{point.views}</span>
										</div>
										<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1a1a24]" />
									</motion.div>
								)}
							</AnimatePresence>

							<motion.div
								animate={{ scale: [1, 2], opacity: [0.5, 0] }}
								transition={{
									duration: 2,
									repeat: Infinity,
									delay: i * 0.2,
								}}
								className={`absolute inset-0 rounded-full ${point.color}`}
							/>
						</motion.div>
					))}

					<svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
						<defs>
							<linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
								<stop offset="100%" stopColor="#f472b6" stopOpacity="0.9" />
							</linearGradient>
							<filter id="glow">
								<feGaussianBlur stdDeviation="2" result="coloredBlur" />
								<feMerge>
									<feMergeNode in="coloredBlur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
						</defs>
						<motion.path
							d="M 100 150 Q 250 100 400 50"
							fill="none"
							stroke="url(#lineGradient)"
							strokeWidth="3"
							filter="url(#glow)"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 1 }}
							transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
						/>
					</svg>
				</div>

				<div className="mt-4 text-center relative z-10">
					<p className="text-xs text-white/40 bg-pink-500/5 inline-block px-3 py-1 rounded-full border border-pink-500/10">
						This channel consistently produces videos that outperform its own average.
					</p>
				</div>
			</div>
		</GlassCard>
	);
}

