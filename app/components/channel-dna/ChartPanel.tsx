"use client";

import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react";

type TakeawayType = "positive" | "negative" | "neutral";

interface ChartPanelProps {
	title: string;
	description?: string;
	score?: number;
	takeaway?: string;
	takeawayType?: TakeawayType;
	children: ReactNode;
}

export function ChartPanel({ title, description, score, takeaway, takeawayType = "neutral", children }: ChartPanelProps) {
	const getTakeawayStyles = () => {
		switch (takeawayType) {
			case "positive":
				return {
					bg: "bg-emerald-500/10",
					border: "border-emerald-500/30",
					text: "text-emerald-400",
					icon: TrendingUp,
				};
			case "negative":
				return {
					bg: "bg-amber-500/10",
					border: "border-amber-500/30",
					text: "text-amber-400",
					icon: TrendingDown,
				};
			default:
				return {
					bg: "bg-white/5",
					border: "border-white/10",
					text: "text-[var(--text-secondary)]",
					icon: Minus,
				};
		}
	};

	const styles = getTakeawayStyles();
	const Icon = styles.icon;

	return (
		<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5 h-full chart-card-hover">
			{/* Header with title and optional score */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<span className="text-[var(--accent-primary)]">●</span>
					<h3 className="text-base font-semibold text-white">
						{title}
						{score !== undefined && (
							<span className="text-[var(--text-muted)] font-normal ml-2">
								({score}% Score)
							</span>
						)}
					</h3>
				</div>
				{description && (
					<button className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
						<span>Full Video</span>
						<ChevronDown className="w-3 h-3" />
					</button>
				)}
			</div>

			{/* Chart area */}
			<div className="h-72 chart-enter">{children}</div>

			{/* Takeaway strip at bottom */}
			{takeaway && (
				<div
					className={`mt-4 px-3 py-2 rounded-lg ${styles.bg} border ${styles.border}`}
				>
					<div className="flex items-center gap-2">
						<Icon className={`w-4 h-4 ${styles.text} flex-shrink-0`} />
						<p className={`text-sm ${styles.text}`}>{takeaway}</p>
					</div>
				</div>
			)}
		</div>
	);
}
