import { NextRequest, NextResponse } from "next/server";
import { libraryStore } from "../save/route";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required. Please login." },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { itemId } = body;

		if (!itemId) {
			return NextResponse.json(
				{ error: "Item ID is required" },
				{ status: 400 }
			);
		}

		const userId = user.whop_user_id;
		const userLibrary = libraryStore.get(userId) || [];
		
		// Ensure user owns the item before deleting
		const item = userLibrary.find((item) => item.id === itemId);
		if (!item || item.userId !== userId) {
			return NextResponse.json(
				{ error: "Item not found or access denied" },
				{ status: 404 }
			);
		}

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

