"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Hash, Maximize2 } from "lucide-react";

export function WinningTopicsBubbleChart() {
	const topics = [
		{ topic: "Topic A", views: 850000, frequency: 12, x: 20, y: 30 },
		{ topic: "Topic B", views: 620000, frequency: 8, x: 50, y: 50 },
		{ topic: "Topic C", views: 450000, frequency: 5, x: 70, y: 25 },
		{ topic: "Topic D", views: 320000, frequency: 3, x: 35, y: 70 },
	];

	const maxSize = Math.max(...topics.map((t) => t.frequency));

	return (
		<GlassCard className="h-full flex flex-col" delay={0.3} hoverEffect={true}>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-pink-500/10">
						<Hash className="w-5 h-5 text-pink-400" />
					</div>
					<h3 className="text-xl font-bold text-white">Winning Topics</h3>
				</div>
				<button className="p-2 rounded-full hover:bg-pink-500/10 transition-colors text-white/40 hover:text-white">
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<p className="text-sm text-white/40 mb-6">
				A small number of topic clusters drive the majority of total views.
			</p>

			<div className="relative flex-1 rounded-2xl bg-pink-950/20 p-6 overflow-hidden group">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#ec489912_1px,transparent_1px),linear-gradient(to_bottom,#ec489912_1px,transparent_1px)] bg-[size:24px_24px]" />
				</div>

				<div className="relative h-48 w-full z-10">
					{topics.map((topic, i) => {
						const size = (topic.frequency / maxSize) * 40 + 20;
						return (
							<motion.div
								key={i}
								className="absolute rounded-full bg-gradient-to-br from-pink-500 to-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.4)] flex items-center justify-center cursor-pointer"
								style={{
									left: `${topic.x}%`,
									top: `${topic.y}%`,
									width: `${size}px`,
									height: `${size}px`,
									transform: "translate(-50%, -50%)",
								}}
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
								whileHover={{ scale: 1.2, zIndex: 50 }}
							>
								<motion.div
									animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
									transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
									className="absolute inset-0 rounded-full bg-pink-400"
								/>
								<span className="text-[10px] font-bold text-white relative z-10">{topic.topic}</span>
							</motion.div>
						);
					})}
				</div>

				<div className="mt-4 text-center relative z-10">
					<p className="text-xs text-white/40 bg-pink-500/5 inline-block px-3 py-1 rounded-full">
						Bubble chart: X = Avg views, Y = Frequency, Size = Engagement
					</p>
				</div>
			</div>
		</GlassCard>
	);
}

