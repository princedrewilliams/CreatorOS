"use client";

import { useState } from "react";
import {
	Layout,
	Image,
	Type,
	ChevronRight,
	ExternalLink,
	Copy,
	Check,
} from "lucide-react";
import type {
	ThumbnailFormatProfile,
	CanvaTemplateMatch,
} from "@/lib/replicate/types";

interface ThumbnailStepProps {
	formatProfile: ThumbnailFormatProfile;
	matchedTemplate: CanvaTemplateMatch;
	suggestedColors: string[];
	isPro: boolean;
	onOpenCanva: () => void;
	onSkip: () => void;
	onContinue: () => void;
}

export function ThumbnailStep({
	formatProfile,
	matchedTemplate,
	suggestedColors,
	onOpenCanva,
	onSkip,
	onContinue,
}: ThumbnailStepProps) {
	const [copiedColor, setCopiedColor] = useState<string | null>(null);

	const handleCopyColor = async (color: string) => {
		try {
			await navigator.clipboard.writeText(color);
			setCopiedColor(color);
			setTimeout(() => setCopiedColor(null), 1500);
		} catch (err) {
			console.error("Failed to copy color:", err);
		}
	};

	const getLayoutIcon = (type: ThumbnailFormatProfile["dominantLayoutType"]) => {
		switch (type) {
			case "face-led":
				return "👤";
			case "object-led":
				return "📦";
			case "text-led":
				return "📝";
			default:
				return "🎨";
		}
	};

	const getPositionLabel = (pos: ThumbnailFormatProfile["subjectPosition"]) => {
		switch (pos) {
			case "left":
				return "Left Third";
			case "center":
				return "Center";
			case "right":
				return "Right Third";
			default:
				return pos;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h3 className="text-sm font-medium text-white mb-1">
					Thumbnail Format Profile
				</h3>
				<p className="text-xs text-[var(--text-muted)]">
					Analyzed layout patterns from this channel's top-performing thumbnails
				</p>
			</div>

			{/* Layout Visual Grid */}
			<div className="grid grid-cols-3 gap-3">
				{/* Layout Type */}
				<div className="p-3 rounded-xl bg-white/5 border border-white/10">
					<div className="flex items-center gap-2 mb-2">
						<Layout className="w-4 h-4 text-cyan-400" />
						<span className="text-xs text-[var(--text-muted)]">Layout</span>
					</div>
					<p className="text-sm font-medium text-white capitalize">
						{getLayoutIcon(formatProfile.dominantLayoutType)}{" "}
						{formatProfile.dominantLayoutType.replace("-", " ")}
					</p>
				</div>

				{/* Subject Position */}
				<div className="p-3 rounded-xl bg-white/5 border border-white/10">
					<div className="flex items-center gap-2 mb-2">
						<Image className="w-4 h-4 text-violet-400" />
						<span className="text-xs text-[var(--text-muted)]">Subject</span>
					</div>
					<p className="text-sm font-medium text-white">
						{getPositionLabel(formatProfile.subjectPosition)}
					</p>
					<p className="text-xs text-[var(--text-muted)] mt-0.5">
						{formatProfile.subjectScale}% of frame
					</p>
				</div>

				{/* Text Info */}
				<div className="p-3 rounded-xl bg-white/5 border border-white/10">
					<div className="flex items-center gap-2 mb-2">
						<Type className="w-4 h-4 text-amber-400" />
						<span className="text-xs text-[var(--text-muted)]">Text</span>
					</div>
					<p className="text-sm font-medium text-white">
						{formatProfile.textBlockCount === 0
							? "None"
							: formatProfile.textBlockCount === 1
							? "1 Block"
							: "2 Blocks"}
					</p>
					{formatProfile.textPosition !== "none" && (
						<p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">
							{formatProfile.textPosition}
						</p>
					)}
				</div>
			</div>

			{/* Matched Template Card */}
			<div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
				<div className="flex items-start justify-between mb-3">
					<div>
						<h4 className="text-sm font-medium text-white flex items-center gap-2">
							Best Match Template
							<span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
								{matchedTemplate.confidence}% match
							</span>
						</h4>
						<p className="text-lg font-semibold text-white mt-1">
							{matchedTemplate.displayName}
						</p>
						<p className="text-xs text-[var(--text-muted)] mt-0.5">
							{matchedTemplate.description}
						</p>
					</div>
				</div>
			</div>

			{/* Color Palette */}
			<div>
				<h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
					Suggested Colors
				</h4>
				<div className="flex flex-wrap gap-2">
					{suggestedColors.map((color) => (
						<button
							key={color}
							onClick={() => handleCopyColor(color)}
							className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
						>
							<div
								className="w-5 h-5 rounded-md border border-white/20"
								style={{ backgroundColor: color }}
							/>
							<span className="text-xs font-mono text-white">{color}</span>
							{copiedColor === color ? (
								<Check className="w-3 h-3 text-green-400" />
							) : (
								<Copy className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
							)}
						</button>
					))}
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 pt-2">
				<button
					onClick={onSkip}
					className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
				>
					Skip
				</button>
				<button
					onClick={onOpenCanva}
					className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
				>
					Open Canva Template
					<ExternalLink className="w-4 h-4" />
				</button>
			</div>

			{/* Continue button (shown below if user wants to proceed without Canva) */}
			<button
				onClick={onContinue}
				className="w-full py-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors flex items-center justify-center gap-1"
			>
				Continue without template
				<ChevronRight className="w-4 h-4" />
			</button>
		</div>
	);
}
