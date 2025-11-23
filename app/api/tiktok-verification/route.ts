import { NextResponse } from "next/server";

// TikTok site verification file
// Accessible at: https://creatoros.online/api/tiktok-verification
// Also accessible at root: https://creatoros.online/tiktok-developers-site-verification=CUIQnDlsiBurE8DQMbj7cMXKqxMTspKk.html
export async function GET() {
	return new NextResponse("CUIQnDlsiBurE8DQMbj7cMXKqxMTspKk", {
		headers: {
			"Content-Type": "text/plain",
		},
	});
}

