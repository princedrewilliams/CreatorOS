import { NextResponse } from "next/server";
import OpenAI from "openai";

// Severity classification system
type Severity = "strong" | "neutral" | "weak" | "concerning";

interface ScoredInsight {
	id: string;
	label: string;
	severity: Severity;
	evidence: string;
	impact: string;
	action?: string;
	examples?: string[];
}

interface CategoryAnalysis {
	score: number;
	severity: Severity;
	summary: string;
	insights: ScoredInsight[];
}

function getSeverity(score: number, trend?: "declining" | "stable" | "improving"): Severity {
	// Concerning: score < 25 OR significant decline
	if (score < 25 || trend === "declining") return "concerning";
	// Weak: score 25-49
	if (score < 50) return "weak";
	// Strong: score >= 75
	if (score >= 75) return "strong";
	// Neutral: score 50-74
	return "neutral";
}

type YoutubeChannel = {
	id: string;
	title: string;
	description: string;
	thumbnail: string;
	bannerUrl?: string;
	subscriberCount?: number;
	viewCount?: number;
	videoCount?: number;
	publishedAt?: string;
	customUrl?: string;
	handle?: string;
	uploadsPlaylistId?: string;
};

type YoutubeVideo = {
	id: string;
	title: string;
	publishedAt: string;
	durationSec?: number;
	views?: number;
	likes?: number;
	comments?: number;
	thumbnails: Record<string, { url: string; width: number; height: number }>;
};

const STOP_WORDS = new Set([
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

const YT_BASE = "https://www.googleapis.com/youtube/v3";

function toNumber(val?: string) {
	if (!val) return undefined;
	const num = Number(val);
	return Number.isFinite(num) ? num : undefined;
}

function cleanWord(word: string) {
	return word
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "")
		.trim();
}

function commonKeywords(titles: string[], top = 12) {
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

function extractNgrams(titles: string[], n: number = 2): { phrase: string; count: number }[] {
	const counts: Record<string, number> = {};
	for (const title of titles) {
		const words = title.toLowerCase().split(/\s+/)
			.map(w => cleanWord(w))
			.filter(w => w.length >= 3 && !STOP_WORDS.has(w));
		for (let i = 0; i <= words.length - n; i++) {
			const phrase = words.slice(i, i + n).join(" ");
			counts[phrase] = (counts[phrase] || 0) + 1;
		}
	}
	return Object.entries(counts)
		.filter(([_, count]) => count >= 2)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([phrase, count]) => ({ phrase, count }));
}

function extractTopicClusters(titles: string[], keywords: { word: string; count: number }[]): {
	clusters: { topic: string; videoCount: number }[];
	alignmentScore: number;
} {
	const topKeywords = keywords.slice(0, 6).map(k => k.word);
	const videoTopics: Set<number>[] = topKeywords.map(() => new Set());

	titles.forEach((title, idx) => {
		const titleWords = title.toLowerCase().split(/\s+/).map(w => cleanWord(w));
		topKeywords.forEach((kw, kwIdx) => {
			if (titleWords.includes(kw)) videoTopics[kwIdx].add(idx);
		});
	});

	const videosInClusters = new Set<number>();
	videoTopics.forEach(s => s.forEach(v => videosInClusters.add(v)));
	const alignmentScore = titles.length > 0 ? (videosInClusters.size / titles.length) * 100 : 0;

	return {
		clusters: topKeywords.map((kw, i) => ({ topic: kw, videoCount: videoTopics[i].size }))
			.filter(c => c.videoCount >= 2)
			.sort((a, b) => b.videoCount - a.videoCount)
			.slice(0, 4),
		alignmentScore
	};
}

async function ytFetch(path: string, params: Record<string, string>) {
	const key = process.env.YOUTUBE_API_KEY;
	if (!key) {
		throw new Error("YOUTUBE_API_KEY is not set");
	}

	const search = new URLSearchParams({ key, ...params });
	const url = `${YT_BASE}${path}?${search.toString()}`;
	const res = await fetch(url, { next: { revalidate: 60 } });
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`YouTube API ${path} failed: ${res.status} ${text}`);
	}
	return res.json();
}

function extractHandleOrId(channelUrl: string) {
	try {
		const url = new URL(channelUrl);
		const path = url.pathname;
		if (path.includes("/channel/")) {
			return { type: "id", value: path.split("/channel/")[1].split(/[/?]/)[0] };
		}
		if (path.includes("/@")) {
			return { type: "handle", value: path.split("/@")[1].split(/[/?]/)[0] };
		}
		if (path.includes("/c/")) {
			return { type: "custom", value: path.split("/c/")[1].split(/[/?]/)[0] };
		}
		// Fallback: treat as search query or direct id/handle
		const trimmed = channelUrl.replace(/^@/, "").trim();
		return { type: "search", value: trimmed };
	} catch {
		const trimmed = channelUrl.replace(/^@/, "").trim();
		// Check if it's a raw YouTube channel ID (starts with UC and is 24 chars)
		if (trimmed.startsWith("UC") && trimmed.length === 24) {
			return { type: "id", value: trimmed };
		}
		return { type: "search", value: trimmed };
	}
}

async function resolveChannelId(input: string): Promise<string> {
	const { type, value } = extractHandleOrId(input);

	if (type === "id") return value;

	if (type === "handle" || type === "custom" || type === "search") {
		const search = await ytFetch("/search", {
			part: "id",
			type: "channel",
			maxResults: "1",
			q: type === "handle" ? `@${value}` : value,
		});
		const id = search.items?.[0]?.id?.channelId;
		if (!id) {
			throw new Error("Could not resolve channel. Try a full channel URL.");
		}
		return id;
	}

	throw new Error("Unable to resolve channel");
}

