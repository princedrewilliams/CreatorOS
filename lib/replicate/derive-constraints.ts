// Derive content constraints from analyzed channel data

import type { ContentConstraints } from "./types";
import type { PackagingResponse, PillarsResponse } from "@/lib/learning-lab/types";
import { aggregateFormatProfile, matchToCanvaTemplate } from "./template-matcher";

interface VideoData {
	id: string;
	title: string;
	publishedAt: string;
	views?: number;
	durationSec?: number;
}

interface ChannelAnalysisData {
	packaging?: PackagingResponse;
	pillars?: PillarsResponse;
	videos?: VideoData[];
}

/**
 * Derives content constraints from analyzed channel data
 * Uses patterns from the reference channel to create replicable constraints
 */
export function deriveConstraints(data: ChannelAnalysisData): ContentConstraints {
	const { packaging, pillars, videos = [] } = data;

	return {
		title: deriveTitleConstraints(packaging, videos),
		seo: deriveSeoConstraints(packaging),
		video: deriveVideoConstraints(pillars, videos),
		thumbnail: deriveThumbnailConstraints(packaging),
		schedule: deriveScheduleConstraints(videos),
	};
}

function deriveTitleConstraints(
	packaging?: PackagingResponse,
	videos?: VideoData[]
): ContentConstraints["title"] {
	// Calculate title length stats
	const titleLengths = (videos || []).map((v) => v.title.length).filter((l) => l > 0);
	const avgTitleLength = titleLengths.length
		? titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length
		: 50;

	// Use ±15% tolerance
	const tolerance = 0.15;
	const minLength = Math.round(avgTitleLength * (1 - tolerance));
	const maxLength = Math.round(avgTitleLength * (1 + tolerance));

	// Extract top hooks from packaging analysis
	const hookDistribution = packaging?.titlePsychology?.hookDistribution || {};
	const sortedHooks = Object.entries(hookDistribution)
		.filter(([hook]) => hook !== "None Detected")
		.sort(([, a], [, b]) => (b as number) - (a as number));
	const requiredHooks = sortedHooks.slice(0, 3).map(([hook]) => hook);

	// Extract power words
	const topPowerWords = packaging?.titlePsychology?.topPowerWords || [];
	const suggestedPowerWords = topPowerWords.slice(0, 10).map((p) => p.word);

	return {
		minLength: Math.max(20, minLength),
		maxLength: Math.min(100, maxLength),
		requiredHooks,
		suggestedPowerWords,
	};
}

function deriveSeoConstraints(packaging?: PackagingResponse): ContentConstraints["seo"] {
	const seoExtraction = packaging?.seoExtraction;

	// Extract primary keywords from top videos
	const keywordFrequency: Record<string, number> = {};
	(seoExtraction?.videos || []).forEach((v) => {
		v.primaryKeywords.forEach((kw) => {
			keywordFrequency[kw] = (keywordFrequency[kw] || 0) + 1;
		});
	});

	const sortedKeywords = Object.entries(keywordFrequency)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 8)
		.map(([kw]) => kw);

	// Get top keywords from analysis
	const topKeywords = (seoExtraction?.topKeywords || [])
		.slice(0, 5)
		.map((k) => k.keyword);

	// Calculate average description length (estimate from preview)
	const descLengths = (seoExtraction?.videos || [])
		.map((v) => v.descriptionPreview.length * 5) // Estimate full length from preview
		.filter((l) => l > 0);
	const avgDescLength = descLengths.length
		? descLengths.reduce((a, b) => a + b, 0) / descLengths.length
		: 500;

	return {
		primaryKeywords: sortedKeywords.length > 0 ? sortedKeywords : topKeywords,
		requiredTopics: topKeywords,
		minDescriptionLength: Math.max(200, Math.round(avgDescLength * 0.7)),
	};
}

