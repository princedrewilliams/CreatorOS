import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		const supabase = await createClient();

		if (!supabase) {
			return NextResponse.json(
				{ error: "Auth service not configured" },
				{ status: 500 }
			);
		}

		const { data: { user }, error } = await supabase.auth.getUser();

		if (error || !user) {
			return NextResponse.json(
				{ error: "Not authenticated" },
				{ status: 401 }
			);
		}

		const username = user.user_metadata?.username || user.email?.split("@")[0] || "User";

		return NextResponse.json({
			success: true,
			user: {
				whop_user_id: user.id,
				whop_username: username,
				email: user.email,
			},
		});
	} catch (error) {
		console.error("[Get User] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get user" },
			{ status: 500 }
		);
	}
}
