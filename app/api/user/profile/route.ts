import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// In-memory store for user profiles (replace with database in production)
const userProfiles = new Map<string, any>();

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const profile = userProfiles.get(user.whop_user_id) || {
			username: user.whop_username,
			niche: "",
			bio: "",
			socialLinks: {
				youtube: "",
				instagram: "",
				tiktok: "",
			},
		};

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
		const { username, niche, bio, socialLinks } = body;

		const profile = {
			username: username || user.whop_username,
			niche: niche || "",
			bio: bio || "",
			socialLinks: {
				youtube: socialLinks?.youtube || "",
				instagram: socialLinks?.instagram || "",
				tiktok: socialLinks?.tiktok || "",
			},
			updatedAt: new Date().toISOString(),
		};

		userProfiles.set(user.whop_user_id, profile);

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

