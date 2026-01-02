import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export interface LibraryItem {
	id: string;
	videoUrl: string;
	platform: "tiktok" | "instagram" | "youtube";
	title: string;
	description: string;
	hashtags: string[];
	ideas: string[];
	audioUrl?: string;
	thumbnail?: string;
	savedAt: string;
	metadata: {
		duration?: number;
		format?: string;
		size?: number;
	};
	userId: string; // Store user ID with each item
}

// In production, this would use a database
// For now, we'll use a simple in-memory store (would be replaced with database)
const libraryStore = new Map<string, LibraryItem[]>();

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required. Please login." },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { videoUrl, platform, title, description, hashtags, ideas, audioUrl, thumbnail, metadata } = body;

		if (!videoUrl || !platform) {
			return NextResponse.json(
				{ error: "Video URL and platform are required" },
				{ status: 400 }
			);
		}

		// In production, you would:
		// 1. Store in database (e.g., PostgreSQL, MongoDB)
		// 2. Extract and store metadata properly
		// 3. Handle file storage (S3, Cloudinary, etc.)

		const userId = user.whop_user_id;

		const libraryItem: LibraryItem = {
			id: `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			videoUrl,
			platform,
			title: title || `Video from ${platform}`,
			description: description || "",
			hashtags: hashtags || [],
			ideas: ideas || [],
			audioUrl,
			thumbnail,
			savedAt: new Date().toISOString(),
			metadata: metadata || {},
			userId,
		};

		// Get user's library
		const userLibrary = libraryStore.get(userId) || [];
		userLibrary.push(libraryItem);
		libraryStore.set(userId, userLibrary);

		return NextResponse.json({
			success: true,
			item: libraryItem,
			message: "Video saved to library successfully",
		});
	} catch (error) {
		console.error("[Save to Library] Error:", error);
		return NextResponse.json(
			{ error: "Failed to save video to library" },
			{ status: 500 }
		);
	}
}

// GET endpoint to retrieve library items
export async function GET() {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required. Please login." },
				{ status: 401 }
			);
		}

		const userId = user.whop_user_id;
		const userLibrary = libraryStore.get(userId) || [];

		return NextResponse.json({
			success: true,
			items: userLibrary,
			count: userLibrary.length,
		});
	} catch (error) {
		console.error("[Get Library] Error:", error);
		return NextResponse.json(
			{ error: "Failed to retrieve library" },
			{ status: 500 }
		);
	}
}

// Export the store for use in other routes if needed
export { libraryStore };