async function fetchChannel(channelId: string): Promise<YoutubeChannel> {
	const data = await ytFetch("/channels", {
		part: "snippet,contentDetails,statistics,brandingSettings",
		id: channelId,
	});
	const item = data.items?.[0];
	if (!item) throw new Error("Channel not found");

	const snippet = item.snippet || {};
	const stats = item.statistics || {};
	const branding = item.brandingSettings || {};
	const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;

	return {
		id: channelId,
		title: snippet.title,
		description: snippet.description,
		thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
		bannerUrl: branding?.image?.bannerExternalUrl || "",
		subscriberCount: toNumber(stats.subscriberCount),
		viewCount: toNumber(stats.viewCount),
		videoCount: toNumber(stats.videoCount),
		publishedAt: snippet.publishedAt,
		customUrl: snippet.customUrl,
		handle: snippet.customUrl?.replace("/", "") || undefined,
		uploadsPlaylistId,
	};
}

async function fetchRecentVideos(uploadsPlaylistId: string): Promise<YoutubeVideo[]> {
	const items = await ytFetch("/playlistItems", {
		part: "snippet,contentDetails",
		maxResults: "25",
		playlistId: uploadsPlaylistId,
	});

	const baseList: YoutubeVideo[] = (items.items || []).map((item: any) => {
		const snippet = item.snippet || {};
		return {
			id: snippet.resourceId?.videoId || item.contentDetails?.videoId || "",
			title: snippet.title || "",
			publishedAt: snippet.publishedAt || "",
			thumbnails: snippet.thumbnails || {},
		};
	});

	const ids = baseList.map((v) => v.id).filter(Boolean);
	if (!ids.length) return baseList;

	const detailed = await fetchVideoDetails(ids);
	const map = new Map(detailed.map((v) => [v.id, v]));

	return baseList.map((v) => {
		const d = map.get(v.id);
		return {
			...v,
			views: d?.views ?? v.views,
			likes: d?.likes ?? v.likes,
			comments: d?.comments ?? v.comments,
			durationSec: d?.durationSec ?? v.durationSec,
			thumbnails: v.thumbnails || d?.thumbnails || {},
		};
	});
}

async function fetchVideoDetails(ids: string[]): Promise<YoutubeVideo[]> {
	const chunks: string[][] = [];
	for (let i = 0; i < ids.length; i += 50) {
		chunks.push(ids.slice(i, i + 50));
	}

	const results: YoutubeVideo[] = [];
	for (const chunk of chunks) {
		const res = await ytFetch("/videos", {
			part: "snippet,statistics,contentDetails",
			id: chunk.join(","),
			maxResults: "50",
		});
		for (const item of res.items || []) {
			const snippet = item.snippet || {};
			const stats = item.statistics || {};
			const content = item.contentDetails || {};
			results.push({
				id: item.id,
				title: snippet.title,
				publishedAt: snippet.publishedAt,
				durationSec: parseISODuration(content.duration),
				views: toNumber(stats.viewCount),
				likes: toNumber(stats.likeCount),
				comments: toNumber(stats.commentCount),
				thumbnails: snippet.thumbnails || {},
			});
		}
	}
	return results;
}

function deriveMetrics(videos: YoutubeVideo[]) {
	if (!videos.length) {
		return {
			postingFrequency: "No recent uploads found",
			averageTitleLength: 0,
			commonKeywords: [] as { word: string; count: number }[],
		};
	}

	const sorted = [...videos].sort(
		(a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
	);
	const gaps: number[] = [];
	for (let i = 0; i < sorted.length - 1; i++) {
		const cur = new Date(sorted[i].publishedAt).getTime();
		const next = new Date(sorted[i + 1].publishedAt).getTime();
		const diffDays = Math.abs(cur - next) / (1000 * 60 * 60 * 24);
		if (Number.isFinite(diffDays)) gaps.push(diffDays);
	}
	const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;

	const averageTitleLength =
		videos.reduce((sum, v) => sum + (v.title?.length || 0), 0) / videos.length;

	const titles = videos.map((v) => v.title);
	const keywords = commonKeywords(titles);
	const repeatedPhrases = extractNgrams(titles, 2);
	const topicData = extractTopicClusters(titles, keywords);

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
		averageTitleLength: Number.isFinite(averageTitleLength) ? Math.round(averageTitleLength) : 0,
		commonKeywords: keywords,
		repeatedPhrases,
		topicClusters: topicData.clusters,
		topicAlignmentScore: topicData.alignmentScore,
	};
}

function computeSearchVisibility(
	videos: YoutubeVideo[],
	channelKeywords: { word: string; count: number }[]
): { scores: { label: string; score: number }[]; median: number } {
	if (!videos.length) {
		return { scores: [], median: 50 };
	}

	const keywordSet = new Set(channelKeywords.slice(0, 10).map(k => k.word.toLowerCase()));
	const recentVideos = videos.slice(0, 10);

	const scores = recentVideos.map((video, index) => {
		const title = video.title || "";
		const titleLower = title.toLowerCase();
		const titleWords = titleLower.split(/\s+/).map(w => cleanWord(w)).filter(w => w.length >= 4);

		// 1. Title keyword relevance (0-35 points)
		// How many channel keywords appear in the title
		const keywordMatches = titleWords.filter(w => keywordSet.has(w)).length;
		const keywordScore = Math.min(35, keywordMatches * 12);

		// 2. Title length score (0-25 points)
		// Optimal range: 42-55 characters
		const titleLen = title.length;
		let titleLengthScore = 0;
		if (titleLen >= 42 && titleLen <= 55) {
			titleLengthScore = 25;
		} else if (titleLen >= 35 && titleLen <= 65) {
			titleLengthScore = 18;
		} else if (titleLen >= 25 && titleLen <= 75) {
			titleLengthScore = 10;
		} else {
			titleLengthScore = 5;
		}

		// 3. Topic consistency (0-25 points)
		// How much does this title share keywords with other videos
		const otherVideos = recentVideos.filter((_, i) => i !== index);
		const otherKeywords = new Set<string>();
		otherVideos.forEach(v => {
			const words = (v.title || "").toLowerCase().split(/\s+/).map(w => cleanWord(w));
			words.filter(w => w.length >= 4 && !STOP_WORDS.has(w)).forEach(w => otherKeywords.add(w));
		});
		const sharedKeywords = titleWords.filter(w => otherKeywords.has(w)).length;
		const consistencyScore = Math.min(25, sharedKeywords * 8);

		// 4. First 50 chars keyword density (0-15 points)
		const first50 = titleLower.slice(0, 50);
		const first50Words = first50.split(/\s+/).map(w => cleanWord(w)).filter(w => w.length >= 4);
		const first50Matches = first50Words.filter(w => keywordSet.has(w)).length;
		const densityScore = Math.min(15, first50Matches * 8);

		const totalScore = Math.min(100, keywordScore + titleLengthScore + consistencyScore + densityScore);

		return {
			label: `V${index + 1}`,
			score: Math.round(totalScore),
		};
	});

	// Calculate median
	const sortedScores = [...scores.map(s => s.score)].sort((a, b) => a - b);
	const median = sortedScores[Math.floor(sortedScores.length / 2)] || 50;

	return { scores, median };
}

