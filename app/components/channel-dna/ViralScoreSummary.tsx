"use client";

import { GlassCard } from "./GlassCard";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface ViralScoreSummaryProps {
	score: number;
}

export function ViralScoreSummary({ score }: ViralScoreSummaryProps) {
	const percentile = Math.round(score * 0.95);
	
	const getLabel = (score: number): string => {
		if (score >= 80) return "Exceptional";
		if (score >= 60) return "High";
		if (score >= 40) return "Stable";
		return "Low";
	};

	const label = getLabel(score);
	const labelColor = 
		score >= 80 ? "text-green-400" :
		score >= 60 ? "text-pink-400" :
		score >= 40 ? "text-yellow-400" :
		"text-white/60";

	return (
		<GlassCard className="h-full flex flex-col" delay={0.1} hoverEffect={true}>
			<div className="flex items-center gap-2 mb-4">
				<div className="p-2 rounded-lg bg-pink-500/10">
					<TrendingUp className="w-5 h-5 text-pink-400" />
				</div>
				<h3 className="text-lg font-bold text-white">Viral Score</h3>
			</div>

			<div className="flex-1 flex flex-col justify-center items-center space-y-4">
				<div className="text-center">
					<div className="flex items-baseline justify-center gap-2 mb-2">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
							className="text-6xl font-bold text-white"
						>
							{score}
						</motion.div>
						<div className="text-xl text-white/60">/100</div>
					</div>
					<div className={`text-lg font-semibold ${labelColor} mb-2`}>
						{label}
					</div>
					<div className="text-sm text-white/60">
						{percentile}th percentile vs similar-sized channels
					</div>
				</div>

				<div className="w-full max-w-md mx-auto pt-4 border-t border-pink-500/20">
					<p className="text-xs text-white/50 text-center italic">
						Score reflects how often this channel's videos outperform peers of similar size.
					</p>
				</div>
			</div>
		</GlassCard>
	);
}

