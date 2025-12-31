"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Image as ImageIcon, Maximize2 } from "lucide-react";

export function ThumbComparisonChart() {
	const topThumbs = { avgViews: 850000, label: "Top 20%" };
	const bottomThumbs = { avgViews: 320000, label: "Bottom 20%" };
	const maxViews = Math.max(topThumbs.avgViews, bottomThumbs.avgViews);

	return (
		<GlassCard className="h-full flex flex-col" delay={0.3} hoverEffect={true}>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
						<ImageIcon className="w-5 h-5 text-pink-400" />
					</div>
					<h3 className="text-xl font-bold text-white">Thumbnail Performance</h3>
				</div>
				<button className="p-2 rounded-full hover:bg-pink-500/10 transition-colors text-white/40 hover:text-white">
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<p className="text-sm text-white/40 mb-6">
				High-performing thumbnails correlate with significantly higher view velocity.
			</p>

			<div className="relative flex-1 rounded-2xl bg-pink-950/20 border border-pink-500/20 p-6 overflow-hidden group">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#ec489912_1px,transparent_1px),linear-gradient(to_bottom,#ec489912_1px,transparent_1px)] bg-[size:24px_24px]" />
				</div>

				<div className="relative h-48 w-full z-10 flex items-end justify-center gap-8">
					<motion.div
						className="flex flex-col items-center gap-3"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
					>
						<motion.div
							className="w-24 bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-lg shadow-[0_0_20px_rgba(236,72,153,0.4)] relative overflow-hidden"
							initial={{ height: 0 }}
							animate={{ height: `${(bottomThumbs.avgViews / maxViews) * 100}%` }}
							transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
						>
							<motion.div
								animate={{ y: ["0%", "100%"] }}
								transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
								className="absolute inset-0 bg-gradient-to-t from-transparent via-pink-300/20 to-transparent"
							/>
						</motion.div>
						<span className="text-xs text-white/60 font-medium">{bottomThumbs.label}</span>
						<span className="text-sm text-pink-400 font-bold">
							{(bottomThumbs.avgViews / 1000).toFixed(0)}K
						</span>
					</motion.div>

					<motion.div
						className="flex flex-col items-center gap-3"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.7 }}
					>
						<motion.div
							className="w-24 bg-gradient-to-t from-pink-500 to-pink-300 rounded-t-lg shadow-[0_0_30px_rgba(236,72,153,0.5)] relative overflow-hidden"
							initial={{ height: 0 }}
							animate={{ height: `${(topThumbs.avgViews / maxViews) * 100}%` }}
							transition={{ delay: 1, duration: 0.5, type: "spring" }}
						>
							<motion.div
								animate={{ y: ["0%", "100%"] }}
								transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
								className="absolute inset-0 bg-gradient-to-t from-transparent via-pink-300/20 to-transparent"
							/>
						</motion.div>
						<span className="text-xs text-white/60 font-medium">{topThumbs.label}</span>
						<span className="text-sm text-pink-400 font-bold">
							{(topThumbs.avgViews / 1000).toFixed(0)}K
						</span>
					</motion.div>
				</div>

				<div className="mt-4 text-center relative z-10">
					<p className="text-xs text-white/40 bg-pink-500/5 inline-block px-3 py-1 rounded-full border border-pink-500/10">
						Performance inferred from post-publish view acceleration.
					</p>
				</div>
			</div>
		</GlassCard>
	);
}

