import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);
		}

		return NextResponse.json({
			success: true,
			user,
		});
	} catch (error) {
		console.error("[Get User] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get user" },
			{ status: 500 }
		);
	}
}

