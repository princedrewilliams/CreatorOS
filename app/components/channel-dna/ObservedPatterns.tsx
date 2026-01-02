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
			title: "Recurring Signal 1",
			description:
				recommendations[0]?.replace(/^Pick|^Test|^Add/, (match) => {
					if (match === "Pick") return "Videos perform best when released in short topic runs (2-3 uploads).";
					if (match === "Test") return "This channel tends to test new hooks and measure 48h performance.";
					if (match === "Add") return "This channel consistently uses specific CTAs and replies quickly.";
					return match;
				}) ||
				"Videos perform best when released in short topic runs (2-3 uploads). This builds trust.",
			icon: Layers,
			color: "text-pink-400",
			bg: "bg-pink-500/10",
			details: "Session time increases by 45% when this pattern is used.",
		},
		{
			id: 2,
			title: "Recurring Signal 2",
			description:
				recommendations[1]?.replace(/^Pick|^Test|^Add/, (match) => {
					if (match === "Pick") return "Videos perform best when released in short topic runs (2-3 uploads).";
					if (match === "Test") return "This channel tends to test new hooks and measure 48h performance.";
					if (match === "Add") return "This channel consistently uses specific CTAs and replies quickly.";
					return match;
				}) ||
				"This channel tends to test new hooks and measure 48h views/sub ratio before doubling down.",
			icon: Zap,
			color: "text-pink-400",
			bg: "bg-pink-500/10",
			details: "Channels using this approach see 2x growth in 3 months.",
		},
		{
			id: 3,
			title: "Recurring Signal 3",
			description:
				recommendations[2]?.replace(/^Pick|^Test|^Add/, (match) => {
					if (match === "Pick") return "Videos perform best when released in short topic runs (2-3 uploads).";
					if (match === "Test") return "This channel tends to test new hooks and measure 48h performance.";
					if (match === "Add") return "This channel consistently uses specific CTAs and replies quickly.";
					return match;
				}) ||
				"This channel consistently uses specific CTAs and replies to top comments within 1 hour.",
			icon: MessageCircle,
			color: "text-pink-400",
			bg: "bg-pink-500/10",
			details: "Engagement rate increases by 3.5% when this pattern is consistent.",
		},
	].slice(0, recommendations.length || 3);

	return (
		<GlassCard className="h-full flex flex-col" delay={0.2} hoverEffect={true}>
			<div className="flex items-center gap-2 mb-6">
				<div className="p-2 rounded-lg bg-pink-500/10">
					<Sparkles className="w-5 h-5 text-pink-400" />
				</div>
				<h3 className="text-xl font-bold text-white">What This Channel Repeats</h3>
				<span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-pink-500/5 text-white/40">
					{patterns.length} Signals
				</span>
			</div>

			<div className="flex flex-col gap-4 flex-1 relative">
							<div className="absolute left-[26px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-pink-500/20 via-pink-500/10 to-transparent -z-10" />

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
							className={`group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden ${
								isExpanded
									? "bg-pink-500/10 shadow-lg"
									: "bg-pink-500/5 hover:bg-pink-500/10"
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
												<div className="pt-3 text-xs text-white/50 italic flex items-center gap-2">
													<div className="w-1 h-1 rounded-full bg-pink-400" />
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

