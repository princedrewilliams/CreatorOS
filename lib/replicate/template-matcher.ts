// Template matching logic for Canva thumbnail templates

import type { ThumbnailAnalysis } from "@/lib/learning-lab/types";
import type {
	ThumbnailFormatProfile,
	CanvaTemplateType,
	CanvaTemplateMatch,
} from "./types";

interface TemplateConfig {
	displayName: string;
	description: string;
	matcher: (profile: ThumbnailFormatProfile) => number;
}

const TEMPLATE_CONFIGS: Record<CanvaTemplateType, TemplateConfig> = {
	"face-left-text-right": {
		displayName: "Face Left + Text Right",
		description: "Subject on left third, text block on right side",
		matcher: (p) => {
			let score = 0;
			if (p.subjectPosition === "left") score += 40;
			if (p.dominantLayoutType === "face-led") score += 30;
			if (p.textBlockCount >= 1) score += 20;
			if (p.textPosition === "center" || p.textPosition === "top") score += 10;
			return score;
		},
	},
	"face-right-text-left": {
		displayName: "Face Right + Text Left",
		description: "Subject on right third, text block on left side",
		matcher: (p) => {
			let score = 0;
			if (p.subjectPosition === "right") score += 40;
			if (p.dominantLayoutType === "face-led") score += 30;
			if (p.textBlockCount >= 1) score += 20;
			if (p.textPosition === "center" || p.textPosition === "top") score += 10;
			return score;
		},
	},
	"center-subject-no-text": {
		displayName: "Center Subject, Minimal Text",
		description: "Subject centered with no or minimal text overlay",
		matcher: (p) => {
			let score = 0;
			if (p.subjectPosition === "center") score += 40;
			if (p.textBlockCount === 0) score += 30;
			else if (p.textBlockCount === 1 && p.averageTextLength < 10) score += 15;
			if (p.subjectScale >= 50) score += 20;
			if (p.dominantLayoutType === "object-led") score += 10;
			return score;
		},
	},
	"text-heavy-top-image-bottom": {
		displayName: "Text Heavy + Image Below",
		description: "Large text at top with supporting imagery below",
		matcher: (p) => {
			let score = 0;
			if (p.dominantLayoutType === "text-led") score += 40;
			if (p.textBlockCount >= 1) score += 25;
			if (p.textPosition === "top") score += 20;
			if (p.averageTextLength >= 15) score += 15;
			return score;
		},
	},
};

// Canva YouTube thumbnail create URL (generic fallback)
const CANVA_THUMBNAIL_DEEP_LINK =
	"https://www.canva.com/design?create&type=TABzW6DJhNk&category=youtube-thumbnails";

// Curated Canva template IDs for each template type
// To add templates:
// 1. Go to canva.com/youtube-thumbnails/templates
// 2. Click "Customize this template" on a matching template
// 3. Extract ID from URL: canva.com/templates/EAF...xxx → ID is "EAF...xxx"
// 4. Add the ID to the appropriate array below
const CANVA_TEMPLATE_IDS: Record<CanvaTemplateType, string[]> = {
	// TODO: Add curated template IDs. For now, falls back to search-filtered gallery.
	"face-left-text-right": [],
	"face-right-text-left": [],
	"center-subject-no-text": [],
	"text-heavy-top-image-bottom": [],
};

// Search queries for template gallery fallback (when no specific template ID)
const CANVA_TEMPLATE_SEARCH_QUERIES: Record<CanvaTemplateType, string> = {
	"face-left-text-right": "face portrait",
	"face-right-text-left": "portrait person",
	"center-subject-no-text": "minimal clean",
	"text-heavy-top-image-bottom": "bold text typography",
};

/**
 * Match a format profile to the best Canva template
 */
export function matchToCanvaTemplate(
	profile: ThumbnailFormatProfile
): CanvaTemplateMatch {
	const scores: { type: CanvaTemplateType; score: number }[] = [];

	for (const [templateType, config] of Object.entries(TEMPLATE_CONFIGS)) {
		const score = config.matcher(profile);
		scores.push({ type: templateType as CanvaTemplateType, score });
	}

	// Sort by score descending
	scores.sort((a, b) => b.score - a.score);
	const bestMatch = scores[0];

	const config = TEMPLATE_CONFIGS[bestMatch.type];

	return {
		templateType: bestMatch.type,
		confidence: bestMatch.score,
		deepLinkUrl: buildCanvaDeepLink(bestMatch.type),
		displayName: config.displayName,
		description: config.description,
	};
}

/**
 * Aggregate format profile from multiple thumbnail analyses
 */
