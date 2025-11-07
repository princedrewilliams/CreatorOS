import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// TikTok OAuth configuration
		const clientKey = process.env.TIKTOK_CLIENT_KEY;
		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/tiktok/callback`;
		const scope = "user.info.basic,video.upload";

		if (!clientKey) {
			return NextResponse.json(
				{ error: "TikTok OAuth is not configured. Please add TIKTOK_CLIENT_KEY to your .env.local file." },
				{ status: 500 }
			);
		}

		// Generate state for CSRF protection
		const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		
		const response = NextResponse.redirect(
			`https://www.tiktok.com/v2/auth/authorize/` +
			`?client_key=${encodeURIComponent(clientKey)}&` +
			`redirect_uri=${encodeURIComponent(redirectUri)}&` +
			`scope=${encodeURIComponent(scope)}&` +
			`response_type=code&` +
			`state=${state}`
		);
		
		response.cookies.set("tiktok_oauth_state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 600, // 10 minutes
		});

		return response;
	} catch (error) {
		console.error("Error initiating TikTok OAuth:", error);
		return NextResponse.json(
			{ error: "Failed to initiate TikTok OAuth" },
			{ status: 500 }
		);
	}
}


