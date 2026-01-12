// Content Pillar Analyzer - LLM-based video categorization

import type { YoutubeVideo } from "../youtube/types";
import { analyzeWithLLM } from "../openai/client";
import { calculateEngagementRate, isShortVideo, getFormatBreakdown } from "../youtube/parsers";
import type {
	ContentPillar,
	PillarClassification,
	PillarAnalysis,
	PillarStats,
	FormatBreakdown,
	PillarScatterPoint,
	FormatPieSlice,
	PillarBarData,
	PillarVerdict,
	SoWhatSection,
	PillarsResponse,
	PillarInsight,
} from "./types";
import { PILLAR_COLORS } from "./types";

interface LLMPillarResult {
	classifications: {
		videoId: string;
		pillar: string;
		confidence: number;
	}[];
}

export async function categorizePillars(
	videos: YoutubeVideo[]
): Promise<PillarClassification[]> {
	if (!videos.length) return [];

	// Prepare video data for LLM (batch for efficiency)
	const videoSummaries = videos.map((v) => ({
		id: v.id,
		title: v.title,
		description: v.description?.slice(0, 200) || "",
		duration: v.durationSec,
		isShort: isShortVideo(v),
	}));

	const systemPrompt = `You are a YouTube content analyst. Classify each video into exactly ONE content pillar based on the title and description.

Available pillars:
- Documentary: Deep-dive, investigative, or long-form storytelling content
- Tutorial: How-to guides, step-by-step instructions, skill teaching
- Q&A: Question and answer format, interviews, AMAs
- Vlog: Personal life updates, day-in-the-life, behind-the-scenes
- Commentary: Opinion pieces, reaction videos, analysis of events/trends
- Review: Product reviews, comparisons, testing content
- News: Current events, updates, announcements
- Entertainment: Comedy, challenges, pranks, entertainment-focused
- Educational: Informative content, explainers, facts, science
- Shorts: Short-form content under 60 seconds (regardless of topic)
- Creator-Led: Videos where the creator's personality, reactions, humor, or unscripted behavior is the main driver - not fitting strict formats above

Return JSON with this exact structure:
{
  "classifications": [
    { "videoId": "...", "pillar": "Tutorial", "confidence": 0.85 }
  ]
}

Confidence should be 0.0-1.0 based on how clearly the content fits the category.
For videos under 60 seconds, always classify as "Shorts" unless the content clearly fits another category.`;

	const userPrompt = `Classify these ${videos.length} videos:

${JSON.stringify(videoSummaries, null, 2)}`;

	const result = await analyzeWithLLM<LLMPillarResult>(systemPrompt, userPrompt);

	// Map LLM results back to videos with engagement data
	const videoMap = new Map(videos.map((v) => [v.id, v]));
	const classifications: PillarClassification[] = [];

	if (result?.classifications) {
		for (const c of result.classifications) {
			const video = videoMap.get(c.videoId);
			if (!video) continue;

			const pillar = validatePillar(c.pillar);
			classifications.push({
				videoId: c.videoId,
				title: video.title,
				pillar,
				confidence: Math.min(1, Math.max(0, c.confidence || 0.5)),
				views: video.views || 0,
				engagementRate: calculateEngagementRate(video),
			});
		}
	}

	// Fallback: classify any missed videos
	for (const video of videos) {
		if (!classifications.find((c) => c.videoId === video.id)) {
			const pillar = heuristicClassify(video);
			classifications.push({
				videoId: video.id,
				title: video.title,
				pillar,
				confidence: 0.5,
				views: video.views || 0,
				engagementRate: calculateEngagementRate(video),
			});
		}
	}

	return classifications;
}

function validatePillar(input: string): ContentPillar {
	const validPillars: ContentPillar[] = [
		"Documentary",
		"Tutorial",
		"Q&A",
		"Vlog",
		"Commentary",
		"Review",
		"News",
		"Entertainment",
		"Educational",
		"Shorts",
		"Creator-Led",
	];

	const normalized = input.trim();
	// Handle legacy "Other" responses
	if (normalized.toLowerCase() === "other") return "Creator-Led";
	const match = validPillars.find(
		(p) => p.toLowerCase() === normalized.toLowerCase()
	);
	return match || "Creator-Led";
}

