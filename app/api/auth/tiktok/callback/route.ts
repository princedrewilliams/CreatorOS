import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserSocialConnection, getUserSocialConnections } from "@/lib/user-data";

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
			const errorText = await tokenResponse.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { error: "Unknown error", error_description: errorText };
			}
			console.error("[TikTok OAuth] Token exchange error:", {
				status: tokenResponse.status,
				statusText: tokenResponse.statusText,
				error: errorData,
			});
			return NextResponse.redirect(
				new URL(`/planner?error=token_exchange_failed&details=${encodeURIComponent(errorData.error_description || errorData.error || "Unknown error")}`, request.url)
			);
		}

		const tokens = await tokenResponse.json();
		console.log("[TikTok OAuth] Token response:", JSON.stringify(tokens, null, 2));

		// According to TikTok docs, tokens are at root level, not in data wrapper
		// Handle both possible response structures
		const accessToken = tokens.access_token || tokens.data?.access_token;
		const refreshToken = tokens.refresh_token || tokens.data?.refresh_token;
		const expiresIn = tokens.expires_in || tokens.data?.expires_in;
		const openId = tokens.open_id || tokens.data?.open_id;
		const grantedScopes = (tokens.scope || tokens.data?.scope || "").split(",").map((s: string) => s.trim());

		if (!accessToken) {
			console.error("[TikTok OAuth] No access token in response:", tokens);
			return NextResponse.redirect(
				new URL("/planner?error=no_access_token", request.url)
			);
		}

		// Log granted scopes for debugging
		console.log("[TikTok OAuth] Granted scopes:", grantedScopes);
		
		// Don't block OAuth flow based on scope check - just try to use the API
		// If scopes are missing, the API call will fail and we'll handle it gracefully

		// Try to get user info - don't check scope first, just try the API
		// If scope is missing, API will return an error and we'll handle it
		let username = "TikTok User";
		let profilePicture: string | undefined;
		let userPlatformId: string | undefined;
		
		if (accessToken) {
			try {
				console.log("[TikTok OAuth] Attempting to fetch user info with access token...");
				const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,unique_id,follower_count,following_count,likes_count,video_count", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
				});
				
				if (userResponse.ok) {
					const userInfo = await userResponse.json();
					console.log("[TikTok OAuth] User info response:", JSON.stringify(userInfo, null, 2));
					
					// Check for API errors in response body
					if (userInfo?.error) {
						console.error("[TikTok OAuth] API error in user info:", userInfo.error);
						if (userInfo.error.code === "scope_not_authorized") {
							console.warn("[TikTok OAuth] Scope not authorized - user info unavailable");
						}
					} else {
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
							
							console.log("[TikTok OAuth] Successfully extracted username:", username);
						}
					}
				} else {
					const errorText = await userResponse.text();
					let errorData;
					try {
						errorData = JSON.parse(errorText);
					} catch {
						errorData = { error: errorText };
					}
					
					console.error("[TikTok OAuth] Failed to fetch user info:", {
						status: userResponse.status,
						statusText: userResponse.statusText,
						error: errorData,
					});
					
					// Check if it's a scope error
					if (errorData.error?.code === "scope_not_authorized") {
						console.warn("[TikTok OAuth] Scope not authorized - user needs to reconnect with proper permissions");
						// Don't fail the OAuth flow, just log it
					}
				}
			} catch (error) {
				console.error("[TikTok OAuth] Error fetching user info:", error);
			}
		}

		// Log the username for debugging
		console.log("[TikTok OAuth] Extracted username:", username);
		
		// Get current user to save connection with user ID
		// Note: User might not be authenticated during OAuth callback
		// Tokens will be stored in cookies and can be associated with user later
		const user = await getCurrentUser();
		console.log("[TikTok OAuth] Current user:", user ? { userId: user.whop_user_id, username: user.whop_username } : "null (user not authenticated)");
		
		// Store connection in user data (persists across devices)
		// Use open_id from token response if userPlatformId wasn't found from user info
		if (!userPlatformId && openId) {
			userPlatformId = openId;
			console.log("[TikTok OAuth] Using open_id from token response:", openId);
		}
		
		// Store tokens even if user is not authenticated - they'll be associated later
		if (accessToken) {
			// If user is authenticated, save to user data store
			if (user) {
			// Ensure username is not empty or default
			const finalUsername = (username && username !== "TikTok User" && username.trim() !== "") 
				? username 
				: "TikTok User"; // Will be refreshed later
			
			const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;
			
			const connection = {
				userId: user.whop_user_id,
				platform: "tiktok" as const,
				connected: true,
				accessToken: accessToken,
				refreshToken: refreshToken,
				expiresAt,
				username: finalUsername,
				userPlatformId: userPlatformId || openId,
				profilePicture,
			};
			
			console.log("[TikTok OAuth] Saving connection:", { 
				userId: user.whop_user_id,
				username: finalUsername, 
				userPlatformId: userPlatformId || openId, 
				hasProfilePicture: !!profilePicture,
				hasAccessToken: !!accessToken,
				hasRefreshToken: !!refreshToken,
				expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "never",
				accessTokenLength: accessToken?.length || 0,
				grantedScopes: grantedScopes,
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
				// User not authenticated - tokens stored in cookies will be used
				// When user logs in, they can sync their connections
				console.log("[TikTok OAuth] User not authenticated, tokens stored in cookies only. User should log in and sync connections.");
			}
		} else {
			console.error("[TikTok OAuth] No access token received:", {
				hasUser: !!user,
				hasAccessToken: !!accessToken,
				tokenResponseKeys: Object.keys(tokens),
				tokenResponseSample: JSON.stringify(tokens).substring(0, 200),
			});
		}
		
		// Store tokens in cookies regardless of user authentication status
		// This allows the tokens to be used even if user session isn't available
		const profilePictureParam = profilePicture ? `&profilePicture=${encodeURIComponent(profilePicture)}` : "";
		
		// Check if this is a popup window (OAuth callback from popup)
		// If so, redirect to a page that closes the popup and notifies parent
		const isPopup = request.headers.get("referer")?.includes("tiktok.com") || 
		                request.url.includes("popup=true");
		
		if (isPopup) {
			// Redirect to a page that closes the popup and notifies parent window
			const redirectUrl = new URL(`/planner?connected=tiktok&username=${encodeURIComponent(username)}${profilePictureParam}&popup=true`, request.url);
			const response = NextResponse.redirect(redirectUrl);
			
			if (accessToken) {
				response.cookies.set("tiktok_access_token", accessToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: expiresIn || 86400, // Default to 24 hours (86400 seconds)
				});

				if (refreshToken) {
					response.cookies.set("tiktok_refresh_token", refreshToken, {
						httpOnly: true,
						secure: process.env.NODE_ENV === "production",
						sameSite: "lax",
						maxAge: 60 * 60 * 24 * 365, // 1 year
					});
				}
			}
			
			response.cookies.delete("tiktok_oauth_state");
			return response;
		}
		
		// Normal redirect (not from popup)
		const response = NextResponse.redirect(
			new URL(`/planner?connected=tiktok&username=${encodeURIComponent(username)}${profilePictureParam}`, request.url)
		);
		
		if (accessToken) {
			response.cookies.set("tiktok_access_token", accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: expiresIn || 86400, // Default to 24 hours (86400 seconds)
			});

			if (refreshToken) {
				response.cookies.set("tiktok_refresh_token", refreshToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 60 * 60 * 24 * 365, // 1 year
				});
			}
			
			console.log("[TikTok OAuth] Tokens stored in cookies:", {
				hasAccessToken: !!accessToken,
				hasRefreshToken: !!refreshToken,
				expiresIn: expiresIn,
			});
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






