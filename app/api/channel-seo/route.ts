import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SEOAnalysisResult {
	seoScore: number;
	insights: {
		keywordConcentration: {
			score: number;
			summary: string;
			topKeywords: string[];
		};
		searchIntentClarity: {
			score: number;
			summary: string;
		};
		metadataCompleteness: {
			score: number;
			summary: string;
		};
	};
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
	metadataScore?: number;
}

// ═══════════════════════════════════════════════════════════════════
// STOP WORDS & BANNED TOKENS FOR KEYWORD EXTRACTION
// ═══════════════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
	// Common English stopwords
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
	"tell", "ask", "work", "seem", "feel", "try", "leave", "call", "keep", "let",
	"begin", "seem", "help", "show", "hear", "play", "run", "move", "live", "believe",
	"part", "turn", "start", "might", "must", "need", "never", "ever", "always",
	"often", "already", "really", "almost", "always", "around", "another", "before",
	"after", "again", "against", "between", "during", "without", "through", "under",
]);

// YouTube/web boilerplate tokens to filter out
const BANNED_TOKENS = new Set([
	// URL fragments
	"https", "http", "www", "com", "net", "org", "co", "io",
	// CTA/promotional terms
	"visit", "link", "click", "subscribe", "follow", "official", "shop", "store",
	"bio", "merch", "promo", "discount", "code", "coupon", "giveaway", "sponsor",
	// Generic video terms
	"video", "videos", "watch", "channel", "episode", "full", "part", "clip",
	"stream", "streaming", "live", "premiere", "upload", "uploaded", "content",
	// Social media
	"instagram", "twitter", "tiktok", "facebook", "snapchat", "discord", "twitch",
	// Generic descriptors
	"best", "top", "amazing", "incredible", "awesome", "epic", "crazy", "insane",
	"ultimate", "exclusive", "special", "bonus", "extra", "free", "new", "latest",
]);

// CTA phrases to strip before tokenization
const CTA_PHRASES = [
	"visit our", "link in bio", "check out", "available at", "watch now",
	"click here", "subscribe to", "follow us", "join us", "sign up",
	"download now", "get yours", "order now", "buy now", "shop now",
	"learn more", "find out", "discover more", "see more", "read more",
];

// Vague/clickbait phrases that hurt search intent clarity
const VAGUE_PHRASES = [
	"you won't believe",
	"what happened",
	"this is why",
	"the truth about",
	"i can't believe",
	"shocking",
	"unbelievable",
	"must see",
	"wait for it",
	"this changed everything",
	"gone wrong",
	"went viral",
	"not clickbait",
	"real reason",
	"finally revealed",
	"nobody knows",
	"secret",
	"exposed"
];

// ═══════════════════════════════════════════════════════════════════
// YOUTUBE API HELPERS
// ═══════════════════════════════════════════════════════════════════

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function extractChannelId(channelUrl: string): Promise<string | null> {
	// Handle different YouTube URL formats
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
			
			// If it's a channel ID (starts with UC), return directly
			if (identifier.startsWith("UC")) {
				return identifier;
			}
			
			// Otherwise, resolve handle/username to channel ID
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

async function fetchChannelData(channelId: string): Promise<{ description: string } | null> {
	if (!YOUTUBE_API_KEY) return null;
	
	try {
		const res = await fetch(
			`https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
		);
		const data = await res.json();
		const channel = data.items?.[0];
		if (!channel) return null;
		
		return {
			description: channel.snippet?.description || "",
		};
	} catch {
		return null;
	}
}

async function fetchRecentVideos(channelId: string, maxResults: number = 30): Promise<VideoData[]> {
	if (!YOUTUBE_API_KEY) return [];
	
	try {
		// First, get video IDs from search
		const searchRes = await fetch(
			`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
		);
		const searchData = await searchRes.json();
		const videoIds = searchData.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];
		
		if (videoIds.length === 0) return [];
		
		// Then, get detailed video data
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
		})) || [];
	} catch (error) {
		console.error("Error fetching videos:", error);
		return [];
	}
}

// ═══════════════════════════════════════════════════════════════════
// KEYWORD EXTRACTION & ANALYSIS (IMPROVED)
// ═══════════════════════════════════════════════════════════════════

/**
 * Clean text by removing URLs, CTA phrases, and boilerplate
 */
