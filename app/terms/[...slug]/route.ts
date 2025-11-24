import { NextRequest, NextResponse } from "next/server";

// Catch-all route for TikTok verification files in /terms/ path
// Handles any TikTok verification file name pattern
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;
	const path = slug.join("/");
	
	// Check if this is a TikTok verification file
	if (path.includes("tiktok") && (path.includes("verification") || path.includes("developers-site"))) {
		// Extract verification code from path or use default
		// TikTok verification files typically contain the code in the filename or path
		const verificationCode = path.match(/tiktok-developers-site-verification=([^/]+)/)?.[1] 
			|| path.match(/tiktok([A-Za-z0-9]+)/)?.[1]
			|| "PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE";
		
		return new NextResponse(`tiktok-developers-site-verification=${verificationCode}`, {
			headers: {
				"Content-Type": "text/plain",
			},
		});
	}
	
	return new NextResponse("Not Found", { status: 404 });
}

