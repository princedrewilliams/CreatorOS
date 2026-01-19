"use client";

import {
	Type,
	Search,
	Clock,
	Image,
	Calendar,
	Hash,
} from "lucide-react";
import type { ContentConstraints } from "@/lib/replicate/types";

interface ConstraintDisplayProps {
	constraints: ContentConstraints;
	compact?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ConstraintDisplay({ constraints, compact = false }: ConstraintDisplayProps) {
	const formatDuration = (seconds: number): string => {
		const mins = Math.round(seconds / 60);
		if (mins < 60) return `${mins}m`;
		const hours = Math.floor(mins / 60);
		const remainingMins = mins % 60;
		return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
	};

	if (compact) {
		return (
			<div className="grid grid-cols-2 gap-2 text-xs">
				<div className="p-2 rounded-lg bg-white/5">
					<span className="text-[var(--text-muted)]">Title: </span>
					<span className="text-white">
						{constraints.title.minLength}-{constraints.title.maxLength} chars
					</span>
				</div>
				<div className="p-2 rounded-lg bg-white/5">
					<span className="text-[var(--text-muted)]">Duration: </span>
					<span className="text-white">
						{formatDuration(constraints.video.recommendedDurationMin)}-
						{formatDuration(constraints.video.recommendedDurationMax)}
					</span>
				</div>
				<div className="p-2 rounded-lg bg-white/5">
					<span className="text-[var(--text-muted)]">Format: </span>
					<span className="text-white">{constraints.video.suggestedFormat}</span>
				</div>
				<div className="p-2 rounded-lg bg-white/5">
					<span className="text-[var(--text-muted)]">Description: </span>
					<span className="text-white">
						{constraints.seo.minDescriptionLength}+ chars
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Title Constraints */}
			<div className="p-4 rounded-xl bg-white/5 border border-[var(--frosted-border)]">
				<div className="flex items-center gap-2 mb-3">
					<Type className="w-4 h-4 text-violet-400" />
					<h4 className="text-sm font-medium text-white">Title</h4>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs">
						<span className="text-[var(--text-muted)]">Character limit</span>
						<span className="text-white font-medium">
							{constraints.title.minLength}-{constraints.title.maxLength} chars
						</span>
					</div>
					{constraints.title.requiredHooks.length > 0 && (
						<div>
							<span className="text-xs text-[var(--text-muted)] block mb-1.5">
								Recommended hooks
							</span>
							<div className="flex flex-wrap gap-1.5">
								{constraints.title.requiredHooks.map((hook) => (
									<span
										key={hook}
										className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs"
									>
										{hook}
									</span>
								))}
							</div>
						</div>
					)}
					{constraints.title.suggestedPowerWords.length > 0 && (
						<div>
							<span className="text-xs text-[var(--text-muted)] block mb-1.5">
								Power words
							</span>
							<div className="flex flex-wrap gap-1.5">
								{constraints.title.suggestedPowerWords.slice(0, 6).map((word) => (
									<span
										key={word}
										className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs"
									>
										{word}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* SEO Constraints */}
			<div className="p-4 rounded-xl bg-white/5 border border-[var(--frosted-border)]">
				<div className="flex items-center gap-2 mb-3">
					<Search className="w-4 h-4 text-blue-400" />
					<h4 className="text-sm font-medium text-white">SEO</h4>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs">
						<span className="text-[var(--text-muted)]">Min description</span>
						<span className="text-white font-medium">
							{constraints.seo.minDescriptionLength} chars
						</span>
					</div>
					{constraints.seo.primaryKeywords.length > 0 && (
						<div>
							<span className="text-xs text-[var(--text-muted)] block mb-1.5">
								Primary keywords
							</span>
							<div className="flex flex-wrap gap-1.5">
								{constraints.seo.primaryKeywords.slice(0, 6).map((keyword) => (
									<span
										key={keyword}
										className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center gap-1"
									>
										<Hash className="w-3 h-3" />
										{keyword}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Video Constraints */}
			<div className="p-4 rounded-xl bg-white/5 border border-[var(--frosted-border)]">
				<div className="flex items-center gap-2 mb-3">
					<Clock className="w-4 h-4 text-green-400" />
					<h4 className="text-sm font-medium text-white">Video</h4>
				</div>
				<div className="grid grid-cols-2 gap-3 text-xs">
					<div>
						<span className="text-[var(--text-muted)] block mb-1">Duration</span>
						<span className="text-white font-medium">
							{formatDuration(constraints.video.recommendedDurationMin)} -{" "}
							{formatDuration(constraints.video.recommendedDurationMax)}
						</span>
					</div>
					<div>
						<span className="text-[var(--text-muted)] block mb-1">Format</span>
						<span className="text-white font-medium">
							{constraints.video.suggestedFormat}
						</span>
					</div>
				</div>
			</div>

			{/* Thumbnail Constraints */}
			<div className="p-4 rounded-xl bg-white/5 border border-[var(--frosted-border)]">
				<div className="flex items-center gap-2 mb-3">
					<Image className="w-4 h-4 text-pink-400" />
					<h4 className="text-sm font-medium text-white">Thumbnail</h4>
				</div>
				<div className="space-y-2 text-xs">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-[var(--text-muted)]">Face:</span>
							<span className="text-white">
								{constraints.thumbnail.recommendFace
									? `Yes (${constraints.thumbnail.faceType})`
									: "Optional"}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-[var(--text-muted)]">Text:</span>
							<span className="text-white">
								{constraints.thumbnail.recommendTextOverlay ? "Recommended" : "Optional"}
							</span>
						</div>
					</div>
					{constraints.thumbnail.suggestedColors.length > 0 && (
						<div>
							<span className="text-[var(--text-muted)] block mb-1.5">
								Suggested colors
							</span>
							<div className="flex gap-1.5">
								{constraints.thumbnail.suggestedColors.map((color, i) => (
									<div
										key={i}
										className="w-6 h-6 rounded border border-white/20"
										style={{ backgroundColor: color }}
										title={color}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Schedule Constraints */}
			<div className="p-4 rounded-xl bg-white/5 border border-[var(--frosted-border)]">
				<div className="flex items-center gap-2 mb-3">
					<Calendar className="w-4 h-4 text-amber-400" />
					<h4 className="text-sm font-medium text-white">Schedule</h4>
				</div>
				<div className="space-y-2 text-xs">
					<div>
						<span className="text-[var(--text-muted)] block mb-1.5">Best days</span>
						<div className="flex gap-1.5">
							{DAYS.map((day, i) => (
								<span
									key={day}
									className={`px-2 py-1 rounded ${
										constraints.schedule.recommendedDays.includes(i)
											? "bg-amber-500/20 text-amber-300"
											: "bg-white/5 text-[var(--text-muted)]"
									}`}
								>
									{day}
								</span>
							))}
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div>
							<span className="text-[var(--text-muted)]">Best hours: </span>
							<span className="text-white">
								{constraints.schedule.recommendedHours
									.map((h) => `${h}:00`)
									.join(", ")}
							</span>
						</div>
						<div>
							<span className="text-[var(--text-muted)]">Min gap: </span>
							<span className="text-white">
								{constraints.schedule.minDaysBetweenUploads} days
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
