"use client";

type Severity = "strong" | "neutral" | "weak" | "concerning";

interface Insight {
	id: string;
	label: string;
	severity: Severity;
	evidence: string;
	impact: string;
	action?: string;
	pattern?: string;
	examples?: string[];
}

interface InsightsPanelProps {
	title?: string;
	insights: Insight[];
	categorySeverity?: Severity;
}

const severityToScore: Record<Severity, number> = {
	strong: 85,
	neutral: 60,
	weak: 40,
	concerning: 25,
};

const severityConfig: Record<Severity, {
	barColor: string;
	textColor: string;
}> = {
	strong: {
		barColor: "bg-gradient-to-r from-emerald-500 to-emerald-400",
		textColor: "text-emerald-400",
	},
	neutral: {
		barColor: "bg-gradient-to-r from-blue-500 to-blue-400",
		textColor: "text-blue-400",
	},
	weak: {
		barColor: "bg-gradient-to-r from-amber-500 to-amber-400",
		textColor: "text-amber-400",
	},
	concerning: {
		barColor: "bg-gradient-to-r from-red-500 to-red-400",
		textColor: "text-red-400",
	},
};

export function InsightsPanel({
	title = "Breakdown",
	insights,
	categorySeverity,
}: InsightsPanelProps) {
	// Calculate overall score from category severity
	const overallScore = categorySeverity ? severityToScore[categorySeverity] : 60;

	return (
		<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5 h-full">
			{/* Header with score */}
			<div className="flex items-center justify-between mb-5">
				<h3 className="text-base font-semibold text-white flex items-center gap-2">
					<span className="text-[var(--accent-primary)]">●</span>
					{title}
				</h3>
				{categorySeverity && (
					<span className={`text-sm font-medium ${severityConfig[categorySeverity].textColor}`}>
						{overallScore}%
					</span>
				)}
			</div>

			{/* Breakdown list with progress bars */}
			<div className="space-y-4">
				{insights.slice(0, 4).map((insight, index) => {
					const severity = insight.severity || "neutral";
					const config = severityConfig[severity];
					const score = severityToScore[severity];

					return (
						<div
							key={insight.id}
							className="group"
							style={{ animationDelay: `${index * 0.1}s` }}
						>
							{/* Label and score row */}
							<div className="flex items-center justify-between mb-1.5">
								<span className="text-sm text-[var(--text-primary)] font-medium">
									{insight.label}
								</span>
								<span className={`text-sm font-semibold ${config.textColor}`}>
									{score}%
								</span>
							</div>

							{/* Progress bar */}
							<div className="h-2 bg-white/5 rounded-full overflow-hidden">
								<div
									className={`h-full ${config.barColor} rounded-full transition-all duration-700 ease-out`}
									style={{ width: `${score}%` }}
								/>
							</div>

							{/* Evidence text (subtle) */}
							<p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
								{insight.evidence}
							</p>
						</div>
					);
				})}
			</div>

			{/* Impact summary at bottom */}
			{insights[0]?.impact && (
				<div className="mt-5 pt-4 border-t border-[var(--frosted-border)]">
					<p className="text-xs text-[var(--text-muted)] leading-relaxed">
						<span className="text-[var(--text-secondary)] font-medium">Impact: </span>
						{insights[0].impact}
					</p>
				</div>
			)}
		</div>
	);
}
