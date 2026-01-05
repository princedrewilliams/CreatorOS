import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface TopicCluster {
	name: string;
	keywords: string[];
	videoCount: number;
	exampleVideos: ExampleVideo[];
}

interface ExampleVideo {
	title: string;
	views: number;
	publishedAt: string;
	matchType: "title" | "description";
	thumbnail?: string;
}

interface SEOSubscores {
	topicFocus: number;
	titleClarity: number;
	topicRepetition: number;
	metadataCompleteness: number;
}

interface SEOAnalysisResult {
	seoScore: number;
	subscores: SEOSubscores;
	explanation: string;
	topicClusters: TopicCluster[];
	chart: {
		labels: string[];
		data: number[];
	};
}

interface VideoData {
	id: string;
	title: string;
	description: string;
	publishedAt: string;
	views: number;
	tags?: string[];
	thumbnail?: string;
	metadataScore?: number;
}

// ═══════════════════════════════════════════════════════════════════
// STOP WORDS & BANNED TOKENS
// ═══════════════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
	"the", "and", "for", "with", "that", "this", "from", "your", "you", "are",
	"was", "have", "has", "what", "when", "how", "why", "into", "about", "just",
	"more", "some", "like", "than", "then", "them", "they", "their", "there",
	"these", "those", "been", "being", "were", "will", "would", "could", "should",
	"can", "but", "not", "all", "any", "each", "every", "both", "few", "most",
	"other", "such", "only", "own", "same", "very", "too", "also", "back", "even",
	"still", "well", "here", "where", "which", "while", "who", "whom", "whose",
	"its", "our", "out", "over", "off", "down", "now", "new", "get", "got",
	"one", "two", "first", "last", "next", "make", "made", "way", "may", "say",
	"see", "come", "take", "know", "think", "look", "want", "give", "use", "find",
]);

const BANNED_TOKENS = new Set([
	"https", "http", "www", "com", "net", "org", "co", "io",
	"visit", "link", "click", "subscribe", "follow", "official", "shop", "store",
	"bio", "merch", "promo", "discount", "code", "coupon", "giveaway", "sponsor",
	"video", "videos", "watch", "channel", "episode", "full", "part", "clip",
	"stream", "streaming", "live", "premiere", "upload", "uploaded", "content",
	"instagram", "twitter", "tiktok", "facebook", "snapchat", "discord", "twitch",
	"best", "top", "amazing", "incredible", "awesome", "epic", "crazy", "insane",
	"ultimate", "exclusive", "special", "bonus", "extra", "free", "latest",
]);

const CTA_PHRASES = [
	"visit our", "link in bio", "check out", "available at", "watch now",
	"click here", "subscribe to", "follow us", "join us", "sign up",
];

const VAGUE_PHRASES = [
	"you won't believe", "what happened", "this is why", "the truth about",
	"shocking", "unbelievable", "must see", "wait for it", "gone wrong",
];

// ═══════════════════════════════════════════════════════════════════
// YOUTUBE API HELPERS
// ═══════════════════════════════════════════════════════════════════

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function extractChannelId(channelUrl: string): Promise<string | null> {
	const patterns = [
		/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/@([a-zA-Z0-9_-]+)/,
		/youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
	];

	for (const pattern of patterns) {
		const match = channelUrl.match(pattern);
		if (match) {
			const identifier = match[1];
			if (identifier.startsWith("UC")) return identifier;
			return await resolveChannelId(identifier, channelUrl.includes("/@"));
		}
	}
	return null;
}

async function resolveChannelId(identifier: string, isHandle: boolean): Promise<string | null> {
	if (!YOUTUBE_API_KEY) return null;
	try {
		const searchParam = isHandle ? `@${identifier}` : identifier;
		const res = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchParam)}&key=${YOUTUBE_API_KEY}`
		);
		const data = await res.json();
		return data.items?.[0]?.snippet?.channelId || null;
	} catch {
		return null;
	}
}

async function fetchChannelData(channelId: string): Promise<{ description: string; subscriberCount: number } | null> {
	if (!YOUTUBE_API_KEY) return null;
	try {
		const res = await fetch(
			`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
		);
		const data = await res.json();
		const channel = data.items?.[0];
		if (!channel) return null;
		return {
			description: channel.snippet?.description || "",
			subscriberCount: parseInt(channel.statistics?.subscriberCount || "0", 10),
		};
	} catch {
		return null;
	}
}

