"use client";

import { useState } from "react";
import { ChevronDown, AlertTriangle, AlertCircle, CheckCircle, Minus } from "lucide-react";

type Severity = "strong" | "neutral" | "weak" | "concerning";

interface Insight {
	id: string;
	label: string;
	severity: Severity;
	evidence: string;
	impact: string;
	action?: string;
	pattern?: string; // Legacy support
	examples?: string[];
}

interface InsightsPanelProps {
	title?: string;
	insights: Insight[];
	categorySeverity?: Severity;
}

const severityConfig: Record<Severity, {
	icon: typeof CheckCircle;
	borderColor: string;
	bgColor: string;
	labelColor: string;
	badgeColor: string;
	badgeBg: string;
}> = {
	strong: {
		icon: CheckCircle,
		borderColor: "border-emerald-500/30",
		bgColor: "bg-emerald-500/5",
		labelColor: "text-emerald-400",
		badgeColor: "text-emerald-300",
		badgeBg: "bg-emerald-500/20",
	},
	neutral: {
		icon: Minus,
		borderColor: "border-[var(--frosted-border)]",
		bgColor: "bg-[var(--frosted-bg)]",
		labelColor: "text-[var(--text-secondary)]",
		badgeColor: "text-[var(--text-muted)]",
		badgeBg: "bg-white/5",
	},
	weak: {
		icon: AlertCircle,
		borderColor: "border-amber-500/30",
		bgColor: "bg-amber-500/5",
		labelColor: "text-amber-400",
		badgeColor: "text-amber-300",
		badgeBg: "bg-amber-500/20",
	},
	concerning: {
		icon: AlertTriangle,
		borderColor: "border-red-500/30",
		bgColor: "bg-red-500/5",
		labelColor: "text-red-400",
		badgeColor: "text-red-300",
		badgeBg: "bg-red-500/20",
	},
};

function SeverityBadge({ severity }: { severity: Severity }) {
	const config = severityConfig[severity];
	const labels: Record<Severity, string> = {
		strong: "Strong",
		neutral: "Neutral",
		weak: "Needs Work",
		concerning: "Concerning",
	};

	return (
		<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeBg} ${config.badgeColor} transition-all duration-300`}>
			{labels[severity]}
		</span>
	);
}

export function InsightsPanel({
	title = "Analysis",
	insights,
	categorySeverity,
}: InsightsPanelProps) {
	const [expanded, setExpanded] = useState<string | null>(null);

	const toggle = (id: string) => {
		setExpanded(expanded === id ? null : id);
	};

	// Determine if we have new-style insights (with severity) or legacy
	const hasNewFormat = insights.some(i => i.severity !== undefined);

	return (
		<div className="space-y-3 animate-slide-up">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
					{title}
				</h3>
				{categorySeverity && <SeverityBadge severity={categorySeverity} />}
			</div>

			<div className="space-y-2">
				{insights.slice(0, 3).map((insight, index) => {
					const isExpanded = expanded === insight.id;
					const hasDetails = insight.action || (insight.examples && insight.examples.length > 0);
					const severity = insight.severity || "neutral";
					const config = severityConfig[severity];
					const Icon = config.icon;

					return (
						<div
							key={insight.id}
							className={`
								backdrop-blur-[var(--frosted-blur)] border rounded-xl overflow-hidden
								${config.borderColor} ${config.bgColor}
								insight-card animate-stagger-item
								transition-all duration-300
							`}
							style={{ animationDelay: `${index * 0.1}s` }}
						>
							<button
								onClick={() => hasDetails && toggle(insight.id)}
								disabled={!hasDetails}
								className={`
									w-full text-left p-4
									${hasDetails ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default"}
									transition-all duration-300
								`}
							>
								<div className="flex items-start gap-3">
									<Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.labelColor} transition-transform duration-300 ${isExpanded ? 'scale-110' : ''}`} />
									<div className="flex-1 min-w-0">
										{hasNewFormat ? (
											<>
												<div className="flex items-center gap-2 mb-1">
													<span className={`text-sm font-medium ${config.labelColor}`}>
														{insight.label}
													</span>
												</div>
												<p className="text-sm text-[var(--text-primary)] leading-relaxed">
													{insight.evidence}
												</p>
												<p className="text-xs text-[var(--text-muted)] mt-1">
													{insight.impact}
												</p>
											</>
										) : (
											<p className="text-sm text-[var(--text-primary)] leading-relaxed">
												{insight.pattern}
											</p>
										)}
									</div>
									{hasDetails && (
										<ChevronDown
											className={`
												w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5
												transition-transform duration-300 ease-out
												${isExpanded ? "rotate-180" : ""}
											`}
										/>
									)}
								</div>
							</button>

							<div
								className={`
									overflow-hidden transition-all duration-300 ease-out
									${isExpanded && hasDetails ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
								`}
							>
								<div className="px-4 pb-4 pt-0 pl-11">
									<div className="border-t border-[var(--frosted-border)] pt-3 space-y-2">
										{insight.action && (
											<div className="space-y-1 animate-fade-in">
												<span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
													Recommended Action
												</span>
												<p className="text-sm text-[var(--accent-primary)] pl-3 border-l-2 border-[var(--accent-primary)]/50">
													{insight.action}
												</p>
											</div>
										)}
										{insight.examples && insight.examples.length > 0 && (
											<div className="space-y-1 mt-2 animate-fade-in">
												<span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
													Examples
												</span>
												{insight.examples.map((example, i) => (
													<p
														key={i}
														className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--frosted-border)]"
														style={{ animationDelay: `${i * 0.05}s` }}
													>
														{example}
													</p>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