function buildHeuristicAnalysis(payload: {
	channel: YoutubeChannel;
	videos: YoutubeVideo[];
	metrics: ReturnType<typeof deriveMetrics>;
	scores: ReturnType<typeof computeScores>;
}): Record<string, CategoryAnalysis> {
	const { channel, videos, metrics, scores } = payload;

	// Calculate key statistics for evidence-based insights
	const views = videos.map((v) => v.views || 0).filter(v => v > 0);
	const sortedViews = [...views].sort((a, b) => a - b);
	const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 0;
	const avgViews = views.length ? views.reduce((a, b) => a + b, 0) / views.length : 0;
	const aboveMedian = views.filter(v => v > medianViews).length;

	// Engagement metrics
	const likes = videos.map((v) => v.likes || 0);
	const comments = videos.map((v) => v.comments || 0);
	const avgLikes = likes.length ? likes.reduce((a, b) => a + b, 0) / likes.length : 0;
	const avgComments = comments.length ? comments.reduce((a, b) => a + b, 0) / comments.length : 0;
	const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews * 100) : 0;

	// Variance calculation for consistency
	const viewsVariance = views.length > 1
		? views.reduce((acc, v) => acc + Math.pow(v - avgViews, 2), 0) / views.length
		: 0;
	const viewsCV = avgViews > 0 ? (Math.sqrt(viewsVariance) / avgViews) : 0; // Coefficient of variation

	// Trend detection (compare first half vs second half)
	const halfPoint = Math.floor(views.length / 2);
	const firstHalfAvg = views.slice(0, halfPoint).reduce((a, b) => a + b, 0) / halfPoint || 0;
	const secondHalfAvg = views.slice(halfPoint).reduce((a, b) => a + b, 0) / (views.length - halfPoint) || 0;
	const trendDirection: "declining" | "stable" | "improving" =
		secondHalfAvg > firstHalfAvg * 1.2 ? "improving" :
		secondHalfAvg < firstHalfAvg * 0.8 ? "declining" : "stable";

	const keywordList = metrics.commonKeywords.slice(0, 5).map((k) => k.word).join(", ") || "none detected";
	const totalVideos = videos.length;

	// Helper to create negative-first insights
	const createInsights = (
		category: string,
		score: number,
		checks: { condition: boolean; insight: ScoredInsight }[]
	): ScoredInsight[] => {
		const severity = getSeverity(score, trendDirection);
		const results: ScoredInsight[] = [];

		// Add negative insights first
		for (const check of checks) {
			if (check.condition && (check.insight.severity === "weak" || check.insight.severity === "concerning")) {
				results.push(check.insight);
			}
		}

		// Then add positive insights if score is strong
		if (severity === "strong" || severity === "neutral") {
			for (const check of checks) {
				if (check.condition && (check.insight.severity === "strong" || check.insight.severity === "neutral")) {
					results.push(check.insight);
				}
			}
		}

		// If no issues, add explicit "no issues" insight
		if (results.length === 0) {
			results.push({
				id: `${category}-ok`,
				label: "No Major Issues",
				severity: "neutral",
				evidence: "Performance is within expected range for this category.",
				impact: "Current approach is sustainable.",
			});
		}

		return results.slice(0, 3);
	};

	// VIRAL POTENTIAL - Check for problems first
	const viralScore = scores.categories["Viral Potential"];
	const viralSeverity = getSeverity(viralScore, trendDirection);
	const viralInsights = createInsights("viral", viralScore, [
		{
			condition: aboveMedian < totalVideos * 0.3,
			insight: {
				id: "viral-low-repeatability",
				label: "Weak Viral Repeatability",
				severity: "weak",
				evidence: `Only ${aboveMedian} of ${totalVideos} videos exceeded channel median views.`,
				impact: "Inconsistent performance makes growth unpredictable.",
				action: "Study your top performers for replicable patterns.",
			},
		},
		{
			condition: viewsCV > 1.5,
			insight: {
				id: "viral-high-volatility",
				label: "High View Volatility",
				severity: "concerning",
				evidence: `Views vary by ${Math.round(viewsCV * 100)}% from average.`,
				impact: "Extreme swings suggest no reliable content formula.",
				action: "Identify what your top 3 videos have in common.",
			},
		},
		{
			condition: trendDirection === "declining",
			insight: {
				id: "viral-declining-trend",
				label: "Declining Performance",
				severity: "concerning",
				evidence: `Recent videos average ${Math.round((1 - secondHalfAvg / firstHalfAvg) * 100)}% fewer views than older ones.`,
				impact: "Audience interest may be fading.",
				action: "Revisit formats and topics from your peak period.",
			},
		},
		{
			condition: aboveMedian >= totalVideos * 0.5 && viewsCV < 0.8,
			insight: {
				id: "viral-consistent",
				label: "Consistent Performance",
				severity: "strong",
				evidence: `${aboveMedian} of ${totalVideos} videos beat median with low variance.`,
				impact: "Reliable formula drives predictable growth.",
			},
		},
	]);

	// ENGAGEMENT - Check for problems first
	const engagementScore = scores.categories["Audience Engagement"];
	const engagementSeverity = getSeverity(engagementScore);
	const engagementInsights = createInsights("engagement", engagementScore, [
		{
			condition: engagementRate < 2,
			insight: {
				id: "engagement-low-rate",
				label: "Low Engagement Rate",
				severity: "weak",
				evidence: `${engagementRate.toFixed(2)}% engagement rate (likes + comments / views).`,
				impact: "Low engagement signals weak audience connection.",
				action: "Add specific CTAs and questions in your first 30 seconds.",
			},
		},
		{
			condition: avgComments < avgViews * 0.001,
			insight: {
				id: "engagement-low-comments",
				label: "Comment Deficit",
				severity: "weak",
				evidence: `Only ${Math.round(avgComments)} avg comments per video.`,
				impact: "Low comments hurt algorithm signals.",
				action: "Ask 1 specific question viewers can answer.",
			},
		},
		{
			condition: engagementRate >= 5,
			insight: {
				id: "engagement-strong",
				label: "Strong Engagement",
				severity: "strong",
				evidence: `${engagementRate.toFixed(2)}% engagement rate is above average.`,
				impact: "High engagement boosts algorithmic distribution.",
			},
		},
	]);

	// DISCOVERABILITY / SEO - 3 observational insights
	const seoScore = scores.categories["Discoverability / SEO"];
	const seoSeverity = getSeverity(seoScore);
	const avgTitleLength = metrics.averageTitleLength;

	// Keyword Focus - based on single recurring keywords
	const keywordCount = metrics.commonKeywords?.length || 0;
	const topKeywords = metrics.commonKeywords?.slice(0, 5).map(k => k.word).join(", ") || "none";
	const keywordSeverity: Severity = keywordCount >= 6 ? "strong" : keywordCount >= 3 ? "neutral" : "weak";

	// Determine title length severity (optimal: 42-55)
	const titleLengthSeverity: Severity =
		(avgTitleLength >= 42 && avgTitleLength <= 55) ? "strong" :
		(avgTitleLength >= 35 && avgTitleLength <= 65) ? "neutral" : "weak";

	// Topic Alignment - based on repeated phrases (n-grams)
	const phraseCount = metrics.repeatedPhrases?.length || 0;
	const topPhrases = metrics.repeatedPhrases?.slice(0, 3).map(p => `"${p.phrase}"`).join(", ") || "none";
	const alignmentPct = Math.round(metrics.topicAlignmentScore || 0);
	const topicSeverity: Severity = phraseCount >= 4 ? "strong" : phraseCount >= 2 ? "neutral" : "weak";

	const seoInsights: ScoredInsight[] = [
		{
			id: "seo-keyword-focus",
			label: "Keyword Focus",
			severity: keywordSeverity,
			evidence: keywordSeverity === "strong"
				? `This channel consistently uses keywords like: ${topKeywords} across video titles.`
				: keywordSeverity === "neutral"
				? `This channel uses some recurring keywords: ${topKeywords}.`
				: `This channel lacks consistent keyword usage (only ${keywordCount} recurring terms detected).`,
			impact: keywordSeverity === "strong"
				? "Strong keyword repetition builds topical authority in search."
				: "Limited keyword consistency reduces search discoverability.",
		},
		{
			id: "seo-title-length",
			label: "Title Length Discipline",
			severity: titleLengthSeverity,
			evidence: titleLengthSeverity === "strong"
				? `Average title length is ${avgTitleLength} characters (within discovery-friendly range of 42-55).`
				: `Average title length is ${avgTitleLength} characters (discovery-friendly range: 42-55).`,
			impact: titleLengthSeverity === "strong"
				? "Optimal title length maximizes search visibility."
				: avgTitleLength < 42
				? "Short titles may lack searchable context."
				: "Long titles risk truncation in search results.",
		},
		{
			id: "seo-topic-alignment",
			label: "Topic Alignment",
			severity: topicSeverity,
			evidence: topicSeverity === "strong"
				? `This channel repeats thematic phrases like: ${topPhrases}. ${alignmentPct}% of videos share common topic clusters.`
				: topicSeverity === "neutral"
				? `Videos use some repeated phrases: ${topPhrases}. ${alignmentPct}% topic overlap detected.`
				: `Videos lack repeated thematic phrases. Only ${phraseCount} recurring phrases and ${alignmentPct}% topic overlap.`,
			impact: topicSeverity === "strong"
				? "Consistent thematic phrases improve algorithmic recommendations."
				: "Scattered themes make recommendation systems less likely to suggest videos together.",
		},
	];

	// UPLOAD CONSISTENCY
	const uploadScore = scores.categories["Upload Consistency"];
	const uploadSeverity = getSeverity(uploadScore);
	const uploadInsights = createInsights("upload", uploadScore, [
		{
			condition: metrics.postingFrequency.includes("Sporadic"),
			insight: {
				id: "upload-sporadic",
				label: "Inconsistent Upload Schedule",
				severity: "concerning",
				evidence: `Posting frequency: ${metrics.postingFrequency}.`,
				impact: "Irregular uploads hurt subscriber retention and algorithm favor.",
				action: "Commit to a fixed weekly schedule.",
			},
		},
		{
			condition: metrics.postingFrequency.includes("Bi-weekly"),
			insight: {
				id: "upload-biweekly",
				label: "Upload Frequency Below Optimal",
				severity: "weak",
				evidence: `Posting every 2 weeks limits growth velocity.`,
				impact: "Weekly uploaders typically grow 2-3x faster.",
				action: "Increase to weekly uploads or add Shorts.",
			},
		},
		{
			condition: metrics.postingFrequency.includes("Daily") || metrics.postingFrequency.includes("Every 2-3"),
			insight: {
				id: "upload-strong",
				label: "Strong Upload Cadence",
				severity: "strong",
				evidence: `Posting frequency: ${metrics.postingFrequency}.`,
				impact: "Consistent uploads maximize algorithmic opportunity.",
			},
		},
	]);

	// THUMBNAIL PERFORMANCE
	const thumbScore = scores.categories["Thumbnail Performance"];
	const thumbSeverity = getSeverity(thumbScore);
	const thumbInsights = createInsights("thumbnail", thumbScore, [
		{
			condition: thumbScore < 50,
			insight: {
				id: "thumb-inconsistent",
				label: "Thumbnail Inconsistency",
				severity: "weak",
				evidence: `Thumbnail style varies significantly across uploads.`,
				impact: "Inconsistent branding reduces click-through on browse.",
				action: "Create a template with consistent colors and text style.",
			},
		},
		{
			condition: thumbScore >= 70,
			insight: {
				id: "thumb-consistent",
				label: "Consistent Thumbnail Style",
				severity: "strong",
				evidence: `Visual branding is maintained across uploads.`,
				impact: "Recognizable thumbnails improve browse CTR.",
			},
		},
	]);

	// CHANNEL IDENTITY & FOCUS
	const identityScore = scores.categories["Channel Identity & Focus"];
	const identitySeverity = getSeverity(identityScore);
	const identityInsights = createInsights("identity", identityScore, [
		{
			condition: (channel.description || "").length < 100,
			insight: {
				id: "identity-weak-bio",
				label: "Underdeveloped Channel Bio",
				severity: "weak",
				evidence: `Channel description is ${(channel.description || "").length} characters.`,
				impact: "New visitors lack context to subscribe.",
				action: "Add a clear value proposition in first 150 characters.",
			},
		},
		{
			condition: metrics.commonKeywords.length < 3,
			insight: {
				id: "identity-unfocused",
				label: "Unclear Topic Focus",
				severity: "weak",
				evidence: `Only ${metrics.commonKeywords.length} recurring themes detected.`,
				impact: "Algorithm struggles to categorize your content.",
				action: "Focus on 2-3 core topics for the next 10 uploads.",
			},
		},
		{
			condition: (channel.description || "").length >= 200 && metrics.commonKeywords.length >= 5,
			insight: {
				id: "identity-strong",
				label: "Clear Channel Identity",
				severity: "strong",
				evidence: `Strong bio with ${metrics.commonKeywords.length} consistent themes.`,
				impact: "Clear positioning aids discovery and retention.",
			},
		},
	]);

	// THEME CONSISTENCY
	const themeScore = Math.round(metrics.topicAlignmentScore || 50);
	const themeSeverity: Severity = themeScore >= 70 ? "strong" : themeScore >= 40 ? "neutral" : "weak";
	const topThemes = metrics.topicClusters?.slice(0, 3).map((c: { topic: string }) => c.topic).join(", ") || "none";
	const themeInsights: ScoredInsight[] = [
		{
			id: "theme-overlap",
			label: "Topic Overlap",
			severity: themeSeverity,
			evidence: themeSeverity === "strong"
				? `${themeScore}% of videos focus on recurring themes: ${topThemes}.`
				: themeSeverity === "neutral"
				? `${themeScore}% of videos share common themes: ${topThemes}.`
				: `Only ${themeScore}% topic overlap detected across recent videos.`,
			impact: themeSeverity === "strong"
				? "Strong topic consistency helps the algorithm recommend your content."
				: "Low topic overlap makes it harder for the algorithm to categorize you.",
		},
		{
			id: "theme-recurring",
			label: "Recurring Topics",
			severity: (metrics.topicClusters?.length || 0) >= 3 ? "strong" : (metrics.topicClusters?.length || 0) >= 1 ? "neutral" : "weak",
			evidence: (metrics.topicClusters?.length || 0) >= 3
				? `${metrics.topicClusters?.length || 0} distinct topic clusters identified.`
				: (metrics.topicClusters?.length || 0) >= 1
				? `${metrics.topicClusters?.length || 0} topic cluster(s) detected.`
				: "No clear topic clusters identified.",
			impact: "Topic clusters help viewers know what to expect from your channel.",
		},
		{
			id: "theme-action",
			label: "Theme Recommendation",
			severity: "neutral",
			evidence: themeSeverity === "strong"
				? "Continue focusing on your strongest themes."
				: "Reduce one-off topics and repeat your strongest themes.",
			impact: "Repeating themes builds authority and improves recommendations.",
		},
	];

	// FORMAT CONSISTENCY
	const durations = videos.map(v => v.durationSec || 0).filter(d => d > 0);
	const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 300;
	const durationVariance = durations.length > 0
		? durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length
		: 0;
	const durationCV = avgDuration > 0 ? Math.sqrt(durationVariance) / avgDuration : 1;
	const formatScore = Math.max(20, Math.min(100, Math.round(100 - durationCV * 80)));
	const formatSeverity: Severity = formatScore >= 70 ? "strong" : formatScore >= 40 ? "neutral" : "weak";

	const formatInsights: ScoredInsight[] = [
		{
			id: "format-length",
			label: "Video Length Consistency",
			severity: formatSeverity,
			evidence: formatSeverity === "strong"
				? `Videos maintain consistent length (~${Math.round(avgDuration / 60)} min average).`
				: formatSeverity === "neutral"
				? `Video lengths vary moderately (~${Math.round(avgDuration / 60)} min average).`
				: `Video lengths vary significantly (${Math.round(avgDuration / 60)} min average with high variance).`,
			impact: formatSeverity === "strong"
				? "Consistent format helps viewers know what to expect."
				: "Varying formats may confuse viewer expectations.",
		},
		{
			id: "format-structure",
			label: "Format Pattern",
			severity: formatScore >= 60 ? "strong" : "neutral",
			evidence: formatScore >= 60
				? "Videos follow a recognizable format pattern."
				: "No consistent format pattern detected.",
			impact: "Repeatable formats improve production efficiency and viewer retention.",
		},
		{
			id: "format-action",
			label: "Format Recommendation",
			severity: "neutral",
			evidence: formatSeverity === "strong"
				? "Continue with your proven format."
				: "Identify your highest-performing format and repeat it more often.",
			impact: "Consistent formats build audience expectations and improve retention.",
		},
	];

	// WINNING TOPICS
	const topicsScore = scores.categories["Winning Topics"];
	const topicsSeverity = getSeverity(topicsScore);
	const topicsInsights = createInsights("topics", topicsScore, [
		{
			condition: metrics.commonKeywords.length < 3,
			insight: {
				id: "topics-scattered",
				label: "No Clear Winning Topics",
				severity: "weak",
				evidence: `Content spans too many unrelated topics.`,
				impact: "No topic cluster to double down on.",
				action: "Analyze your top 5 videos and identify shared themes.",
			},
		},
		{
			condition: metrics.commonKeywords.length >= 5,
			insight: {
				id: "topics-clear",
				label: "Topic Clusters Identified",
				severity: "strong",
				evidence: `Top topics: ${keywordList}.`,
				impact: "Clear clusters enable focused content strategy.",
			},
		},
	]);

	return {
		"Viral Potential": {
			score: viralScore,
			severity: viralSeverity,
			summary: viralSeverity === "strong"
				? `${aboveMedian} of ${totalVideos} videos beat median with consistent performance.`
				: viralSeverity === "concerning"
				? `Only ${aboveMedian} of ${totalVideos} videos exceeded median. High volatility detected.`
				: `${aboveMedian} of ${totalVideos} videos beat median. Room for improvement.`,
			insights: viralInsights,
		},
		"Engagement Signals": {
			score: engagementScore,
			severity: engagementSeverity,
			summary: `${engagementRate.toFixed(2)}% engagement rate. ${avgComments.toFixed(0)} avg comments per video.`,
			insights: engagementInsights,
		},
		"SEO Strategy": {
			score: seoScore,
			severity: seoSeverity,
			summary: `${metrics.commonKeywords.length} recurring keywords. Avg title: ${avgTitleLength} chars.`,
			insights: seoInsights,
		},
		"Posting Consistency": {
			score: uploadScore,
			severity: uploadSeverity,
			summary: `Upload cadence: ${metrics.postingFrequency}.`,
			insights: uploadInsights,
		},
		"Thumbnail Strategy": {
			score: thumbScore,
			severity: thumbSeverity,
			summary: thumbSeverity === "strong" ? "Consistent visual branding." : "Visual branding varies.",
			insights: thumbInsights,
		},
		"Content Clusters": {
			score: topicsScore,
			severity: topicsSeverity,
			summary: metrics.commonKeywords.length >= 3
				? `Top topics: ${keywordList}.`
				: "No clear topic clusters detected.",
			insights: topicsInsights,
		},
		"Channel Positioning": {
			score: identityScore,
			severity: identitySeverity,
			summary: identitySeverity === "strong"
				? "Clear channel identity and positioning."
				: "Channel positioning needs refinement.",
			insights: identityInsights,
		},
		"Theme Consistency": {
			score: themeScore,
			severity: themeSeverity,
			summary: themeSeverity === "strong"
				? "Videos focus on consistent themes."
				: "Theme focus could be stronger.",
			insights: themeInsights,
		},
		"Format Consistency": {
			score: formatScore,
			severity: formatSeverity,
			summary: formatSeverity === "strong"
				? "Videos follow a consistent format."
				: "Format varies across uploads.",
			insights: formatInsights,
		},
		"Replication Score": {
			score: Math.round((viralScore + engagementScore + uploadScore) / 3),
			severity: getSeverity(Math.round((viralScore + engagementScore + uploadScore) / 3)),
			summary: viewsCV < 0.8
				? "Replicable formula detected."
				: "No consistent formula identified.",
			insights: viralInsights.slice(0, 2), // Reuse viral insights
		},
	};
}

