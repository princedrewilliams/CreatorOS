// Learning Lab Types

import type { YoutubeChannel, Severity } from "../youtube/types";

// Content Pillars
export type ContentPillar =
	| "Documentary"
	| "Tutorial"
	| "Q&A"
	| "Vlog"
	| "Commentary"
	| "Review"
	| "News"
	| "Entertainment"
	| "Educational"
	| "Shorts"
	| "Creator-Led";

export const PILLAR_COLORS: Record<ContentPillar, string> = {
	Documentary: "#8b5cf6",
	Tutorial: "#10b981",
	"Q&A": "#f59e0b",
	Vlog: "#ec4899",
	Commentary: "#3b82f6",
	Review: "#ef4444",
	News: "#6366f1",
	Entertainment: "#f97316",
	Educational: "#14b8a6",
	Shorts: "#a855f7",
	"Creator-Led": "#f472b6",
};

// Pillar definitions for tooltips
export const PILLAR_DEFINITIONS: Record<ContentPillar, string> = {
	Documentary: "Deep-dive, investigative, or long-form storytelling content",
	Tutorial: "How-to guides, step-by-step instructions, skill teaching",
	"Q&A": "Question and answer format, interviews, AMAs",
	Vlog: "Personal life updates, day-in-the-life, behind-the-scenes",
	Commentary: "Opinion pieces, reaction videos, analysis of events/trends",
	Review: "Product reviews, comparisons, testing content",
	News: "Current events, updates, announcements",
	Entertainment: "Comedy, challenges, pranks, entertainment-focused",
	Educational: "Informative content, explainers, facts, science",
	Shorts: "Short-form content under 60 seconds",
	"Creator-Led": "Videos where the creator's personality, reactions, humor, or unscripted behavior drives engagement rather than a strict format",
};

export interface PillarClassification {
	videoId: string;
	title: string;
	pillar: ContentPillar;
	confidence: number;
	views: number;
	engagementRate: number;
}

export interface PillarStats {
	count: number;
	avgViews: number;
	avgEngagement: number;
	totalViews: number;
}

export interface PillarAnalysis {
	pillars: PillarClassification[];
	pillarStats: Partial<Record<ContentPillar, PillarStats>>;
	growthDriver: ContentPillar;
	underperformer: ContentPillar;
}

export interface FormatBreakdown {
	shorts: {
		count: number;
		percentage: number;
		avgViews: number;
		avgEngagement: number;
	};
	longForm: {
		count: number;
		percentage: number;
		avgViews: number;
		avgEngagement: number;
	};
	recommendation: string;
}

export interface PillarScatterPoint {
	videoId: string;
	title: string;
	pillar: ContentPillar;
	views: number;
	engagementRate: number;
	color: string;
}

export interface FormatPieSlice {
	name: "Shorts" | "Long-form";
	value: number;
	percentage: number;
	fill: string;
	[key: string]: string | number;
}

// Bar chart data for average views by content type
export interface PillarBarData {
	pillar: ContentPillar;
	label: string;
	avgViews: number;
	count: number;
	color: string;
}

// Verdict section for clear conclusions
export interface PillarVerdict {
	headline: string;
	isStrong: boolean;
	whyItWorks: string[];
	commonMistakes?: string[];
}

// So What section
export interface SoWhatSection {
	title: string;
	body: string;
	actionItems: string[];
}

export interface PillarsResponse {
	analysis: PillarAnalysis;
	formatBreakdown: FormatBreakdown;
	chartData: PillarScatterPoint[];
	pieData: FormatPieSlice[];
	barChartData: PillarBarData[];
	verdict: PillarVerdict;
	soWhat: SoWhatSection;
	insights: PillarInsight[];
	channelHealth: "strong" | "mixed" | "weak";
}

export interface PillarInsight {
	id: string;
	label: string;
	severity: Severity;
	evidence: string;
	impact: string;
	action?: string;
}

