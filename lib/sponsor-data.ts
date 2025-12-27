// Sponsor data storage for cross-device sync
// In production, this would use a database (PostgreSQL, MongoDB, etc.)

export type DealStatus = "lead" | "negotiating" | "active" | "completed" | "rejected";
export type PaymentStatus = "unpaid" | "invoiced" | "paid";

export interface Sponsor {
	id: string;
	userId: string; // Index by userId so each creator only sees their own sponsors
	brandName: string;
	contactName?: string;
	contactEmail?: string;
	dealStatus: DealStatus;
	platform: "youtube"; // Only YouTube for now
	deliverables: string[]; // Array of deliverable strings
	rate: number; // Deal value/rate
	currency: string; // e.g., "USD"
	dueDate?: string; // YYYY-MM-DD format
	paymentStatus: PaymentStatus;
	paymentLink?: string; // PayPal or Stripe payment link
	notes?: string;
	youtubeVideoIds?: string[]; // Array of YouTube video IDs linked to this sponsor
	createdAt: string;
	updatedAt: string;
	deletedAt?: string; // Soft delete timestamp
}

// In-memory store (replace with database in production)
// Structure: Map<userId, Sponsor[]>
const userSponsors = new Map<string, Sponsor[]>();

/**
 * Get all sponsors for a user (excluding soft-deleted)
 */
export function getUserSponsors(userId: string): Sponsor[] {
	const sponsors = userSponsors.get(userId) || [];
	// Filter out soft-deleted sponsors
	return sponsors.filter((sponsor) => !sponsor.deletedAt);
}

/**
 * Get a single sponsor by ID (only if it belongs to the user)
 */
export function getSponsorById(userId: string, sponsorId: string): Sponsor | null {
	const sponsors = getUserSponsors(userId);
	return sponsors.find((s) => s.id === sponsorId) || null;
}

/**
 * Create a new sponsor
 */
export function createSponsor(userId: string, sponsorData: Omit<Sponsor, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt">): Sponsor {
	const sponsors = getUserSponsors(userId);
	
	const now = new Date().toISOString();
	const newSponsor: Sponsor = {
		...sponsorData,
		id: generateId(),
		userId,
		createdAt: now,
		updatedAt: now,
	};
	
	sponsors.push(newSponsor);
	userSponsors.set(userId, sponsors);
	
	return newSponsor;
}

/**
 * Update an existing sponsor
 */
export function updateSponsor(userId: string, sponsorId: string, updates: Partial<Omit<Sponsor, "id" | "userId" | "createdAt" | "deletedAt">>): Sponsor | null {
	const sponsors = userSponsors.get(userId) || [];
	const index = sponsors.findIndex((s) => s.id === sponsorId && !s.deletedAt);
	
	if (index === -1) {
		return null; // Sponsor not found or doesn't belong to user
	}
	
	sponsors[index] = {
		...sponsors[index],
		...updates,
		updatedAt: new Date().toISOString(),
	};
	
	userSponsors.set(userId, sponsors);
	return sponsors[index];
}

/**
 * Soft delete a sponsor (set deletedAt timestamp)
 */
export function deleteSponsor(userId: string, sponsorId: string): boolean {
	const sponsors = userSponsors.get(userId) || [];
	const index = sponsors.findIndex((s) => s.id === sponsorId && !s.deletedAt);
	
	if (index === -1) {
		return false; // Sponsor not found or doesn't belong to user
	}
	
	sponsors[index] = {
		...sponsors[index],
		deletedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	
	userSponsors.set(userId, sponsors);
	return true;
}

/**
 * Get sponsors filtered by deal status
 */
export function getSponsorsByStatus(userId: string, status: DealStatus): Sponsor[] {
	return getUserSponsors(userId).filter((s) => s.dealStatus === status);
}

/**
 * Generate a unique ID for sponsors
 */
function generateId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	return `sponsor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Export store for API routes (if needed for debugging/admin)
export { userSponsors };

