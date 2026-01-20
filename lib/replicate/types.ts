// Replicate This - Type Definitions

export interface ThumbnailFormatProfile {
	aspectRatio: "16:9";
	subjectPosition: "left" | "center" | "right";
	subjectScale: number; // 0-100
	textBlockCount: 0 | 1 | 2;
	textPosition: "top" | "center" | "bottom" | "none";
	averageTextLength: number;
	dominantLayoutType: "face-led" | "object-led" | "text-led";
}

export type CanvaTemplateType =
	| "face-left-text-right"
	| "face-right-text-left"
	| "center-subject-no-text"
	| "text-heavy-top-image-bottom";

export interface CanvaTemplateMatch {
	templateType: CanvaTemplateType;
	confidence: number;
	deepLinkUrl: string;
	displayName: string;
	description: string;
}

export interface ContentConstraints {
	title: {
		minLength: number;
		maxLength: number;
		requiredHooks: string[];
		suggestedPowerWords: string[];
	};
	seo: {
		primaryKeywords: string[];
		requiredTopics: string[];
		minDescriptionLength: number;
	};
	video: {
		recommendedDurationMin: number;
		recommendedDurationMax: number;
		suggestedFormat: string;
	};
	thumbnail: {
		recommendFace: boolean;
		faceType: "close-up" | "medium" | "wide" | "none";
		recommendTextOverlay: boolean;
		suggestedColors: string[];
		formatProfile?: ThumbnailFormatProfile;
		matchedTemplate?: CanvaTemplateMatch;
	};
	schedule: {
		recommendedDays: number[]; // 0-6 (Sunday-Saturday)
		recommendedHours: number[]; // 0-23
		minDaysBetweenUploads: number;
	};
}

export interface ReplicationSettings {
	id: string;
	userId: string;
	targetChannelId: string;
	referenceChannelId: string;
	referenceChannelName: string;
	referenceChannelThumbnail?: string;
	constraints: ContentConstraints;
	createdAt: string;
	updatedAt: string;
}

export type ViolationSeverity = "error" | "warning";

export interface ConstraintViolation {
	field: string;
	constraint: string;
	actual: string | number;
	expected: string | number;
	severity: ViolationSeverity;
}

export interface UploadDraft {
	title: string;
	description: string;
	tags: string[];
}

export interface ValidationResult {
	valid: boolean;
	violations: ConstraintViolation[];
	score: number; // 0-100 compliance score
}

// API Response types
export interface DeriveConstraintsRequest {
	channelUrl: string;
	targetChannelId: string;
}

export interface DeriveConstraintsResponse {
	success: boolean;
	settings?: ReplicationSettings;
	error?: string;
}

export interface ValidateUploadRequest {
	settingsId: string;
	upload: UploadDraft;
}

export interface ValidateUploadResponse {
	valid: boolean;
	violations: ConstraintViolation[];
	score: number;
}

// Channel data for UI
export interface UserYouTubeChannel {
	id: string;
	title: string;
	thumbnail: string;
	subscriberCount?: number;
}
