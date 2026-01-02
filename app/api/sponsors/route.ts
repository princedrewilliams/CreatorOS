import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
	getUserSponsors,
	createSponsor,
	type Sponsor,
	type DealStatus,
} from "@/lib/sponsor-data";
import { validateSponsor, calculateSponsorSummary, groupSponsorsByStatus } from "@/lib/sponsor-business-logic";

/**
 * GET /api/sponsors
 * List all sponsors for the authenticated user
 * Query params: status (optional) - filter by deal status
 */
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const url = new URL(request.url);
		const statusFilter = url.searchParams.get("status") as DealStatus | null;

		let sponsors = getUserSponsors(user.whop_user_id);

		// Filter by status if provided
		if (statusFilter) {
			sponsors = sponsors.filter((s) => s.dealStatus === statusFilter);
		}

		// Calculate summary statistics
		const summary = calculateSponsorSummary(getUserSponsors(user.whop_user_id));
		
		// Group by status for pipeline view
		const grouped = groupSponsorsByStatus(getUserSponsors(user.whop_user_id));

		return NextResponse.json({
			success: true,
			sponsors,
			summary,
			grouped,
		});
	} catch (error) {
		console.error("[Sponsors API] Error fetching sponsors:", error);
		return NextResponse.json(
			{ error: "Failed to fetch sponsors" },
			{ status: 500 }
		);
	}
}

/**
 * POST /api/sponsors
 * Create a new sponsor
 */
export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		
		// Extract and validate required fields
		const sponsorData: Omit<Sponsor, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt"> = {
			brandName: body.brandName?.trim(),
			contactName: body.contactName?.trim(),
			contactEmail: body.contactEmail?.trim(),
			dealStatus: body.dealStatus || "lead",
			platform: "youtube", // Only YouTube for now
			deliverables: Array.isArray(body.deliverables) ? body.deliverables : [],
			rate: typeof body.rate === "number" ? body.rate : parseFloat(body.rate) || 0,
			currency: body.currency || "USD",
			dueDate: body.dueDate || undefined,
			paymentStatus: body.paymentStatus || "unpaid",
			paymentLink: body.paymentLink?.trim() || undefined,
			notes: body.notes?.trim(),
			youtubeVideoIds: Array.isArray(body.youtubeVideoIds) ? body.youtubeVideoIds : undefined,
		};

		// Validate sponsor data
		const validation = validateSponsor(sponsorData);
		if (!validation.valid) {
			return NextResponse.json(
				{ error: "Validation failed", errors: validation.errors },
				{ status: 400 }
			);
		}

		// Create sponsor
		const newSponsor = createSponsor(user.whop_user_id, sponsorData);

		return NextResponse.json({
			success: true,
			sponsor: newSponsor,
		}, { status: 201 });
	} catch (error) {
		console.error("[Sponsors API] Error creating sponsor:", error);
		return NextResponse.json(
			{ error: "Failed to create sponsor" },
			{ status: 500 }
		);
	}
}