type ScoringCategory =
	| "Viral Potential"
	| "Audience Engagement"
	| "Discoverability / SEO"
	| "Upload Consistency"
	| "Thumbnail Performance"
	| "Channel Identity & Focus"
	| "Winning Topics"
	| "Channel Score";

const CATEGORY_WEIGHTS: Record<ScoringCategory, number> = {
	"Viral Potential": 0.3,
	"Audience Engagement": 0.2,
	"Discoverability / SEO": 0.15,
	"Upload Consistency": 0.15,
	"Thumbnail Performance": 0.1,
	"Channel Identity & Focus": 0.1,
	"Winning Topics": 0,
	"Channel Score": 0,
};

function clamp(val: number, min = 0, max = 100) {
	return Math.max(min, Math.min(max, val));
}

function average(nums: number[]) {
	const arr = nums.filter((n) => Number.isFinite(n));
	if (!arr.length) return 0;
	return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function parseISODuration(duration?: string) {
	if (!duration) return undefined;
	const match =
		/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(duration) ||
		/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(duration);
	if (!match) return undefined;
	const [, dH, dM, dS, dd, dh2, dm2, ds2] = match;
	const days = Number(dd) || 0;
	const hours = Number(dH || dh2) || 0;
	const minutes = Number(dM || dm2) || 0;
	const seconds = Number(dS || ds2) || 0;
	return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

function computeScores(input: { channel: YoutubeChannel; videos: YoutubeVideo[]; metrics: any }) {
	const { channel, videos, metrics } = input;
	const subs = channel.subscriberCount || 0;
	const recent = videos.slice(0, 20);
	const views = recent.map((v) => v.views || 0);
	const likes = recent.map((v) => v.likes || 0);
	const comments = recent.map((v) => v.comments || 0);

	// Viral Potential (normalize by subs when possible)
	const avgViews = average(views);
	const viewsPerSub = subs > 0 ? avgViews / subs : 0;
	const viralViewsScore = clamp(Math.log10(viewsPerSub * 1_000 + 1) * 25); // ~0-100
	const outlierRatio = (() => {
		if (!views.length) return 0;
		const sorted = [...views].sort((a, b) => a - b);
		const median = sorted[Math.floor(sorted.length / 2)] || 0;
		const max = Math.max(...views);
		return median > 0 ? clamp((max / median) * 20) : 0;
	})();
	const shortVideos = recent.filter((v) => (v.durationSec || 0) > 0 && (v.durationSec || 0) <= 90);
	const longVideos = recent.filter((v) => (v.durationSec || 0) > 90);
	const shortAvg = average(shortVideos.map((v) => v.views || 0));
	const longAvg = average(longVideos.map((v) => v.views || 0));
	const shortsVsLong = clamp(
		shortAvg + longAvg > 0 ? ((Math.max(shortAvg, longAvg) / Math.max(1, Math.min(shortAvg, longAvg)))) * 15 : 0,
	);
	const viralScore = clamp((viralViewsScore * 0.6 + outlierRatio * 0.25 + shortsVsLong * 0.15), 0, 100);

	// Engagement
	const likeRate = avgViews > 0 ? average(likes) / Math.max(1, avgViews) : 0;
	const commentRate = avgViews > 0 ? average(comments) / Math.max(1, avgViews) : 0;
	const likeScore = clamp(Math.log10(likeRate * 1_000 + 1) * 25);
	const commentScore = clamp(Math.log10(commentRate * 2_000 + 1) * 25);
	const engagementConsistency = (() => {
		if (likes.length < 3) return 50;
		const avg = average(likes);
		if (avg === 0) return 20;
		const variance = average(likes.map((l) => Math.pow(l - avg, 2)));
		const cv = Math.sqrt(variance) / (avg || 1);
		return clamp(100 - cv * 80);
	})();
	const engagementScore = clamp(likeScore * 0.45 + commentScore * 0.25 + engagementConsistency * 0.3);

	// Discoverability
	const titleLengths = recent.map((v) => (v.title || "").length).filter(Boolean);
	const titleLengthScore = (() => {
		if (!titleLengths.length) return 50;
		const avg = average(titleLengths);
		// 38-64 sweet spot
		const diff = Math.abs(avg - 50);
		return clamp(100 - diff * 2);
	})();
	const keywordScore = clamp((metrics.commonKeywords?.length || 0) * 6);
	const discoverabilityScore = clamp(titleLengthScore * 0.55 + keywordScore * 0.45);

	// Upload Consistency
	const cadenceScore = (() => {
		const freq = metrics.postingFrequency || "";
		if (freq.includes("Daily")) return 95;
		if (freq.includes("Every 2-3 days")) return 90;
		if (freq.includes("Weekly")) return 80;
		if (freq.includes("Bi-weekly")) return 65;
		if (freq.includes("Sporadic")) return 45;
		return 60;
	})();
	const uploadConsistencyScore = cadenceScore;

	// Thumbnail Performance
	const thumbConsistency = (() => {
		const palettes = recent.map((v) => (v.thumbnails?.high?.url || v.thumbnails?.default?.url || "").split("/").slice(-1)[0]);
		const unique = new Set(palettes.filter(Boolean));
		if (!palettes.length) return 40;
		const ratio = unique.size / palettes.length;
		return clamp(100 - ratio * 60);
	})();
	const thumbTextPattern = titleLengthScore; // reuse as proxy
	const thumbnailScore = clamp(thumbConsistency * 0.6 + thumbTextPattern * 0.4);

	// Channel Identity & Focus (uses keyword focus + bio clarity)
	const topicScore = clamp(keywordScore * 1.0);
	const bioClarity = clamp((channel.description || "").length > 80 ? 85 : 50 + (channel.description || "").length * 0.35, 0, 95);
	const identityScore = clamp((bioClarity * 0.5) + (titleLengthScore * 0.25) + (topicScore * 0.25));

	// Winning Topics (dominance: a few clusters outperform baseline)
	const winningTopicsScore = (() => {
		if (!videos.length) return 50;
		// Approximate clustering via keywords frequency against average views
		const avg = average(videos.map((v) => v.views || 0)) || 0;
		const keywords = metrics.commonKeywords || [];
		if (!keywords.length || avg === 0) return clamp(topicScore);
		// treat top keywords as clusters; reward if their implied views exceed baseline
		const topClusterBoost = Math.min(100, (keywords[0]?.count || 0) * 4);
		const dominanceBoost = avg > 0 ? clamp((keywords.length ? topClusterBoost : 0) + Math.min(30, avg / (avg + 1) * 30)) : 50;
		return clamp(Math.max(60, dominanceBoost));
	})();

	const categories: Record<ScoringCategory, number> = {
		"Viral Potential": viralScore,
		"Audience Engagement": engagementScore,
		"Discoverability / SEO": discoverabilityScore,
		"Upload Consistency": uploadConsistencyScore,
		"Thumbnail Performance": thumbnailScore,
		"Channel Identity & Focus": clamp((topicScore + identityScore) / 2),
		"Winning Topics": winningTopicsScore,
		"Channel Score": 0, // derived after weighted
	};

	let total = 0;
	for (const [k, w] of Object.entries(CATEGORY_WEIGHTS)) {
		total += (categories[k as ScoringCategory] || 0) * w;
	}
	categories["Channel Score"] = clamp(total); // treat as overall

	const sorted = Object.entries(categories)
		.filter(([k]) => k !== "Channel Score")
		.sort((a, b) => b[1] - a[1]);
	const strengths = sorted.slice(0, 3).map(([k, v]) => ({ category: k, score: Math.round(v) }));
	const weaknesses = sorted.slice(-3).map(([k, v]) => ({ category: k, score: Math.round(v) }));

	const improvements = weaknesses.map((w) => {
		switch (w.category) {
			case "Viral Potential":
				return "This channel tends to test new hooks and measure 48h performance before doubling down.";
			case "Audience Engagement":
				return "This channel consistently uses specific CTAs and replies to top comments quickly.";
			case "Discoverability / SEO":
				return "Front-load 1 keyword in the first 40 chars of title and first line of description.";
			case "Upload Consistency":
				return "Lock a 2-3 day schedule and batch two videos ahead to avoid gaps.";
			case "Thumbnail Performance":
				return "Standardize a template: bold 1-3 words, strong face/emotion, consistent palette.";
			case "Channel Identity & Focus":
				return "This channel tends to perform best when videos are released in short topic runs (2-3 uploads).";
			default:
				return "Tighten packaging and cadence across next 5 uploads.";
		}
	});

	const percentile = clamp(Math.round(total * 0.95));
	const contextLabel =
		total >= 86 ? "Elite" : total >= 71 ? "High Growth" : total >= 41 ? "Growing" : "Emerging";

	return {
		total: Math.round(total),
		categories: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, Math.round(v)])) as Record<
			ScoringCategory,
			number
		>,
		strengths,
		weaknesses,
		improvements,
		percentile,
		contextLabel,
	};
}

