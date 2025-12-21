import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSocialConnections } from "@/lib/user-data";

// In-memory store for user profiles (replace with database in production)
export const userProfiles = new Map<string, any>();
export const userProfilePictures = new Map<string, string>();

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get profile picture from store
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

		// Update profile picture in store if provided
		if (profilePicture) {
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

		// Note: Creator profiles feature removed

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

