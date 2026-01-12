// Community Intelligence Analyzer - Comment clustering and sentiment

import type { YoutubeVideo, YoutubeComment, Severity } from "../youtube/types";
import { analyzeWithLLM } from "../openai/client";
import { calculateEngagementVelocity, getHoursOld } from "../youtube/parsers";
import type {
	CommentCategory,
	ClusteredComment,
	ContentGap,
	EngagementVelocity,
	CommunityResponse,
	CommunityInsight,
} from "./types";

interface LLMCommentCluster {
	comments: {
		id: string;
		category: string;
		sentiment: string;
	}[];
	contentGaps: {
		theme: string;
		category: string;
		frequency: number;
		examples: string[];
		priority: string;
	}[];
}

export async function clusterComments(
	comments: YoutubeComment[]
): Promise<ClusteredComment[]> {
	if (!comments.length) return [];

	// Prepare comment data (limit to avoid token limits)
	const commentData = comments.slice(0, 100).map((c) => ({
		id: c.id,
		text: c.text.slice(0, 300),
		videoId: c.videoId,
		likes: c.likeCount,
	}));

	const systemPrompt = `You are a community sentiment analyst. Categorize YouTube comments into actionable buckets.

Categories:
- Question: Viewer asking for clarification, requesting topics, or seeking help
- Complaint: Frustration, criticism, or negative feedback about content
- Feature Request: Suggestion for future content or improvements
- Praise: Positive feedback, appreciation, or encouragement
- Suggestion: Constructive advice or ideas
- Other: Comments that don't fit other categories

Sentiment:
- positive: Supportive, appreciative, excited
- neutral: Informational, factual, neither positive nor negative
- negative: Frustrated, critical, disappointed

Return JSON:
{
  "comments": [
    { "id": "...", "category": "Question", "sentiment": "neutral" }
  ],
  "contentGaps": [
    { "theme": "tutorial on X topic", "category": "Question", "frequency": 5, "examples": ["can you make a video about...", "..."], "priority": "high" }
  ]
}

Content gaps are recurring themes that represent unmet audience needs.
Priority: high (5+ mentions), medium (3-4), low (1-2)`;

	const userPrompt = `Categorize these ${comments.length} comments and identify content gaps:

${JSON.stringify(commentData, null, 2)}`;

	const result = await analyzeWithLLM<LLMCommentCluster>(systemPrompt, userPrompt);

	const commentMap = new Map(comments.map((c) => [c.id, c]));
	const clustered: ClusteredComment[] = [];

	if (result?.comments) {
		for (const c of result.comments) {
			const original = commentMap.get(c.id);
			if (!original) continue;

			clustered.push({
				id: c.id,
				text: original.text,
				category: validateCategory(c.category),
				sentiment: validateSentiment(c.sentiment),
				videoId: original.videoId,
				likeCount: original.likeCount,
			});
		}
	}

	// Fallback for missed comments
	for (const comment of comments) {
		if (!clustered.find((c) => c.id === comment.id)) {
			clustered.push({
				id: comment.id,
				text: comment.text,
				category: heuristicCategorize(comment.text),
				sentiment: heuristicSentiment(comment.text),
				videoId: comment.videoId,
				likeCount: comment.likeCount,
			});
		}
	}

	return clustered;
}

function validateCategory(input: string): CommentCategory {
	const valid: CommentCategory[] = [
		"Question",
		"Complaint",
		"Feature Request",
		"Praise",
		"Suggestion",
		"Other",
	];
	return valid.find((c) => c.toLowerCase() === input.toLowerCase()) || "Other";
}

function validateSentiment(input: string): "positive" | "neutral" | "negative" {
	const lower = input.toLowerCase();
	if (lower === "positive") return "positive";
	if (lower === "negative") return "negative";
	return "neutral";
}

