import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections, setUserSocialConnection } from "@/lib/user-data";

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Authentication required" }, { status: 401 });
		}

		const socialConnections = getUserSocialConnections(user.whop_user_id);
		const tiktokConnection = socialConnections.find(
			(conn) => conn.platform === "tiktok" && conn.connected && conn.refreshToken
		);

		if (!tiktokConnection?.refreshToken) {
			return NextResponse.json({ error: "No refresh token available" }, { status: 400 });
		}

		const clientKey = process.env.TIKTOK_CLIENT_KEY;
		const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

		if (!clientKey || !clientSecret) {
			return NextResponse.json({ error: "TikTok OAuth not configured" }, { status: 500 });
		}

		// Refresh the access token using refresh token
		const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_key: clientKey,
				client_secret: clientSecret,
				grant_type: "refresh_token",
				refresh_token: tiktokConnection.refreshToken,
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json().catch(() => ({ error: "Unknown error" }));
			console.error("[TikTok Refresh] Token refresh failed:", errorData);
			return NextResponse.json(
				{ error: "Failed to refresh token", details: errorData },
				{ status: tokenResponse.status }
			);
		}

		const tokens = await tokenResponse.json();

		if (!tokens.data?.access_token) {
			return NextResponse.json({ error: "No access token in response" }, { status: 500 });
		}

		// Update the connection with new tokens
		const updatedConnection = {
			...tiktokConnection,
			accessToken: tokens.data.access_token,
			refreshToken: tokens.data.refresh_token || tiktokConnection.refreshToken, // Use new refresh token if provided
			expiresAt: tokens.data.expires_in ? Date.now() + tokens.data.expires_in * 1000 : undefined,
		};

		setUserSocialConnection(user.whop_user_id, updatedConnection);

		// Also update the cookie
		const response = NextResponse.json({
			success: true,
			accessToken: tokens.data.access_token,
			expiresIn: tokens.data.expires_in,
		});

		response.cookies.set("tiktok_access_token", tokens.data.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: tokens.data.expires_in || 3600,
		});

		if (tokens.data.refresh_token) {
			response.cookies.set("tiktok_refresh_token", tokens.data.refresh_token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 365, // 1 year
			});
		}

		return response;
	} catch (error) {
		console.error("[TikTok Refresh] Error:", error);
		return NextResponse.json(
			{ error: "Failed to refresh token", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

