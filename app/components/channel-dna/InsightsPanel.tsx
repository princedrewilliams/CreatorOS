"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Insight {
	id: string;
	pattern: string;
	examples?: string[];
}

interface InsightsPanelProps {
	title?: string;
	insights: Insight[];
}

export function InsightsPanel({
	title = "What This Channel Repeats",
	insights,
}: InsightsPanelProps) {
	const [expanded, setExpanded] = useState<string | null>(null);

	const toggle = (id: string) => {
		setExpanded(expanded === id ? null : id);
	};

	return (
		<div className="space-y-3">
			<h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
				{title}
			</h3>

			<div className="space-y-2">
				{insights.slice(0, 3).map((insight) => {
					const isExpanded = expanded === insight.id;
					const hasExamples = insight.examples && insight.examples.length > 0;

					return (
						<div
							key={insight.id}
							className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-xl overflow-hidden"
						>
							<button
								onClick={() => hasExamples && toggle(insight.id)}
								disabled={!hasExamples}
								className={`
									w-full text-left p-4
									${hasExamples ? "cursor-pointer hover:bg-[var(--frosted-bg-hover)]" : "cursor-default"}
									transition-colors
								`}
							>
								<div className="flex items-start justify-between gap-3">
									<p className="text-sm text-[var(--text-primary)] leading-relaxed">
										{insight.pattern}
									</p>
									{hasExamples && (
										<ChevronDown
											className={`
												w-4 h-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5
												transition-transform duration-200
												${isExpanded ? "rotate-180" : ""}
											`}
										/>
									)}
								</div>
							</button>

							{isExpanded && hasExamples && (
								<div className="px-4 pb-4 pt-0">
									<div className="border-t border-[var(--frosted-border)] pt-3 space-y-2">
										<span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
											Examples
										</span>
										{insight.examples?.map((example, i) => (
											<p
												key={i}
												className="text-xs text-[var(--text-secondary)] pl-3 border-l-2 border-[var(--accent-primary)]/30"
											>
												{example}
											</p>
										))}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
