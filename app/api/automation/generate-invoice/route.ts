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
				// Modern template: Clean, contemporary design with colored header
				doc.setFillColor(59, 130, 246); // Blue
				doc.rect(0, logoOffset, 210, 40, "F");
				doc.setTextColor(255, 255, 255);
				doc.setFontSize(28);
				doc.text("INVOICE", 20, logoOffset + 25);
				doc.setTextColor(0, 0, 0);
				doc.setFontSize(10);
				doc.text(`Invoice #: ${invoiceId}`, 150, logoOffset + 20);
				doc.text(`Date: ${invoiceDate}`, 150, logoOffset + 27);
				doc.text(`Due Date: ${formattedDueDate}`, 150, logoOffset + 34);
				
				// Company Information
				doc.setFontSize(14);
				doc.text("Bill To:", 20, logoOffset + 55);
				doc.setFontSize(12);
				doc.text(companyName, 20, logoOffset + 62);
				
				let yPos = logoOffset + 80;
				if (description) {
					doc.setFontSize(12);
					doc.text("Description:", 20, yPos);
					yPos += 7;
					const splitDescription = doc.splitTextToSize(description, 170);
					doc.text(splitDescription, 20, yPos);
					yPos += splitDescription.length * 7 + 5;
				}
				
				if (deliverables.length > 0) {
					doc.setFontSize(14);
					doc.text("Deliverables Checklist:", 20, yPos);
					yPos += 10;
					doc.setFontSize(12);
					deliverables.forEach((item: string) => {
						if (yPos > 250) {
							doc.addPage();
							yPos = 20;
						}
						doc.text(`☐ ${item}`, 25, yPos);
						yPos += 7;
					});
					yPos += 5;
				}
				
				// Amount Section with box
				doc.setFillColor(240, 240, 240);
				doc.roundedRect(20, yPos, 170, 30, 3, 3, "F");
				doc.setFontSize(14);
				doc.text("Amount Due:", 30, yPos + 10);
				doc.setFontSize(20);
				doc.text(`$${amount.toFixed(2)}`, 30, yPos + 25);
				
				if (paymentLink) {
					doc.setFontSize(10);
					doc.setTextColor(59, 130, 246);
					doc.text("Pay online:", 20, yPos + 45);
					const splitPayment = doc.splitTextToSize(paymentLink, 170);
					doc.text(splitPayment, 20, yPos + 52);
					doc.setTextColor(0, 0, 0);
				}
				break;
				
			case "classic":
				// Classic template: Traditional business style
				doc.setFontSize(24);
				doc.text("INVOICE", 20, logoOffset + 30);
				doc.setDrawColor(0, 0, 0);
				doc.line(20, logoOffset + 35, 190, logoOffset + 35);
				
				doc.setFontSize(10);
				doc.text(`Invoice #: ${invoiceId}`, 20, logoOffset + 45);
				doc.text(`Date: ${invoiceDate}`, 20, logoOffset + 52);
				doc.text(`Due Date: ${formattedDueDate}`, 20, logoOffset + 59);
				
				doc.setFontSize(14);
				doc.text("Bill To:", 20, logoOffset + 75);
				doc.setFontSize(12);
				doc.text(companyName, 20, logoOffset + 82);
				
				let yPosClassic = logoOffset + 100;
				if (description) {
					doc.setFontSize(12);
					doc.text("Description:", 20, yPosClassic);
					yPosClassic += 7;
					const splitDescription = doc.splitTextToSize(description, 170);
					doc.text(splitDescription, 20, yPosClassic);
					yPosClassic += splitDescription.length * 7 + 5;
				}
				
				if (deliverables.length > 0) {
					doc.setFontSize(14);
					doc.text("Deliverables Checklist:", 20, yPosClassic);
					yPosClassic += 10;
					doc.setFontSize(12);
					deliverables.forEach((item: string) => {
						if (yPosClassic > 250) {
							doc.addPage();
							yPosClassic = 20;
						}
						doc.text(`☐ ${item}`, 25, yPosClassic);
						yPosClassic += 7;
					});
					yPosClassic += 5;
				}
				
				doc.setFontSize(14);
				doc.text("Amount Due:", 20, yPosClassic);
				doc.setFontSize(18);
				doc.text(`$${amount.toFixed(2)}`, 20, yPosClassic + 10);
				
				if (paymentLink) {
					doc.setFontSize(10);
					doc.text("Pay online using the link below:", 20, yPosClassic + 25);
					const splitPayment = doc.splitTextToSize(paymentLink, 170);
					doc.text(splitPayment, 20, yPosClassic + 32);
				}
				break;
				
			case "minimal":
				// Minimal template: Simple and elegant
				doc.setFontSize(20);
				doc.text("INVOICE", 20, logoOffset + 30);
				
				doc.setFontSize(9);
				doc.setTextColor(128, 128, 128);
				doc.text(`#${invoiceId}`, 20, logoOffset + 40);
				doc.text(invoiceDate, 20, logoOffset + 47);
				doc.setTextColor(0, 0, 0);
				
				doc.setFontSize(12);
				doc.text("Bill To:", 20, logoOffset + 65);
				doc.setFontSize(11);
				doc.text(companyName, 20, logoOffset + 72);
				
				let yPosMinimal = logoOffset + 90;
				if (description) {
					doc.setFontSize(10);
					doc.text(description, 20, yPosMinimal);
					yPosMinimal += doc.getTextWidth(description) > 170 ? 15 : 10;
				}
				
				if (deliverables.length > 0) {
					deliverables.forEach((item: string) => {
						if (yPosMinimal > 250) {
							doc.addPage();
							yPosMinimal = 20;
						}
						doc.setFontSize(10);
						doc.text(`• ${item}`, 20, yPosMinimal);
						yPosMinimal += 7;
					});
					yPosMinimal += 5;
				}
				
				doc.setFontSize(16);
				doc.text(`$${amount.toFixed(2)}`, 20, yPosMinimal);
				doc.setFontSize(9);
				doc.setTextColor(128, 128, 128);
				doc.text(`Due: ${formattedDueDate}`, 20, yPosMinimal + 7);
				doc.setTextColor(0, 0, 0);
				
				if (paymentLink) {
					doc.setFontSize(9);
					doc.setTextColor(100, 100, 200);
					doc.text(paymentLink, 20, yPosMinimal + 20);
					doc.setTextColor(0, 0, 0);
				}
				break;
				
			case "professional":
			default:
				// Professional template: Corporate standard format
				doc.setFontSize(22);
				doc.text("INVOICE", 20, logoOffset + 30);
				
				// Table-like layout
				doc.setFontSize(10);
				doc.text(`Invoice Number: ${invoiceId}`, 120, logoOffset + 30);
				doc.text(`Invoice Date: ${invoiceDate}`, 120, logoOffset + 37);
				doc.text(`Due Date: ${formattedDueDate}`, 120, logoOffset + 44);
				
				doc.setDrawColor(200, 200, 200);
				doc.line(20, logoOffset + 50, 190, logoOffset + 50);
				
				doc.setFontSize(12);
				doc.text("Bill To:", 20, logoOffset + 65);
				doc.setFontSize(11);
				doc.text(companyName, 20, logoOffset + 72);
				
				let yPosPro = logoOffset + 90;
				if (description) {
					doc.setFontSize(11);
					doc.text("Description:", 20, yPosPro);
					yPosPro += 7;
					const splitDescription = doc.splitTextToSize(description, 170);
					doc.text(splitDescription, 20, yPosPro);
					yPosPro += splitDescription.length * 7 + 5;
				}
				
				if (deliverables.length > 0) {
					doc.setFontSize(12);
					doc.text("Deliverables:", 20, yPosPro);
					yPosPro += 10;
					doc.setFontSize(11);
					deliverables.forEach((item: string) => {
						if (yPosPro > 250) {
							doc.addPage();
							yPosPro = 20;
						}
						doc.text(`✓ ${item}`, 25, yPosPro);
						yPosPro += 7;
					});
					yPosPro += 5;
				}
				
				doc.setDrawColor(200, 200, 200);
				doc.line(20, yPosPro, 190, yPosPro);
				yPosPro += 10;
				
				doc.setFontSize(12);
				doc.text("Total Amount Due:", 120, yPosPro);
				doc.setFontSize(16);
				doc.text(`$${amount.toFixed(2)}`, 120, yPosPro + 10);
				
				if (paymentLink) {
					doc.setFontSize(10);
					doc.setTextColor(0, 100, 200);
					doc.text("Payment Link:", 20, yPosPro + 25);
					const splitPayment = doc.splitTextToSize(paymentLink, 170);
					doc.text(splitPayment, 20, yPosPro + 32);
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
