import { NextResponse } from "next/server";

// TikTok site verification file for /terms/ URL prefix
// Accessible at: https://creatoros.online/terms/tiktok-developers-site-verification
// Also serves any TikTok verification file in /terms/ path
export async function GET() {
	// Return the verification code - update this with the actual code from TikTok
	return new NextResponse("tiktok-developers-site-verification=PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE", {
		headers: {
			"Content-Type": "text/plain",
		},
	});
}

