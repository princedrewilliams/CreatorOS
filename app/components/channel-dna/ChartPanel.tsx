"use client";

import { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type TakeawayType = "positive" | "negative" | "neutral";

interface ChartPanelProps {
	title: string;
	description?: string;
	takeaway?: string;
	takeawayType?: TakeawayType;
	children: ReactNode;
}

export function ChartPanel({ title, description, takeaway, takeawayType = "neutral", children }: ChartPanelProps) {
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
		<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5 card-hover-lift animate-scale-in">
			<div className="mb-4">
				<h3 className="text-base font-semibold text-white">{title}</h3>
				{description && (
					<p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
				)}
			</div>
			<div className="h-56 chart-enter">{children}</div>
			{takeaway && (
				<div
					className={`mt-4 px-3 py-2 rounded-lg ${styles.bg} border ${styles.border} transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(236,72,153,0.08)]`}
				>
					<div className="flex items-center gap-2">
						<Icon className={`w-4 h-4 ${styles.text} transition-transform duration-300`} />
						<p className={`text-sm ${styles.text}`}>{takeaway}</p>
					</div>
				</div>
			)}
		</div>
	);
}
