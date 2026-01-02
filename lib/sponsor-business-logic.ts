// Business logic helpers for sponsor management
import type { Sponsor, DealStatus } from "./sponsor-data";

export interface SponsorSummary {
	activeDealsCount: number;
	totalDealValue: number;
	paidAmount: number;
	unpaidAmount: number;
	upcomingDeadlines: Sponsor[];
	overdueDeals: Sponsor[];
	monthlyRevenue: number;
}

/**
 * Calculate summary statistics for a user's sponsors
 */
export function calculateSponsorSummary(sponsors: Sponsor[]): SponsorSummary {
	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();
	
	// Active deals (status = "active")
	const activeDeals = sponsors.filter((s) => s.dealStatus === "active");
	const activeDealsCount = activeDeals.length;
	
	// Total deal value (sum of all active + negotiating deals)
	const activeAndNegotiating = sponsors.filter(
		(s) => s.dealStatus === "active" || s.dealStatus === "negotiating"
	);
	const totalDealValue = activeAndNegotiating.reduce((sum, s) => sum + s.rate, 0);
	
	// Paid vs unpaid amounts
	const paidDeals = sponsors.filter((s) => s.paymentStatus === "paid");
	const unpaidDeals = sponsors.filter(
		(s) => s.paymentStatus === "unpaid" || s.paymentStatus === "invoiced"
	);
	
	const paidAmount = paidDeals.reduce((sum, s) => sum + s.rate, 0);
	const unpaidAmount = unpaidDeals.reduce((sum, s) => sum + s.rate, 0);
	
	// Upcoming deadlines (within next 30 days)
	const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
	const upcomingDeadlines = sponsors
		.filter((s) => {
			if (!s.dueDate) return false;
			const dueDate = new Date(s.dueDate);
			return dueDate > now && dueDate <= thirtyDaysFromNow;
		})
		.sort((a, b) => {
			const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
			const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
			return dateA - dateB;
		});
	
	// Overdue deals (dueDate has passed and paymentStatus is not "paid")
	const overdueDeals = sponsors.filter((s) => {
		if (!s.dueDate) return false;
		const dueDate = new Date(s.dueDate);
		return dueDate < now && s.paymentStatus !== "paid";
	});
	
	// Monthly revenue (completed deals with paid status in current month)
	const monthlyRevenue = sponsors
		.filter((s) => {
			if (s.dealStatus !== "completed" || s.paymentStatus !== "paid") return false;
			const createdAt = new Date(s.createdAt);
			return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
		})
		.reduce((sum, s) => sum + s.rate, 0);
	
	return {
		activeDealsCount,
		totalDealValue,
		paidAmount,
		unpaidAmount,
		upcomingDeadlines,
		overdueDeals,
		monthlyRevenue,
	};
}

/**
 * Validate sponsor data according to business rules
 */
export function validateSponsor(sponsor: Partial<Sponsor>): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	
	if (!sponsor.brandName || sponsor.brandName.trim().length === 0) {
		errors.push("Brand name is required");
	}
	
	if (sponsor.rate !== undefined && sponsor.rate < 0) {
		errors.push("Rate must be a positive number");
	}
	
	if (!sponsor.currency || sponsor.currency.trim().length === 0) {
		errors.push("Currency is required");
	}
	
	// Business rule: Active sponsors must have a dueDate
	if (sponsor.dealStatus === "active" && !sponsor.dueDate) {
		errors.push("Active sponsors must have a due date");
	}
	
	// Business rule: Completed sponsors should be marked paid
	if (sponsor.dealStatus === "completed" && sponsor.paymentStatus !== "paid") {
		errors.push("Completed sponsors should be marked as paid");
	}
	
	// Validate dueDate format if provided
	if (sponsor.dueDate) {
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(sponsor.dueDate)) {
			errors.push("Due date must be in YYYY-MM-DD format");
		}
	}
	
	// Validate email format if provided
	if (sponsor.contactEmail) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(sponsor.contactEmail)) {
			errors.push("Contact email must be a valid email address");
		}
	}
	
	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Check if a deal is overdue and warn user
 */
export function checkOverdueWarnings(sponsor: Sponsor): string[] {
	const warnings: string[] = [];
	
	if (!sponsor.dueDate) return warnings;
	
	const dueDate = new Date(sponsor.dueDate);
	const now = new Date();
	
	// Warn if deal is active but payment is unpaid after due date
	if (sponsor.dealStatus === "active" && dueDate < now && sponsor.paymentStatus !== "paid") {
		warnings.push("Deal is active but payment is unpaid after due date");
	}
	
	return warnings;
}

/**
 * Group sponsors by deal status for pipeline view
 */
export function groupSponsorsByStatus(sponsors: Sponsor[]): Record<DealStatus, Sponsor[]> {
	const grouped: Record<DealStatus, Sponsor[]> = {
		lead: [],
		negotiating: [],
		active: [],
		completed: [],
		rejected: [],
	};
	
	sponsors.forEach((sponsor) => {
		grouped[sponsor.dealStatus].push(sponsor);
	});
	
	return grouped;
}

/**
 * Calculate revenue trends (for Growth Engine integration)
 */
export interface RevenueTrend {
	month: string; // YYYY-MM format
	revenue: number;
	dealCount: number;
	averageDealSize: number;
}

export function calculateRevenueTrends(sponsors: Sponsor[]): RevenueTrend[] {
	// Group completed and paid sponsors by month
	const monthlyData = new Map<string, { revenue: number; count: number }>();
	
	sponsors
		.filter((s) => s.dealStatus === "completed" && s.paymentStatus === "paid")
		.forEach((sponsor) => {
			const date = new Date(sponsor.createdAt);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
			
			const existing = monthlyData.get(monthKey) || { revenue: 0, count: 0 };
			monthlyData.set(monthKey, {
				revenue: existing.revenue + sponsor.rate,
				count: existing.count + 1,
			});
		});
	
	// Convert to array and calculate averages
	const trends: RevenueTrend[] = Array.from(monthlyData.entries())
		.map(([month, data]) => ({
			month,
			revenue: data.revenue,
			dealCount: data.count,
			averageDealSize: data.count > 0 ? data.revenue / data.count : 0,
		}))
		.sort((a, b) => a.month.localeCompare(b.month));
	
	return trends;
}

