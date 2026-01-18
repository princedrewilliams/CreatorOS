// YouTube API Fetcher - Extracted and Extended for Learning Lab

import type {
	YoutubeChannel,
	YoutubeVideo,
	YoutubeComment,
	VideoFetchOptions,
} from "./types";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

function toNumber(val?: string): number | undefined {
	if (!val) return undefined;
	const num = Number(val);
	return Number.isFinite(num) ? num : undefined;
}

function parseISODuration(duration?: string): number | undefined {
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

export async function ytFetch(
	path: string,
	params: Record<string, string>
): Promise<any> {
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

function extractHandleOrId(channelUrl: string): {
	type: "id" | "handle" | "custom" | "search";
	value: string;
} {
	try {
		const url = new URL(channelUrl);
		const path = url.pathname;
		if (path.includes("/channel/")) {
			return {
				type: "id",
				value: path.split("/channel/")[1].split(/[/?]/)[0],
			};
		}
		if (path.includes("/@")) {
			return { type: "handle", value: path.split("/@")[1].split(/[/?]/)[0] };
		}
		if (path.includes("/c/")) {
			return { type: "custom", value: path.split("/c/")[1].split(/[/?]/)[0] };
		}
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

export async function resolveChannelId(input: string): Promise<string> {
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

export async function fetchChannel(channelId: string): Promise<YoutubeChannel> {
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
		thumbnail:
			snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
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

export async function fetchRecentVideos(
	uploadsPlaylistId: string,
	options: VideoFetchOptions = {}
): Promise<YoutubeVideo[]> {
	const {
		maxResults = 25,
		includeDescription = false,
		includeTags = false,
	} = options;

	const allItems: any[] = [];
	let pageToken: string | undefined;
	const perPage = Math.min(50, maxResults);

	// Paginate through playlist items
	while (allItems.length < maxResults) {
		const params: Record<string, string> = {
			part: "snippet,contentDetails",
			maxResults: String(Math.min(perPage, maxResults - allItems.length)),
			playlistId: uploadsPlaylistId,
		};
		if (pageToken) {
			params.pageToken = pageToken;
		}

		const result = await ytFetch("/playlistItems", params);
		const items = result.items || [];
		allItems.push(...items);

		pageToken = result.nextPageToken;
		if (!pageToken || items.length === 0) break;
	}

	const baseList: YoutubeVideo[] = allItems.slice(0, maxResults).map((item) => {
		const snippet = item.snippet || {};
		return {
			id: snippet.resourceId?.videoId || item.contentDetails?.videoId || "",
			title: snippet.title || "",
			description: includeDescription ? snippet.description || "" : undefined,
			publishedAt: snippet.publishedAt || "",
			thumbnails: snippet.thumbnails || {},
		};
	});

	const ids = baseList.map((v) => v.id).filter(Boolean);
	if (!ids.length) return baseList;

	// Fetch detailed video info
	const detailed = await fetchVideoDetails(ids, {
		includeDescription,
		includeTags,
	});
	const map = new Map(detailed.map((v) => [v.id, v]));

	return baseList.map((v) => {
		const d = map.get(v.id);
		return {
			...v,
			description: d?.description ?? v.description,
			views: d?.views ?? v.views,
			likes: d?.likes ?? v.likes,
			comments: d?.comments ?? v.comments,
			durationSec: d?.durationSec ?? v.durationSec,
			tags: d?.tags ?? v.tags,
			thumbnails: v.thumbnails || d?.thumbnails || {},
			isShort: d?.isShort ?? v.isShort,
		};
	});
}

export async function fetchVideoDetails(
	ids: string[],
	options: { includeDescription?: boolean; includeTags?: boolean } = {}
): Promise<YoutubeVideo[]> {
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
			const durationSec = parseISODuration(content.duration);

			results.push({
				id: item.id,
				title: snippet.title,
				description: options.includeDescription
					? snippet.description
					: undefined,
				publishedAt: snippet.publishedAt,
				durationSec,
				views: toNumber(stats.viewCount),
				likes: toNumber(stats.likeCount),
				comments: toNumber(stats.commentCount),
				tags: options.includeTags ? snippet.tags || [] : undefined,
				thumbnails: snippet.thumbnails || {},
				isShort: durationSec !== undefined && durationSec <= 60,
			});
		}
	}
	return results;
}

export async function fetchVideoComments(
	videoId: string,
	maxResults = 50
): Promise<YoutubeComment[]> {
	try {
		const result = await ytFetch("/commentThreads", {
			part: "snippet",
			videoId,
			maxResults: String(Math.min(100, maxResults)),
			order: "relevance",
		});

		return (result.items || []).map((item: any) => {
			const comment = item.snippet?.topLevelComment?.snippet || {};
			return {
				id: item.id,
				videoId,
				authorName: comment.authorDisplayName || "Anonymous",
				authorProfileImage: comment.authorProfileImageUrl,
				text: comment.textDisplay || comment.textOriginal || "",
				likeCount: comment.likeCount || 0,
				publishedAt: comment.publishedAt || "",
				isReply: false,
			};
		});
	} catch (error) {
		// Comments might be disabled for some videos
		console.warn(`Failed to fetch comments for video ${videoId}:`, error);
		return [];
	}
}

export async function fetchCommentsForVideos(
	videoIds: string[],
	commentsPerVideo = 50
): Promise<YoutubeComment[]> {
	const allComments: YoutubeComment[] = [];

	// Fetch comments in parallel with a concurrency limit
	const batchSize = 5;
	for (let i = 0; i < videoIds.length; i += batchSize) {
		const batch = videoIds.slice(i, i + batchSize);
		const results = await Promise.all(
			batch.map((id) => fetchVideoComments(id, commentsPerVideo))
		);
		allComments.push(...results.flat());
	}

	return allComments;
}
