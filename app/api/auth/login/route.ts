import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required" },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		if (!supabase) {
			return NextResponse.json(
				{ error: "Auth service not configured" },
				{ status: 500 }
			);
		}

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			console.error("[Login] Supabase error:", error);
			return NextResponse.json(
				{ error: error.message, code: error.status, details: error.code },
				{ status: 401 }
			);
		}

		const user = data.user;
		const username = user.user_metadata?.username || user.email?.split("@")[0] || "User";

		// Create response with user data
		const response = NextResponse.json({
			success: true,
			user: {
				whop_user_id: user.id,
				whop_username: username,
				email: user.email,
			},
		});

		// Set legacy cookies for compatibility with existing code
		response.cookies.set("whop_user_id", user.id, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});
		response.cookies.set("whop_username", username, {
			httpOnly: false,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});
		if (user.email) {
			response.cookies.set("user_email", user.email, {
				httpOnly: false,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 30,
				path: "/",
			});
		}

		return response;
	} catch (error) {
		console.error("[Login] Error:", error);
		return NextResponse.json(
			{ error: "Failed to login" },
			{ status: 500 }
		);
	}
}
