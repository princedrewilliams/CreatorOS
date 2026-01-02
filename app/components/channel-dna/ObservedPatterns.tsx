"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Sparkles, TrendingUp, Search, Calendar, Image as ImageIcon, Hash, Fingerprint, Zap } from "lucide-react";

interface ObservedPatternsProps {
	activeTab: string;
	score?: any;
	recommendations?: string[];
}

export function ObservedPatterns({ activeTab, score: _score, recommendations = [] }: ObservedPatternsProps) {
	const [expandedId, setExpandedId] = useState<number | null>(null);

	// Viral Score Tab - Redesigned with Evidence-Based Patterns
	if (activeTab === "viral") {
		const viralSignals = [
			{
				id: 1,
				confidence: "High" as const,
				pattern: "This channel frequently front-loads keywords in titles.",
				evidence: "Observed across 80% of top-performing videos.",
				videoCount: 8,
			},
			{
				id: 2,
				confidence: "High" as const,
				pattern: "Thumbnail features single high-contrast subject with minimal text overlay.",
				evidence: "Found in 78% of videos exceeding channel average by 3x or more.",
				videoCount: 12,
			},
			{
				id: 3,
				confidence: "Medium" as const,
				pattern: "Videos released in 2-3 upload clusters show sustained view velocity.",
				evidence: "Session time increases by 45% when this pattern is present.",
				videoCount: 5,
			},
			{
				id: 4,
				confidence: "Medium" as const,
				pattern: "Engagement rate spikes when CTA appears within first 30 seconds.",
				evidence: "Appears in 65% of top-performing videos.",
				videoCount: 6,
			},
			{
				id: 5,
				confidence: "Low" as const,
				pattern: "Title hooks appear in first 40 characters with clear outcome promise.",
				evidence: "Correlates with 2.3x higher views in first 48h.",
				videoCount: 3,
			},
		];

		return (
			<GlassCard className="h-full flex flex-col" delay={0.2} hoverEffect={true}>
				{/* Viral Signature Section */}
				<div className="flex items-center gap-2 mb-6">
					<div className="p-2 rounded-lg bg-pink-500/10">
						<Zap className="w-5 h-5 text-pink-400" />
					</div>
					<div className="flex-1">
						<h3 className="text-xl font-bold text-white">What This Channel Repeats</h3>
						<p className="text-xs text-white/50">Patterns consistently observed across top-performing videos.</p>
					</div>
				</div>

				{/* Pattern Cards with View Examples */}
				<div className="flex flex-col gap-3 flex-1">
					{viralSignals.map((signal, index) => {
						const isExpanded = expandedId === signal.id;
						
						return (
							<motion.div
								key={signal.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
								className={`group relative p-4 rounded-2xl transition-all duration-300 overflow-hidden ${
									isExpanded
										? "bg-pink-500/10 shadow-lg"
										: "bg-pink-500/5 hover:bg-pink-500/10"
								}`}
							>
								<div className="flex items-start justify-between gap-3 mb-2">
									<div className="flex items-center gap-2">
										<span className={`text-xs font-bold px-2 py-0.5 rounded ${
											signal.confidence === "High" ? "text-green-400 bg-green-400/10" :
											signal.confidence === "Medium" ? "text-yellow-400 bg-yellow-400/10" :
											"text-blue-400 bg-blue-400/10"
										}`}>
											{signal.confidence} Confidence
										</span>
									</div>
								</div>
								<p className="text-sm text-white/80 leading-relaxed mb-2">
									{signal.pattern}
								</p>
								<div className="text-xs text-white/50 italic mb-3">
									{signal.evidence}
								</div>
								<button
									onClick={(e) => {
										e.stopPropagation();
										// TODO: Open video examples modal
										console.log("View examples for pattern", signal.id);
									}}
									className="w-full px-3 py-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors flex items-center justify-center gap-2"
								>
									View {signal.videoCount} Matching Videos
									<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</button>
							</motion.div>
						);
					})}
				</div>
			</GlassCard>
		);
	}

	// Other tabs - Dynamic content based on activeTab
	const tabConfig: Record<string, { title: string; icon: any; patterns: any[] }> = {
		search: {
			title: "Discovery Patterns",
			icon: Search,
			patterns: [
				{
					id: 1,
					title: "Pattern 1",
					description: "This channel's discovery is driven primarily by Browse rather than Search.",
					icon: Search,
					details: "Browse traffic accounts for 65% of total views.",
				},
			],
		},
		upload: {
			title: "Consistency Patterns",
			icon: Calendar,
			patterns: [
				{
					id: 1,
					title: "Pattern 1",
					description: "This channel maintains a predictable upload cadence with minimal gaps.",
					icon: Calendar,
					details: "Average 3 uploads per week over last 60 days.",
				},
			],
		},
		thumb: {
			title: "Thumbnail Patterns",
			icon: ImageIcon,
			patterns: [
				{
					id: 1,
					title: "Pattern 1",
					description: "High-performing thumbnails correlate with significantly higher view velocity.",
					icon: ImageIcon,
					details: "Top 20% thumbnails drive 2.4x more views in first 24h.",
				},
			],
		},
		topics: {
			title: "Topic Patterns",
			icon: Hash,
			patterns: [
				{
					id: 1,
					title: "Pattern 1",
					description: "A small number of topic clusters drive the majority of total views.",
					icon: Hash,
					details: "Top 3 topics account for 68% of total channel views.",
				},
			],
		},
		identity: {
			title: "Identity Patterns",
			icon: Fingerprint,
			patterns: [
				{
					id: 1,
					title: "Pattern 1",
					description: "The channel maintains a clear and repeatable content identity.",
					icon: Fingerprint,
					details: "Format consistency score: 78/100.",
				},
			],
		},
	};

	const config = tabConfig[activeTab] || {
		title: "What This Channel Repeats",
		icon: Sparkles,
		patterns: [
			{
				id: 1,
				title: "Recurring Signal 1",
				description: recommendations[0] || "Videos perform best when released in short topic runs (2-3 uploads).",
				icon: TrendingUp,
				details: "Session time increases by 45% when this pattern is used.",
			},
			{
				id: 2,
				title: "Recurring Signal 2",
				description: recommendations[1] || "This channel tends to test new hooks and measure 48h performance.",
				icon: Zap,
				details: "Channels using this approach see 2x growth in 3 months.",
			},
			{
				id: 3,
				title: "Recurring Signal 3",
				description: recommendations[2] || "This channel consistently uses specific CTAs and replies quickly.",
				icon: Sparkles,
				details: "Engagement rate increases by 3.5% when this pattern is consistent.",
			},
		].slice(0, recommendations.length || 3),
	};

	const Icon = config.icon;

	return (
		<GlassCard className="h-full flex flex-col" delay={0.2} hoverEffect={true}>
			<div className="flex items-center gap-2 mb-6">
				<div className="p-2 rounded-lg bg-pink-500/10">
					<Icon className="w-5 h-5 text-pink-400" />
				</div>
				<h3 className="text-xl font-bold text-white">{config.title}</h3>
				<span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-pink-500/5 text-white/40">
					{config.patterns.length} Signals
				</span>
			</div>

			<div className="flex flex-col gap-4 flex-1 relative">
				<div className="absolute left-[26px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-pink-500/20 via-pink-500/10 to-transparent -z-10" />

				{config.patterns.map((pattern, index) => {
					const PatternIcon = pattern.icon;
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
								<div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
									<PatternIcon className="w-5 h-5 text-pink-400" />
								</div>

								<div className="flex-1">
									<div className="flex items-center justify-between mb-1">
										<h4 className="text-white font-bold flex items-center gap-2">
											{pattern.title}
										</h4>
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
