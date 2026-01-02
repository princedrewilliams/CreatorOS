import { NextResponse } from "next/server";

// Catch-all route for TikTok verification files in /privacy/ path
// Handles any TikTok verification file name pattern
// Accessible at: https://creatoros.online/privacy/[any-tiktok-verification-file]
export async function GET(
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;
	const path = slug.join("/");
	const filename = slug[slug.length - 1] || "";
	
	// Check if this is a TikTok verification file (by filename pattern)
	if (filename.includes("tiktok") || path.includes("tiktok")) {
		// Try to extract verification code from filename
		// Pattern 1: tiktok-developers-site-verification=CODE
		let verificationCode = path.match(/tiktok-developers-site-verification=([^/.\s]+)/)?.[1];
		
		// Pattern 2: tiktok[random string].txt - extract the random string
		if (!verificationCode && filename.includes("tiktok")) {
			const match = filename.match(/tiktok([A-Za-z0-9]+)/);
			if (match) {
				verificationCode = match[1];
			}
		}
		
		// If we found a code, return it; otherwise return placeholder
		const code = verificationCode || "PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE";
		return new NextResponse(`tiktok-developers-site-verification=${code}`, {
			headers: {
				"Content-Type": "text/plain",
			},
		});
	}
	
	return new NextResponse("Not Found", { status: 404 });
}

