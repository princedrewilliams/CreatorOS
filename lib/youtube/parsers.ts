// YouTube Data Parsers - Utility functions for Learning Lab

import type { YoutubeVideo, DerivedMetrics } from "./types";

export const STOP_WORDS = new Set([
	"the",
	"and",
	"for",
	"with",
	"that",
	"this",
	"from",
	"your",
	"you",
	"are",
	"was",
	"have",
	"has",
	"what",
	"when",
	"how",
	"why",
	"into",
	"about",
	"just",
	"like",
	"free",
	"best",
	"new",
	"get",
	"now",
	"can",
	"will",
	"dont",
	"it's",
	"its",
	"they",
	"them",
	"their",
	"theirs",
]);

export function cleanWord(word: string): string {
	return word
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "")
		.trim();
}

export function isShortVideo(video: YoutubeVideo): boolean {
	// Method 1: Duration-based (under 60 seconds)
	if (video.durationSec !== undefined && video.durationSec <= 60) {
		return true;
	}

	// Method 2: Already flagged
	if (video.isShort === true) {
		return true;
	}

	// Method 3: Title-based heuristic
	const shortIndicators = ["#shorts", "#short", "| shorts", "(shorts)"];
	const titleLower = (video.title || "").toLowerCase();
	if (shortIndicators.some((ind) => titleLower.includes(ind))) {
		return true;
	}

	return false;
}

export function calculateEngagementRate(video: YoutubeVideo): number {
	if (!video.views || video.views === 0) return 0;
	const interactions = (video.likes || 0) + (video.comments || 0);
	return (interactions / video.views) * 100;
}

export function calculateEngagementVelocity(video: YoutubeVideo): number {
	const publishedAt = new Date(video.publishedAt);
	const now = new Date();
	const hoursOld =
		(now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);

	if (hoursOld <= 0 || !video.views) return 0;
	return video.views / hoursOld;
}

export function getHoursOld(publishedAt: string): number {
	const published = new Date(publishedAt);
	const now = new Date();
	return (now.getTime() - published.getTime()) / (1000 * 60 * 60);
}

export function commonKeywords(
	titles: string[],
	top = 12
): { word: string; count: number }[] {
	const counts: Record<string, number> = {};
	for (const title of titles) {
		const words = title.split(/\s+/);
		for (const raw of words) {
			const w = cleanWord(raw);
			if (!w || w.length < 4 || STOP_WORDS.has(w)) continue;
			counts[w] = (counts[w] || 0) + 1;
		}
	}
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, top)
		.map(([word, count]) => ({ word, count }));
}

export function deriveMetrics(videos: YoutubeVideo[]): DerivedMetrics {
	if (!videos.length) {
		return {
			postingFrequency: "No recent uploads found",
			averageTitleLength: 0,
			commonKeywords: [],
		};
	}

	const sorted = [...videos].sort(
		(a, b) =>
			new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
	);
	const gaps: number[] = [];
	for (let i = 0; i < sorted.length - 1; i++) {
		const cur = new Date(sorted[i].publishedAt).getTime();
		const next = new Date(sorted[i + 1].publishedAt).getTime();
		const diffDays = Math.abs(cur - next) / (1000 * 60 * 60 * 24);
		if (Number.isFinite(diffDays)) gaps.push(diffDays);
	}
	const avgGap = gaps.length
		? gaps.reduce((a, b) => a + b, 0) / gaps.length
		: null;

	const averageTitleLength =
		videos.reduce((sum, v) => sum + (v.title?.length || 0), 0) / videos.length;

	const keywords = commonKeywords(videos.map((v) => v.title));

	let postingFrequency = "Not enough data";
	if (avgGap !== null) {
		if (avgGap <= 1.5) postingFrequency = "Daily";
		else if (avgGap <= 3) postingFrequency = "Every 2-3 days";
		else if (avgGap <= 7) postingFrequency = "Weekly";
		else if (avgGap <= 14) postingFrequency = "Bi-weekly";
		else postingFrequency = "Sporadic (2+ weeks)";
	}

	return {
		postingFrequency,
		averageTitleLength: Number.isFinite(averageTitleLength)
			? Math.round(averageTitleLength)
			: 0,
		commonKeywords: keywords,
	};
}

export function formatViews(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
	return value.toString();
}

export function getFormatBreakdown(videos: YoutubeVideo[]): {
	shorts: { count: number; percentage: number; avgViews: number; avgEngagement: number };
	longForm: { count: number; percentage: number; avgViews: number; avgEngagement: number };
} {
	const shorts = videos.filter(isShortVideo);
	const longForm = videos.filter((v) => !isShortVideo(v));

	const calcAvg = (arr: YoutubeVideo[], field: "views" | "engagement") => {
		if (!arr.length) return 0;
		if (field === "views") {
			return arr.reduce((sum, v) => sum + (v.views || 0), 0) / arr.length;
		}
		return (
			arr.reduce((sum, v) => sum + calculateEngagementRate(v), 0) / arr.length
		);
	};

	return {
		shorts: {
			count: shorts.length,
			percentage: videos.length > 0 ? (shorts.length / videos.length) * 100 : 0,
			avgViews: calcAvg(shorts, "views"),
			avgEngagement: calcAvg(shorts, "engagement"),
		},
		longForm: {
			count: longForm.length,
			percentage: videos.length > 0 ? (longForm.length / videos.length) * 100 : 0,
			avgViews: calcAvg(longForm, "views"),
			avgEngagement: calcAvg(longForm, "engagement"),
		},
	};
}