function heuristicCategorize(text: string): CommentCategory {
	const lower = text.toLowerCase();

	if (/\?|can you|how do|what is|please make/i.test(lower)) return "Question";
	if (/please|you should|would be great|make a video/i.test(lower)) return "Feature Request";
	if (/love|great|amazing|awesome|thank you|best/i.test(lower)) return "Praise";
	if (/hate|bad|worst|disappointing|sucks/i.test(lower)) return "Complaint";
	if (/try|consider|maybe|suggest/i.test(lower)) return "Suggestion";

	return "Other";
}

function heuristicSentiment(text: string): "positive" | "neutral" | "negative" {
	const lower = text.toLowerCase();

	const positive = /love|great|amazing|awesome|thank|best|excellent|perfect|fantastic/i;
	const negative = /hate|bad|worst|terrible|sucks|disappointed|awful|horrible/i;

	if (positive.test(lower)) return "positive";
	if (negative.test(lower)) return "negative";
	return "neutral";
}

export async function identifyContentGaps(
	comments: YoutubeComment[]
): Promise<ContentGap[]> {
	if (comments.length < 10) return [];

	// Cluster comments first
	const clustered = await clusterComments(comments);

	// Group questions and feature requests
	const actionable = clustered.filter(
		(c) => c.category === "Question" || c.category === "Feature Request"
	);

	// Simple theme extraction from actionable comments
	const themes: Record<string, { count: number; examples: string[]; category: CommentCategory }> = {};

	for (const c of actionable) {
		// Extract potential themes (simplified - LLM does better job)
		const words = c.text.toLowerCase().split(/\s+/);
		const keywords = words.filter((w) => w.length > 5);

		for (const kw of keywords.slice(0, 3)) {
			if (!themes[kw]) {
				themes[kw] = { count: 0, examples: [], category: c.category };
			}
			themes[kw].count++;
			if (themes[kw].examples.length < 3) {
				themes[kw].examples.push(c.text.slice(0, 100));
			}
		}
	}

	// Convert to ContentGap format
	const gaps: ContentGap[] = Object.entries(themes)
		.filter(([_, data]) => data.count >= 2)
		.sort((a, b) => b[1].count - a[1].count)
		.slice(0, 5)
		.map(([theme, data]) => ({
			theme,
			category: data.category,
			frequency: data.count,
			exampleComments: data.examples,
			priority: (data.count >= 5 ? "high" : data.count >= 3 ? "medium" : "low") as "high" | "medium" | "low",
		}));

	return gaps;
}

export function calculateVelocities(videos: YoutubeVideo[]): EngagementVelocity[] {
	return videos
		.map((video) => {
			const hoursOld = getHoursOld(video.publishedAt);
			const viewsPerHour = calculateEngagementVelocity(video);

			return {
				videoId: video.id,
				title: video.title,
				publishedAt: video.publishedAt,
				currentViews: video.views || 0,
				hoursOld: Math.round(hoursOld),
				viewsPerHour: Math.round(viewsPerHour),
				velocityRank: 0, // Will be set after sorting
			};
		})
		.sort((a, b) => b.viewsPerHour - a.viewsPerHour)
		.map((v, index) => ({ ...v, velocityRank: index + 1 }));
}

function getSentimentBreakdown(comments: ClusteredComment[]): {
	positive: number;
	neutral: number;
	negative: number;
} {
	const total = comments.length || 1;
	const positive = comments.filter((c) => c.sentiment === "positive").length;
	const negative = comments.filter((c) => c.sentiment === "negative").length;
	const neutral = comments.filter((c) => c.sentiment === "neutral").length;

	return {
		positive: Math.round((positive / total) * 100),
		neutral: Math.round((neutral / total) * 100),
		negative: Math.round((negative / total) * 100),
	};
}