function heuristicClassify(video: YoutubeVideo): ContentPillar {
	const title = (video.title || "").toLowerCase();
	const desc = (video.description || "").toLowerCase();
	const combined = `${title} ${desc}`;

	// Check for Shorts first
	if (isShortVideo(video)) return "Shorts";

	// Pattern matching
	if (/how to|tutorial|guide|step by step|learn/i.test(combined)) return "Tutorial";
	if (/review|unboxing|tested|hands on/i.test(combined)) return "Review";
	if (/vlog|day in|behind the scenes|my life/i.test(combined)) return "Vlog";
	if (/q&a|ama|interview|asks|questions/i.test(combined)) return "Q&A";
	if (/documentary|investigation|deep dive|story of/i.test(combined)) return "Documentary";
	if (/react|response|my thoughts|opinion/i.test(combined)) return "Commentary";
	if (/news|update|announcement|breaking/i.test(combined)) return "News";
	if (/explained|what is|why|facts|science/i.test(combined)) return "Educational";
	if (/challenge|prank|funny|comedy/i.test(combined)) return "Entertainment";

	return "Creator-Led";
}

export function calculatePillarStats(
	classifications: PillarClassification[]
): Partial<Record<ContentPillar, PillarStats>> {
	const stats: Partial<Record<ContentPillar, PillarStats>> = {};

	for (const c of classifications) {
		if (!stats[c.pillar]) {
			stats[c.pillar] = {
				count: 0,
				avgViews: 0,
				avgEngagement: 0,
				totalViews: 0,
			};
		}
		const s = stats[c.pillar]!;
		s.count++;
		s.totalViews += c.views;
	}

	// Calculate averages
	for (const pillar of Object.keys(stats) as ContentPillar[]) {
		const s = stats[pillar]!;
		const pillarVideos = classifications.filter((c) => c.pillar === pillar);
		s.avgViews = s.count > 0 ? s.totalViews / s.count : 0;
		s.avgEngagement =
			pillarVideos.reduce((sum, c) => sum + c.engagementRate, 0) / s.count || 0;
	}

	return stats;
}

export function findGrowthDriver(
	stats: Partial<Record<ContentPillar, PillarStats>>
): ContentPillar {
	let bestPillar: ContentPillar = "Creator-Led";
	let bestScore = -1;

	for (const [pillar, s] of Object.entries(stats) as [ContentPillar, PillarStats][]) {
		if (!s || s.count < 2) continue; // Need at least 2 videos

		// Score = normalized views * engagement weight * consistency
		const score = s.avgViews * (1 + s.avgEngagement / 10);
		if (score > bestScore) {
			bestScore = score;
			bestPillar = pillar;
		}
	}

	return bestPillar;
}

export function findUnderperformer(
	stats: Partial<Record<ContentPillar, PillarStats>>
): ContentPillar {
	let worstPillar: ContentPillar = "Creator-Led";
	let worstScore = Number.POSITIVE_INFINITY;

	for (const [pillar, s] of Object.entries(stats) as [ContentPillar, PillarStats][]) {
		if (!s || s.count < 2) continue;

		const score = s.avgViews * (1 + s.avgEngagement / 10);
		if (score < worstScore) {
			worstScore = score;
			worstPillar = pillar;
		}
	}

	return worstPillar;
}

export function generatePillarChartData(
	classifications: PillarClassification[]
): PillarScatterPoint[] {
	return classifications.map((c) => ({
		videoId: c.videoId,
		title: c.title.length > 40 ? `${c.title.slice(0, 37)}...` : c.title,
		pillar: c.pillar,
		views: c.views,
		engagementRate: Math.round(c.engagementRate * 100) / 100,
		color: PILLAR_COLORS[c.pillar],
	}));
}