async function fetchRecentVideos(channelId: string, maxResults: number = 30): Promise<VideoData[]> {
	if (!YOUTUBE_API_KEY) return [];
	try {
		const searchRes = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
		);
		const searchData = await searchRes.json();
		const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];
		if (videoIds.length === 0) return [];

		const videosRes = await fetch(
			`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}&key=${YOUTUBE_API_KEY}`
		);
		const videosData = await videosRes.json();

		return videosData.items?.map((video: any) => ({
			id: video.id,
			title: video.snippet?.title || "",
			description: video.snippet?.description || "",
			publishedAt: video.snippet?.publishedAt || "",
			views: parseInt(video.statistics?.viewCount || "0", 10),
			tags: video.snippet?.tags || [],
			thumbnail: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url,
		})) || [];
	} catch (error) {
		console.error("Error fetching videos:", error);
		return [];
	}
}

// ═══════════════════════════════════════════════════════════════════
// TEXT PROCESSING
// ═══════════════════════════════════════════════════════════════════

function cleanText(text: string): string {
	let cleaned = text.toLowerCase();
	cleaned = cleaned.replace(/https?:\/\/\S+/g, " ");
	cleaned = cleaned.replace(/www\.\S+/g, " ");
	for (const phrase of CTA_PHRASES) {
		cleaned = cleaned.replace(new RegExp(phrase, "gi"), " ");
	}
	cleaned = cleaned.replace(/\S+@\S+\.\S+/g, " ");
	cleaned = cleaned.replace(/[^a-z\s]/g, " ");
	cleaned = cleaned.replace(/\s+/g, " ").trim();
	return cleaned;
}

function isValidToken(word: string): boolean {
	if (word.length < 3) return false;
	if (STOP_WORDS.has(word)) return false;
	if (BANNED_TOKENS.has(word)) return false;
	if (/^\d+$/.test(word)) return false;
	return true;
}

function extractKeywords(text: string): string[] {
	return cleanText(text).split(/\s+/).filter(isValidToken);
}

// ═══════════════════════════════════════════════════════════════════
// TOPIC CLUSTER ANALYSIS
// ═══════════════════════════════════════════════════════════════════

function buildTopicClusters(videos: VideoData[], subscriberCount: number): TopicCluster[] {
	// Track keyword co-occurrence across videos
	const keywordVideos: Record<string, Set<number>> = {};
	const keywordInTitle: Record<string, Set<number>> = {};
	
	// Process each video
	videos.forEach((video, idx) => {
		const titleKeywords = extractKeywords(video.title);
		const descKeywords = extractKeywords(video.description.slice(0, 120));
		const allKeywords = [...new Set([...titleKeywords, ...descKeywords])];
		
		for (const kw of allKeywords) {
			if (!keywordVideos[kw]) keywordVideos[kw] = new Set();
			keywordVideos[kw].add(idx);
			
			if (titleKeywords.includes(kw)) {
				if (!keywordInTitle[kw]) keywordInTitle[kw] = new Set();
				keywordInTitle[kw].add(idx);
			}
		}
	});
	
	// Filter keywords that appear in at least 2 videos but not more than 70%
	const validKeywords = Object.entries(keywordVideos)
		.filter(([, videoSet]) => {
			const count = videoSet.size;
			return count >= 2 && count <= videos.length * 0.7;
		})
		.map(([kw]) => kw);
	
	// Group keywords by co-occurrence (simple clustering)
	const clusters: TopicCluster[] = [];
	const usedKeywords = new Set<string>();
	
	// Sort keywords by frequency (descending)
	const sortedKeywords = validKeywords.sort((a, b) => 
		keywordVideos[b].size - keywordVideos[a].size
	);
	
	for (const primaryKw of sortedKeywords) {
		if (usedKeywords.has(primaryKw)) continue;
		
		const primaryVideos = keywordVideos[primaryKw];
		const relatedKeywords = [primaryKw];
		
		// Find keywords that co-occur with this primary keyword
		for (const otherKw of sortedKeywords) {
			if (otherKw === primaryKw || usedKeywords.has(otherKw)) continue;
			
			const otherVideos = keywordVideos[otherKw];
			const overlap = [...primaryVideos].filter(v => otherVideos.has(v)).length;
			const overlapRatio = overlap / Math.min(primaryVideos.size, otherVideos.size);
			
			// If >50% overlap, group together
			if (overlapRatio > 0.5 && relatedKeywords.length < 5) {
				relatedKeywords.push(otherKw);
			}
		}
		
		// Mark all keywords in this cluster as used
		relatedKeywords.forEach(kw => usedKeywords.add(kw));
		
		// Get example videos for this cluster
		const clusterVideoIndices = [...primaryVideos];
		const exampleVideos = getExampleVideos(
			videos, 
			clusterVideoIndices, 
			primaryKw, 
			subscriberCount
		);
		
		// Generate cluster name
		const clusterName = generateClusterName(relatedKeywords);
		
		clusters.push({
			name: clusterName,
			keywords: relatedKeywords,
			videoCount: primaryVideos.size,
			exampleVideos,
		});
		
		if (clusters.length >= 5) break;
	}
	
	return clusters;
}

