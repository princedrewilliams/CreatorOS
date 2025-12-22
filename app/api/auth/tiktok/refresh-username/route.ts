import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections, setUserSocialConnection } from "@/lib/user-data";

export async function GET(request: NextRequest) {
	try {
		// Try to get token from cookies first
		let tiktokToken = request.cookies.get("tiktok_access_token")?.value;
		
		// Also check user data store (more reliable)
		try {
			const user = await getCurrentUser();
			if (user) {
				const socialConnections = getUserSocialConnections(user.whop_user_id);
				const tiktokConnection = socialConnections.find(
					(conn) => conn.platform === "tiktok" && conn.connected
				);
				
				if (tiktokConnection) {
					// Check if token is expired
					const isExpired = tiktokConnection.expiresAt && tiktokConnection.expiresAt < Date.now();
					
					if (tiktokConnection.accessToken && !isExpired) {
						tiktokToken = tiktokConnection.accessToken;
						console.log("[refresh-username] Using token from user data store");
					} else if (isExpired && tiktokConnection.refreshToken) {
						// Try to refresh the token
						console.log("[refresh-username] Token expired, attempting refresh...");
						try {
							const clientKey = process.env.TIKTOK_CLIENT_KEY;
							const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
							
							if (clientKey && clientSecret) {
								const refreshResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
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
								
								if (refreshResponse.ok) {
									const refreshData = await refreshResponse.json();
									// According to TikTok docs, tokens are at root level
									const newAccessToken = refreshData.access_token || refreshData.data?.access_token;
									const newRefreshToken = refreshData.refresh_token || refreshData.data?.refresh_token;
									const newExpiresIn = refreshData.expires_in || refreshData.data?.expires_in;
									
									if (newAccessToken) {
										tiktokToken = newAccessToken;
										
										// Update the connection with new token
										const updatedConnection = {
											...tiktokConnection,
											accessToken: newAccessToken,
											refreshToken: newRefreshToken || tiktokConnection.refreshToken,
											expiresAt: newExpiresIn ? Date.now() + newExpiresIn * 1000 : undefined,
										};
										setUserSocialConnection(user.whop_user_id, updatedConnection);
										
										console.log("[refresh-username] Token refreshed successfully");
									} else {
										console.error("[refresh-username] No access token in refresh response:", refreshData);
									}
								} else {
									const errorData = await refreshResponse.json().catch(() => ({}));
									console.warn("[refresh-username] Failed to refresh token:", refreshResponse.status, errorData);
								}
							}
						} catch (refreshError) {
							console.error("[refresh-username] Error refreshing token:", refreshError);
						}
					} else if (tiktokConnection.accessToken) {
						// Token exists but might be expired, try using it anyway
						tiktokToken = tiktokConnection.accessToken;
						console.log("[refresh-username] Using potentially expired token from user data store");
					}
				}
			}
		} catch (error) {
			console.warn("[refresh-username] Error getting user data:", error);
		}

		if (!tiktokToken) {
			console.warn("[refresh-username] No TikTok access token available");
			return NextResponse.json({ error: "TikTok not connected or token expired. Please reconnect your TikTok account." }, { status: 401 });
		}

		// Fetch user info from TikTok API
		const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,unique_id,follower_count,following_count,likes_count,video_count", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${tiktokToken}`,
				"Content-Type": "application/json",
			},
		});

		if (!userResponse.ok) {
			const errorText = await userResponse.text();
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { error: errorText };
			}
			
			console.error("[TikTok] Failed to fetch user info:", {
				status: userResponse.status,
				statusText: userResponse.statusText,
				error: errorData,
			});
			
			// Check if it's a scope error
			if (errorData.error?.code === "scope_not_authorized") {
				console.warn("[TikTok] Scope not authorized - returning default username");
				// Return success with default username instead of error
				// This prevents repeated error attempts
				return NextResponse.json({
					username: "TikTok User",
					profilePicture: undefined,
					warning: "Scope not authorized - username unavailable",
				});
			}
			
			return NextResponse.json(
				{ error: "Failed to fetch TikTok user info", details: errorData.error?.message || errorText },
				{ status: userResponse.status }
			);
		}

		const userInfo = await userResponse.json();
		console.log("[TikTok] User info response:", JSON.stringify(userInfo, null, 2));

		// Check for API errors
		if (userInfo?.error) {
			console.error("[TikTok] API error in user info:", userInfo.error);
			return NextResponse.json(
				{ error: userInfo.error?.message || "Failed to fetch TikTok user info" },
				{ status: 500 }
			);
		}

		// Try different possible response structures
		const user = userInfo.data?.user || userInfo.user || userInfo.data;
		let username = "TikTok User";
		let profilePicture: string | undefined;

		if (user) {
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
		console.log("[TikTok] Extracted username:", username);

		// Also update the user data store if user is authenticated
		try {
			const user = await getCurrentUser();
			
			if (user && tiktokToken) {
				const socialConnections = getUserSocialConnections(user.whop_user_id);
				const existingConnection = socialConnections.find((c) => c.platform === "tiktok");
				
				if (existingConnection) {
					setUserSocialConnection(user.whop_user_id, {
						...existingConnection,
						username,
						profilePicture,
						accessToken: tiktokToken, // Ensure token is saved
					});
					console.log("[refresh-username] Updated user data store with username:", username);
				} else {
					console.warn("[refresh-username] No existing TikTok connection found in user data store");
				}
			}
		} catch (error) {
			console.warn("[TikTok] Failed to update user data store:", error);
		}

		return NextResponse.json({ username, profilePicture });
	} catch (error) {
		console.error("[TikTok] Error fetching username:", error);
		return NextResponse.json(
			{ error: "Failed to fetch TikTok username" },
			{ status: 500 }
		);
	}
}

