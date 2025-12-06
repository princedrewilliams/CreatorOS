import { NextRequest, NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		await clearUserSession();
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Logout] Error:", error);
		return NextResponse.json(
			{ error: "Failed to logout" },
			{ status: 500 }
		);
	}
}

