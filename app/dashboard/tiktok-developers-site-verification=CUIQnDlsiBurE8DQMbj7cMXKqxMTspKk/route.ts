import { NextResponse } from "next/server";

// TikTok site verification file
// Accessible at: https://creatoros.online/dashboard/tiktok-developers-site-verification=CUIQnDlsiBurE8DQMbj7cMXKqxMTspKk
export async function GET() {
	return new NextResponse("CUIQnDlsiBurE8DQMbj7cMXKqxMTspKk", {
		headers: {
			"Content-Type": "text/plain",
		},
	});
}

