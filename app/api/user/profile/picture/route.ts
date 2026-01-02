import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userProfilePictures } from "@/app/api/user/profile/route";

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
		const { profilePictureUrl } = body;

		if (!profilePictureUrl) {
			return NextResponse.json(
				{ error: "Profile picture URL is required" },
				{ status: 400 }
			);
		}

		// Store profile picture URL
		userProfilePictures.set(user.whop_user_id, profilePictureUrl);

		// Also update user profile if it exists
		const { userProfiles } = await import("@/app/api/user/profile/route");
		const userProfile = userProfiles.get(user.whop_user_id);
		if (userProfile) {
			userProfile.profilePicture = profilePictureUrl;
			userProfiles.set(user.whop_user_id, userProfile);
		}

		// Note: Creator profiles feature removed

		return NextResponse.json({
			success: true,
			profilePictureUrl,
		});
	} catch (error) {
		console.error("[Save Profile Picture] Error:", error);
		return NextResponse.json(
			{ error: "Failed to save profile picture" },
			{ status: 500 }
		);
	}
}

export async function GET(_request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const profilePictureUrl = userProfilePictures.get(user.whop_user_id) || null;

		return NextResponse.json({
			success: true,
			profilePictureUrl,
		});
	} catch (error) {
		console.error("[Get Profile Picture] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get profile picture" },
			{ status: 500 }
		);
	}
}