// Generate bar chart data for average views by content type
export function generateBarChartData(
	stats: Partial<Record<ContentPillar, PillarStats>>,
	formatBreakdown: FormatBreakdown
): PillarBarData[] {
	const data: PillarBarData[] = [];

	// Add Shorts
	if (formatBreakdown.shorts.count > 0) {
		data.push({
			pillar: "Shorts",
			label: "Shorts",
			avgViews: formatBreakdown.shorts.avgViews,
			count: formatBreakdown.shorts.count,
			color: PILLAR_COLORS["Shorts"],
		});
	}

	// Add Long-form pillars (excluding Shorts)
	for (const [pillar, s] of Object.entries(stats) as [ContentPillar, PillarStats][]) {
		if (!s || pillar === "Shorts") continue;
		data.push({
			pillar,
			label: pillar,
			avgViews: s.avgViews,
			count: s.count,
			color: PILLAR_COLORS[pillar],
		});
	}

	// Sort by avgViews descending
	return data.sort((a, b) => b.avgViews - a.avgViews);
}

// Generate verdict based on analysis
export function generateVerdict(
	analysis: PillarAnalysis,
	formatBreakdown: FormatBreakdown,
	channelHealth: "strong" | "mixed" | "weak"
): PillarVerdict {
	const { growthDriver, underperformer, pillarStats } = analysis;
	const driverStats = pillarStats[growthDriver];
	const underStats = pillarStats[underperformer];

	const shortsOutperform = formatBreakdown.shorts.avgViews > formatBreakdown.longForm.avgViews;
	const shortsPct = formatBreakdown.shorts.percentage;

	// Generate headline
	let headline: string;
	if (channelHealth === "strong") {
		if (growthDriver === "Shorts" || shortsOutperform) {
			headline = `Shorts drive the most views on this channel, averaging ${formatNumber(formatBreakdown.shorts.avgViews)} views per video.`;
		} else if (growthDriver === "Creator-Led") {
			headline = `Creator-led long-form videos consistently outperform other formats on this channel.`;
		} else {
			headline = `${growthDriver} content is this channel's strongest performer, averaging ${formatNumber(driverStats?.avgViews || 0)} views.`;
		}
	} else if (channelHealth === "weak") {
		headline = `This channel uploads frequently but most videos fail to outperform the channel average.`;
	} else {
		headline = `Content performance is inconsistent. ${growthDriver} shows promise but results vary.`;
	}

	// Generate "why it works" bullets
	const whyItWorks: string[] = [];
	if (driverStats && driverStats.count >= 2) {
		whyItWorks.push(`${growthDriver} content has ${driverStats.count} videos with ${driverStats.avgEngagement.toFixed(1)}% avg engagement.`);
	}
	if (shortsOutperform && shortsPct > 20) {
		whyItWorks.push(`Shorts capture browse traffic effectively with ${formatNumber(formatBreakdown.shorts.avgViews)} avg views.`);
	} else if (!shortsOutperform && shortsPct < 30) {
		whyItWorks.push(`Long-form content builds deeper audience connection with ${formatNumber(formatBreakdown.longForm.avgViews)} avg views.`);
	}

	// Add format mix insight
	const activePillars = Object.entries(pillarStats).filter(([_, s]) => s && s.count >= 2).length;
	if (activePillars <= 2) {
		whyItWorks.push("Focused content strategy helps the algorithm understand who to recommend to.");
	}

	// Generate common mistakes for weak channels
	const commonMistakes: string[] = [];
	if (channelHealth === "weak" || channelHealth === "mixed") {
		if (activePillars > 4) {
			commonMistakes.push("Content is spread across too many formats, making it harder for the algorithm to categorize.");
		}
		if (underStats && underStats.avgViews < (driverStats?.avgViews || 0) * 0.3) {
			commonMistakes.push(`${underperformer} content significantly underperforms and may hurt overall channel metrics.`);
		}
		if (shortsPct > 60 && !shortsOutperform) {
			commonMistakes.push("Heavy Shorts focus isn't translating to strong performance. Consider rebalancing.");
		}
	}

	return {
		headline,
		isStrong: channelHealth === "strong",
		whyItWorks: whyItWorks.slice(0, 3),
		commonMistakes: commonMistakes.length > 0 ? commonMistakes : undefined,
	};
}

