import { NextRequest, NextResponse } from "next/server";

// Handle TikTok verification file at /dashboard/tiktok-developers-site-verification=...
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;
	const path = slug.join("/");
	
	// Check if this is the TikTok verification file
	if (path.includes("tiktok-developers-site-verification") && path.includes("CUIQnDlsiBurE8DQMbj7cMXKqxMTspKk")) {
		return new NextResponse("CUIQnDlsiBurE8DQMbj7cMXKqxMTspKk", {
			headers: {
				"Content-Type": "text/plain",
			},
		});
	}
	
	return new NextResponse("Not Found", { status: 404 });
}