function deriveVideoConstraints(
	pillars?: PillarsResponse,
	videos?: VideoData[]
): ContentConstraints["video"] {
	// Calculate duration stats (±25% tolerance)
	const durations = (videos || [])
		.map((v) => v.durationSec || 0)
		.filter((d) => d > 60); // Exclude shorts

	const avgDuration = durations.length
		? durations.reduce((a, b) => a + b, 0) / durations.length
		: 600;

	const tolerance = 0.25;
	const recommendedDurationMin = Math.round(avgDuration * (1 - tolerance));
	const recommendedDurationMax = Math.round(avgDuration * (1 + tolerance));

	// Determine suggested format from pillars
	let suggestedFormat = "Mixed";
	if (pillars?.analysis?.growthDriver) {
		suggestedFormat = pillars.analysis.growthDriver;
	}

	return {
		recommendedDurationMin: Math.max(60, recommendedDurationMin),
		recommendedDurationMax: Math.max(recommendedDurationMin + 60, recommendedDurationMax),
		suggestedFormat,
	};
}

function deriveThumbnailConstraints(
	packaging?: PackagingResponse
): ContentConstraints["thumbnail"] {
	const patterns = packaging?.thumbnailPatterns;
	const thumbnails = packaging?.thumbnails || [];

	// Determine if face is recommended (>50% usage)
	const recommendFace = (patterns?.faceUsagePercent || 0) > 50;

	// Determine face type
	let faceType: "close-up" | "medium" | "wide" | "none" = "none";
	if (recommendFace && patterns?.dominantFaceType) {
		const type = patterns.dominantFaceType.toLowerCase();
		if (type.includes("close")) faceType = "close-up";
		else if (type.includes("medium")) faceType = "medium";
		else if (type.includes("wide")) faceType = "wide";
	}

	// Determine if text overlay is recommended (>40% usage)
	const recommendTextOverlay = (patterns?.textOverlayPercent || 0) > 40;

	// Get common colors
	const suggestedColors = patterns?.commonColors || ["#FF0000", "#FFFFFF", "#000000"];

	// Aggregate format profile from thumbnail analyses
	const formatProfile = aggregateFormatProfile(thumbnails);

	// Match to best Canva template
	const matchedTemplate = matchToCanvaTemplate(formatProfile);

	return {
		recommendFace,
		faceType,
		recommendTextOverlay,
		suggestedColors: suggestedColors.slice(0, 5),
		formatProfile,
		matchedTemplate,
	};
}

function deriveScheduleConstraints(videos?: VideoData[]): ContentConstraints["schedule"] {
	const videoTimes = (videos || [])
		.map((v) => new Date(v.publishedAt))
		.filter((d) => !isNaN(d.getTime()));

	// Count uploads by day of week
	const dayCount: Record<number, number> = {};
	videoTimes.forEach((d) => {
		const day = d.getDay();
		dayCount[day] = (dayCount[day] || 0) + 1;
	});

	// Get top 3 upload days
	const recommendedDays = Object.entries(dayCount)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 3)
		.map(([day]) => parseInt(day, 10));

	// Count uploads by hour
	const hourCount: Record<number, number> = {};
	videoTimes.forEach((d) => {
		const hour = d.getHours();
		hourCount[hour] = (hourCount[hour] || 0) + 1;
	});

	// Get top 3 upload hours
	const recommendedHours = Object.entries(hourCount)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 3)
		.map(([hour]) => parseInt(hour, 10));

	// Calculate average days between uploads
	let minDaysBetweenUploads = 7;
	if (videoTimes.length >= 2) {
		const sortedTimes = videoTimes.sort((a, b) => a.getTime() - b.getTime());
		const gaps: number[] = [];
		for (let i = 1; i < sortedTimes.length; i++) {
			const gap = (sortedTimes[i].getTime() - sortedTimes[i - 1].getTime()) / (1000 * 60 * 60 * 24);
			gaps.push(gap);
		}
		const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
		minDaysBetweenUploads = Math.max(1, Math.round(avgGap * 0.8));
	}

	return {
		recommendedDays: recommendedDays.length > 0 ? recommendedDays : [2, 4, 6], // Default: Tue, Thu, Sat
		recommendedHours: recommendedHours.length > 0 ? recommendedHours : [14, 16, 18], // Default: 2-6 PM
		minDaysBetweenUploads,
	};
}
