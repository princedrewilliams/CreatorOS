// User data storage for cross-device sync
// In production, this would use a database (PostgreSQL, MongoDB, etc.)

import type { ReplicationSettings } from "@/lib/replicate/types";

export interface UserSocialConnection {
	userId: string;
	platform: "youtube" | "instagram" | "tiktok";
	connected: boolean;
	accessToken?: string;
	refreshToken?: string;
	expiresAt?: number;
	username?: string;
	userPlatformId?: string;
	profilePicture?: string;
}

export interface UserSubscription {
	userId: string;
	isPro: boolean;
	planType?: "monthly" | "annual";
	purchasedAt?: string;
	expiresAt?: string;
	cancelledAt?: string;
}

export interface UserStripeConnection {
	userId: string;
	connected: boolean;
	accessToken?: string;
	refreshToken?: string;
	stripeAccountId?: string;
	stripePublishableKey?: string;
	livemode?: boolean;
	expiresAt?: number;
	connectedAt?: string;
}

// In-memory stores (replace with database in production)
const userSocialConnections = new Map<string, UserSocialConnection[]>();
const userSubscriptions = new Map<string, UserSubscription>();
const userStripeConnections = new Map<string, UserStripeConnection>();

// Social Connections
export function getUserSocialConnections(userId: string): UserSocialConnection[] {
	return userSocialConnections.get(userId) || [];
}

export function setUserSocialConnection(userId: string, connection: UserSocialConnection) {
	const connections = getUserSocialConnections(userId);
	const existingIndex = connections.findIndex((c) => c.platform === connection.platform);
	
	if (existingIndex >= 0) {
		connections[existingIndex] = connection;
	} else {
		connections.push(connection);
	}
	
	userSocialConnections.set(userId, connections);
	return connection;
}

export function removeUserSocialConnection(userId: string, platform: "youtube" | "instagram" | "tiktok") {
	const connections = getUserSocialConnections(userId);
	const filtered = connections.filter((c) => c.platform !== platform);
	userSocialConnections.set(userId, filtered);
}

// Subscriptions
export function getUserSubscription(userId: string): UserSubscription | null {
	return userSubscriptions.get(userId) || { userId, isPro: false };
}

export function setUserSubscription(userId: string, subscription: UserSubscription) {
	userSubscriptions.set(userId, subscription);
	return subscription;
}

export function cancelUserSubscription(userId: string): UserSubscription {
	const currentSubscription = getUserSubscription(userId);
	const cancelledSubscription: UserSubscription = {
		userId,
		isPro: false,
		planType: currentSubscription?.planType,
		purchasedAt: currentSubscription?.purchasedAt,
		expiresAt: undefined,
		cancelledAt: new Date().toISOString(),
	};
	userSubscriptions.set(userId, cancelledSubscription);
	return cancelledSubscription;
}

// Stripe Connections
export function getUserStripeConnection(userId: string): UserStripeConnection | null {
	return userStripeConnections.get(userId) || { userId, connected: false };
}

export function setUserStripeConnection(userId: string, connection: UserStripeConnection) {
	userStripeConnections.set(userId, connection);
	return connection;
}

export function removeUserStripeConnection(userId: string) {
	userStripeConnections.delete(userId);
}

// Replication Settings
const userReplicationSettings = new Map<string, ReplicationSettings[]>();

export function getUserReplicationSettings(userId: string): ReplicationSettings[] {
	return userReplicationSettings.get(userId) || [];
}

export function setUserReplicationSettings(
	userId: string,
	settings: ReplicationSettings
): ReplicationSettings {
	const existing = getUserReplicationSettings(userId);
	const existingIndex = existing.findIndex((s) => s.id === settings.id);

	if (existingIndex >= 0) {
		existing[existingIndex] = settings;
	} else {
		existing.push(settings);
	}

	userReplicationSettings.set(userId, existing);
	return settings;
}

export function getReplicationSettingsById(
	userId: string,
	id: string
): ReplicationSettings | null {
	const settings = getUserReplicationSettings(userId);
	return settings.find((s) => s.id === id) || null;
}

export function deleteReplicationSettings(userId: string, id: string): boolean {
	const settings = getUserReplicationSettings(userId);
	const filtered = settings.filter((s) => s.id !== id);

	if (filtered.length === settings.length) {
		return false; // Nothing was deleted
	}

	userReplicationSettings.set(userId, filtered);
	return true;
}

// Export stores for API routes
export { userSocialConnections, userSubscriptions, userStripeConnections, userReplicationSettings };

