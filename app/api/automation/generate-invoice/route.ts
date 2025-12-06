import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			brandName,
			dealAmount,
			deliverables,
			dueDate,
			paymentTerms,
			autoSend = false,
		} = body;

		if (!brandName || !dealAmount) {
			return NextResponse.json(
				{ error: "Brand name and deal amount are required" },
				{ status: 400 }
			);
		}

		// In production, this would:
		// 1. Generate PDF invoice using a library like pdfkit or puppeteer
		// 2. Create payment link (Stripe, PayPal, etc.)
		// 3. Generate deliverable checklist
		// 4. Store invoice in database
		// 5. Auto-send email if enabled
		// 6. Return invoice data

		const invoice = {
			id: `INV-${Date.now()}`,
			brandName,
			dealAmount: parseFloat(dealAmount),
			deliverables: deliverables || [],
			dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
			paymentTerms: paymentTerms || "Net 30",
			invoiceUrl: `/api/invoices/${Date.now()}.pdf`,
			paymentLink: `https://pay.example.com/invoice/${Date.now()}`,
			checklist: deliverables?.map((d: string, i: number) => ({
				id: `checklist-${i + 1}`,
				item: d,
				completed: false,
				dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
			})) || [],
			sent: autoSend,
			createdAt: new Date().toISOString(),
		};

		return NextResponse.json({
			success: true,
			invoice,
		});
	} catch (error) {
		console.error("[Generate Invoice] Error:", error);
		return NextResponse.json(
			{ error: "Failed to generate invoice" },
			{ status: 500 }
		);
	}
}

