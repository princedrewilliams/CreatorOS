import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import jsPDF from "jspdf";

// Helper to get base URL for internal API calls
function getBaseUrl(request: NextRequest): string {
	const host = request.headers.get("host");
	const protocol = request.headers.get("x-forwarded-proto") || "https";
	return `${protocol}://${host}`;
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	let sponsorId: string | undefined;
	try {
		const user = await getCurrentUser();
		if (!user) {
			console.error("[Sponsor Export] User not authenticated");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const resolvedParams = await params;
		sponsorId = resolvedParams.id;
		
		console.log("[Sponsor Export] Request details:", { 
			userId: user.whop_user_id, 
			sponsorId,
			username: user.whop_username 
		});
		
		// Fetch sponsor data
		// In serverless environments, in-memory storage may not persist across instances
		// So we try to fetch from the main API route first as a fallback
		const { getSponsorById, getUserSponsors } = await import("@/lib/sponsor-data");
		
		// First, try direct lookup
		let sponsor = getSponsorById(user.whop_user_id, sponsorId);
		
		// If not found, try fetching from the main API route (which might have the data in a different instance)
		if (!sponsor) {
			try {
				// Make an internal API call to get the sponsor
				const baseUrl = getBaseUrl(request);
				const cookieHeader = request.headers.get('cookie') || '';
				
				console.log("[Sponsor Export] Attempting to fetch sponsor via API route:", `${baseUrl}/api/sponsors/${sponsorId}`);
				
				const apiResponse = await fetch(`${baseUrl}/api/sponsors/${sponsorId}`, {
					headers: {
						'Cookie': cookieHeader,
					},
				});
				
				if (apiResponse.ok) {
					const apiData = await apiResponse.json();
					if (apiData.success && apiData.sponsor) {
						console.log("[Sponsor Export] Found sponsor via API route");
						sponsor = apiData.sponsor;
					} else {
						console.warn("[Sponsor Export] API route returned but no sponsor in response:", apiData);
					}
				} else {
					const errorData = await apiResponse.json().catch(() => ({}));
					console.warn("[Sponsor Export] API route failed:", apiResponse.status, errorData);
				}
			} catch (apiError) {
				console.warn("[Sponsor Export] Failed to fetch sponsor via API route:", apiError);
			}
		}
		
		// If still not found, check all available sponsors
		if (!sponsor && sponsorId) {
			const allSponsors = getUserSponsors(user.whop_user_id);
			console.log("[Sponsor Export] Sponsor not found. Available sponsors:", {
				userId: user.whop_user_id,
				totalSponsors: allSponsors.length,
				sponsorIds: allSponsors.map(s => s.id),
				lookingFor: sponsorId
			});
			
			// Try case-insensitive match (sponsorId is guaranteed to be defined here due to the if condition)
			const lowerSponsorId = sponsorId.toLowerCase();
			sponsor = allSponsors.find(s => 
				s.id === sponsorId || 
				s.id.toLowerCase() === lowerSponsorId
			) || null;
		}
		
		if (!sponsor) {
			const allSponsors = getUserSponsors(user.whop_user_id);
			console.error("[Sponsor Export] Sponsor not found after all attempts:", { 
				userId: user.whop_user_id, 
				sponsorId: sponsorId || "undefined",
				availableIds: allSponsors.map(s => s.id),
				availableBrands: allSponsors.map(s => s.brandName)
			});
			return NextResponse.json(
				{ 
					error: "Sponsor not found", 
					details: `Looking for ID: ${sponsorId || "undefined"}. Available sponsors: ${allSponsors.length}` 
				},
				{ status: 404 }
			);
		}

		console.log("[Sponsor Export] Generating invoice for sponsor:", sponsor.brandName);

		// Generate PDF invoice using jsPDF
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4'
		});

		// Set margins
		const margin = 20;
		let yPos = margin;

		// Header
		doc.setFontSize(24);
		doc.setFont('helvetica', 'bold');
		doc.text('INVOICE', margin, yPos);
		yPos += 8;
		
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		doc.text(`Invoice #${sponsor.id.slice(0, 8).toUpperCase()}`, margin, yPos);
		yPos += 15;

		// Bill To section
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(100, 100, 100);
		doc.text('BILL TO:', margin, yPos);
		yPos += 7;
		
		doc.setFontSize(12);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(0, 0, 0);
		doc.text(sponsor.brandName, margin, yPos);
		yPos += 6;
		
		if (sponsor.contactName) {
			doc.text(sponsor.contactName, margin, yPos);
			yPos += 6;
		}
		if (sponsor.contactEmail) {
			doc.text(sponsor.contactEmail, margin, yPos);
			yPos += 6;
		}
		yPos += 5;

		// Invoice Details (right aligned)
		const invoiceDate = new Date().toLocaleDateString();
		const dueDate = sponsor.dueDate ? new Date(sponsor.dueDate).toLocaleDateString() : 'N/A';
		const paymentStatus = sponsor.paymentStatus.charAt(0).toUpperCase() + sponsor.paymentStatus.slice(1);
		
		const pageWidth = doc.internal.pageSize.getWidth();
		const rightMargin = pageWidth - margin;
		
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(100, 100, 100);
		doc.text('INVOICE DETAILS:', rightMargin, yPos - 20, { align: 'right' });
		
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(0, 0, 0);
		doc.text(`Date: ${invoiceDate}`, rightMargin, yPos - 13, { align: 'right' });
		doc.text(`Due Date: ${dueDate}`, rightMargin, yPos - 7, { align: 'right' });
		doc.text(`Status: ${paymentStatus}`, rightMargin, yPos - 1, { align: 'right' });
		yPos += 10;

		// Table header
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('Description', margin, yPos);
		doc.text('Amount', rightMargin, yPos, { align: 'right' });
		yPos += 5;
		
		// Draw line
		doc.setDrawColor(200, 200, 200);
		doc.line(margin, yPos, rightMargin, yPos);
		yPos += 5;

		// Table row
		const deliverables = sponsor.deliverables && sponsor.deliverables.length > 0 
			? sponsor.deliverables.join(', ') 
			: 'Sponsorship services';
		const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: sponsor.currency || 'USD' }).format(sponsor.rate);
		
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text('Sponsorship Deal', margin, yPos);
		yPos += 5;
		
		doc.setFontSize(9);
		doc.setTextColor(100, 100, 100);
		const deliverablesLines = doc.splitTextToSize(deliverables, rightMargin - margin - 10);
		doc.text(deliverablesLines, margin + 5, yPos);
		yPos += deliverablesLines.length * 5;
		
		if (sponsor.notes) {
			const notesLines = doc.splitTextToSize(sponsor.notes, rightMargin - margin - 10);
			doc.text(notesLines, margin + 5, yPos);
			yPos += notesLines.length * 4;
		}
		
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(0, 0, 0);
		doc.text(amount, rightMargin, yPos - (deliverablesLines.length * 5) - 5, { align: 'right' });
		yPos += 5;
		
		// Draw line
		doc.setDrawColor(200, 200, 200);
		doc.line(margin, yPos, rightMargin, yPos);
		yPos += 8;

		// Total row
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text('Total:', rightMargin - 20, yPos, { align: 'right' });
		doc.text(amount, rightMargin, yPos, { align: 'right' });
		yPos += 15;

		// Payment Link section (if provided)
		if (sponsor.paymentLink) {
			doc.setFontSize(10);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(0, 0, 0);
			doc.text('Payment Link:', margin, yPos);
			yPos += 6;
			
			doc.setFontSize(9);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(0, 0, 255); // Blue color for link
			const paymentLinkLines = doc.splitTextToSize(sponsor.paymentLink, rightMargin - margin);
			doc.text(paymentLinkLines, margin, yPos);
			yPos += paymentLinkLines.length * 4 + 5;
		}

		// Footer
		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });
		yPos += 5;
		doc.text(`Generated by CreatorOS on ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });

		// Generate PDF as array buffer
		const pdfOutput = doc.output('arraybuffer');
		const pdfArray = new Uint8Array(pdfOutput);
		
		// Sanitize filename
		const sanitizedBrandName = sponsor.brandName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
		const filename = `invoice-${sanitizedBrandName}-${new Date().toISOString().split("T")[0]}.pdf`;

		console.log("[Sponsor Export] PDF generated successfully, size:", pdfArray.length, "bytes");

		return new NextResponse(pdfArray, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("[Sponsor Export] Error:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error("[Sponsor Export] Error details:", {
			message: errorMessage,
			stack: error instanceof Error ? error.stack : undefined,
			sponsorId: sponsorId || "unknown",
		});
		return NextResponse.json(
			{ error: `Failed to export report: ${errorMessage}` },
			{ status: 500 }
		);
	}
}