function generateClusterName(keywords: string[]): string {
	// Capitalize and join top 2-3 keywords
	const topKeywords = keywords.slice(0, 3);
	return topKeywords
		.map(kw => kw.charAt(0).toUpperCase() + kw.slice(1))
		.join(" & ");
}

function getExampleVideos(
	videos: VideoData[],
	videoIndices: number[],
	keyword: string,
	subscriberCount: number
): ExampleVideo[] {
	const candidates = videoIndices.map(idx => {
		const video = videos[idx];
		const viewsPerSub = subscriberCount > 0 ? video.views / subscriberCount : 0;
		const recencyScore = new Date(video.publishedAt).getTime();
		const matchType = video.title.toLowerCase().includes(keyword) ? "title" : "description";
		
		return {
			video,
			score: viewsPerSub * 0.7 + (recencyScore / Date.now()) * 0.3,
			matchType,
		};
	});
	
	// Sort by combined score and take top 3
	candidates.sort((a, b) => b.score - a.score);
	
	return candidates.slice(0, 3).map(c => ({
		title: c.video.title,
		views: c.video.views,
		publishedAt: c.video.publishedAt,
		matchType: c.matchType as "title" | "description",
		thumbnail: c.video.thumbnail,
	}));
}

// ═══════════════════════════════════════════════════════════════════
// SEO SCORING (4 FACTORS)
// ═══════════════════════════════════════════════════════════════════

