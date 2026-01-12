// YouTube API Types - Extended for Learning Lab

export type Severity = "strong" | "neutral" | "weak" | "concerning";

export interface YoutubeChannel {
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
}

export interface YoutubeVideo {
	id: string;
	title: string;
	description?: string;
	publishedAt: string;
	durationSec?: number;
	views?: number;
	likes?: number;
	comments?: number;
	tags?: string[];
	thumbnails: Record<string, { url: string; width: number; height: number }>;
	isShort?: boolean;
}

export interface YoutubeComment {
	id: string;
	videoId: string;
	authorName: string;
	authorProfileImage?: string;
	text: string;
	likeCount: number;
	publishedAt: string;
	isReply: boolean;
}

export interface VideoFetchOptions {
	maxResults?: number;
	includeDescription?: boolean;
	includeTags?: boolean;
}

export interface ScoredInsight {
	id: string;
	label: string;
	severity: Severity;
	evidence: string;
	impact: string;
	action?: string;
	examples?: string[];
}

export interface CategoryAnalysis {
	score: number;
	severity: Severity;
	summary: string;
	insights: ScoredInsight[];
}

export interface DerivedMetrics {
	postingFrequency: string;
	averageTitleLength: number;
	commonKeywords: { word: string; count: number }[];
}

export interface SearchVisibilityResult {
	scores: { label: string; score: number }[];
	median: number;
}