export function aggregateFormatProfile(
	analyses: ThumbnailAnalysis[]
): ThumbnailFormatProfile {
	const validAnalyses = analyses.filter((a) => a.status === "analyzed");

	if (validAnalyses.length === 0) {
		// Return default profile
		return {
			aspectRatio: "16:9",
			subjectPosition: "center",
			subjectScale: 50,
			textBlockCount: 1,
			textPosition: "top",
			averageTextLength: 10,
			dominantLayoutType: "face-led",
		};
	}

	// Count subject positions
	const positionCounts: Record<string, number> = { left: 0, center: 0, right: 0 };
	let totalSubjectScale = 0;
	let subjectScaleCount = 0;
	let totalTextBlockCount = 0;
	let textBlockCountEntries = 0;
	const textPositionCounts: Record<string, number> = {
		top: 0,
		center: 0,
		bottom: 0,
		none: 0,
	};
	let totalTextLength = 0;
	let textLengthCount = 0;
	const layoutTypeCounts: Record<string, number> = {
		"face-led": 0,
		"object-led": 0,
		"text-led": 0,
	};

	for (const analysis of validAnalyses) {
		const a = analysis.analysis;

		// Subject position
		if (a.subjectPosition) {
			positionCounts[a.subjectPosition]++;
		} else {
			// Infer from face presence
			if (a.hasFace) {
				positionCounts["center"]++;
			}
		}

		// Subject scale
		if (a.subjectScale !== undefined) {
			totalSubjectScale += a.subjectScale;
			subjectScaleCount++;
		}

		// Text block count
		if (a.textBlockCount !== undefined) {
			totalTextBlockCount += a.textBlockCount;
			textBlockCountEntries++;
		} else if (a.hasTextOverlay !== null) {
			totalTextBlockCount += a.hasTextOverlay ? 1 : 0;
			textBlockCountEntries++;
		}

		// Text position
		if (a.textPosition) {
			textPositionCounts[a.textPosition]++;
		} else if (a.hasTextOverlay) {
			textPositionCounts["top"]++;
		} else {
			textPositionCounts["none"]++;
		}

		// Text length
		if (a.averageTextLength !== undefined) {
			totalTextLength += a.averageTextLength;
			textLengthCount++;
		}

		// Layout type
		if (a.dominantLayoutType) {
			layoutTypeCounts[a.dominantLayoutType]++;
		} else {
			// Infer from other fields
			if (a.hasFace) {
				layoutTypeCounts["face-led"]++;
			} else if (a.hasTextOverlay) {
				layoutTypeCounts["text-led"]++;
			} else {
				layoutTypeCounts["object-led"]++;
			}
		}
	}

	// Find dominant values
	const subjectPosition = (
		Object.entries(positionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "center"
	) as "left" | "center" | "right";

	const subjectScale =
		subjectScaleCount > 0
			? Math.round(totalSubjectScale / subjectScaleCount)
			: 50;

	const avgTextBlockCount =
		textBlockCountEntries > 0
			? totalTextBlockCount / textBlockCountEntries
			: 1;
	const textBlockCount = (
		avgTextBlockCount < 0.5 ? 0 : avgTextBlockCount < 1.5 ? 1 : 2
	) as 0 | 1 | 2;

	const textPosition = (
		Object.entries(textPositionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
		"top"
	) as "top" | "center" | "bottom" | "none";

	const averageTextLength =
		textLengthCount > 0 ? Math.round(totalTextLength / textLengthCount) : 10;

	const dominantLayoutType = (
		Object.entries(layoutTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
		"face-led"
	) as "face-led" | "object-led" | "text-led";

	return {
		aspectRatio: "16:9",
		subjectPosition,
		subjectScale,
		textBlockCount,
		textPosition,
		averageTextLength,
		dominantLayoutType,
	};
}

/**
 * Build Canva deep link URL for a specific template type
 * Uses curated template IDs when available, falls back to search-filtered gallery
 */
export function buildCanvaDeepLink(templateType?: CanvaTemplateType): string {
	if (!templateType) {
		return CANVA_THUMBNAIL_DEEP_LINK;
	}

	const templateIds = CANVA_TEMPLATE_IDS[templateType];

	// Use curated template if available
	if (templateIds && templateIds.length > 0) {
		// Pick random template for variety
		const templateId = templateIds[Math.floor(Math.random() * templateIds.length)];
		return `https://www.canva.com/templates/${templateId}`;
	}

	// Fallback to filtered template gallery
	const searchQuery = CANVA_TEMPLATE_SEARCH_QUERIES[templateType];
	if (searchQuery) {
		return `https://www.canva.com/youtube-thumbnails/templates/?query=${encodeURIComponent(searchQuery)}`;
	}

	return CANVA_THUMBNAIL_DEEP_LINK;
}
