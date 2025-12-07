import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections } from "@/lib/user-data";

// In-memory store for user profiles (replace with database in production)
export const userProfiles = new Map<string, any>();

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get profile picture from chat API
		const { userProfilePictures } = await import("@/app/api/collab/chat/route");
		const profilePicture = userProfilePictures.get(user.whop_user_id) || "";

		const profile = userProfiles.get(user.whop_user_id) || {
			username: user.whop_username,
			niche: "",
			bio: "",
			profilePicture,
			socialLinks: {
				youtube: "",
				instagram: "",
				tiktok: "",
			},
		};

		// Ensure profile picture is included
		if (!profile.profilePicture && profilePicture) {
			profile.profilePicture = profilePicture;
		}

		return NextResponse.json({
			success: true,
			profile,
		});
	} catch (error) {
		console.error("[Get Profile] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get profile" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { username, niche, bio, socialLinks, profilePicture } = body;

		// Update profile picture in chat API if provided
		if (profilePicture) {
			const { userProfilePictures } = await import("@/app/api/collab/chat/route");
			userProfilePictures.set(user.whop_user_id, profilePicture);
		}

		const profile = {
			username: username || user.whop_username,
			niche: niche || "",
			bio: bio || "",
			profilePicture: profilePicture || "",
			socialLinks: {
				youtube: socialLinks?.youtube || "",
				instagram: socialLinks?.instagram || "",
				tiktok: socialLinks?.tiktok || "",
			},
			updatedAt: new Date().toISOString(),
		};

		userProfiles.set(user.whop_user_id, profile);

		// Sync to creator profiles if user has a niche
		if (niche) {
			try {
				const socialConnections = getUserSocialConnections(user.whop_user_id);
				const platforms = socialConnections
					.filter((conn) => conn.connected)
					.map((conn) => conn.platform);
				
				// Get stats from social connections (mock for now, in production fetch from APIs)
				const followers = socialConnections.reduce((sum, conn) => {
					return sum + (conn.connected ? 10000 : 0); // Mock follower count
				}, 0);
				const highestViews = 2500000; // Mock

				// Update creator profiles
				const { creatorProfiles } = await import("@/app/api/collab/creators/route");
				const creatorProfile = {
					userId: user.whop_user_id,
					id: user.whop_user_id,
					username: username || user.whop_username,
					niche: niche,
					followers: followers || 0,
					highestViews: highestViews || 0,
					platforms: platforms || [],
					profilePicture: profilePicture || "",
					socialLinks: {
						youtube: socialLinks?.youtube || "",
						instagram: socialLinks?.instagram || "",
						tiktok: socialLinks?.tiktok || "",
					},
					createdAt: creatorProfiles.has(user.whop_user_id)
						? creatorProfiles.get(user.whop_user_id).createdAt
						: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				creatorProfiles.set(user.whop_user_id, creatorProfile);
			} catch (err) {
				console.error("[Sync Creator Profile] Error:", err);
				// Non-critical, continue
			}
		}

		return NextResponse.json({
			success: true,
			profile,
		});
	} catch (error) {
		console.error("[Save Profile] Error:", error);
		return NextResponse.json(
			{ error: "Failed to save profile" },
			{ status: 500 }
		);
	}
}

