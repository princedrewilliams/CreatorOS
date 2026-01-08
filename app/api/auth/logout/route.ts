import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
	try {
		const supabase = await createClient();

		if (supabase) {
			await supabase.auth.signOut();
		}

		// Create response and clear all auth cookies
		const response = NextResponse.json({ success: true });

		// Clear Supabase auth cookies (handled by Supabase SSR)
		// Clear legacy cookies
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
