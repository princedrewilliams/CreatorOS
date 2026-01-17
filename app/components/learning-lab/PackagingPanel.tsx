"use client";

import { TabContent } from "@/app/components/channel-dna/TabContent";
import { ChartPanel } from "@/app/components/channel-dna/ChartPanel";
import { InsightsPanel } from "@/app/components/channel-dna/InsightsPanel";
import { HookAnalysisChart } from "./charts/HookAnalysisChart";
import { User, Type, Palette, Eye, CheckCircle } from "lucide-react";
import type { PackagingResponse, HookType, ThumbnailAnalysis } from "@/lib/learning-lab/types";

interface PackagingPanelProps {
	data: PackagingResponse;
}

// Individual thumbnail card
function ThumbnailCard({ thumbnail }: { thumbnail: ThumbnailAnalysis }) {
	const { analysis, thumbnailUrl, status } = thumbnail;

	if (status !== "analyzed" || !thumbnailUrl) {
		return null;
	}

	return (
		<div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[var(--accent-primary)]/30 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] transition-all duration-300">
			<div className="aspect-video relative">
				<img
					src={thumbnailUrl}
					alt="Video thumbnail"
					className="w-full h-full object-cover"
				/>
				{/* Overlay badges */}
				<div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
					{analysis.hasFace && (
						<span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/70 border border-emerald-400/50 text-white">
							{analysis.faceType || "Face"}
						</span>
					)}
					{analysis.hasTextOverlay && (
						<span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/70 border border-blue-400/50 text-white">
							Text
						</span>
					)}
				</div>
			</div>
			<div className="p-3 space-y-2">
				{/* Composition score */}
				{analysis.compositionScore !== undefined && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-white/90">Composition</span>
						<div className="flex items-center gap-2">
							<div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
								<div
									className={`h-full rounded-full ${
										analysis.compositionScore >= 70
											? "bg-emerald-500"
											: analysis.compositionScore >= 50
											? "bg-amber-500"
											: "bg-red-500"
									}`}
									style={{ width: `${analysis.compositionScore}%` }}
								/>
							</div>
							<span className="text-xs font-medium text-white">
								{analysis.compositionScore}
							</span>
						</div>
					</div>
				)}
				{/* Color palette */}
				{analysis.dominantColors && analysis.dominantColors.length > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-xs text-white/90">Colors:</span>
						<div className="flex gap-1">
							{analysis.dominantColors.slice(0, 4).map((color, i) => (
								<span
									key={i}
									className="w-4 h-4 rounded-full border border-white/20"
									style={{ backgroundColor: color }}
									title={color}
								/>
							))}
						</div>
					</div>
				)}
				{/* Emotion */}
				{analysis.faceEmotion && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-white/90">Expression</span>
						<span className="text-xs text-white capitalize">{analysis.faceEmotion}</span>
					</div>
				)}
			</div>
		</div>
	);
}