function cleanText(text: string): string {
	let cleaned = text.toLowerCase();
	
	// Remove URLs
	cleaned = cleaned.replace(/https?:\/\/\S+/g, " ");
	cleaned = cleaned.replace(/www\.\S+/g, " ");
	
	// Remove CTA phrases
	for (const phrase of CTA_PHRASES) {
		cleaned = cleaned.replace(new RegExp(phrase, "gi"), " ");
	}
	
	// Remove email addresses
	cleaned = cleaned.replace(/\S+@\S+\.\S+/g, " ");
	
	// Remove special characters but keep spaces
	cleaned = cleaned.replace(/[^a-z\s]/g, " ");
	
	// Normalize whitespace
	cleaned = cleaned.replace(/\s+/g, " ").trim();
	
	return cleaned;
}

/**
 * Check if a token is valid for keyword extraction
 */
function isValidToken(word: string): boolean {
	// Must be at least 3 characters
	if (word.length < 3) return false;
	
	// Must not be a stopword
	if (STOP_WORDS.has(word)) return false;
	
	// Must not be a banned token
	if (BANNED_TOKENS.has(word)) return false;
	
	// Must not contain numbers only
	if (/^\d+$/.test(word)) return false;
	
	// Must not contain URL fragments
	if (word.includes("/") || word.includes(".") || word.includes(":")) return false;
	
	return true;
}

/**
 * Extract topic-bearing keywords from text
 */
function extractKeywords(text: string): string[] {
	const cleaned = cleanText(text);
	return cleaned
		.split(/\s+/)
		.filter(isValidToken);
}

/**
 * Analyze keyword concentration with improved filtering
 */
