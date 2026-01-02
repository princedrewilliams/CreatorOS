import { NextResponse } from "next/server";
import OpenAI from "openai";

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
		averageTitleLength: Number.isFinite(averageTitleLength) ? Math.round(averageTitleLength) : 0,
		commonKeywords: keywords,
	};
}

function buildHeuristicAnalysis(payload: {
	channel: YoutubeChannel;
	videos: YoutubeVideo[];
	metrics: ReturnType<typeof deriveMetrics>;
}) {
	const { metrics } = payload;

	const baseScore = (boost: number) => {
		let score = 50 + boost;
		if (metrics.postingFrequency.includes("Daily")) score += 10;
		if (metrics.postingFrequency.includes("Weekly")) score += 5;
		score = Math.min(98, Math.max(35, score));
		return score;
	};

	const simple = (summary: string, insights: string[], scoreBoost = 0) => ({
		score: baseScore(scoreBoost),
		summary,
		insights,
	});

	const keywordList = metrics.commonKeywords.slice(0, 5).map((k) => k.word).join(", ") || "—";

	return {
		"Viral Potential": simple("Recent uploads show repeatable hooks and pacing.", [
			"Double down on topics that repeat across top titles.",
			"Open faster: tighten first 5 seconds to keep watch time.",
			"Test shorter intros on next 3 uploads.",
		]),
		"Engagement Signals": simple("Audience responds best when the promise is clear early.", [
			"Use 1 clear promise per title/thumbnail.",
			"Ask 1 specific question in the first 20 seconds to drive comments.",
			"Pin a comment with a CTA on next uploads.",
		]),
		"SEO Strategy": simple(`Leverage recurring keywords: ${keywordList}.`, [
			"Front-load primary keyword in first 40 chars of title.",
			"Mirror the keyword in the first 150 chars of description.",
			"Group uploads into 2-3 topic clusters for session depth.",
		]),
		"Posting Consistency": simple(`Cadence: ${metrics.postingFrequency}.`, [
			"Lock a repeatable schedule (same days/time).",
			"Batch record 2 videos ahead to maintain cadence.",
			"Rotate 2 reliable formats to avoid misses.",
		]),
		"Thumbnail Strategy": simple("Keep contrast high and text minimal.", [
			"Use 1-3 words max with bold contrast.",
			"Keep subject left/right to leave negative space for text.",
			"Maintain consistent color palette for brand recall.",
		]),
		"Content Clusters": simple(`Top words hint clusters: ${keywordList}.`, [
			"Pick 2 primary clusters and publish 3-in-a-row for each.",
			"Create 1 playlist per cluster and link it in descriptions.",
			"Refresh older winners with updated thumbnails/titles.",
		]),
		"Channel Positioning": simple("Position around a clear promise and niche proof.", [
			"Add a 1-line promise to the channel description.",
			"Use the same promise in channel banner CTA.",
			"Open videos with proof that matches the promise.",
		]),
		"Replication Score": simple("Good fundamentals; tighten packaging and cadence.", [
			"Document a title formula and reuse it for 5 uploads.",
			"Standardize thumbnail template for faster iteration.",
			"Review retention dips at 30s/90s and script against them.",
		]),
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

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const channelUrl = body?.channelUrl?.trim();
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

		const payload = { channel, videos, metrics };

		const openaiKey = process.env.OPENAI_API_KEY;
		let analysis: Record<
			string,
			{ score: number; summary: string; insights: string[] }
		> = buildHeuristicAnalysis(payload);

		let aiSummary: {
			summary: string;
			recommendations: string[];
			doubleDown: string;
		} = {
			summary: "",
			recommendations: score.improvements.slice(0, 3),
			doubleDown: score.strengths[0] ? `Double down on ${score.strengths[0].category}` : "",
		};

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
		}

		return NextResponse.json({
			analysis,
			data: payload,
			score,
			aiSummary,
		});
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

