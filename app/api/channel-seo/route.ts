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
// STOP WORDS FOR KEYWORD EXTRACTION
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
	"tell", "ask", "work", "seem", "feel", "try", "leave", "call", "keep", "let",
	"begin", "seem", "help", "show", "hear", "play", "run", "move", "live", "believe",
	"part", "turn", "start", "might", "must", "need", "never", "ever", "always",
	"often", "already", "really", "almost", "always", "around", "another", "before",
	"after", "again", "against", "between", "during", "without", "through", "under",
	"video", "videos", "watch", "subscribe", "channel", "episode", "full", "official"
]);

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
// KEYWORD EXTRACTION & ANALYSIS
// ═══════════════════════════════════════════════════════════════════

function extractKeywords(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

function analyzeKeywordConcentration(
	videos: VideoData[],
	channelDescription: string
): { score: number; summary: string; topKeywords: string[] } {
	// Collect all keywords from titles, descriptions, and channel description
	const allKeywords: string[] = [];
	
	// Channel description keywords (weighted more heavily by including multiple times)
	const channelKeywords = extractKeywords(channelDescription);
	allKeywords.push(...channelKeywords, ...channelKeywords); // Double weight
	
	// Video titles and descriptions
	for (const video of videos) {
		allKeywords.push(...extractKeywords(video.title));
		allKeywords.push(...extractKeywords(video.description.slice(0, 500))); // First 500 chars
	}
	
	// Count keyword frequency
	const keywordCounts: Record<string, number> = {};
	for (const keyword of allKeywords) {
		keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
	}
	
	// Sort by frequency and get top 5
	const sortedKeywords = Object.entries(keywordCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5);
	
	const topKeywords = sortedKeywords.map(([word]) => word);
	const top5Occurrences = sortedKeywords.reduce((sum, [, count]) => sum + count, 0);
	const totalOccurrences = allKeywords.length;
	
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

