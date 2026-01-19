// Feature-based paywall utilities

import { getCurrentUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/user-data";

export type ProFeature =
	| "learning-lab"
	| "replicate-this"
	| "scheduling"
	| "seo-constraints"
	| "thumbnail-templates";

export const PRO_FEATURES: Set<ProFeature> = new Set([
	"learning-lab",
	"replicate-this",
	"scheduling",
	"seo-constraints",
	"thumbnail-templates",
]);

export const FEATURE_DISPLAY_NAMES: Record<ProFeature, string> = {
	"learning-lab": "Learning Lab",
	"replicate-this": "Replicate This",
	"scheduling": "Advanced Scheduling",
	"seo-constraints": "SEO Constraints",
	"thumbnail-templates": "Thumbnail Templates",
};

export interface ProStatus {
	isPro: boolean;
	userId: string | null;
	isAuthenticated: boolean;
}

export interface ProCheckResult {
	allowed: boolean;
	reason?: string;
}

/**
 * Check the Pro status of the current user
 */
export async function checkProStatus(): Promise<ProStatus> {
	const user = await getCurrentUser();

	if (!user) {
		return {
			isPro: false,
			userId: null,
			isAuthenticated: false,
		};
	}

	const subscription = getUserSubscription(user.whop_user_id);
	const isPro = subscription?.isPro ?? false;

	// Check if subscription has expired
	if (isPro && subscription?.expiresAt) {
		const expiryDate = new Date(subscription.expiresAt);
		if (expiryDate < new Date()) {
			return {
				isPro: false,
				userId: user.whop_user_id,
				isAuthenticated: true,
			};
		}
	}

	return {
		isPro,
		userId: user.whop_user_id,
		isAuthenticated: true,
	};
}

/**
 * Check if a user has access to a specific Pro feature
 */
export async function requirePro(feature: ProFeature): Promise<ProCheckResult> {
	// Validate feature is a real Pro feature
	if (!PRO_FEATURES.has(feature)) {
		return {
			allowed: true, // Unknown features are allowed by default
		};
	}

	const status = await checkProStatus();

	if (!status.isAuthenticated) {
		return {
			allowed: false,
			reason: "Please log in to access this feature.",
		};
	}

	if (!status.isPro) {
		const displayName = FEATURE_DISPLAY_NAMES[feature] || feature;
		return {
			allowed: false,
			reason: `${displayName} requires a Pro subscription. Upgrade to unlock this feature.`,
		};
	}

	return {
		allowed: true,
	};
}
