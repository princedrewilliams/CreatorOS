import { NextRequest, NextResponse } from "next/server";

// Catch-all route for TikTok verification files at root path
// Handles any TikTok verification file name pattern
// Accessible at: https://creatoros.online/[any-tiktok-verification-file]
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;
	const path = slug.join("/");
	const filename = slug[slug.length - 1] || "";
	
	// Handle TikTok and Google verification files - return 404 for everything else
	// This prevents interference with other routes
	const isTiktokVerification = filename.includes("tiktok") || path.includes("tiktok");
	const isGoogleVerification = filename.startsWith("google") && (filename.endsWith(".html") || filename.endsWith(".txt"));
	
	if (!isTiktokVerification && !isGoogleVerification) {
		return new NextResponse("Not Found", { status: 404 });
	}
	
	// Handle Google verification files
	if (isGoogleVerification) {
		// Extract verification code from filename
		// Pattern: google[verification-code].html
		let verificationCode = filename.match(/google([A-Za-z0-9_-]+)\.(html|txt)/)?.[1];
		
		if (!verificationCode) {
			// Try alternative pattern
			verificationCode = filename.replace("google", "").replace(".html", "").replace(".txt", "");
		}
		
		// Google verification files typically contain a meta tag
		// The actual content should match what Google provides in the downloaded file
		const htmlContent = `<!DOCTYPE html>
<html>
<head>
	<meta name="google-site-verification" content="${verificationCode || "PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE"}" />
	<title>Google Site Verification</title>
</head>
<body>
	google-site-verification: google${verificationCode || "PLACEHOLDER_UPDATE_WITH_ACTUAL_CODE"}.html
</body>
</html>`;
		
		return new NextResponse(htmlContent, {
			headers: {
				"Content-Type": "text/html; charset=utf-8",
			},
		});
	}
	
	// Check if this is a TikTok verification file (by filename pattern)
	if (isTiktokVerification) {
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
		
		// Pattern 3: Check if filename matches the pattern from analytics (tiktokTUSHeQRSCqZve6ZWGWGJW1DvYTtjmFON.txt)
		// Extract the code part after "tiktok"
		if (!verificationCode && filename.startsWith("tiktok") && filename.endsWith(".txt")) {
			const codePart = filename.replace("tiktok", "").replace(".txt", "");
			if (codePart.length > 10) { // Likely a verification code
				verificationCode = codePart;
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