// Generate "So What" section
export function generateSoWhat(
	analysis: PillarAnalysis,
	formatBreakdown: FormatBreakdown,
	channelHealth: "strong" | "mixed" | "weak"
): SoWhatSection {
	const { growthDriver, underperformer } = analysis;
	const shortsOutperform = formatBreakdown.shorts.avgViews > formatBreakdown.longForm.avgViews;

	let body: string;
	const actionItems: string[] = [];

	if (channelHealth === "strong") {
		if (shortsOutperform) {
			body = `If you create content in a similar niche, Shorts appear to be a strong growth lever. However, consider mixing in long-form content for subscriber retention and deeper engagement.`;
			actionItems.push("Study their top Shorts for hook patterns and pacing");
			actionItems.push("Test similar short-form content in your niche");
			actionItems.push("Add long-form content to convert casual viewers to subscribers");
		} else {
			body = `If you create content in the same niche, your best growth opportunity is ${growthDriver.toLowerCase()} long-form videos. Shorts may drive reach but this channel's sustained engagement comes from longer content.`;
			actionItems.push(`Analyze their top ${growthDriver} videos for structure and topics`);
			actionItems.push("Focus on depth over frequency for long-form content");
			actionItems.push("Use Shorts as teasers to drive traffic to long-form");
		}
	} else if (channelHealth === "weak") {
		body = `This channel shows inconsistent performance patterns. Use it as a case study of what NOT to do, or identify specific videos that broke through to understand exceptions.`;
		actionItems.push("Don't copy the format mix - it's not working");
		actionItems.push("Look for outlier videos that performed well and study those specifically");
		actionItems.push("Consider if this niche requires a different approach entirely");
	} else {
		body = `This channel has mixed results. ${growthDriver} content shows promise, but overall strategy needs refinement. Learn from their wins while avoiding their inconsistencies.`;
		actionItems.push(`Focus only on replicating their ${growthDriver} approach`);
		actionItems.push(`Avoid their ${underperformer} content style`);
		actionItems.push("Test with more consistency than this channel shows");
	}

	return {
		title: "What This Means For You",
		body,
		actionItems,
	};
}

// Calculate channel health
export function calculateChannelHealth(
	stats: Partial<Record<ContentPillar, PillarStats>>,
	_formatBreakdown: FormatBreakdown
): "strong" | "mixed" | "weak" {
	const allStats = Object.values(stats).filter((s): s is PillarStats => s !== undefined);
	if (allStats.length === 0) return "weak";

	const avgViews = allStats.reduce((sum, s) => sum + s.avgViews, 0) / allStats.length;
	const avgEngagement = allStats.reduce((sum, s) => sum + s.avgEngagement, 0) / allStats.length;

	// Check if top performer significantly outperforms average
	const topAvgViews = Math.max(...allStats.map(s => s.avgViews));
	const viewsVariance = topAvgViews / (avgViews || 1);

	// Strong: high engagement and consistent views
	if (avgEngagement > 4 && viewsVariance < 3) return "strong";

	// Weak: low engagement or very inconsistent
	if (avgEngagement < 2 || viewsVariance > 5) return "weak";

	return "mixed";
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
	return num.toString();
}

export function generateFormatPieData(
	formatBreakdown: FormatBreakdown
): FormatPieSlice[] {
	return [
		{
			name: "Shorts",
			value: formatBreakdown.shorts.count,
			percentage: Math.round(formatBreakdown.shorts.percentage),
			fill: "#a855f7", // Violet
		},
		{
			name: "Long-form",
			value: formatBreakdown.longForm.count,
			percentage: Math.round(formatBreakdown.longForm.percentage),
			fill: "#3b82f6", // Blue
		},
	];
}

function generateFormatRecommendation(format: Omit<FormatBreakdown, "recommendation">): string {
	const shortsPct = format.shorts.percentage;
	const shortsPerformsBetter = format.shorts.avgViews > format.longForm.avgViews;

	if (shortsPct < 10) {
		return "Consider adding Shorts to capture browse traffic and reach new audiences.";
	}
	if (shortsPct > 70) {
		return shortsPerformsBetter
			? "Shorts-first strategy is working. Consider occasional long-form for depth."
			: "Long-form outperforms Shorts. Consider rebalancing your format mix.";
	}
	if (shortsPerformsBetter) {
		return "Shorts are outperforming - consider increasing short-form output.";
	}
	return "Balanced format mix. Focus on whichever format aligns with your goals.";
}

