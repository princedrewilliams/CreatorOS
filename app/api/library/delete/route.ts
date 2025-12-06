import { NextRequest, NextResponse } from "next/server";
import { libraryStore } from "../save/route";

export async function DELETE(request: NextRequest) {
	try {
		const body = await request.json();
		const { itemId } = body;

		if (!itemId) {
			return NextResponse.json(
				{ error: "Item ID is required" },
				{ status: 400 }
			);
		}

		// In production, get user ID from session/auth
		const userId = "default"; // Replace with actual user ID from auth

		const userLibrary = libraryStore.get(userId) || [];
		const filteredLibrary = userLibrary.filter((item) => item.id !== itemId);
		libraryStore.set(userId, filteredLibrary);

		return NextResponse.json({
			success: true,
			message: "Item deleted from library",
		});
	} catch (error) {
		console.error("[Delete from Library] Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete item from library" },
			{ status: 500 }
		);
	}
}

