"use client";

import { useState } from "react";
import { ChartPanel } from "@/app/components/channel-dna/ChartPanel";
import { PillarBarChart } from "./charts/PillarBarChart";
import { FormatPieChart } from "./charts/FormatPieChart";
import { CheckCircle, AlertTriangle, XCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { PillarsResponse, ContentPillar } from "@/lib/learning-lab/types";
import { PILLAR_DEFINITIONS } from "@/lib/learning-lab/types";

interface PillarsPanelProps {
	data: PillarsResponse;
}

// Tooltip component for Creator-Led explanation
function PillarTooltip({ pillar }: { pillar: ContentPillar }) {
	const [isOpen, setIsOpen] = useState(false);
	const definition = PILLAR_DEFINITIONS[pillar];

	if (!definition) return <span>{pillar}</span>;

	return (
		<span className="relative inline-block">
			<button
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
				onClick={() => setIsOpen(!isOpen)}
				className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 cursor-help"
			>
				{pillar}
				<Info className="w-3 h-3 opacity-60" />
			</button>
			{isOpen && (
				<div className="absolute z-50 left-0 top-full mt-1 w-64 p-3 rounded-lg bg-black/95 border border-white/10 shadow-xl text-xs text-white/80">
					{definition}
				</div>
			)}
		</span>
	);
}

// Health badge component
function HealthBadge({ health }: { health: "strong" | "mixed" | "weak" }) {
	const config = {
		strong: {
			icon: CheckCircle,
			label: "Strong",
			bg: "bg-emerald-500/20",
			border: "border-emerald-500/30",
			text: "text-emerald-400",
		},
		mixed: {
			icon: AlertTriangle,
			label: "Mixed",
			bg: "bg-amber-500/20",
			border: "border-amber-500/30",
			text: "text-amber-400",
		},
		weak: {
			icon: XCircle,
			label: "Weak",
			bg: "bg-red-500/20",
			border: "border-red-500/30",
			text: "text-red-400",
		},
	};

	const { icon: Icon, label, bg, border, text } = config[health];

	return (
		<span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${bg} ${border} ${text} border`}>
			<Icon className="w-4 h-4" />
			{label}
		</span>
	);
}

export function PillarsPanel({ data }: PillarsPanelProps) {
	const { formatBreakdown, barChartData, pieData, verdict, soWhat, insights, channelHealth } = data;
	const [showAllInsights, setShowAllInsights] = useState(false);

	// Check if format mix is imbalanced (show pie chart only if imbalanced)
	const isImbalanced = formatBreakdown.shorts.percentage > 70 || formatBreakdown.shorts.percentage < 20;

	// Format mismatch detection
	const shortsOutperform = formatBreakdown.shorts.avgViews > formatBreakdown.longForm.avgViews;
	const shortsDominate = formatBreakdown.shorts.percentage > 60;
	const hasMismatch = (shortsOutperform && !shortsDominate) || (!shortsOutperform && shortsDominate);

	return (
		<div className="space-y-6">
			{/* TOP VERDICT SECTION */}
			<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-6">
				<div className="flex items-start justify-between gap-4 mb-4">
					<h2 className="text-xl font-bold text-white">
						What Actually Drives Views on This Channel
					</h2>
					<HealthBadge health={channelHealth} />
				</div>

				{/* Main Verdict Headline */}
				<p className={`text-lg ${verdict.isStrong ? "text-emerald-400" : channelHealth === "weak" ? "text-red-400" : "text-amber-400"} font-medium mb-4`}>
					{verdict.headline}
				</p>

				{/* Why This Works / Why It Happens */}
				{verdict.whyItWorks.length > 0 && (
					<div className="mb-4">
						<h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
							Why This Works
						</h3>
						<ul className="space-y-2">
							{verdict.whyItWorks.map((reason, i) => (
								<li key={i} className="flex items-start gap-2 text-sm text-white/80">
									<CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
									{reason}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Common Mistakes (for weak/mixed channels) */}
				{verdict.commonMistakes && verdict.commonMistakes.length > 0 && (
					<div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
						<h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-2">
							<AlertTriangle className="w-4 h-4" />
							Common Mistakes
						</h3>
						<ul className="space-y-2">
							{verdict.commonMistakes.map((mistake, i) => (
								<li key={i} className="flex items-start gap-2 text-sm text-red-300">
									<XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
									{mistake}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			{/* PRIMARY CHART - Average Views by Content Type */}
			<ChartPanel
				title="Average Views by Content Type"
				description="Which content formats generate the most views"
				takeaway={`${barChartData[0]?.label || "Top content"} leads with ${formatNumber(barChartData[0]?.avgViews || 0)} average views per video.`}
				takeawayType={channelHealth === "strong" ? "positive" : channelHealth === "weak" ? "negative" : "neutral"}
			>
				<PillarBarChart data={barChartData} />
			</ChartPanel>

			{/* FORMAT MIX CONTEXT - Only show if imbalanced */}
			{isImbalanced && (
				<div className="grid lg:grid-cols-2 gap-6">
					<ChartPanel
						title="Format Mix"
						description="Ratio of Shorts to Long-form content"
						takeaway={formatBreakdown.recommendation}
						takeawayType={shortsOutperform ? "positive" : "neutral"}
					>
						<FormatPieChart data={pieData} />
					</ChartPanel>

					{/* Format Mismatch Alert */}
					{hasMismatch && (
						<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-amber-500/30 rounded-2xl p-5">
							<div className="flex items-center gap-2 mb-3">
								<AlertTriangle className="w-5 h-5 text-amber-400" />
								<h3 className="text-base font-semibold text-amber-400">
									Format Mismatch Detected
								</h3>
							</div>
							<p className="text-sm text-white/80 mb-4">
								{shortsDominate && !shortsOutperform
									? "This channel uploads mostly Shorts, but Long-form content actually performs better. There's an opportunity to shift strategy."
									: "This channel uploads mostly Long-form content, but Shorts are outperforming. Consider testing more short-form content."}
							</p>
							<div className="grid grid-cols-2 gap-3">
								<div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
									<p className="text-xs text-white/70 mb-1">Shorts Output</p>
									<p className="text-lg font-bold text-violet-400">
										{Math.round(formatBreakdown.shorts.percentage)}%
									</p>
								</div>
								<div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
									<p className="text-xs text-white/70 mb-1">Long-form Output</p>
									<p className="text-lg font-bold text-blue-400">
										{Math.round(formatBreakdown.longForm.percentage)}%
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* DETAILED INSIGHTS (Expandable) */}
			{insights.length > 0 && (
				<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5">
					<button
						onClick={() => setShowAllInsights(!showAllInsights)}
						className="w-full flex items-center justify-between text-left"
					>
						<h3 className="text-base font-semibold text-white">
							Detailed Insights ({insights.length})
						</h3>
						{showAllInsights ? (
							<ChevronUp className="w-5 h-5 text-white/70" />
						) : (
							<ChevronDown className="w-5 h-5 text-white/70" />
						)}
					</button>

					{showAllInsights && (
						<div className="mt-4 space-y-3">
							{insights.map((insight) => (
								<div
									key={insight.id}
									className={`p-4 rounded-lg border ${
										insight.severity === "strong"
											? "bg-emerald-500/10 border-emerald-500/30"
											: insight.severity === "weak"
											? "bg-amber-500/10 border-amber-500/30"
											: insight.severity === "concerning"
											? "bg-red-500/10 border-red-500/30"
											: "bg-white/5 border-white/10"
									}`}
								>
									<div className="flex items-start gap-3">
										<div className={`w-2 h-2 rounded-full mt-2 ${
											insight.severity === "strong"
												? "bg-emerald-400"
												: insight.severity === "weak"
												? "bg-amber-400"
												: insight.severity === "concerning"
												? "bg-red-400"
												: "bg-gray-400"
										}`} />
										<div className="flex-1">
											<p className="text-sm font-medium text-white mb-1">
												{insight.label.includes("Creator-Led") ? (
													<>
														<PillarTooltip pillar="Creator-Led" /> Content{" "}
														{insight.label.replace("Creator-Led Content", "").replace("Creator-Led", "")}
													</>
												) : (
													insight.label
												)}
											</p>
											<p className="text-xs text-white/70 mb-1">{insight.evidence}</p>
											<p className="text-xs text-white/80">{insight.impact}</p>
											{insight.action && (
												<p className="text-xs text-[var(--accent-primary)] mt-2 font-medium">
													Action: {insight.action}
												</p>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* SO WHAT SECTION */}
			<div className="bg-gradient-to-br from-[var(--accent-primary)]/10 to-violet-500/10 border border-[var(--accent-primary)]/30 rounded-2xl p-6">
				<h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
					<span className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
						<Info className="w-4 h-4 text-[var(--accent-primary)]" />
					</span>
					{soWhat.title}
				</h3>
				<p className="text-sm text-white/80 mb-4 leading-relaxed">
					{soWhat.body}
				</p>
				<div className="space-y-2">
					<p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
						Your Action Items:
					</p>
					<ul className="space-y-2">
						{soWhat.actionItems.map((item, i) => (
							<li key={i} className="flex items-start gap-2 text-sm text-gray-200">
								<span className="w-5 h-5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-bold flex items-center justify-center flex-shrink-0">
									{i + 1}
								</span>
								{item}
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* PILLAR LEGEND with tooltips */}
			<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5">
				<h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
					Content Type Reference
				</h3>
				<div className="flex flex-wrap gap-3">
					{barChartData.slice(0, 6).map((item) => (
						<div
							key={item.pillar}
							className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
						>
							<span
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: item.color }}
							/>
							{item.pillar === "Creator-Led" ? (
								<PillarTooltip pillar="Creator-Led" />
							) : (
								<span className="text-sm text-white/80">{item.label}</span>
							)}
							<span className="text-xs text-white/60">({item.count})</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
	return num.toString();
}