// Packaging & SEO
export type HookType =
	| "Curiosity"
	| "Negativity Bias"
	| "List/Number"
	| "How-To"
	| "Question"
	| "Urgency"
	| "Social Proof"
	| "Controversy"
	| "Personal Story"
	| "None Detected";

export interface TitleAnalysis {
	videoId: string;
	title: string;
	views: number;
	hooks: HookType[];
	powerWords: string[];
	hookScore: number;
	lengthOptimal: boolean;
}

export interface TitlePsychologyAnalysis {
	topPerformers: TitleAnalysis[];
	hookDistribution: Partial<Record<HookType, number>>;
	avgHookScore: number;
	topPowerWords: { word: string; count: number; avgViews: number }[];
	recommendations: string[];
}

export interface ThumbnailAnalysis {
	videoId: string;
	thumbnailUrl: string;
	analysis: {
		hasFace: boolean | null;
		faceType?: "close-up" | "medium" | "wide" | "none";
		faceEmotion?: string;
		dominantColors: string[];
		colorPalette?: "high-saturation" | "muted" | "monochrome";
		hasTextOverlay: boolean | null;
		textDensity?: "low" | "medium" | "high";
		compositionScore?: number;
	};
	status: "analyzed" | "pending" | "unsupported";
}

export interface SEOExtraction {
	videoId: string;
	title: string;
	primaryKeywords: string[];
	lsiKeywords: string[];
	descriptionPreview: string;
	tagCount: number;
	hasTimestamps: boolean;
	hasLinks: boolean;
}

export interface ThumbnailPatterns {
	faceUsagePercent: number;
	avgCompositionScore: number;
	commonColors: string[];
	textOverlayPercent: number;
	dominantFaceType: string;
	dominantEmotion?: string;
	insights: string[];
}

export interface PackagingResponse {
	titlePsychology: TitlePsychologyAnalysis;
	thumbnails: ThumbnailAnalysis[];
	thumbnailPatterns: ThumbnailPatterns;
	seoExtraction: {
		videos: SEOExtraction[];
		topKeywords: { keyword: string; frequency: number }[];
		keywordGaps: string[];
	};
	overallScore: number;
	severity: Severity;
	insights: PackagingInsight[];
}

export interface PackagingInsight {
	id: string;
	label: string;
	severity: Severity;
	evidence: string;
	impact: string;
	action?: string;
}

// Community Intelligence
export type CommentCategory =
	| "Question"
	| "Complaint"
	| "Feature Request"
	| "Praise"
	| "Suggestion"
	| "Other";

export interface ClusteredComment {
	id: string;
	text: string;
	category: CommentCategory;
	sentiment: "positive" | "neutral" | "negative";
	videoId: string;
	likeCount: number;
}

export interface ContentGap {
	theme: string;
	category: CommentCategory;
	frequency: number;
	exampleComments: string[];
	priority: "high" | "medium" | "low";
}

export interface EngagementVelocity {
	videoId: string;
	title: string;
	publishedAt: string;
	currentViews: number;
	hoursOld: number;
	viewsPerHour: number;
	velocityRank: number;
}

export interface CommunityResponse {
	comments: ClusteredComment[];
	contentGaps: ContentGap[];
	engagementVelocity: EngagementVelocity[];
	topTrendingVideos: string[];
	sentimentBreakdown: {
		positive: number;
		neutral: number;
		negative: number;
	};
	severity: Severity;
	insights: CommunityInsight[];
}

export interface CommunityInsight {
	id: string;
	label: string;
	severity: Severity;
	evidence: string;
	impact: string;
	action?: string;
}

// Unified Learning Lab Response
export interface LearningLabRequest {
	channelUrl: string;
	userNiche?: string;
	modules?: ("pillars" | "packaging" | "community")[];
}

export interface LearningLabResponse {
	channel: YoutubeChannel;
	pillars?: PillarsResponse;
	packaging?: PackagingResponse;
	community?: CommunityResponse;
	overallInsights: {
		growthOpportunity: string;
		contentStrategy: string;
		packagingAdvice: string;
	};
	fetchedAt: string;
	videosAnalyzed: number;
}