export function PackagingPanel({ data }: PackagingPanelProps) {
	const { titlePsychology, thumbnails, thumbnailPatterns, seoExtraction, insights, severity } = data;

	// Prepare hook chart data
	const hookChartData = Object.entries(titlePsychology.hookDistribution)
		.filter(([hook]) => hook !== "None Detected")
		.map(([hook, count]) => ({
			hook: hook as HookType,
			count: count || 0,
		}))
		.sort((a, b) => b.count - a.count);

	// Takeaway for hook chart
	const topHook = hookChartData[0];
	const hookTakeaway = topHook
		? `"${topHook.hook}" is your most used hook type (${topHook.count} videos).`
		: "Limited hook usage detected in top videos.";

	const hookTakeawayType =
		titlePsychology.avgHookScore >= 60
			? "positive"
			: titlePsychology.avgHookScore >= 40
			? "neutral"
			: "negative";

	// Filter analyzed thumbnails and remove duplicates by videoId
	const analyzedThumbnails = thumbnails
		.filter(t => t.status === "analyzed")
		.filter((t, index, self) => self.findIndex(x => x.videoId === t.videoId) === index);
	const hasThumbnailData = analyzedThumbnails.length > 0 || thumbnailPatterns.avgCompositionScore > 0;

	return (
		<div className="space-y-6">
			{/* Hook Analysis */}
			<TabContent
				tabKey="packaging-hooks"
				insights={
					<InsightsPanel
						title="Packaging Analysis"
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
						title="Title Hook Distribution"
						description="Psychological hooks used in top-performing titles"
						takeaway={hookTakeaway}
						takeawayType={hookTakeawayType}
					>
						<HookAnalysisChart data={hookChartData} />
					</ChartPanel>
				}
			/>

			{/* Thumbnail Analysis Section */}
			<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-base font-semibold text-white">
						Thumbnail Analysis
					</h3>
					{hasThumbnailData ? (
						<span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
							AI Analyzed
						</span>
					) : (
						<span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
							Processing
						</span>
					)}
				</div>

				{hasThumbnailData ? (
					<>
						{/* Thumbnail Pattern Summary */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
							<div className="p-3 rounded-lg bg-white/5 border border-white/10">
								<div className="flex items-center gap-2 mb-1">
									<User className="w-4 h-4 text-violet-400" />
									<span className="text-xs text-white/85">Face Usage</span>
								</div>
								<p className="text-lg font-bold text-white">
									{Math.round(thumbnailPatterns.faceUsagePercent)}%
								</p>
								<p className="text-xs text-white/60 mt-1">
									{thumbnailPatterns.dominantFaceType !== "unknown" &&
										`Mostly ${thumbnailPatterns.dominantFaceType}`}
								</p>
							</div>

							<div className="p-3 rounded-lg bg-white/5 border border-white/10">
								<div className="flex items-center gap-2 mb-1">
									<Type className="w-4 h-4 text-blue-400" />
									<span className="text-xs text-white/85">Text Overlay</span>
								</div>
								<p className="text-lg font-bold text-white">
									{Math.round(thumbnailPatterns.textOverlayPercent)}%
								</p>
							</div>

							<div className="p-3 rounded-lg bg-white/5 border border-white/10">
								<div className="flex items-center gap-2 mb-1">
									<Eye className="w-4 h-4 text-emerald-400" />
									<span className="text-xs text-white/85">Composition</span>
								</div>
								<p className="text-lg font-bold text-white">
									{Math.round(thumbnailPatterns.avgCompositionScore)}/100
								</p>
							</div>

							<div className="p-3 rounded-lg bg-white/5 border border-white/10">
								<div className="flex items-center gap-2 mb-1">
									<Palette className="w-4 h-4 text-pink-400" />
									<span className="text-xs text-white/85">Colors</span>
								</div>
								<div className="flex gap-1 mt-1">
									{thumbnailPatterns.commonColors.slice(0, 4).map((color, i) => (
										<span
											key={i}
											className="w-5 h-5 rounded-full border border-white/20"
											style={{ backgroundColor: color }}
											title={color}
										/>
									))}
								</div>
							</div>
						</div>

						{/* Thumbnail Pattern Insights */}
						{thumbnailPatterns.insights.length > 0 && (
							<div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
								<h4 className="text-sm font-medium text-white mb-3">
									Thumbnail Patterns
								</h4>
								<ul className="space-y-2">
									{thumbnailPatterns.insights.map((insight, i) => (
										<li key={i} className="flex items-start gap-2 text-sm text-white/80">
											<CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
											{insight}
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Individual Thumbnail Grid */}
						{analyzedThumbnails.length > 0 && (
							<>
								<h4 className="text-sm font-medium text-white mb-3">
									Analyzed Thumbnails ({analyzedThumbnails.length})
								</h4>
								<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
									{analyzedThumbnails.slice(0, 8).map((thumbnail) => (
										<ThumbnailCard key={thumbnail.videoId} thumbnail={thumbnail} />
									))}
								</div>
							</>
						)}
					</>
				) : (
					<div className="text-center py-8">
						<p className="text-sm text-white/80">
							Thumbnail analysis is processing. Results will appear shortly.
						</p>
					</div>
				)}
			</div>

			{/* SEO Keywords */}
			<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5">
				<h3 className="text-base font-semibold text-white mb-4">
					Top SEO Keywords
				</h3>
				<p className="text-xs text-[var(--text-muted)] mb-3">
					Most frequent keywords from tags and descriptions
				</p>
				<div className="flex flex-wrap gap-2">
					{seoExtraction.topKeywords.slice(0, 10).map((kw, index) => (
						<span
							key={kw.keyword}
							className={`
								px-3 py-1.5 rounded-full text-sm hover:scale-105 transition-transform duration-200
								${index < 3
									? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
									: "bg-white/5 text-[var(--text-secondary)] border border-[var(--frosted-border)]"
								}
							`}
						>
							{kw.keyword}
							<span className="ml-1 text-xs opacity-60">({kw.frequency})</span>
						</span>
					))}
					{seoExtraction.topKeywords.length === 0 && (
						<p className="text-sm text-white/60">No keywords detected</p>
					)}
				</div>
			</div>

			{/* Top Performing Titles */}
			<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5">
				<h3 className="text-base font-semibold text-white mb-4">
					Top Performing Titles
				</h3>
				<div className="space-y-3">
					{titlePsychology.topPerformers.slice(0, 5).map((video, index) => (
						<div
							key={video.videoId}
							className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-[var(--frosted-border)] hover:border-[var(--accent-primary)]/30 hover:bg-white/[0.07] transition-all duration-300"
						>
							<span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-bold flex items-center justify-center">
								{index + 1}
							</span>
							<div className="flex-1 min-w-0">
								<p className="text-sm text-white truncate">{video.title}</p>
								<div className="flex flex-wrap gap-2 mt-1">
									{video.hooks.slice(0, 3).map((hook) => (
										<span
											key={hook}
											className="text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-400"
										>
											{hook}
										</span>
									))}
									{video.lengthOptimal && (
										<span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
											Optimal Length
										</span>
									)}
								</div>
							</div>
							<div className="text-right flex-shrink-0">
								<p className="text-sm font-medium text-white">
									{video.views >= 1_000_000
										? `${(video.views / 1_000_000).toFixed(1)}M`
										: video.views >= 1_000
										? `${(video.views / 1_000).toFixed(0)}K`
										: video.views}
								</p>
								<p className="text-xs text-white">views</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
