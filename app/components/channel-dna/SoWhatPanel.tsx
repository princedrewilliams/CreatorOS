"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb, TrendingUp, AlertCircle, Target } from "lucide-react";

interface SoWhatSection {
	context: string;
	strengths: string[];
	limits: string[];
	actions: string[];
}

interface SoWhatPanelProps {
	section: SoWhatSection | undefined;
	userNiche: string;
	channelName: string;
}

export function SoWhatPanel({ section, userNiche, channelName }: SoWhatPanelProps) {
	const [isExpanded, setIsExpanded] = useState(true);

	if (!section || !userNiche) {
		return null;
	}

	const nicheLabel = userNiche.charAt(0).toUpperCase() + userNiche.slice(1);

	return (
		<div className="mt-4">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between text-left mb-3"
			>
				<h3 className="text-sm font-medium text-[var(--accent-primary)] uppercase tracking-wider flex items-center gap-2">
					<Lightbulb className="w-4 h-4" />
					So What for {nicheLabel} Creators
				</h3>
				<ChevronDown
					className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
						isExpanded ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isExpanded && (
				<div className="space-y-3">
					{/* Context */}
					<div className="backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] bg-[var(--frosted-bg)] rounded-xl p-4">
						<p className="text-sm text-[var(--text-primary)] leading-relaxed">
							{section.context}
						</p>
					</div>

					{/* What This Creator Does Well */}
					<div className="backdrop-blur-[var(--frosted-blur)] border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-2">
							<TrendingUp className="w-4 h-4 text-emerald-400" />
							<span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
								What {channelName} Does Well
							</span>
						</div>
						<ul className="space-y-1.5">
							{section.strengths.map((strength, i) => (
								<li key={i} className="text-sm text-[var(--text-primary)] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400/60">
									{strength}
								</li>
							))}
						</ul>
					</div>

					{/* What Limits Their Approach */}
					<div className="backdrop-blur-[var(--frosted-blur)] border border-amber-500/30 bg-amber-500/5 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-2">
							<AlertCircle className="w-4 h-4 text-amber-400" />
							<span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
								What Limits Their Approach
							</span>
						</div>
						<ul className="space-y-1.5">
							{section.limits.map((limit, i) => (
								<li key={i} className="text-sm text-[var(--text-primary)] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-400/60">
									{limit}
								</li>
							))}
						</ul>
					</div>

					{/* If You Post [NICHE] Content */}
					<div className="backdrop-blur-[var(--frosted-blur)] border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 rounded-xl p-4">
						<div className="flex items-center gap-2 mb-2">
							<Target className="w-4 h-4 text-[var(--accent-primary)]" />
							<span className="text-xs font-medium text-[var(--accent-primary)] uppercase tracking-wide">
								If You Post {nicheLabel} Content
							</span>
						</div>
						<ul className="space-y-1.5">
							{section.actions.map((action, i) => (
								<li key={i} className="text-sm text-[var(--text-primary)] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--accent-primary)]/60">
									{action}
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}