interface SoWhatSection {
	context: string;
	strengths: string[];
	limits: string[];
	actions: string[];
}

async function generateSoWhat(
	client: OpenAI,
	channelName: string,
	userNiche: string,
	analysisData: any,
	scores: any
): Promise<Record<string, SoWhatSection>> {
	const prompt = `You are a YouTube strategy analyst. Analyze ${channelName}'s channel data and generate contextual "So What?" sections for a creator in the "${userNiche}" niche.

CHANNEL DATA:
${JSON.stringify({ scores, metrics: analysisData.metrics, videoCount: analysisData.videos?.length }, null, 2)}

For each tab, generate a "So What?" section following this EXACT structure:
- context: 1 sentence explaining why this creator's approach matters for ${userNiche} creators
- strengths: 2 bullets of what this creator does well (that ${userNiche} creators could learn from)
- limits: 2 bullets of what limits their approach (or would break if copied incorrectly)
- actions: 3 bullets for "${userNiche}" creators - one pattern to adopt, one mistake to avoid, one constraint to respect

RULES:
- Speak directly to the user ("If you post ${userNiche} content...")
- Reference ${channelName} by name
- Stay observational, not prescriptive
- No marketing language, no emojis, no guarantees
- Be analytical and educational

Return JSON with this structure:
{
  "viral": { "context": "...", "strengths": ["...", "..."], "limits": ["...", "..."], "actions": ["...", "...", "..."] },
  "search": { "context": "...", "strengths": ["...", "..."], "limits": ["...", "..."], "actions": ["...", "...", "..."] },
  "upload": { "context": "...", "strengths": ["...", "..."], "limits": ["...", "..."], "actions": ["...", "...", "..."] },
  "thumb": { "context": "...", "strengths": ["...", "..."], "limits": ["...", "..."], "actions": ["...", "...", "..."] },
  "topics": { "context": "...", "strengths": ["...", "..."], "limits": ["...", "..."], "actions": ["...", "...", "..."] },
  "identity": { "context": "...", "strengths": ["...", "..."], "limits": ["...", "..."], "actions": ["...", "...", "..."] }
}`;

	try {
		const completion = await client.chat.completions.create({
			model: "gpt-4.1-mini",
			messages: [
				{ role: "system", content: "You are a precise YouTube growth analyst. Return only valid JSON." },
				{ role: "user", content: prompt },
			],
			response_format: { type: "json_object" },
		});

		const content = completion.choices?.[0]?.message?.content || "{}";
		return JSON.parse(content);
	} catch (err) {
		console.error("Failed to generate So What sections:", err);
		return {};
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const channelUrl = body?.channelUrl?.trim();
		const userNiche = body?.userNiche?.trim() || "";
		if (!channelUrl) {
			return NextResponse.json({ error: "channelUrl is required" }, { status: 400 });
		}

		const channelId = await resolveChannelId(channelUrl);
		const channel = await fetchChannel(channelId);

		if (!channel.uploadsPlaylistId) {
			throw new Error("Could not find uploads playlist for this channel.");
		}

		const videos = await fetchRecentVideos(channel.uploadsPlaylistId);
		const metrics = deriveMetrics(videos);
		const score = computeScores({ channel, videos, metrics });
		const searchVisibility = computeSearchVisibility(videos, metrics.commonKeywords);

		const payload = { channel, videos, metrics, searchVisibility };

		const openaiKey = process.env.OPENAI_API_KEY;
		let analysis: Record<string, CategoryAnalysis> = buildHeuristicAnalysis({ ...payload, scores: score });

		let aiSummary: {
			summary: string;
			recommendations: string[];
			doubleDown: string;
		} = {
			summary: "",
			recommendations: score.improvements.slice(0, 3),
			doubleDown: score.strengths[0] ? `Double down on ${score.strengths[0].category}` : "",
		};

		let soWhat: Record<string, SoWhatSection> = {};

		if (openaiKey) {
			const client = new OpenAI({ apiKey: openaiKey });
			const prompt = `
You are a precise YouTube growth analyst. You will receive deterministic scores (0-100) already calculated. DO NOT create or change numeric scores.
Return JSON with: { "summary": string, "recommendations": [3 strings], "double_down": string }.
Focus on why scores are high/low, repeating patterns across top videos, and 3 high-impact next actions. Keep concise.

Data:
${JSON.stringify({ score, payload }, null, 2)}
`;

			const completion = await client.chat.completions.create({
				model: "gpt-4.1-mini",
				messages: [
					{ role: "system", content: "You are concise, factual, and never invent numbers." },
					{ role: "user", content: prompt },
				],
				response_format: { type: "json_object" },
			});

			const content = completion.choices?.[0]?.message?.content || "";
			try {
				const parsed = JSON.parse(content);
				if (parsed && typeof parsed === "object") {
					aiSummary = {
						summary: parsed.summary || aiSummary.summary,
						recommendations: parsed.recommendations || aiSummary.recommendations,
						doubleDown: parsed.double_down || aiSummary.doubleDown,
					};
				}
			} catch {
				// fallback to deterministic recs
			}

			// Auto-detect niche from keywords if user didn't provide one
			const detectedNiche = metrics.commonKeywords.slice(0, 3).map(k => k.word).join(", ") || "content creation";
			const effectiveNiche = userNiche || detectedNiche;

			// Always generate So What sections
			soWhat = await generateSoWhat(client, channel.title, effectiveNiche, payload, score);
		}

		// Include detected niche in response for frontend
		const detectedNiche = metrics.commonKeywords.slice(0, 3).map(k => k.word).join(", ") || "content creation";

		return NextResponse.json({
			analysis,
			data: payload,
			score,
			aiSummary,
			soWhat,
			detectedNiche,
		});
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

