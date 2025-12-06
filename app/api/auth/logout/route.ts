import { NextRequest, NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		await clearUserSession();
		
		// Create response and explicitly clear cookies
		const response = NextResponse.json({ success: true });
		
		// Explicitly delete cookies in the response
		response.cookies.delete("whop_user_id");
		response.cookies.delete("whop_username");
		response.cookies.delete("user_email");
		
		return response;
	} catch (error) {
		console.error("[Logout] Error:", error);
		return NextResponse.json(
			{ error: "Failed to logout" },
			{ status: 500 }
		);
	}
}

