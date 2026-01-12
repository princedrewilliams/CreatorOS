"use client";

import type { ContentGap } from "@/lib/learning-lab/types";

interface ContentGapsChartProps {
	gaps: ContentGap[];
}

const PRIORITY_COLORS = {
	high: {
		bg: "bg-red-500/10",
		border: "border-red-500/30",
		text: "text-red-400",
		badge: "bg-red-500/20",
	},
	medium: {
		bg: "bg-amber-500/10",
		border: "border-amber-500/30",
		text: "text-amber-400",
		badge: "bg-amber-500/20",
	},
	low: {
		bg: "bg-blue-500/10",
		border: "border-blue-500/30",
		text: "text-blue-400",
		badge: "bg-blue-500/20",
	},
};

const CATEGORY_ICONS = {
	Question: "?",
	Complaint: "!",
	"Feature Request": "+",
	Praise: "♡",
	Suggestion: "→",
	Other: "•",
};

export function ContentGapsChart({ gaps }: ContentGapsChartProps) {
	if (!gaps.length) {
		return (
			<div className="flex items-center justify-center h-full text-sm text-white/60">
				No content gaps detected from comments
			</div>
		);
	}

	return (
		<div className="space-y-3 overflow-y-auto max-h-full p-1">
			{gaps.slice(0, 5).map((gap, index) => {
				const colors = PRIORITY_COLORS[gap.priority];
				const icon = CATEGORY_ICONS[gap.category] || "•";

				return (
					<div
						key={index}
						className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
					>
						<div className="flex items-start justify-between gap-2">
							<div className="flex items-center gap-2">
								<span
									className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${colors.badge} ${colors.text}`}
								>
									{icon}
								</span>
								<div>
									<h4 className="font-medium text-white capitalize">
										{gap.theme}
									</h4>
									<p className="text-xs text-white/70">
										{gap.category} • {gap.frequency} mentions
									</p>
								</div>
							</div>
							<span
								className={`text-xs px-2 py-0.5 rounded-full ${colors.badge} ${colors.text}`}
							>
								{gap.priority}
							</span>
						</div>

						{gap.exampleComments.length > 0 && (
							<div className="mt-2 pl-8">
								<p className="text-xs text-white/60 italic line-clamp-2">
									"{gap.exampleComments[0]}"
								</p>
							</div>
						)}
					</div>
				);
			})}

			{gaps.length > 5 && (
				<p className="text-xs text-center text-white/60">
					+{gaps.length - 5} more content gaps
				</p>
			)}
		</div>
	);
}
