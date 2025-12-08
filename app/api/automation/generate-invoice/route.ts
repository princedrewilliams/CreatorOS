import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { jsPDF } from "jspdf";
import { getCurrentUser } from "@/lib/auth";
import { getUserStripeConnection } from "@/lib/user-data";

// Initialize Stripe (only if key is provided)
const getStripe = () => {
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey || !secretKey.startsWith("sk_")) {
		return null;
	}
	return new Stripe(secretKey, {
		apiVersion: "2025-11-17.clover",
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
			template = "modern",
			paymentLink: customPaymentLink,
			logoUrl,
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

		// Get current user and their Stripe connection
		const user = await getCurrentUser();
		let paymentLink: string | null = customPaymentLink || null;
		let stripePaymentLinkId: string | null = null;

		// If user provided a custom payment link, use it and skip Stripe creation
		if (customPaymentLink) {
			paymentLink = customPaymentLink;
		} else {
			// Try to use user's connected Stripe account first
			let stripe: Stripe | null = null;
			if (user) {
			const stripeConnection = getUserStripeConnection(user.whop_user_id);
			if (stripeConnection?.connected && stripeConnection.accessToken) {
				// Use user's Stripe access token to create payment links on their account
				try {
					// Check if token needs refresh
					if (stripeConnection.expiresAt && stripeConnection.expiresAt < Date.now()) {
						// Token expired, try to refresh
						if (stripeConnection.refreshToken) {
							const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
							if (stripeSecretKey) {
								try {
									const refreshResponse = await fetch("https://connect.stripe.com/oauth/token", {
										method: "POST",
										headers: {
											"Content-Type": "application/x-www-form-urlencoded",
										},
										body: new URLSearchParams({
											client_secret: stripeSecretKey,
											refresh_token: stripeConnection.refreshToken,
											grant_type: "refresh_token",
										}),
									});

									if (refreshResponse.ok) {
										const newTokens = await refreshResponse.json();
										// Update connection with new tokens
										const { setUserStripeConnection } = await import("@/lib/user-data");
										setUserStripeConnection(user.whop_user_id, {
											...stripeConnection,
											accessToken: newTokens.access_token,
											refreshToken: newTokens.refresh_token,
											expiresAt: Date.now() + 3600000,
										});
										// Use new access token
										stripe = new Stripe(newTokens.access_token, {
											apiVersion: "2025-11-17.clover",
										});
									} else {
										console.warn("[Stripe] Failed to refresh token, falling back to app key");
									}
								} catch (refreshError) {
									console.error("[Stripe] Error refreshing token:", refreshError);
								}
							}
						}
					} else {
						// Token is still valid, use platform Stripe with connected account
						const platformStripe = getStripe();
						if (platformStripe && stripeConnection.stripeAccountId) {
							stripe = platformStripe;
							(stripe as any).connectedAccountId = stripeConnection.stripeAccountId;
						} else {
							// Fallback: try using access token directly
							stripe = new Stripe(stripeConnection.accessToken, {
								apiVersion: "2025-11-17.clover",
							});
						}
					}
				} catch (error) {
					console.error("[Stripe] Error initializing with user token:", error);
				}
			}
		}

			// Fallback to app's Stripe key if user doesn't have connected account
			if (!stripe) {
				stripe = getStripe();
			}

			if (stripe) {
			try {
				const connectedAccountId = (stripe as any).connectedAccountId;
				
				// Create a product for this invoice
				const productOptions: any = {
					name: `Invoice for ${companyName}`,
					description: description || `Invoice payment for ${companyName}`,
				};
				// If using connected account, create on their account
				const product = connectedAccountId
					? await stripe.products.create(productOptions, {
							stripeAccount: connectedAccountId,
						})
					: await stripe.products.create(productOptions);

				// Create a price for the product
				const priceOptions: any = {
					product: product.id,
					unit_amount: Math.round(amount * 100), // Convert to cents
					currency: "usd",
				};
				const price = connectedAccountId
					? await stripe.prices.create(priceOptions, {
							stripeAccount: connectedAccountId,
						})
					: await stripe.prices.create(priceOptions);

				// Create a payment link
				const paymentLinkOptions: any = {
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
				};
				const paymentLinkResponse = connectedAccountId
					? await stripe.paymentLinks.create(paymentLinkOptions, {
							stripeAccount: connectedAccountId,
						})
					: await stripe.paymentLinks.create(paymentLinkOptions);

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
				console.warn("[Stripe] No Stripe connection available. Payment links will not be generated.");
			}
		}

		// Generate PDF Invoice with selected template
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
		
		// Add logo if provided
		let logoHeight = 0;
		if (logoUrl) {
			try {
				// For base64 images, jsPDF can handle them directly
				// Calculate dimensions (max width 50mm)
				const maxWidth = 50;
				// Default aspect ratio, will be adjusted when image loads
				let logoWidth = maxWidth;
				logoHeight = maxWidth * 0.6; // Default aspect ratio
				
				// Try to extract image format from base64
				let imgFormat = "PNG";
				if (logoUrl.startsWith("data:image/")) {
					const match = logoUrl.match(/data:image\/(\w+);base64/);
					if (match) {
						imgFormat = match[1].toUpperCase();
					}
				}
				
				// Add image to PDF (jsPDF will handle dimensions)
				doc.addImage(logoUrl, imgFormat, 20, 10, logoWidth, logoHeight);
			} catch (error) {
				console.error("[Invoice] Error loading logo:", error);
				// Continue without logo if it fails to load
				logoHeight = 0;
			}
		}
		
		// Apply template-specific styling
		const logoOffset = logoHeight > 0 ? logoHeight + 15 : 0;
		
		switch (template) {
			case "modern":
				// Modern template: Clean, contemporary design with gradient-like colored header
				doc.setFillColor(99, 102, 241); // Indigo/Purple
				doc.rect(0, logoOffset, 210, 50, "F");
				doc.setTextColor(255, 255, 255);
				doc.setFontSize(32);
				doc.setFont("helvetica", "bold");
				doc.text("INVOICE", 20, logoOffset + 30);
				doc.setFont("helvetica", "normal");
				doc.setTextColor(255, 255, 255);
				doc.setFontSize(9);
				doc.text(`#${invoiceId}`, 150, logoOffset + 20);
				doc.text(`Date: ${invoiceDate}`, 150, logoOffset + 28);
				doc.text(`Due: ${formattedDueDate}`, 150, logoOffset + 36);
				doc.setTextColor(0, 0, 0);
				
				// Company Information with modern styling
				doc.setFillColor(245, 247, 250);
				doc.roundedRect(20, logoOffset + 60, 170, 25, 2, 2, "F");
				doc.setFontSize(11);
				doc.setTextColor(100, 100, 100);
				doc.text("BILL TO", 25, logoOffset + 70);
				doc.setFontSize(14);
				doc.setTextColor(0, 0, 0);
				doc.setFont("helvetica", "bold");
				doc.text(companyName, 25, logoOffset + 80);
				doc.setFont("helvetica", "normal");
				
				let yPos = logoOffset + 100;
				if (description) {
					doc.setFontSize(11);
					doc.setTextColor(60, 60, 60);
					doc.text("Description", 20, yPos);
					yPos += 8;
					doc.setFontSize(10);
					const splitDescription = doc.splitTextToSize(description, 170);
					doc.text(splitDescription, 20, yPos);
					yPos += splitDescription.length * 6 + 8;
				}
				
				if (deliverables.length > 0) {
					doc.setFontSize(11);
					doc.setTextColor(60, 60, 60);
					doc.text("Deliverables", 20, yPos);
					yPos += 8;
					doc.setFontSize(10);
					deliverables.forEach((item: string) => {
						if (yPos > 250) {
							doc.addPage();
							yPos = 20;
						}
						doc.setTextColor(99, 102, 241);
						doc.text("▸", 20, yPos);
						doc.setTextColor(0, 0, 0);
						doc.text(item, 25, yPos);
						yPos += 7;
					});
					yPos += 8;
				}
				
				// Amount Section with modern rounded box
				doc.setFillColor(99, 102, 241);
				doc.roundedRect(20, yPos, 170, 35, 4, 4, "F");
				doc.setFontSize(11);
				doc.setTextColor(255, 255, 255);
				doc.text("TOTAL AMOUNT DUE", 30, yPos + 10);
				doc.setFontSize(24);
				doc.setFont("helvetica", "bold");
				doc.text(`$${amount.toFixed(2)}`, 30, yPos + 28);
				doc.setFont("helvetica", "normal");
				
				if (paymentLink) {
					doc.setFontSize(9);
					doc.setTextColor(99, 102, 241);
					doc.text("Payment Link:", 20, yPos + 50);
					const splitPayment = doc.splitTextToSize(paymentLink, 170);
					doc.text(splitPayment, 20, yPos + 57);
					doc.setTextColor(0, 0, 0);
				}
				break;
				
			case "classic":
				// Classic template: Traditional business style with serif-like feel
				doc.setDrawColor(0, 0, 0);
				doc.setLineWidth(0.5);
				// Double line header
				doc.line(20, logoOffset + 25, 190, logoOffset + 25);
				doc.line(20, logoOffset + 27, 190, logoOffset + 27);
				
				doc.setFontSize(26);
				doc.setFont("times", "bold");
				doc.text("INVOICE", 20, logoOffset + 20);
				doc.setFont("times", "normal");
				
				// Classic table-style layout
				doc.setFontSize(9);
				doc.text(`Invoice Number:`, 20, logoOffset + 40);
				doc.setFont("times", "bold");
				doc.text(invoiceId, 70, logoOffset + 40);
				doc.setFont("times", "normal");
				
				doc.text(`Invoice Date:`, 20, logoOffset + 48);
				doc.setFont("times", "bold");
				doc.text(invoiceDate, 70, logoOffset + 48);
				doc.setFont("times", "normal");
				
				doc.text(`Due Date:`, 20, logoOffset + 56);
				doc.setFont("times", "bold");
				doc.text(formattedDueDate, 70, logoOffset + 56);
				doc.setFont("times", "normal");
				
				// Separator line
				doc.line(20, logoOffset + 65, 190, logoOffset + 65);
				
				doc.setFontSize(12);
				doc.setFont("times", "bold");
				doc.text("Bill To:", 20, logoOffset + 78);
				doc.setFont("times", "normal");
				doc.setFontSize(11);
				doc.text(companyName, 20, logoOffset + 86);
				
				let yPosClassic = logoOffset + 105;
				if (description) {
					doc.setFontSize(10);
					doc.setFont("times", "italic");
					doc.text(description, 20, yPosClassic);
					yPosClassic += doc.getTextWidth(description) > 170 ? 12 : 8;
					doc.setFont("times", "normal");
					yPosClassic += 5;
				}
				
				if (deliverables.length > 0) {
					doc.setFontSize(11);
					doc.setFont("times", "bold");
					doc.text("Deliverables:", 20, yPosClassic);
					yPosClassic += 10;
					doc.setFont("times", "normal");
					doc.setFontSize(10);
					deliverables.forEach((item: string) => {
						if (yPosClassic > 250) {
							doc.addPage();
							yPosClassic = 20;
						}
						doc.text(`• ${item}`, 25, yPosClassic);
						yPosClassic += 7;
					});
					yPosClassic += 8;
				}
				
				// Classic amount section with underline
				doc.line(20, yPosClassic, 190, yPosClassic);
				yPosClassic += 10;
				doc.setFontSize(12);
				doc.setFont("times", "bold");
				doc.text("Total Amount Due:", 20, yPosClassic);
				doc.setFontSize(20);
				doc.text(`$${amount.toFixed(2)}`, 120, yPosClassic);
				doc.setFont("times", "normal");
				doc.line(120, yPosClassic + 2, 190, yPosClassic + 2);
				
				if (paymentLink) {
					doc.setFontSize(9);
					doc.setFont("times", "italic");
					doc.text("Payment Instructions:", 20, yPosClassic + 20);
					doc.setFont("times", "normal");
					const splitPayment = doc.splitTextToSize(paymentLink, 170);
					doc.text(splitPayment, 20, yPosClassic + 28);
				}
				break;
				
			case "minimal":
				// Minimal template: Ultra-clean, lots of white space
				doc.setFontSize(18);
				doc.setFont("helvetica", "light");
				doc.text("INVOICE", 20, logoOffset + 25);
				doc.setFont("helvetica", "normal");
				
				// Very subtle, small text
				doc.setFontSize(8);
				doc.setTextColor(150, 150, 150);
				doc.text(invoiceId, 20, logoOffset + 35);
				doc.text(invoiceDate, 20, logoOffset + 42);
				doc.setTextColor(0, 0, 0);
				
				// Minimal spacing
				doc.setFontSize(10);
				doc.setTextColor(80, 80, 80);
				doc.text(companyName, 20, logoOffset + 60);
				doc.setTextColor(0, 0, 0);
				
				let yPosMinimal = logoOffset + 80;
				if (description) {
					doc.setFontSize(9);
					doc.setTextColor(100, 100, 100);
					doc.text(description, 20, yPosMinimal);
					yPosMinimal += doc.getTextWidth(description) > 170 ? 18 : 12;
					doc.setTextColor(0, 0, 0);
					yPosMinimal += 10;
				}
				
				if (deliverables.length > 0) {
					deliverables.forEach((item: string) => {
						if (yPosMinimal > 250) {
							doc.addPage();
							yPosMinimal = 20;
						}
						doc.setFontSize(9);
						doc.setTextColor(120, 120, 120);
						doc.text(item, 20, yPosMinimal);
						yPosMinimal += 8;
					});
					yPosMinimal += 15;
				}
				
				// Minimal amount - just the number, large
				doc.setFontSize(28);
				doc.setFont("helvetica", "light");
				doc.text(`$${amount.toFixed(2)}`, 20, yPosMinimal);
				doc.setFont("helvetica", "normal");
				doc.setFontSize(8);
				doc.setTextColor(150, 150, 150);
				doc.text(`Due ${formattedDueDate}`, 20, yPosMinimal + 10);
				doc.setTextColor(0, 0, 0);
				
				if (paymentLink) {
					doc.setFontSize(8);
					doc.setTextColor(120, 120, 120);
					doc.text(paymentLink, 20, yPosMinimal + 25);
					doc.setTextColor(0, 0, 0);
				}
				break;
				
			case "professional":
			default:
				// Professional template: Corporate standard with table layout
				// Header with company info style
				doc.setFillColor(240, 240, 240);
				doc.rect(20, logoOffset + 20, 170, 15, "F");
				doc.setFontSize(20);
				doc.setFont("helvetica", "bold");
				doc.text("INVOICE", 20, logoOffset + 32);
				doc.setFont("helvetica", "normal");
				
				// Professional table-style metadata
				doc.setFontSize(9);
				doc.setTextColor(100, 100, 100);
				doc.text("INVOICE #", 120, logoOffset + 28);
				doc.text("DATE", 120, logoOffset + 35);
				doc.text("DUE DATE", 120, logoOffset + 42);
				doc.setTextColor(0, 0, 0);
				doc.setFont("helvetica", "bold");
				doc.text(invoiceId, 160, logoOffset + 28);
				doc.text(invoiceDate, 160, logoOffset + 35);
				doc.text(formattedDueDate, 160, logoOffset + 42);
				doc.setFont("helvetica", "normal");
				
				// Separator
				doc.setDrawColor(220, 220, 220);
				doc.setLineWidth(0.5);
				doc.line(20, logoOffset + 48, 190, logoOffset + 48);
				
				// Bill To section with box
				doc.setFillColor(250, 250, 250);
				doc.rect(20, logoOffset + 55, 80, 20, "F");
				doc.setFontSize(9);
				doc.setTextColor(100, 100, 100);
				doc.text("BILL TO", 25, logoOffset + 63);
				doc.setFontSize(11);
				doc.setTextColor(0, 0, 0);
				doc.setFont("helvetica", "bold");
				doc.text(companyName, 25, logoOffset + 72);
				doc.setFont("helvetica", "normal");
				
				let yPosPro = logoOffset + 90;
				if (description) {
					doc.setFontSize(10);
					doc.setTextColor(60, 60, 60);
					doc.text("Description:", 20, yPosPro);
					yPosPro += 7;
					doc.setFontSize(9);
					const splitDescription = doc.splitTextToSize(description, 170);
					doc.text(splitDescription, 20, yPosPro);
					yPosPro += splitDescription.length * 6 + 8;
				}
				
				if (deliverables.length > 0) {
					// Table header
					doc.setFillColor(245, 245, 245);
					doc.rect(20, yPosPro, 170, 8, "F");
					doc.setFontSize(9);
					doc.setFont("helvetica", "bold");
					doc.text("Item", 25, yPosPro + 6);
					yPosPro += 12;
					doc.setFont("helvetica", "normal");
					doc.setFontSize(9);
					deliverables.forEach((item: string) => {
						if (yPosPro > 250) {
							doc.addPage();
							yPosPro = 20;
						}
						doc.text(`• ${item}`, 25, yPosPro);
						yPosPro += 7;
					});
					yPosPro += 5;
				}
				
				// Professional total section
				doc.setDrawColor(200, 200, 200);
				doc.line(20, yPosPro, 190, yPosPro);
				yPosPro += 12;
				doc.setFontSize(10);
				doc.setTextColor(100, 100, 100);
				doc.text("Subtotal:", 120, yPosPro);
				doc.text(`$${amount.toFixed(2)}`, 160, yPosPro);
				yPosPro += 8;
				doc.setFontSize(11);
				doc.setFont("helvetica", "bold");
				doc.setTextColor(0, 0, 0);
				doc.text("TOTAL:", 120, yPosPro);
				doc.setFontSize(16);
				doc.text(`$${amount.toFixed(2)}`, 160, yPosPro);
				doc.setFont("helvetica", "normal");
				
				if (paymentLink) {
					doc.setFontSize(9);
					doc.setTextColor(0, 120, 200);
					doc.text("Payment Link:", 20, yPosPro + 20);
					const splitPayment = doc.splitTextToSize(paymentLink, 170);
					doc.text(splitPayment, 20, yPosPro + 27);
					doc.setTextColor(0, 0, 0);
				}
				break;
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
			template: template || "modern",
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
