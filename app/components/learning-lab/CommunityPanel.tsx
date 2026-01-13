"use client";

import { TabContent } from "@/app/components/channel-dna/TabContent";
import { ChartPanel } from "@/app/components/channel-dna/ChartPanel";
import { InsightsPanel } from "@/app/components/channel-dna/InsightsPanel";
import { EngagementVelocityChart } from "./charts/EngagementVelocityChart";
import type { CommunityResponse } from "@/lib/learning-lab/types";

interface CommunityPanelProps {
	data: CommunityResponse;
}

export function CommunityPanel({ data }: CommunityPanelProps) {
	const {
		engagementVelocity,
		sentimentBreakdown,
		insights,
		severity,
	} = data;

	// Velocity takeaway
	const topVelocity = engagementVelocity[0];
	const velocityTakeaway = topVelocity
		? `"${topVelocity.title.slice(0, 35)}..." is gaining ${topVelocity.viewsPerHour.toLocaleString()} views/hour.`
		: "Not enough recent data to calculate velocity.";

	const velocityTakeawayType = topVelocity?.velocityRank === 1 ? "positive" : "neutral";

	return (
		<div className="space-y-6">
			{/* Velocity Chart */}
			<TabContent
				tabKey="community-velocity"
				insights={
					<InsightsPanel
						title="Community Analysis"
						insights={insights.map((i) => ({
							id: i.id,
							label: i.label,
							severity: i.severity,
							evidence: i.evidence,
							impact: i.impact,
							action: i.action,
						}))}
						categorySeverity={severity}
					/>
				}
				chart={
					<ChartPanel
						title="Engagement Velocity"
						description="Views per hour since publish"
						takeaway={velocityTakeaway}
						takeawayType={velocityTakeawayType}
					>
						<EngagementVelocityChart data={engagementVelocity} />
					</ChartPanel>
				}
			/>

			{/* Sentiment Breakdown */}
			<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5">
				<h3 className="text-base font-semibold text-white mb-4">
					Comment Sentiment
				</h3>
				<div className="space-y-4">
					{/* Positive */}
					<div>
						<div className="flex justify-between text-sm mb-1">
							<span className="text-emerald-400">Positive</span>
							<span className="text-white">{sentimentBreakdown.positive}%</span>
						</div>
						<div className="h-2 bg-white/10 rounded-full overflow-hidden">
							<div
								className="h-full bg-emerald-500 rounded-full transition-all duration-500"
								style={{ width: `${sentimentBreakdown.positive}%` }}
							/>
						</div>
					</div>

					{/* Neutral */}
					<div>
						<div className="flex justify-between text-sm mb-1">
							<span className="text-white/70">Neutral</span>
							<span className="text-white">{sentimentBreakdown.neutral}%</span>
						</div>
						<div className="h-2 bg-white/10 rounded-full overflow-hidden">
							<div
								className="h-full bg-gray-500 rounded-full transition-all duration-500"
								style={{ width: `${sentimentBreakdown.neutral}%` }}
							/>
						</div>
					</div>

					{/* Negative */}
					<div>
						<div className="flex justify-between text-sm mb-1">
							<span className="text-red-400">Negative</span>
							<span className="text-white">{sentimentBreakdown.negative}%</span>
						</div>
						<div className="h-2 bg-white/10 rounded-full overflow-hidden">
							<div
								className="h-full bg-red-500 rounded-full transition-all duration-500"
								style={{ width: `${sentimentBreakdown.negative}%` }}
							/>
						</div>
					</div>
				</div>

				<div className="mt-6 pt-4 border-t border-[var(--frosted-border)]">
					<p className="text-xs text-[var(--text-muted)]">
						{sentimentBreakdown.positive >= 50
							? "Healthy community sentiment. Audience is engaged and supportive."
							: sentimentBreakdown.negative >= 25
							? "Review negative comments for actionable feedback."
							: "Mixed sentiment. Consider addressing common concerns."}
					</p>
				</div>
			</div>

			{/* Comment Categories */}
			<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5">
				<h3 className="text-base font-semibold text-white mb-4">
					Comment Categories
				</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					{(() => {
						const categories = data.comments.reduce(
							(acc, c) => {
								acc[c.category] = (acc[c.category] || 0) + 1;
								return acc;
							},
							{} as Record<string, number>
						);

						const categoryConfig = {
							Question: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
							Complaint: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
							"Feature Request": { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" },
							Praise: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
							Suggestion: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
							Other: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-white/70" },
						};

						return Object.entries(categories)
							.sort((a, b) => b[1] - a[1])
							.map(([category, count]) => {
								const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.Other;
								return (
									<div
										key={category}
										className={`p-3 rounded-lg ${config.bg} border ${config.border} text-center`}
									>
										<p className={`text-lg font-bold ${config.text}`}>{count}</p>
										<p className="text-xs text-white/70">{category}</p>
									</div>
								);
							});
					})()}
				</div>
			</div>
		</div>
	);
}
