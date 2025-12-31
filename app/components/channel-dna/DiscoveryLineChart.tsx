"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Search, Maximize2 } from "lucide-react";

export function DiscoveryLineChart() {
	const data = [
		{ day: "Day 1", views: 45 },
		{ day: "Day 7", views: 62 },
		{ day: "Day 14", views: 78 },
		{ day: "Day 21", views: 85 },
		{ day: "Day 30", views: 92 },
		{ day: "Day 45", views: 88 },
		{ day: "Day 60", views: 95 },
	];

	const maxViews = Math.max(...data.map((d) => d.views));

	return (
		<GlassCard className="h-full flex flex-col" delay={0.3} hoverEffect={true}>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
						<Search className="w-5 h-5 text-pink-400" />
					</div>
					<h3 className="text-xl font-bold text-white">Search & Discovery</h3>
				</div>
				<button className="p-2 rounded-full hover:bg-pink-500/10 transition-colors text-white/40 hover:text-white">
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<p className="text-sm text-white/40 mb-6">
				Recent uploads show strong early momentum, indicating favorable algorithm pickup.
			</p>

			<div className="relative flex-1 rounded-2xl bg-pink-500/5 border border-pink-500/10 p-6 overflow-hidden group">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#ec489912_1px,transparent_1px),linear-gradient(to_bottom,#ec489912_1px,transparent_1px)] bg-[size:24px_24px]" />
				</div>

				<div className="relative h-48 w-full z-10">
					<svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
						<defs>
							<linearGradient id="lineGradientPink" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
								<stop offset="100%" stopColor="#f472b6" stopOpacity="0.9" />
							</linearGradient>
							<filter id="glowPink">
								<feGaussianBlur stdDeviation="3" result="coloredBlur" />
								<feMerge>
									<feMergeNode in="coloredBlur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
						</defs>
						<motion.path
							d={`M ${data.map((d, i) => `${(i * 400) / (data.length - 1)},${200 - (d.views / maxViews) * 180}`).join(" L ")}`}
							fill="none"
							stroke="url(#lineGradientPink)"
							strokeWidth="3"
							filter="url(#glowPink)"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 1 }}
							transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
						/>
						{data.map((d, i) => (
							<motion.circle
								key={i}
								cx={(i * 400) / (data.length - 1)}
								cy={200 - (d.views / maxViews) * 180}
								r="4"
								fill="#ec4899"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
							/>
						))}
					</svg>
				</div>

				<div className="mt-4 text-center relative z-10">
					<p className="text-xs text-white/40 bg-pink-500/5 inline-block px-3 py-1 rounded-full border border-pink-500/10">
						Discovery velocity measured by views gained in first 48 hours.
					</p>
				</div>
			</div>
		</GlassCard>
	);
}

