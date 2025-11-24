import { NextResponse } from "next/server";

// TikTok site verification file for /privacy/ URL prefix
// Accessible at: https://creatoros.online/privacy/tiktok-developers-site-verification
// Also serves any TikTok verification file in /privacy/ path
export async function GET() {
	// Return the verification code - update this with the actual code from TikTok
	return new NextResponse("tiktok-developers-site-verification=PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE", {
		headers: {
			"Content-Type": "text/plain",
		},
	});
}

