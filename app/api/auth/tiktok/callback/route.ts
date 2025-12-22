import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserSocialConnection } from "@/lib/user-data";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		if (error) {
			return NextResponse.redirect(
				new URL(`/planner?error=${encodeURIComponent(error)}`, request.url)
			);
		}

		if (!code || !state) {
			return NextResponse.redirect(
				new URL("/planner?error=missing_code_or_state", request.url)
			);
		}

		// Verify state
		const storedState = request.cookies.get("tiktok_oauth_state")?.value;
		if (state !== storedState) {
			return NextResponse.redirect(
				new URL("/planner?error=invalid_state", request.url)
			);
		}

		const clientKey = process.env.TIKTOK_CLIENT_KEY;
		const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
		// Build redirect URI same way as in the auth route
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
		const cleanBaseUrl = baseUrl.replace(/\/$/, "");
		const redirectUri = `${cleanBaseUrl}/api/auth/tiktok/callback`;

		if (!clientKey || !clientSecret) {
			return NextResponse.redirect(
				new URL("/planner?error=oauth_not_configured", request.url)
			);
		}

		// Exchange code for tokens
		const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_key: clientKey,
				client_secret: clientSecret,
				code,
				grant_type: "authorization_code",
				redirect_uri: redirectUri,
			}),
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json();
			console.error("Token exchange error:", errorData);
			return NextResponse.redirect(
				new URL("/planner?error=token_exchange_failed", request.url)
			);
		}

		const tokens = await tokenResponse.json();

		// Get user info
		let username = "TikTok User";
		let profilePicture: string | undefined;
		let userPlatformId: string | undefined;
		if (tokens.data?.access_token) {
			try {
				const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,unique_id,follower_count,following_count,likes_count,video_count", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${tokens.data.access_token}`,
						"Content-Type": "application/json",
					},
				});
				
				if (userResponse.ok) {
					const userInfo = await userResponse.json();
					console.log("[TikTok OAuth] User info response:", JSON.stringify(userInfo, null, 2));
					
					// Check for API errors
					if (userInfo?.error) {
						console.error("[TikTok OAuth] API error in user info:", userInfo.error);
					}
					
					// Try different possible response structures
					const user = userInfo.data?.user || userInfo.user || userInfo.data;
					
					if (user) {
						// Get user ID
						userPlatformId = user.open_id || user.union_id || user.user_id || user.id;
						
						// Prefer unique_id (handle/@username) over display_name
						// TikTok API returns unique_id as the @username handle
						const rawUsername = user.unique_id || user.username || user.display_name || user.nickname;
						if (rawUsername && rawUsername.trim() !== "") {
							username = rawUsername.trim();
							// Remove @ if present (we'll add it in the UI)
							username = username.replace(/^@/, "");
						}
						
						// Get profile picture
						profilePicture = user.avatar_url || user.avatar_larger || user.profile_picture_url;
					}
					
					// Log for debugging
					console.log("[TikTok OAuth] Extracted username:", username);
				} else {
					const errorText = await userResponse.text();
					console.error("[TikTok OAuth] Failed to fetch user info:", userResponse.status, errorText);
				}
			} catch (error) {
				console.error("[TikTok OAuth] Error fetching user info:", error);
			}
		}

		// Log the username for debugging
		console.log("[TikTok OAuth] Extracted username:", username);
		
		// Get current user to save connection with user ID
		const user = await getCurrentUser();
		
		// Store connection in user data (persists across devices)
		if (user && tokens.data?.access_token) {
			// Ensure username is not empty or default
			const finalUsername = (username && username !== "TikTok User" && username.trim() !== "") 
				? username 
				: "TikTok User"; // Will be refreshed later
			
			const expiresAt = tokens.data.expires_in ? Date.now() + tokens.data.expires_in * 1000 : undefined;
			
			const connection = {
				userId: user.whop_user_id,
				platform: "tiktok" as const,
				connected: true,
				accessToken: tokens.data.access_token,
				refreshToken: tokens.data.refresh_token,
				expiresAt,
				username: finalUsername,
				userPlatformId,
				profilePicture,
			};
			
			console.log("[TikTok OAuth] Saving connection:", { 
				userId: user.whop_user_id,
				username: finalUsername, 
				userPlatformId, 
				hasProfilePicture: !!profilePicture,
				hasAccessToken: !!tokens.data.access_token,
				hasRefreshToken: !!tokens.data.refresh_token,
				expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "never",
				accessTokenLength: tokens.data.access_token?.length || 0,
			});
			
			const savedConnection = setUserSocialConnection(user.whop_user_id, connection);
			
			// Verify it was saved
			const verifyConnections = getUserSocialConnections(user.whop_user_id);
			const verifiedConnection = verifyConnections.find((c) => c.platform === "tiktok");
			console.log("[TikTok OAuth] Connection saved verification:", {
				found: !!verifiedConnection,
				hasAccessToken: !!verifiedConnection?.accessToken,
				hasRefreshToken: !!verifiedConnection?.refreshToken,
				connected: verifiedConnection?.connected,
			});
			
			// If username is still default, try to refresh it immediately
			if (finalUsername === "TikTok User") {
				console.log("[TikTok OAuth] Username is default, will be refreshed by client");
			}
		} else {
			console.error("[TikTok OAuth] Failed to save connection:", {
				hasUser: !!user,
				hasAccessToken: !!tokens.data?.access_token,
			});
		}
		
		// Store tokens
		const profilePictureParam = profilePicture ? `&profilePicture=${encodeURIComponent(profilePicture)}` : "";
		const response = NextResponse.redirect(
			new URL(`/planner?connected=tiktok&username=${encodeURIComponent(username)}${profilePictureParam}`, request.url)
		);
		
		if (tokens.data?.access_token) {
			response.cookies.set("tiktok_access_token", tokens.data.access_token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: tokens.data.expires_in || 3600,
			});

			if (tokens.data?.refresh_token) {
				response.cookies.set("tiktok_refresh_token", tokens.data.refresh_token, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 60 * 60 * 24 * 365, // 1 year
				});
			}
		}

		// Clear state cookie
		response.cookies.delete("tiktok_oauth_state");

		return response;
	} catch (error) {
		console.error("Error in TikTok OAuth callback:", error);
		return NextResponse.redirect(
			new URL("/planner?error=oauth_callback_failed", request.url)
		);
	}
}






