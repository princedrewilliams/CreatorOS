import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { jsPDF } from "jspdf";

// Initialize Stripe (only if key is provided)
const getStripe = () => {
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey || !secretKey.startsWith("sk_")) {
		return null;
	}
	return new Stripe(secretKey, {
		apiVersion: "2024-12-18.acacia",
	});
};

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			companyName,
			amount,
			dueDate,
			deliverables = [],
			description,
		} = body;

		if (!companyName || !amount || !dueDate) {
			return NextResponse.json(
				{ error: "Company name, amount, and due date are required" },
				{ status: 400 }
			);
		}

		if (amount <= 0) {
			return NextResponse.json(
				{ error: "Amount must be greater than 0" },
				{ status: 400 }
			);
		}

		// Create Stripe Payment Link
		let paymentLink: string | null = null;
		let stripePaymentLinkId: string | null = null;

		const stripe = getStripe();
		if (stripe) {
			try {
				// Create a product for this invoice
				const product = await stripe.products.create({
					name: `Invoice for ${companyName}`,
					description: description || `Invoice payment for ${companyName}`,
				});

				// Create a price for the product
				const price = await stripe.prices.create({
					product: product.id,
					unit_amount: Math.round(amount * 100), // Convert to cents
					currency: "usd",
				});

				// Create a payment link
				const paymentLinkResponse = await stripe.paymentLinks.create({
					line_items: [
						{
							price: price.id,
							quantity: 1,
						},
					],
					metadata: {
						invoice_company: companyName,
						due_date: dueDate,
					},
				});

				paymentLink = paymentLinkResponse.url;
				stripePaymentLinkId = paymentLinkResponse.id;
			} catch (stripeError: any) {
				console.error("[Stripe] Error creating payment link:", stripeError);
				// Continue without Stripe if it fails - invoice can still be generated
				if (stripeError?.message) {
					console.error("Stripe error details:", stripeError.message);
				}
			}
		} else {
			console.warn("[Stripe] STRIPE_SECRET_KEY not configured. Payment links will not be generated.");
		}

		// Generate PDF Invoice
		const invoiceId = `INV-${Date.now()}`;
		const invoiceDate = new Date().toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
		const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

		const doc = new jsPDF();
		
		// Header
		doc.setFontSize(24);
		doc.text("INVOICE", 20, 30);
		
		doc.setFontSize(12);
		doc.text(`Invoice #: ${invoiceId}`, 20, 45);
		doc.text(`Date: ${invoiceDate}`, 20, 52);
		doc.text(`Due Date: ${formattedDueDate}`, 20, 59);

		// Company Information
		doc.setFontSize(14);
		doc.text("Bill To:", 20, 75);
		doc.setFontSize(12);
		doc.text(companyName, 20, 82);

		// Description
		let yPos = 100;
		if (description) {
			doc.setFontSize(12);
			doc.text("Description:", 20, yPos);
			yPos += 7;
			const splitDescription = doc.splitTextToSize(description, 170);
			doc.text(splitDescription, 20, yPos);
			yPos += splitDescription.length * 7 + 5;
		}

		// Deliverables Checklist
		if (deliverables.length > 0) {
			doc.setFontSize(14);
			doc.text("Deliverables Checklist:", 20, yPos);
			yPos += 10;
			doc.setFontSize(12);
			deliverables.forEach((item: string, index: number) => {
				// Check if we need a new page
				if (yPos > 250) {
					doc.addPage();
					yPos = 20;
				}
				doc.text(`☐ ${item}`, 25, yPos);
				yPos += 7;
			});
			yPos += 5;
		}

		// Amount Section
		doc.setFontSize(14);
		doc.text("Amount Due:", 20, yPos);
		doc.setFontSize(18);
		doc.text(`$${amount.toFixed(2)}`, 20, yPos + 10);

		// Payment Link
		if (paymentLink) {
			doc.setFontSize(10);
			doc.setTextColor(0, 100, 200);
			doc.text("Pay online using the link below:", 20, yPos + 25);
			const splitPayment = doc.splitTextToSize(paymentLink, 170);
			doc.text(splitPayment, 20, yPos + 32);
			doc.setTextColor(0, 0, 0);
		}

		// Footer
		doc.setFontSize(10);
		doc.setTextColor(128, 128, 128);
		doc.text("Thank you for your business!", 20, doc.internal.pageSize.height - 20);

		// Convert PDF to base64
		const pdfBase64 = doc.output("datauristring").split(",")[1];

		// Create deliverable checklist
		const checklist = deliverables.map((item: string, index: number) => ({
			id: `checklist-${index + 1}`,
			item,
			completed: false,
			dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
		}));

		const invoice = {
			id: invoiceId,
			companyName,
			amount: parseFloat(amount.toString()),
			deliverables,
			dueDate,
			description: description || "",
			paymentTerms: "Net 30",
			invoiceDate: new Date().toISOString(),
			pdfBase64,
			paymentLink,
			stripePaymentLinkId,
			checklist,
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
