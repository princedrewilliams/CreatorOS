// Packaging & SEO Analyzer - Title psychology, thumbnails, and SEO extraction

import type { YoutubeVideo, Severity } from "../youtube/types";
import { analyzeWithLLM } from "../openai/client";
import { cleanWord, STOP_WORDS } from "../youtube/parsers";
import type {
	HookType,
	TitleAnalysis,
	TitlePsychologyAnalysis,
	ThumbnailPatterns,
	SEOExtraction,
	PackagingResponse,
	PackagingInsight,
} from "./types";
import { analyzeThumbnailsBatch, aggregateThumbnailPatterns } from "./thumbnail-analyzer";

interface LLMTitleAnalysis {
	analyses: {
		videoId: string;
		hooks: string[];
		powerWords: string[];
		hookScore: number;
	}[];
	topPowerWords: string[];
	recommendations: string[];
}

export async function analyzeTitlePsychology(
	videos: YoutubeVideo[],
	topN = 10
): Promise<TitlePsychologyAnalysis> {
	// Sort by views and take top N
	const topVideos = [...videos]
		.sort((a, b) => (b.views || 0) - (a.views || 0))
		.slice(0, topN);

	if (!topVideos.length) {
		return {
			topPerformers: [],
			hookDistribution: {},
			avgHookScore: 0,
			topPowerWords: [],
			recommendations: ["Not enough video data to analyze title psychology."],
		};
	}

	const videoData = topVideos.map((v) => ({
		id: v.id,
		title: v.title,
		views: v.views || 0,
	}));

	const systemPrompt = `You are a YouTube title psychology expert. Analyze video titles for psychological hooks and power words.

Hook Types to identify:
- Curiosity: Leaves something unexplained, creates an "open loop"
- Negativity Bias: Uses negative framing that triggers loss aversion
- List/Number: Contains numbers or lists (e.g., "5 Ways to...")
- How-To: Direct instructional framing
- Question: Poses a question to the viewer
- Urgency: Creates time pressure or FOMO
- Social Proof: References popularity or others' experiences
- Controversy: Takes a strong stance or challenges norms
- Personal Story: Uses first-person narrative framing
- None Detected: No clear psychological hook

Power Words are emotionally charged words that trigger action (e.g., "secret", "shocking", "simple", "proven", "ultimate", "free", "new", "instant").

For each title, provide:
- hooks: Array of detected hook types (can be multiple)
- powerWords: Array of power words found
- hookScore: 0-100 score based on hook effectiveness

Return JSON:
{
  "analyses": [
    { "videoId": "...", "hooks": ["Curiosity", "List/Number"], "powerWords": ["secret", "simple"], "hookScore": 75 }
  ],
  "topPowerWords": ["word1", "word2", ...],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}`;

	const userPrompt = `Analyze these top-performing video titles:

${JSON.stringify(videoData, null, 2)}`;

	const result = await analyzeWithLLM<LLMTitleAnalysis>(systemPrompt, userPrompt);

	// Build title analyses
	const videoMap = new Map(topVideos.map((v) => [v.id, v]));
	const titleAnalyses: TitleAnalysis[] = [];
	const hookCounts: Partial<Record<HookType, number>> = {};
	let totalHookScore = 0;

	if (result?.analyses) {
		for (const a of result.analyses) {
			const video = videoMap.get(a.videoId);
			if (!video) continue;

			const hooks = a.hooks.map(validateHook).filter((h): h is HookType => h !== null);
			const titleLen = video.title.length;

			titleAnalyses.push({
				videoId: a.videoId,
				title: video.title,
				views: video.views || 0,
				hooks,
				powerWords: a.powerWords || [],
				hookScore: Math.min(100, Math.max(0, a.hookScore || 50)),
				lengthOptimal: titleLen >= 40 && titleLen <= 60,
			});

			// Count hooks
			for (const hook of hooks) {
				hookCounts[hook] = (hookCounts[hook] || 0) + 1;
			}
			totalHookScore += a.hookScore || 50;
		}
	}

	// Fallback for any missed videos
	for (const video of topVideos) {
		if (!titleAnalyses.find((t) => t.videoId === video.id)) {
			const hooks = detectHooksHeuristically(video.title);
			const powerWords = detectPowerWordsHeuristically(video.title);
			const titleLen = video.title.length;

			titleAnalyses.push({
				videoId: video.id,
				title: video.title,
				views: video.views || 0,
				hooks,
				powerWords,
				hookScore: hooks.length * 20 + powerWords.length * 10,
				lengthOptimal: titleLen >= 40 && titleLen <= 60,
			});

			for (const hook of hooks) {
				hookCounts[hook] = (hookCounts[hook] || 0) + 1;
			}
		}
	}

	// Calculate power word frequency with avg views
	const powerWordViews: Record<string, { count: number; totalViews: number }> = {};
	for (const t of titleAnalyses) {
		for (const word of t.powerWords) {
			const w = word.toLowerCase();
			if (!powerWordViews[w]) {
				powerWordViews[w] = { count: 0, totalViews: 0 };
			}
			powerWordViews[w].count++;
			powerWordViews[w].totalViews += t.views;
		}
	}

	const topPowerWords = Object.entries(powerWordViews)
		.map(([word, data]) => ({
			word,
			count: data.count,
			avgViews: data.count > 0 ? data.totalViews / data.count : 0,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10);

	return {
		topPerformers: titleAnalyses,
		hookDistribution: hookCounts,
		avgHookScore: titleAnalyses.length > 0 ? totalHookScore / titleAnalyses.length : 0,
		topPowerWords,
		recommendations: result?.recommendations || generateDefaultRecommendations(hookCounts),
	};
}

function validateHook(input: string): HookType | null {
	const validHooks: HookType[] = [
		"Curiosity",
		"Negativity Bias",
		"List/Number",
		"How-To",
		"Question",
		"Urgency",
		"Social Proof",
		"Controversy",
		"Personal Story",
		"None Detected",
	];

	const normalized = input.trim();
	return validHooks.find((h) => h.toLowerCase() === normalized.toLowerCase()) || null;
}

function detectHooksHeuristically(title: string): HookType[] {
	const hooks: HookType[] = [];
	const lower = title.toLowerCase();

	if (/\?/.test(title)) hooks.push("Question");
	if (/\d+\s*(ways|tips|reasons|things|steps|secrets)/i.test(title)) hooks.push("List/Number");
	if (/how to|tutorial|guide/i.test(lower)) hooks.push("How-To");
	if (/never|worst|mistake|fail|don't|avoid/i.test(lower)) hooks.push("Negativity Bias");
	if (/shocking|secret|hidden|truth|revealed/i.test(lower)) hooks.push("Curiosity");
	if (/now|today|hurry|limited|last chance/i.test(lower)) hooks.push("Urgency");
	if (/everyone|millions|viral|trending/i.test(lower)) hooks.push("Social Proof");
	if (/\bi\b|\bmy\b|personal|story/i.test(lower)) hooks.push("Personal Story");

	return hooks.length > 0 ? hooks : ["None Detected"];
}

const POWER_WORDS = new Set([
	"secret",
	"shocking",
	"simple",
	"proven",
	"ultimate",
	"free",
	"new",
	"instant",
	"best",
	"worst",
	"amazing",
	"incredible",
	"powerful",
	"easy",
	"fast",
	"hidden",
	"truth",
	"revealed",
	"exclusive",
	"limited",
	"guaranteed",
	"complete",
	"essential",
	"critical",
	"urgent",
]);

function detectPowerWordsHeuristically(title: string): string[] {
	const words = title.toLowerCase().split(/\s+/);
	return words
		.map((w) => cleanWord(w))
		.filter((w) => POWER_WORDS.has(w));
}

function generateDefaultRecommendations(
	hookDist: Partial<Record<HookType, number>>
): string[] {
	const recs: string[] = [];

	if (!hookDist["Curiosity"]) {
		recs.push("Add curiosity hooks by leaving something unexplained in your titles.");
	}
	if (!hookDist["List/Number"]) {
		recs.push("Test numbered lists in titles (e.g., '5 Ways to...') for higher CTR.");
	}
	if (!hookDist["Question"]) {
		recs.push("Try question-based titles to create engagement loops.");
	}

	return recs.length > 0 ? recs : ["Continue testing different hook combinations."];
}

// SEO Extraction
export function extractSEOData(videos: YoutubeVideo[]): SEOExtraction[] {
	return videos.map((video) => {
		const desc = video.description || "";
		const descPreview = desc.slice(0, 150);

		// Extract keywords from tags
		const primaryKeywords = (video.tags || []).slice(0, 5);

		// Extract LSI keywords from description
		const descWords = desc
			.slice(0, 500)
			.split(/\s+/)
			.map((w) => cleanWord(w))
			.filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

		// Get unique words with frequency
		const wordCounts: Record<string, number> = {};
		for (const w of descWords) {
			wordCounts[w] = (wordCounts[w] || 0) + 1;
		}

		const lsiKeywords = Object.entries(wordCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 8)
			.map(([word]) => word);

		return {
			videoId: video.id,
			title: video.title,
			primaryKeywords,
			lsiKeywords,
			descriptionPreview: descPreview,
			tagCount: video.tags?.length || 0,
			hasTimestamps: /\d{1,2}:\d{2}/.test(desc),
			hasLinks: /https?:\/\//.test(desc),
		};
	});
}

export function aggregateSEOKeywords(
	seoData: SEOExtraction[]
): { keyword: string; frequency: number }[] {
	const counts: Record<string, number> = {};

	for (const seo of seoData) {
		for (const kw of [...seo.primaryKeywords, ...seo.lsiKeywords]) {
			const w = kw.toLowerCase();
			counts[w] = (counts[w] || 0) + 1;
		}
	}

	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 15)
		.map(([keyword, frequency]) => ({ keyword, frequency }));
}

function generatePackagingInsights(
	titlePsych: TitlePsychologyAnalysis,
	seoData: SEOExtraction[],
	thumbnailPatterns?: ThumbnailPatterns
): PackagingInsight[] {
	const insights: PackagingInsight[] = [];

	// Hook usage insight
	const hookCount = Object.values(titlePsych.hookDistribution).reduce((a, b) => (a || 0) + (b || 0), 0);
	const avgHooksPerTitle = titlePsych.topPerformers.length > 0
		? hookCount / titlePsych.topPerformers.length
		: 0;

	if (avgHooksPerTitle >= 2) {
		insights.push({
			id: "pack-strong-hooks",
			label: "Strong Title Hook Usage",
			severity: "strong",
			evidence: `Top videos average ${avgHooksPerTitle.toFixed(1)} hooks per title.`,
			impact: "Multiple hooks increase click probability.",
		});
	} else if (avgHooksPerTitle < 1) {
		insights.push({
			id: "pack-weak-hooks",
			label: "Titles Lack Psychological Hooks",
			severity: "weak",
			evidence: "Most titles don't use established hook patterns.",
			impact: "Missing opportunities for higher CTR.",
			action: "Add curiosity, numbers, or questions to your next 5 titles.",
		});
	}

	// Thumbnail insights
	if (thumbnailPatterns && thumbnailPatterns.avgCompositionScore > 0) {
		if (thumbnailPatterns.faceUsagePercent > 70) {
			insights.push({
				id: "pack-strong-faces",
				label: "Effective Face Usage in Thumbnails",
				severity: "strong",
				evidence: `${Math.round(thumbnailPatterns.faceUsagePercent)}% of thumbnails feature faces.`,
				impact: "Faces increase emotional connection and CTR.",
			});
		} else if (thumbnailPatterns.faceUsagePercent < 30) {
			insights.push({
				id: "pack-low-faces",
				label: "Missing Faces in Thumbnails",
				severity: "weak",
				evidence: `Only ${Math.round(thumbnailPatterns.faceUsagePercent)}% of thumbnails feature faces.`,
				impact: "Adding faces typically increases click-through rates by 30%+.",
				action: "Test adding expressive faces to your next 5 thumbnails.",
			});
		}

		if (thumbnailPatterns.avgCompositionScore < 50) {
			insights.push({
				id: "pack-weak-composition",
				label: "Thumbnail Composition Needs Work",
				severity: "weak",
				evidence: `Average composition score: ${Math.round(thumbnailPatterns.avgCompositionScore)}/100.`,
				impact: "Poor composition reduces visual impact in browse.",
				action: "Use the rule of thirds and high contrast colors.",
			});
		}
	}

	// Title length insight
	const optimalCount = titlePsych.topPerformers.filter((t) => t.lengthOptimal).length;
	const optimalPct = titlePsych.topPerformers.length > 0
		? (optimalCount / titlePsych.topPerformers.length) * 100
		: 0;

	if (optimalPct < 50) {
		insights.push({
			id: "pack-title-length",
			label: "Title Length Not Optimal",
			severity: "weak",
			evidence: `Only ${optimalPct.toFixed(0)}% of top videos have optimal title length (40-60 chars).`,
			impact: "Titles may be truncated or lack context.",
			action: "Target 40-60 characters for search visibility.",
		});
	}

	// Tag usage insight
	const avgTags = seoData.length > 0
		? seoData.reduce((sum, s) => sum + s.tagCount, 0) / seoData.length
		: 0;

	if (avgTags < 5) {
		insights.push({
			id: "pack-low-tags",
			label: "Underutilizing Video Tags",
			severity: "weak",
			evidence: `Average of ${avgTags.toFixed(1)} tags per video.`,
			impact: "Missing keyword signals for search algorithm.",
			action: "Add 10-15 relevant tags per video.",
		});
	}

	return insights.slice(0, 4);
}

function calculatePackagingScore(
	titlePsych: TitlePsychologyAnalysis,
	seoData: SEOExtraction[],
	thumbnailPatterns?: ThumbnailPatterns
): number {
	let score = 40; // Base score

	// Hook score contribution (0-20 points)
	score += Math.min(20, titlePsych.avgHookScore / 5);

	// Power words contribution (0-10 points)
	score += Math.min(10, titlePsych.topPowerWords.length * 1.5);

	// Optimal title length contribution (0-10 points)
	const optimalPct = titlePsych.topPerformers.filter((t) => t.lengthOptimal).length /
		Math.max(1, titlePsych.topPerformers.length);
	score += optimalPct * 10;

	// Tag usage contribution (0-10 points)
	const avgTags = seoData.length > 0
		? seoData.reduce((sum, s) => sum + s.tagCount, 0) / seoData.length
		: 0;
	score += Math.min(10, avgTags);

	// Thumbnail contribution (0-20 points)
	if (thumbnailPatterns && thumbnailPatterns.avgCompositionScore > 0) {
		score += Math.min(10, thumbnailPatterns.avgCompositionScore / 10);
		score += thumbnailPatterns.faceUsagePercent > 50 ? 5 : 0;
		score += thumbnailPatterns.textOverlayPercent > 40 ? 5 : 0;
	}

	return Math.min(100, Math.max(0, Math.round(score)));
}

function getSeverity(score: number): Severity {
	if (score >= 75) return "strong";
	if (score >= 50) return "neutral";
	if (score >= 25) return "weak";
	return "concerning";
}

function generateThumbnailInsights(patterns: Omit<ThumbnailPatterns, "insights">): string[] {
	const insights: string[] = [];

	if (patterns.faceUsagePercent > 70) {
		insights.push("Strong face presence in thumbnails builds personal connection with viewers.");
	} else if (patterns.faceUsagePercent < 30) {
		insights.push("Low face usage - consider adding faces to increase click-through rates.");
	}

	if (patterns.avgCompositionScore > 70) {
		insights.push("Well-composed thumbnails with clear visual hierarchy.");
	} else if (patterns.avgCompositionScore < 50) {
		insights.push("Thumbnail composition could be improved for better visual impact.");
	}

	if (patterns.textOverlayPercent > 60) {
		insights.push("Consistent text overlay usage reinforces messaging.");
	}

	if (patterns.dominantFaceType === "close-up") {
		insights.push("Close-up faces create emotional connection and improve CTR.");
	}

	return insights.slice(0, 3);
}

export async function analyzePackaging(
	videos: YoutubeVideo[],
	topN = 10,
	useVision = true
): Promise<PackagingResponse> {
	// Analyze title psychology
	const titlePsychology = await analyzeTitlePsychology(videos, topN);

	// Analyze thumbnails with GPT-4o Vision
	const topVideos = videos.slice(0, topN);
	const thumbnails = await analyzeThumbnailsBatch(topVideos, useVision, 3);

	// Aggregate thumbnail patterns
	const rawPatterns = aggregateThumbnailPatterns(thumbnails);
	const thumbnailPatterns: ThumbnailPatterns = {
		...rawPatterns,
		insights: generateThumbnailInsights(rawPatterns),
	};

	// Extract SEO data
	const seoVideos = extractSEOData(videos);
	const topKeywords = aggregateSEOKeywords(seoVideos);

	// Calculate overall score (include thumbnail score)
	const overallScore = calculatePackagingScore(titlePsychology, seoVideos, thumbnailPatterns);

	// Generate insights
	const insights = generatePackagingInsights(titlePsychology, seoVideos, thumbnailPatterns);

	return {
		titlePsychology,
		thumbnails,
		thumbnailPatterns,
		seoExtraction: {
			videos: seoVideos.slice(0, topN),
			topKeywords,
			keywordGaps: [],
		},
		overallScore,
		severity: getSeverity(overallScore),
		insights,
	};
}
