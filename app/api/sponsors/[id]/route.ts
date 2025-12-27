import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
	getSponsorById,
	updateSponsor,
	deleteSponsor,
	type Sponsor,
	type DealStatus,
	type PaymentStatus,
} from "@/lib/sponsor-data";
import { validateSponsor, checkOverdueWarnings } from "@/lib/sponsor-business-logic";

/**
 * GET /api/sponsors/:id
 * Get a single sponsor by ID
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const sponsor = getSponsorById(user.whop_user_id, id);
		
		if (!sponsor) {
			return NextResponse.json(
				{ error: "Sponsor not found" },
				{ status: 404 }
			);
		}

		// Check for overdue warnings
		const warnings = checkOverdueWarnings(sponsor);

		return NextResponse.json({
			success: true,
			sponsor,
			warnings,
		});
	} catch (error) {
		console.error("[Sponsors API] Error fetching sponsor:", error);
		return NextResponse.json(
			{ error: "Failed to fetch sponsor" },
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/sponsors/:id
 * Update an existing sponsor
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		// Check if sponsor exists and belongs to user
		const existingSponsor = getSponsorById(user.whop_user_id, id);
		if (!existingSponsor) {
			return NextResponse.json(
				{ error: "Sponsor not found" },
				{ status: 404 }
			);
		}

		const body = await request.json();
		
		// Build update object (only include provided fields)
		const updates: Partial<Omit<Sponsor, "id" | "userId" | "createdAt" | "deletedAt">> = {};
		
		if (body.brandName !== undefined) updates.brandName = body.brandName.trim();
		if (body.contactName !== undefined) updates.contactName = body.contactName?.trim();
		if (body.contactEmail !== undefined) updates.contactEmail = body.contactEmail?.trim();
		if (body.dealStatus !== undefined) updates.dealStatus = body.dealStatus;
		if (body.deliverables !== undefined) updates.deliverables = Array.isArray(body.deliverables) ? body.deliverables : [];
		if (body.rate !== undefined) updates.rate = typeof body.rate === "number" ? body.rate : parseFloat(body.rate) || 0;
		if (body.currency !== undefined) updates.currency = body.currency;
		if (body.dueDate !== undefined) updates.dueDate = body.dueDate || undefined;
		if (body.paymentStatus !== undefined) updates.paymentStatus = body.paymentStatus;
		if (body.paymentLink !== undefined) updates.paymentLink = body.paymentLink?.trim() || undefined;
		if (body.notes !== undefined) updates.notes = body.notes?.trim();
		if (body.youtubeVideoIds !== undefined) updates.youtubeVideoIds = Array.isArray(body.youtubeVideoIds) ? body.youtubeVideoIds : undefined;

		// Merge with existing sponsor for validation
		const mergedSponsor = { ...existingSponsor, ...updates };
		
		// Validate updated sponsor data
		const validation = validateSponsor(mergedSponsor);
		if (!validation.valid) {
			return NextResponse.json(
				{ error: "Validation failed", errors: validation.errors },
				{ status: 400 }
			);
		}

		// Update sponsor
		const updatedSponsor = updateSponsor(user.whop_user_id, id, updates);
		
		if (!updatedSponsor) {
			return NextResponse.json(
				{ error: "Failed to update sponsor" },
				{ status: 500 }
			);
		}

		// Check for overdue warnings
		const warnings = checkOverdueWarnings(updatedSponsor);

		return NextResponse.json({
			success: true,
			sponsor: updatedSponsor,
			warnings,
		});
	} catch (error) {
		console.error("[Sponsors API] Error updating sponsor:", error);
		return NextResponse.json(
			{ error: "Failed to update sponsor" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/sponsors/:id
 * Soft delete a sponsor
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const success = deleteSponsor(user.whop_user_id, id);
		
		if (!success) {
			return NextResponse.json(
				{ error: "Sponsor not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Sponsor deleted successfully",
		});
	} catch (error) {
		console.error("[Sponsors API] Error deleting sponsor:", error);
		return NextResponse.json(
			{ error: "Failed to delete sponsor" },
			{ status: 500 }
		);
	}
}

