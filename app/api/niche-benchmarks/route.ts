import { NextResponse } from "next/server";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

interface NicheChannel {
	id: string;
	title: string;
	thumbnail: string;
	subscriberCount: number;
	viewCount: number;
	videoCount: number;
	avgViews: number;
}

interface NicheBenchmark {
	channels: NicheChannel[];
	medianSubscribers: number;
	medianViews: number;
	medianVideos: number;
	avgUploadFrequency: string;
	topPatterns: string[];
	channelPosition: {
		subscriberPercentile: number;
		viewsPercentile: number;
		verdict: string;
	};
}

async function ytFetch(path: string, params: Record<string, string>) {
	const key = process.env.YOUTUBE_API_KEY;
	if (!key) throw new Error("YOUTUBE_API_KEY not set");

	const search = new URLSearchParams({ key, ...params });
	const url = `${YT_BASE}${path}?${search.toString()}`;
	const res = await fetch(url, { next: { revalidate: 300 } });
	if (!res.ok) {
		throw new Error(`YouTube API ${path} failed: ${res.status}`);
	}
	return res.json();
}

function toNumber(val?: string): number {
	if (!val) return 0;
	const num = Number(val);
	return Number.isFinite(num) ? num : 0;
}

function median(arr: number[]): number {
	if (!arr.length) return 0;
	const sorted = [...arr].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
}

function percentile(value: number, arr: number[]): number {
	if (!arr.length) return 50;
	const sorted = [...arr].sort((a, b) => a - b);
	const below = sorted.filter(v => v < value).length;
	return Math.round((below / sorted.length) * 100);
}

async function findSimilarChannels(
	keywords: string[],
	currentChannelId: string
): Promise<string[]> {
	// Search for channels with similar keywords
	const query = keywords.slice(0, 3).join(" ");

	const searchRes = await ytFetch("/search", {
		part: "id",
		type: "channel",
		q: query,
		maxResults: "15",
	});

	const channelIds: string[] = (searchRes.items || [])
		.map((item: { id?: { channelId?: string } }) => item.id?.channelId)
		.filter((id: string | undefined): id is string => !!id && id !== currentChannelId);

	return channelIds.slice(0, 10);
}

async function getChannelDetails(channelIds: string[]): Promise<NicheChannel[]> {
	if (!channelIds.length) return [];

	const res = await ytFetch("/channels", {
		part: "snippet,statistics",
		id: channelIds.join(","),
	});

	return (res.items || []).map((item: {
		id: string;
		snippet?: { title?: string; thumbnails?: { default?: { url?: string } } };
		statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
	}) => {
		const snippet = item.snippet || {};
		const stats = item.statistics || {};
		const subscribers = toNumber(stats.subscriberCount);
		const views = toNumber(stats.viewCount);
		const videos = toNumber(stats.videoCount);

		return {
			id: item.id,
			title: snippet.title || "Unknown",
			thumbnail: snippet.thumbnails?.default?.url || "",
			subscriberCount: subscribers,
			viewCount: views,
			videoCount: videos,
			avgViews: videos > 0 ? Math.round(views / videos) : 0,
		};
	});
}

function analyzePatterns(channels: NicheChannel[]): string[] {
	const patterns: string[] = [];

	// Analyze upload frequency
	const avgVideos = channels.reduce((sum, c) => sum + c.videoCount, 0) / channels.length;
	if (avgVideos > 500) {
		patterns.push("High-volume uploaders dominate this niche (500+ videos typical)");
	} else if (avgVideos > 100) {
		patterns.push("Moderate content libraries in this niche (100-500 videos typical)");
	} else {
		patterns.push("Smaller content libraries in this niche (<100 videos typical)");
	}

	// Analyze views-to-subscribers ratio
	const avgViewsPerSub = channels.reduce((sum, c) =>
		sum + (c.subscriberCount > 0 ? c.viewCount / c.subscriberCount : 0), 0
	) / channels.length;

	if (avgViewsPerSub > 100) {
		patterns.push("High discoverability niche - videos reach beyond subscriber base");
	} else if (avgViewsPerSub > 50) {
		patterns.push("Moderate discoverability - balanced subscriber and search traffic");
	} else {
		patterns.push("Subscriber-driven niche - growth relies on subscriber retention");
	}

	// Analyze channel size distribution
	const largeChannels = channels.filter(c => c.subscriberCount > 100_000).length;
	const pctLarge = Math.round((largeChannels / channels.length) * 100);
	if (pctLarge > 50) {
		patterns.push(`Competitive niche - ${pctLarge}% of similar channels have 100K+ subscribers`);
	} else {
		patterns.push(`Emerging niche - only ${pctLarge}% of similar channels exceed 100K subscribers`);
	}

	return patterns;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { channelId, keywords, subscriberCount, viewCount } = body;

		if (!channelId || !keywords?.length) {
			return NextResponse.json(
				{ error: "channelId and keywords are required" },
				{ status: 400 }
			);
		}

		// Find similar channels
		const similarIds = await findSimilarChannels(keywords, channelId);

		if (similarIds.length === 0) {
			return NextResponse.json({
				channels: [],
				medianSubscribers: 0,
				medianViews: 0,
				medianVideos: 0,
				avgUploadFrequency: "Unknown",
				topPatterns: ["Not enough similar channels found for comparison"],
				channelPosition: {
					subscriberPercentile: 50,
					viewsPercentile: 50,
					verdict: "Insufficient data for niche comparison",
				},
			});
		}

		// Get details for similar channels
		const channels = await getChannelDetails(similarIds);

		// Calculate benchmarks
		const subscribers = channels.map(c => c.subscriberCount);
		const views = channels.map(c => c.viewCount);
		const videos = channels.map(c => c.videoCount);

		const medianSubs = median(subscribers);
		const medianViews = median(views);
		const medianVids = median(videos);

		// Calculate channel position
		const subPercentile = percentile(subscriberCount || 0, subscribers);
		const viewPercentile = percentile(viewCount || 0, views);

		let verdict = "";
		if (subPercentile >= 75 && viewPercentile >= 75) {
			verdict = "Top performer in this niche - maintain momentum";
		} else if (subPercentile >= 50 || viewPercentile >= 50) {
			verdict = "Above average in this niche - room to grow into top tier";
		} else if (subPercentile >= 25 || viewPercentile >= 25) {
			verdict = "Below median in this niche - focus on differentiation";
		} else {
			verdict = "Early stage in this niche - study top performers";
		}

		// Analyze patterns
		const topPatterns = analyzePatterns(channels);

		// Calculate avg upload frequency
		const avgVideosPerChannel = videos.reduce((a, b) => a + b, 0) / videos.length;
		let avgUploadFrequency = "Unknown";
		if (avgVideosPerChannel > 1000) avgUploadFrequency = "Daily uploaders common";
		else if (avgVideosPerChannel > 200) avgUploadFrequency = "Weekly uploaders typical";
		else avgUploadFrequency = "Less frequent uploaders";

		const benchmark: NicheBenchmark = {
			channels: channels.slice(0, 6), // Return top 6 for display
			medianSubscribers: medianSubs,
			medianViews: medianViews,
			medianVideos: medianVids,
			avgUploadFrequency,
			topPatterns,
			channelPosition: {
				subscriberPercentile: subPercentile,
				viewsPercentile: viewPercentile,
				verdict,
			},
		};

		return NextResponse.json(benchmark);
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Failed to get benchmarks" },
			{ status: 500 }
		);
	}
}
