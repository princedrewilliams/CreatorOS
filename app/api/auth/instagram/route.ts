import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Instagram Basic Display API OAuth configuration
		const clientId = process.env.INSTAGRAM_CLIENT_ID;
		const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/instagram/callback`;
		const scope = "user_profile,user_media";

		if (!clientId) {
			return NextResponse.json(
				{ error: "Instagram OAuth is not configured. Please add INSTAGRAM_CLIENT_ID to your .env.local file." },
				{ status: 500 }
			);
		}

		// Generate state for CSRF protection
		const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		
		const response = NextResponse.redirect(
			`https://api.instagram.com/oauth/authorize?` +
			`client_id=${encodeURIComponent(clientId)}&` +
			`redirect_uri=${encodeURIComponent(redirectUri)}&` +
			`scope=${encodeURIComponent(scope)}&` +
			`response_type=code&` +
			`state=${state}`
		);
		
		response.cookies.set("instagram_oauth_state", state, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 600, // 10 minutes
		});

		return response;
	} catch (error) {
		console.error("Error initiating Instagram OAuth:", error);
		return NextResponse.json(
			{ error: "Failed to initiate Instagram OAuth" },
			{ status: 500 }
		);
	}
}