function calculateSEOScore(
	videos: VideoData[],
	topicClusters: TopicCluster[]
): { score: number; subscores: SEOSubscores; explanation: string } {
	const totalVideos = videos.length;
	
	// 1️⃣ TOPIC FOCUS (30%) - % of videos in top 2-3 clusters
	const top3ClusterVideos = topicClusters.slice(0, 3).reduce((sum, c) => sum + c.videoCount, 0);
	const topicFocusRatio = totalVideos > 0 ? Math.min(1, top3ClusterVideos / totalVideos) : 0;
	const topicFocus = Math.round(topicFocusRatio * 100);
	
	// 2️⃣ TITLE KEYWORD CLARITY (25%) - keywords in first 40 chars
	let clearTitleCount = 0;
	for (const video of videos) {
		const first40Chars = video.title.slice(0, 40).toLowerCase();
		const titleKeywords = extractKeywords(video.title);
		const hasVague = VAGUE_PHRASES.some(p => video.title.toLowerCase().includes(p));
		
		if (!hasVague && titleKeywords.some(kw => first40Chars.includes(kw))) {
			clearTitleCount++;
		}
	}
	const titleClarity = totalVideos > 0 ? Math.round((clearTitleCount / totalVideos) * 100) : 0;
	
	// 3️⃣ TOPIC REPETITION (25%) - recurring topics across videos
	const avgClusterSize = topicClusters.length > 0 
		? topicClusters.reduce((sum, c) => sum + c.videoCount, 0) / topicClusters.length 
		: 0;
	const repetitionRatio = totalVideos > 0 ? Math.min(1, avgClusterSize / (totalVideos * 0.3)) : 0;
	const topicRepetition = Math.round(repetitionRatio * 100);
	
	// 4️⃣ METADATA COMPLETENESS (20%) - description quality
	let metadataScore = 0;
	for (const video of videos) {
		let videoScore = 0;
		// Title length 40-70 chars
		if (video.title.length >= 40 && video.title.length <= 70) videoScore += 25;
		else if (video.title.length >= 30) videoScore += 15;
		// Description >= 200 chars (excluding URLs)
		const cleanDesc = video.description.replace(/https?:\/\/\S+/g, "");
		if (cleanDesc.length >= 200) videoScore += 25;
		else if (cleanDesc.length >= 100) videoScore += 15;
		// Keyword in first 2 lines
		const first2Lines = video.description.split("\n").slice(0, 2).join(" ");
		const titleKeywords = extractKeywords(video.title);
		if (titleKeywords.some(kw => first2Lines.toLowerCase().includes(kw))) videoScore += 25;
		// Not too many links
		const linkCount = (video.description.match(/https?:\/\//g) || []).length;
		if (linkCount <= 3) videoScore += 25;
		else if (linkCount <= 5) videoScore += 15;
		
		metadataScore += videoScore;
	}
	const metadataCompleteness = totalVideos > 0 ? Math.round(metadataScore / totalVideos) : 0;
	
	// FINAL SCORE
	const score = Math.round(
		topicFocus * 0.30 +
		titleClarity * 0.25 +
		topicRepetition * 0.25 +
		metadataCompleteness * 0.20
	);
	
	// EXPLANATION
	const strengths: string[] = [];
	const weaknesses: string[] = [];
	
	if (topicFocus >= 60) strengths.push("Strong topic focus around 2-3 themes");
	else weaknesses.push("Content spans many different topics");
	
	if (titleClarity >= 60) strengths.push("Titles clearly describe the content");
	else weaknesses.push("Many titles use vague or curiosity-driven phrasing");
	
	if (topicRepetition >= 50) strengths.push("Topics repeat across multiple videos");
	else weaknesses.push("Topics are rarely repeated across videos");
	
	if (metadataCompleteness >= 60) strengths.push("Consistent metadata across videos");
	else weaknesses.push("Metadata quality varies across videos");
	
	const explanation = strengths.length >= 2
		? `Strong SEO signals. ${strengths.slice(0, 2).join(". ")}.`
		: weaknesses.length >= 2
			? `Room for improvement. ${weaknesses.slice(0, 2).join(". ")}.`
			: "Mixed SEO signals across content.";
	
	return {
		score,
		subscores: { topicFocus, titleClarity, topicRepetition, metadataCompleteness },
		explanation,
	};
}

// ═══════════════════════════════════════════════════════════════════
// CHART DATA - TOPIC CONSISTENCY OVER TIME
// ═══════════════════════════════════════════════════════════════════

function buildChartData(videos: VideoData[], topicClusters: TopicCluster[]): { labels: string[]; data: number[] } {
	if (videos.length === 0 || topicClusters.length === 0) {
		return { labels: [], data: [] };
	}
	
	// Get top cluster keywords
	const topClusterKeywords = topicClusters.slice(0, 3).flatMap(c => c.keywords);
	
	// Sort videos by date (oldest first)
	const sortedVideos = [...videos].sort(
		(a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
	);
	
	// Calculate topic consistency per video
	const chartData = sortedVideos.map(video => {
		const titleKeywords = extractKeywords(video.title);
		const descKeywords = extractKeywords(video.description.slice(0, 120));
		const allKeywords = [...titleKeywords, ...descKeywords];
		
		const matchCount = allKeywords.filter(kw => topClusterKeywords.includes(kw)).length;
		const score = Math.min(100, Math.round((matchCount / Math.max(1, allKeywords.length)) * 100));
		
		return {
			label: formatDate(video.publishedAt),
			score,
		};
	});
	
	return {
		labels: chartData.map(d => d.label),
		data: chartData.map(d => d.score),
	};
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN API HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { channelUrl } = body;

		if (!channelUrl) {
			return NextResponse.json({ error: "Channel URL is required" }, { status: 400 });
		}

		if (!YOUTUBE_API_KEY) {
			return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
		}

		const channelId = await extractChannelId(channelUrl);
		if (!channelId) {
			return NextResponse.json({ error: "Could not resolve channel ID" }, { status: 400 });
		}

		const channelData = await fetchChannelData(channelId);
		if (!channelData) {
			return NextResponse.json({ error: "Could not fetch channel data" }, { status: 404 });
		}

		const videos = await fetchRecentVideos(channelId, 30);
		if (videos.length === 0) {
			return NextResponse.json({ error: "No videos found" }, { status: 404 });
		}

		// Build topic clusters with example videos
		const topicClusters = buildTopicClusters(videos, channelData.subscriberCount);

		// Calculate SEO score with subscores
		const { score, subscores, explanation } = calculateSEOScore(videos, topicClusters);

		// Build chart data
		const chart = buildChartData(videos, topicClusters);

		const result: SEOAnalysisResult = {
			seoScore: score,
			subscores,
			explanation,
			topicClusters,
			chart,
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("SEO analysis error:", error);
		return NextResponse.json({ error: "Failed to analyze channel SEO" }, { status: 500 });
	}
}
