import { NextRequest, NextResponse } from "next/server";

interface LibraryItem {
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
}

// In production, this would use a database
// For now, we'll use a simple in-memory store (would be replaced with database)
const libraryStore = new Map<string, LibraryItem[]>();

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { videoUrl, platform, title, description, hashtags, ideas, audioUrl, thumbnail, metadata } = body;

		if (!videoUrl || !platform) {
			return NextResponse.json(
				{ error: "Video URL and platform are required" },
				{ status: 400 }
			);
		}

		// In production, you would:
		// 1. Get user ID from session/auth
		// 2. Store in database (e.g., PostgreSQL, MongoDB)
		// 3. Extract and store metadata properly
		// 4. Handle file storage (S3, Cloudinary, etc.)

		// For now, use a simple user identifier (in production, get from auth)
		const userId = "default"; // Replace with actual user ID from auth

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
export async function GET(request: NextRequest) {
	try {
		// In production, get user ID from session/auth
		const userId = "default"; // Replace with actual user ID from auth

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

