// Validate uploads against content constraints

import type { ContentConstraints, ConstraintViolation, UploadDraft, ValidationResult } from "./types";

// Common hook patterns for detection
const HOOK_PATTERNS: Record<string, RegExp[]> = {
	Curiosity: [
		/\bsecret\b/i,
		/\bhidden\b/i,
		/\bunexpected\b/i,
		/\bshocking\b/i,
		/\byou won't believe\b/i,
		/\bwhat happens\b/i,
		/\bthe truth about\b/i,
		/\brevealed\b/i,
	],
	"Negativity Bias": [
		/\bworst\b/i,
		/\bmistake\b/i,
		/\bfail\b/i,
		/\bavoid\b/i,
		/\bdon't\b/i,
		/\bnever\b/i,
		/\bwrong\b/i,
		/\bdanger\b/i,
	],
	"List/Number": [/\b\d+\s+(ways|tips|things|reasons|steps|hacks)\b/i, /^[\d]+\s/],
	"How-To": [/\bhow to\b/i, /\bguide\b/i, /\btutorial\b/i, /\bstep[- ]by[- ]step\b/i],
	Question: [/\bwhy\b/i, /\bhow\b/i, /\bwhat\b/i, /\bwhen\b/i, /\bwhere\b/i, /\bwhich\b/i, /\?$/],
	Urgency: [/\bnow\b/i, /\btoday\b/i, /\blimited\b/i, /\bhurry\b/i, /\blast chance\b/i, /\bimmediately\b/i],
	"Social Proof": [
		/\beveryone\b/i,
		/\bmillions\b/i,
		/\bviral\b/i,
		/\btrending\b/i,
		/\bmost people\b/i,
		/\bexperts\b/i,
	],
	Controversy: [/\bcontroversial\b/i, /\bdebate\b/i, /\bunpopular opinion\b/i, /\bthe truth\b/i],
	"Personal Story": [/\bmy\b/i, /\bi tried\b/i, /\bmy experience\b/i, /\bstory\b/i, /\bjourney\b/i],
};

/**
 * Detect hooks present in a title
 */
function detectHooks(title: string): string[] {
	const hooks: string[] = [];

	for (const [hookType, patterns] of Object.entries(HOOK_PATTERNS)) {
		if (patterns.some((pattern) => pattern.test(title))) {
			hooks.push(hookType);
		}
	}

	return hooks;
}

/**
 * Calculate how well a keyword appears in text
 */
function keywordPresence(text: string, keyword: string): boolean {
	const lowerText = text.toLowerCase();
	const lowerKeyword = keyword.toLowerCase();
	return lowerText.includes(lowerKeyword);
}

/**
 * Validate an upload draft against content constraints
 */
export function validateUpload(
	upload: UploadDraft,
	constraints: ContentConstraints
): ValidationResult {
	const violations: ConstraintViolation[] = [];

	// Validate title length
	if (upload.title.length < constraints.title.minLength) {
		violations.push({
			field: "title",
			constraint: "minLength",
			actual: upload.title.length,
			expected: constraints.title.minLength,
			severity: "error",
		});
	}

	if (upload.title.length > constraints.title.maxLength) {
		violations.push({
			field: "title",
			constraint: "maxLength",
			actual: upload.title.length,
			expected: constraints.title.maxLength,
			severity: "warning",
		});
	}

	// Validate hooks
	const detectedHooks = detectHooks(upload.title);
	const hasRequiredHook = constraints.title.requiredHooks.some((hook) =>
		detectedHooks.includes(hook)
	);

	if (constraints.title.requiredHooks.length > 0 && !hasRequiredHook) {
		violations.push({
			field: "title",
			constraint: "requiredHooks",
			actual: detectedHooks.length > 0 ? detectedHooks.join(", ") : "None",
			expected: constraints.title.requiredHooks.slice(0, 3).join(" or "),
			severity: "warning",
		});
	}

	// Validate description length
	if (upload.description.length < constraints.seo.minDescriptionLength) {
		violations.push({
			field: "description",
			constraint: "minDescriptionLength",
			actual: upload.description.length,
			expected: constraints.seo.minDescriptionLength,
			severity: "warning",
		});
	}

	// Validate keywords in description
	const combinedText = `${upload.title} ${upload.description} ${upload.tags.join(" ")}`.toLowerCase();
	const missingKeywords = constraints.seo.primaryKeywords.filter(
		(kw) => !keywordPresence(combinedText, kw)
	);

	if (missingKeywords.length > constraints.seo.primaryKeywords.length / 2) {
		violations.push({
			field: "seo",
			constraint: "primaryKeywords",
			actual: `Missing: ${missingKeywords.slice(0, 3).join(", ")}`,
			expected: `Include keywords: ${constraints.seo.primaryKeywords.slice(0, 3).join(", ")}`,
			severity: "warning",
		});
	}

	// Validate required topics
	const missingTopics = constraints.seo.requiredTopics.filter(
		(topic) => !keywordPresence(combinedText, topic)
	);

	if (missingTopics.length > 0 && missingTopics.length === constraints.seo.requiredTopics.length) {
		violations.push({
			field: "seo",
			constraint: "requiredTopics",
			actual: "No required topics found",
			expected: `Include at least one: ${constraints.seo.requiredTopics.slice(0, 3).join(", ")}`,
			severity: "error",
		});
	}

	// Calculate compliance score
	const totalChecks = 5;
	const failedChecks = violations.filter((v) => v.severity === "error").length;
	const warningChecks = violations.filter((v) => v.severity === "warning").length;
	const score = Math.round(((totalChecks - failedChecks - warningChecks * 0.5) / totalChecks) * 100);

	return {
		valid: failedChecks === 0,
		violations,
		score: Math.max(0, score),
	};
}

/**
 * Get human-readable constraint summary
 */
export function getConstraintSummary(constraints: ContentConstraints): string[] {
	const summary: string[] = [];

	summary.push(
		`Title: ${constraints.title.minLength}-${constraints.title.maxLength} characters`
	);

	if (constraints.title.requiredHooks.length > 0) {
		summary.push(`Hooks: Use ${constraints.title.requiredHooks.slice(0, 3).join(", ")}`);
	}

	if (constraints.title.suggestedPowerWords.length > 0) {
		summary.push(
			`Power words: ${constraints.title.suggestedPowerWords.slice(0, 5).join(", ")}`
		);
	}

	summary.push(`Description: Minimum ${constraints.seo.minDescriptionLength} characters`);

	if (constraints.seo.primaryKeywords.length > 0) {
		summary.push(`Keywords: ${constraints.seo.primaryKeywords.slice(0, 5).join(", ")}`);
	}

	const minDur = Math.round(constraints.video.recommendedDurationMin / 60);
	const maxDur = Math.round(constraints.video.recommendedDurationMax / 60);
	summary.push(`Duration: ${minDur}-${maxDur} minutes`);

	summary.push(`Format: ${constraints.video.suggestedFormat}`);

	if (constraints.thumbnail.recommendFace) {
		summary.push(`Thumbnail: Include ${constraints.thumbnail.faceType} face shot`);
	}

	if (constraints.thumbnail.recommendTextOverlay) {
		summary.push(`Thumbnail: Add text overlay`);
	}

	return summary;
}