function generateCommunityInsights(
	clustered: ClusteredComment[],
	gaps: ContentGap[],
	velocity: EngagementVelocity[]
): CommunityInsight[] {
	const insights: CommunityInsight[] = [];
	const sentiment = getSentimentBreakdown(clustered);

	// Sentiment insight
	if (sentiment.negative > 20) {
		insights.push({
			id: "comm-high-negative",
			label: "High Negative Sentiment",
			severity: "concerning",
			evidence: `${sentiment.negative}% of comments are negative.`,
			impact: "May indicate content or community issues.",
			action: "Review negative comments for actionable feedback.",
		});
	} else if (sentiment.positive > 60) {
		insights.push({
			id: "comm-positive-community",
			label: "Positive Community Sentiment",
			severity: "strong",
			evidence: `${sentiment.positive}% of comments are positive.`,
			impact: "Strong community support drives retention.",
		});
	}

	// Content gaps insight
	const highPriorityGaps = gaps.filter((g) => g.priority === "high");
	if (highPriorityGaps.length > 0) {
		insights.push({
			id: "comm-content-gaps",
			label: `${highPriorityGaps.length} High-Priority Content Gaps`,
			severity: "neutral",
			evidence: `Audience frequently asks about: ${highPriorityGaps.map((g) => g.theme).join(", ")}`,
			impact: "Unmet demand represents content opportunities.",
			action: "Create content addressing top content gaps.",
		});
	}

	// Question volume insight
	const questions = clustered.filter((c) => c.category === "Question");
	const questionPct = (questions.length / clustered.length) * 100;

	if (questionPct > 30) {
		insights.push({
			id: "comm-high-questions",
			label: "High Question Volume",
			severity: "neutral",
			evidence: `${Math.round(questionPct)}% of comments are questions.`,
			impact: "Indicates engaged audience seeking more value.",
			action: "Consider Q&A videos or FAQ content.",
		});
	}

	// Velocity insight
	if (velocity.length > 0) {
		const topVelocity = velocity[0];
		const avgVelocity =
			velocity.reduce((sum, v) => sum + v.viewsPerHour, 0) / velocity.length;

		if (topVelocity.viewsPerHour > avgVelocity * 2) {
			insights.push({
				id: "comm-velocity-outlier",
				label: "Velocity Outlier Detected",
				severity: "strong",
				evidence: `"${topVelocity.title.slice(0, 40)}..." is gaining ${topVelocity.viewsPerHour.toLocaleString()} views/hour.`,
				impact: "Fast early traction signals algorithmic potential.",
				action: "Study this video's packaging for replicable patterns.",
			});
		}
	}

	return insights.slice(0, 3);
}

function calculateCommunitySeverity(
	clustered: ClusteredComment[],
	gaps: ContentGap[]
): Severity {
	const sentiment = getSentimentBreakdown(clustered);
	const highGaps = gaps.filter((g) => g.priority === "high").length;

	// Concerning if high negative or many complaints
	if (sentiment.negative > 30) return "concerning";

	// Weak if moderate issues
	if (sentiment.negative > 15 || highGaps > 3) return "weak";

	// Strong if positive sentiment and actionable gaps identified
	if (sentiment.positive > 50 && highGaps <= 2) return "strong";

	return "neutral";
}

export async function analyzeCommunity(
	comments: YoutubeComment[],
	videos: YoutubeVideo[]
): Promise<CommunityResponse> {
	// Cluster comments
	const clustered = await clusterComments(comments);

	// Identify content gaps
	const contentGaps = await identifyContentGaps(comments);

	// Calculate engagement velocity
	const velocity = calculateVelocities(videos);

	// Top 5 trending by velocity
	const topTrendingVideos = velocity.slice(0, 5).map((v) => v.videoId);

	// Sentiment breakdown
	const sentimentBreakdown = getSentimentBreakdown(clustered);

	// Generate insights
	const insights = generateCommunityInsights(clustered, contentGaps, velocity);

	// Calculate severity
	const severity = calculateCommunitySeverity(clustered, contentGaps);

	return {
		comments: clustered,
		contentGaps,
		engagementVelocity: velocity,
		topTrendingVideos,
		sentimentBreakdown,
		severity,
		insights,
	};
}
