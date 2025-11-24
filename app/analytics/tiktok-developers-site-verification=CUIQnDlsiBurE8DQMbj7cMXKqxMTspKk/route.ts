import { NextResponse } from "next/server";

// TikTok site verification file for URL prefix verification
// Accessible at: https://creatoros.online/analytics/tiktok-developers-site-verification=CUIQnDlsiBurE8DQMbj7cMXKqxMTspKk
export async function GET() {
	return new NextResponse("CUIQnDlsiBurE8DQMbj7cMXKqxMTspKk", {
		headers: {
			"Content-Type": "text/plain",
		},
	});
}