function analyzeKeywordConcentration(
	videos: VideoData[],
	channelDescription: string
): { score: number; summary: string; topKeywords: string[] } {
	const totalVideos = videos.length;
	
	// Track keyword occurrences per video (for uniqueness penalty)
	const keywordVideoCount: Record<string, Set<number>> = {};
	const keywordTitleBonus: Record<string, number> = {};
	const keywordTotalCount: Record<string, number> = {};
	
	// Process channel description
	const channelKeywords = extractKeywords(channelDescription);
	for (const kw of channelKeywords) {
		keywordTotalCount[kw] = (keywordTotalCount[kw] || 0) + 2; // Double weight for channel desc
	}
	
	// Process each video
	videos.forEach((video, videoIndex) => {
		// Title keywords (higher weight)
		const titleKeywords = extractKeywords(video.title);
		for (const kw of titleKeywords) {
			keywordTotalCount[kw] = (keywordTotalCount[kw] || 0) + 3; // Title gets 3x weight
			keywordTitleBonus[kw] = (keywordTitleBonus[kw] || 0) + 1;
			if (!keywordVideoCount[kw]) keywordVideoCount[kw] = new Set();
			keywordVideoCount[kw].add(videoIndex);
		}
		
		// Description keywords (first 300 chars only)
		const descKeywords = extractKeywords(video.description.slice(0, 300));
		for (const kw of descKeywords) {
			keywordTotalCount[kw] = (keywordTotalCount[kw] || 0) + 1;
			if (!keywordVideoCount[kw]) keywordVideoCount[kw] = new Set();
			keywordVideoCount[kw].add(videoIndex);
		}
	});
	
	// Calculate final scores with uniqueness penalty
	const keywordScores: Array<[string, number]> = [];
	
	for (const [keyword, count] of Object.entries(keywordTotalCount)) {
		const videoAppearances = keywordVideoCount[keyword]?.size || 0;
		const videoRatio = totalVideos > 0 ? videoAppearances / totalVideos : 0;
		
		// Skip keywords that appear in >70% of videos (too generic)
		if (videoRatio > 0.7) continue;
		
		// Calculate score: frequency × position bonus × uniqueness
		const frequencyWeight = count;
		const positionWeight = 1 + (keywordTitleBonus[keyword] || 0) * 0.5;
		const uniquenessWeight = Math.max(0.3, 1 - videoRatio * 0.5);
		
		const finalScore = frequencyWeight * positionWeight * uniquenessWeight;
		keywordScores.push([keyword, finalScore]);
	}
	
	// Sort by score and get top 5
	keywordScores.sort((a, b) => b[1] - a[1]);
	const topKeywords = keywordScores.slice(0, 5).map(([word]) => word);
	
	// Calculate concentration score
	const top5Score = keywordScores.slice(0, 5).reduce((sum, [, score]) => sum + score, 0);
	const totalScore = keywordScores.reduce((sum, [, score]) => sum + score, 0);
	const score = totalScore > 0 
		? Math.min(100, Math.round((top5Score / totalScore) * 100))
		: 0;
	
	// Calculate score
	const score = totalOccurrences > 0 
		? Math.min(100, Math.round((top5Occurrences / totalOccurrences) * 100))
		: 0;
	
	// Generate summary
	let summary: string;
	if (score >= 60) {
		summary = `Strong topical authority. Content consistently focuses on ${topKeywords.slice(0, 3).join(", ")}.`;
	} else if (score >= 40) {
		summary = `Moderate keyword focus. Primary themes include ${topKeywords.slice(0, 3).join(", ")} but coverage varies.`;
	} else {
		summary = `Scattered topic coverage. No dominant keyword themes detected across recent content.`;
	}
	
	return { score, summary, topKeywords };
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH INTENT CLARITY ANALYSIS
// ═══════════════════════════════════════════════════════════════════

function analyzeSearchIntentClarity(videos: VideoData[]): { score: number; summary: string } {
	if (videos.length === 0) return { score: 0, summary: "No videos to analyze." };
	
	let clearTitleCount = 0;
	
	for (const video of videos) {
		const title = video.title.toLowerCase();
		const words = title.split(/\s+/).filter(w => w.length > 2);
		
		// Check for vague/clickbait phrases
		const hasVaguePhrasing = VAGUE_PHRASES.some(phrase => title.includes(phrase));
		if (hasVaguePhrasing) continue;
		
		// Extract potential keywords (non-stopwords)
		const keywords = words.filter(w => !STOP_WORDS.has(w));
		if (keywords.length === 0) continue;
		
		// Check if primary keyword appears in first 40% of title
		const first40Percent = Math.ceil(words.length * 0.4);
		const firstWords = words.slice(0, first40Percent);
		const hasEarlyKeyword = keywords.some(kw => firstWords.includes(kw));
		
		if (hasEarlyKeyword) {
			clearTitleCount++;
		}
	}
	
	const score = Math.round((clearTitleCount / videos.length) * 100);
	
	let summary: string;
	if (score >= 70) {
		summary = `Search-optimized titles. ${score}% of videos front-load primary keywords for discoverability.`;
	} else if (score >= 45) {
		summary = `Mixed title strategy. Some videos prioritize search, others use curiosity-first hooks.`;
	} else {
		summary = `Curiosity-driven titles. Most titles prioritize engagement over search discoverability.`;
	}
	
	return { score, summary };
}

// ═══════════════════════════════════════════════════════════════════
// METADATA COMPLETENESS ANALYSIS
// ═══════════════════════════════════════════════════════════════════

function analyzeMetadataCompleteness(
	videos: VideoData[]
): { score: number; summary: string; videoScores: { date: string; score: number }[] } {
	if (videos.length === 0) {
		return { score: 0, summary: "No videos to analyze.", videoScores: [] };
	}
	
	const videoScores: { date: string; score: number }[] = [];
	
	for (const video of videos) {
		let passedChecks = 0;
		const totalChecks = 4;
		
		// Check 1: Title length between 40-60 chars (optimal for SEO)
		const titleLength = video.title.length;
		if (titleLength >= 40 && titleLength <= 70) {
			passedChecks++;
		} else if (titleLength >= 30 && titleLength <= 80) {
			passedChecks += 0.5; // Partial credit
		}
		
		// Check 2: Description >= 250 chars
		if (video.description.length >= 250) {
			passedChecks++;
		} else if (video.description.length >= 100) {
			passedChecks += 0.5; // Partial credit
		}
		
		// Check 3: Primary keyword in first 2 lines of description
		const firstTwoLines = video.description.split("\n").slice(0, 2).join(" ").toLowerCase();
		const titleKeywords = extractKeywords(video.title);
		const hasKeywordInDescription = titleKeywords.some(kw => firstTwoLines.includes(kw));
		if (hasKeywordInDescription) {
			passedChecks++;
		}
		
		// Check 4: Tags present (if accessible)
		if (video.tags && video.tags.length > 0) {
			passedChecks++;
		} else {
			// Tags often not accessible via API, give partial credit if description is rich
			if (video.description.length >= 500) {
				passedChecks += 0.5;
			}
		}
		
		const videoScore = Math.round((passedChecks / totalChecks) * 100);
		video.metadataScore = videoScore;
		
		videoScores.push({
			date: video.publishedAt,
			score: videoScore,
		});
	}
	
	// Calculate average score
	const avgScore = Math.round(
		videoScores.reduce((sum, v) => sum + v.score, 0) / videoScores.length
	);
	
	let summary: string;
	if (avgScore >= 75) {
		summary = `Strong SEO metadata. Titles, descriptions, and keywords are well-optimized across videos.`;
	} else if (avgScore >= 50) {
		summary = `Moderate metadata quality. Some videos lack complete descriptions or keyword alignment.`;
	} else {
		summary = `Weak metadata optimization. Many videos missing descriptions or keyword placement.`;
	}
	
	return { score: avgScore, summary, videoScores };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN API HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { channelUrl } = body;
		
		if (!channelUrl) {
			return NextResponse.json(
				{ error: "Channel URL is required" },
				{ status: 400 }
			);
		}
		
		if (!YOUTUBE_API_KEY) {
			return NextResponse.json(
				{ error: "YouTube API key not configured" },
				{ status: 500 }
			);
		}
		
		// Extract channel ID from URL
		const channelId = await extractChannelId(channelUrl);
		if (!channelId) {
			return NextResponse.json(
				{ error: "Could not resolve channel ID from URL" },
				{ status: 400 }
			);
		}
		
		// Fetch channel data
		const channelData = await fetchChannelData(channelId);
		if (!channelData) {
			return NextResponse.json(
				{ error: "Could not fetch channel data" },
				{ status: 404 }
			);
		}
		
		// Fetch recent videos
		const videos = await fetchRecentVideos(channelId, 30);
		if (videos.length === 0) {
			return NextResponse.json(
				{ error: "No videos found for this channel" },
				{ status: 404 }
			);
		}
		
		// ══════════════════════════════════════════════════════════════
		// ANALYZE SEO METRICS
		// ══════════════════════════════════════════════════════════════
		
		// 1. Keyword Concentration Analysis
		const keywordAnalysis = analyzeKeywordConcentration(videos, channelData.description);
		
		// 2. Search Intent Clarity Analysis
		const searchIntentAnalysis = analyzeSearchIntentClarity(videos);
		
		// 3. Metadata Completeness Analysis
		const metadataAnalysis = analyzeMetadataCompleteness(videos);
		
		// ══════════════════════════════════════════════════════════════
		// CALCULATE FINAL SEO SCORE
		// ══════════════════════════════════════════════════════════════
		
		const seoScore = Math.round(
			keywordAnalysis.score * 0.4 +
			searchIntentAnalysis.score * 0.35 +
			metadataAnalysis.score * 0.25
		);
		
		// ══════════════════════════════════════════════════════════════
		// BUILD CHART DATA
		// ══════════════════════════════════════════════════════════════
		
		// Sort by date (oldest first for chart)
		const sortedScores = [...metadataAnalysis.videoScores].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		);
		
		const chart = {
			labels: sortedScores.map(v => {
				const date = new Date(v.date);
				return `${date.getMonth() + 1}/${date.getDate()}`;
			}),
			data: sortedScores.map(v => v.score),
		};
		
		// ══════════════════════════════════════════════════════════════
		// BUILD RESPONSE
		// ══════════════════════════════════════════════════════════════
		
		const result: SEOAnalysisResult = {
			seoScore,
			insights: {
				keywordConcentration: {
					score: keywordAnalysis.score,
					summary: keywordAnalysis.summary,
					topKeywords: keywordAnalysis.topKeywords,
				},
				searchIntentClarity: {
					score: searchIntentAnalysis.score,
					summary: searchIntentAnalysis.summary,
				},
				metadataCompleteness: {
					score: metadataAnalysis.score,
					summary: metadataAnalysis.summary,
				},
			},
			chart,
		};
		
		return NextResponse.json(result);
		
	} catch (error) {
		console.error("SEO analysis error:", error);
		return NextResponse.json(
			{ error: "Failed to analyze channel SEO" },
			{ status: 500 }
		);
	}
}

