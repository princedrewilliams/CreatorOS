"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Sparkles, Layers, Zap, MessageCircle, ChevronDown } from "lucide-react";

interface ObservedPatternsProps {
	recommendations?: string[];
}

export function ObservedPatterns({ recommendations = [] }: ObservedPatternsProps) {
	const [expandedId, setExpandedId] = useState<number | null>(null);

	const patterns = [
		{
			id: 1,
			title: "Pattern 1",
			description:
				recommendations[0] ||
				"Pick 2 topic clusters and publish 3-in-a-row; group them into playlists.",
			icon: Layers,
			color: "text-blue-400",
			bg: "bg-blue-500/10",
			details: "This strategy increases session time by 45% on average.",
		},
		{
			id: 2,
			title: "Pattern 2",
			description:
				recommendations[1] ||
				"Test 3 new hooks and measure 48h views/sub ratio; double down on winners.",
			icon: Zap,
			color: "text-yellow-400",
			bg: "bg-yellow-500/10",
			details: "Channels using this A/B testing see 2x growth in 3 months.",
		},
		{
			id: 3,
			title: "Pattern 3",
			description:
				recommendations[2] ||
				"Add a single, specific CTA and reply to top 10 comments within 1 hour.",
			icon: MessageCircle,
			color: "text-pink-400",
			bg: "bg-pink-500/10",
			details: "Boosts engagement rate by 3.5% and triggers algorithm push.",
		},
	].slice(0, recommendations.length || 3);

	return (
		<GlassCard className="h-full flex flex-col" delay={0.2} hoverEffect={true}>
			<div className="flex items-center gap-2 mb-6">
				<div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
					<Sparkles className="w-5 h-5 text-purple-400" />
				</div>
				<h3 className="text-xl font-bold text-white">Observed Patterns</h3>
				<span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/5">
					{patterns.length} New
				</span>
			</div>

			<div className="flex flex-col gap-4 flex-1 relative">
				<div className="absolute left-[26px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent -z-10" />

				{patterns.map((pattern, index) => {
					const Icon = pattern.icon;
					const isExpanded = expandedId === pattern.id;
					return (
						<motion.div
							key={pattern.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								delay: 0.4 + index * 0.1,
								type: "spring",
							}}
							onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
							className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
								isExpanded
									? "bg-white/10 border-white/20 shadow-lg"
									: "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
							}`}
						>
							<div className="flex gap-4">
								<div
									className={`flex-shrink-0 w-10 h-10 rounded-full ${pattern.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300`}
								>
									<Icon className={`w-5 h-5 ${pattern.color}`} />
								</div>

								<div className="flex-1">
									<div className="flex items-center justify-between mb-1">
										<h4 className="text-white font-bold flex items-center gap-2">
											{pattern.title}
										</h4>
										<motion.div
											animate={{ rotate: isExpanded ? 180 : 0 }}
											transition={{ duration: 0.3 }}
										>
											<ChevronDown className="w-4 h-4 text-white/40" />
										</motion.div>
									</div>

									<p className="text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
										{pattern.description}
									</p>

									<AnimatePresence>
										{isExpanded && (
											<motion.div
												initial={{ height: 0, opacity: 0, marginTop: 0 }}
												animate={{ height: "auto", opacity: 1, marginTop: 12 }}
												exit={{ height: 0, opacity: 0, marginTop: 0 }}
												className="overflow-hidden"
											>
												<div className="pt-3 border-t border-white/10 text-xs text-white/50 italic flex items-center gap-2">
													<div className="w-1 h-1 rounded-full bg-green-400" />
													{pattern.details}
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</div>
						</motion.div>
					);
				})}
			</div>
		</GlassCard>
	);
}