function generatePillarInsights(
	analysis: PillarAnalysis,
	_format: FormatBreakdown
): PillarInsight[] {
	const insights: PillarInsight[] = [];

	// Growth driver insight
	const driverStats = analysis.pillarStats[analysis.growthDriver];
	if (driverStats && driverStats.count >= 2) {
		insights.push({
			id: "pillar-growth-driver",
			label: `${analysis.growthDriver} is Your Growth Driver`,
			severity: "strong",
			evidence: `${driverStats.count} ${analysis.growthDriver} videos avg ${Math.round(driverStats.avgViews).toLocaleString()} views with ${driverStats.avgEngagement.toFixed(1)}% engagement.`,
			impact: "This content type resonates most with your audience.",
			action: `Double down on ${analysis.growthDriver} content and analyze what makes these videos work.`,
		});
	}

	// Underperformer insight
	const underStats = analysis.pillarStats[analysis.underperformer];
	if (underStats && underStats.count >= 2 && analysis.underperformer !== analysis.growthDriver) {
		insights.push({
			id: "pillar-underperformer",
			label: `${analysis.underperformer} Content Underperforming`,
			severity: "weak",
			evidence: `${underStats.count} ${analysis.underperformer} videos avg only ${Math.round(underStats.avgViews).toLocaleString()} views.`,
			impact: "This content type may not resonate with your audience.",
			action: `Consider reducing ${analysis.underperformer} content or testing different angles.`,
		});
	}

	// Pillar diversity insight
	const activePillars = Object.entries(analysis.pillarStats).filter(
		([_, s]) => s && s.count >= 2
	).length;

	if (activePillars === 1) {
		insights.push({
			id: "pillar-single-focus",
			label: "Single Content Pillar Focus",
			severity: "neutral",
			evidence: "Content is concentrated in one category.",
			impact: "Low risk but limited audience expansion potential.",
			action: "Consider testing adjacent content pillars to find new audiences.",
		});
	} else if (activePillars > 4) {
		insights.push({
			id: "pillar-scattered",
			label: "Scattered Content Strategy",
			severity: "concerning",
			evidence: `Content spread across ${activePillars} different pillars.`,
			impact: "Algorithm struggles to categorize your channel.",
			action: "Focus on your top 2-3 performing pillars for the next 10 videos.",
		});
	}

	return insights.slice(0, 3);
}

export async function analyzePillars(
	videos: YoutubeVideo[]
): Promise<PillarsResponse> {
	// Get pillar classifications
	const classifications = await categorizePillars(videos);

	// Calculate stats per pillar
	const pillarStats = calculatePillarStats(classifications);

	// Find growth driver and underperformer
	const growthDriver = findGrowthDriver(pillarStats);
	const underperformer = findUnderperformer(pillarStats);

	const analysis: PillarAnalysis = {
		pillars: classifications,
		pillarStats,
		growthDriver,
		underperformer,
	};

	// Calculate format breakdown
	const rawFormat = getFormatBreakdown(videos);
	const formatBreakdown: FormatBreakdown = {
		...rawFormat,
		recommendation: generateFormatRecommendation(rawFormat),
	};

	// Calculate channel health
	const channelHealth = calculateChannelHealth(pillarStats, formatBreakdown);

	// Generate chart data
	const chartData = generatePillarChartData(classifications);
	const pieData = generateFormatPieData(formatBreakdown);
	const barChartData = generateBarChartData(pillarStats, formatBreakdown);

	// Generate verdict and so what sections
	const verdict = generateVerdict(analysis, formatBreakdown, channelHealth);
	const soWhat = generateSoWhat(analysis, formatBreakdown, channelHealth);

	// Generate insights
	const insights = generatePillarInsights(analysis, formatBreakdown);

	return {
		analysis,
		formatBreakdown,
		chartData,
		pieData,
		barChartData,
		verdict,
		soWhat,
		insights,
		channelHealth,
	};
}
