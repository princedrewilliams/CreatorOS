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

	return (items.items || []).map((item: any) => {
		const snippet = item.snippet || {};
		return {
			id: snippet.resourceId?.videoId || item.contentDetails?.videoId || "",
			title: snippet.title || "",
			publishedAt: snippet.publishedAt || "",
			thumbnails: snippet.thumbnails || {},
		};
	});
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
	const { metrics, videos } = payload;

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

		const payload = { channel, videos, metrics };

		const openaiKey = process.env.OPENAI_API_KEY;
		let analysis: Record<
			string,
			{ score: number; summary: string; insights: string[] }
		> = buildHeuristicAnalysis(payload);

		if (openaiKey) {
			const client = new OpenAI({ apiKey: openaiKey });
			const prompt = `
You are a YouTube growth strategist. Given structured public channel data, return JSON with these exact keys:
- Viral Potential
- Engagement Signals
- SEO Strategy
- Posting Consistency
- Thumbnail Strategy
- Content Clusters
- Channel Positioning
- Replication Score

Each key value must be an object: { "score": 0-100, "summary": string, "insights": [2-3 short bullet strings] }.
Focus on concrete, specific recommendations.

Structured data:
${JSON.stringify(payload, null, 2)}
`;

			const completion = await client.chat.completions.create({
				model: "gpt-4.1-mini",
				messages: [
					{ role: "system", content: "You are a precise, concise YouTube channel analyst." },
					{ role: "user", content: prompt },
				],
				response_format: { type: "json_object" },
			});

			const content = completion.choices?.[0]?.message?.content || "";
			try {
				const parsed = JSON.parse(content);
				if (parsed && typeof parsed === "object") {
					analysis = parsed as typeof analysis;
				}
			} catch {
				// fall back to heuristic
			}
		}

		return NextResponse.json({
			analysis,
			data: payload,
		});
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

