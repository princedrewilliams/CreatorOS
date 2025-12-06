// User data storage for cross-device sync
// In production, this would use a database (PostgreSQL, MongoDB, etc.)

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
}

// In-memory stores (replace with database in production)
const userSocialConnections = new Map<string, UserSocialConnection[]>();
const userSubscriptions = new Map<string, UserSubscription>();

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

// Export stores for API routes
export { userSocialConnections, userSubscriptions };

