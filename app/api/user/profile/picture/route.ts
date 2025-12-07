import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userProfilePictures } from "@/app/api/collab/chat/route";

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

		// Also update in chat API
		const { userProfilePictures: chatPictures } = await import("@/app/api/collab/chat/route");
		// We'll need to export this or use a shared store
		// For now, we'll update it in the chat route directly

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

export async function GET(request: NextRequest) {
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

