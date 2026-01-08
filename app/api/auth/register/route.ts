import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password, username } = body;

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

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username: username || email.split("@")[0],
				},
			},
		});

		if (error) {
			console.error("[Register] Supabase error:", error);
			// Handle specific error cases
			if (error.message.includes("already registered")) {
				return NextResponse.json(
					{ error: "User with this email already exists" },
					{ status: 409 }
				);
			}
			return NextResponse.json(
				{ error: error.message, code: error.status, details: error.code },
				{ status: 400 }
			);
		}

		const user = data.user;
		if (!user) {
			return NextResponse.json(
				{ error: "Registration failed" },
				{ status: 500 }
			);
		}

		const displayUsername = username || email.split("@")[0];

		// Create response with user data
		const response = NextResponse.json({
			success: true,
			user: {
				whop_user_id: user.id,
				whop_username: displayUsername,
				email: user.email,
			},
			// Note: If email confirmation is enabled in Supabase, user should check email
			emailConfirmationRequired: !data.session,
		});

		// Set legacy cookies for compatibility (only if session exists - no email confirmation)
		if (data.session) {
			response.cookies.set("whop_user_id", user.id, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 24 * 30,
				path: "/",
			});
			response.cookies.set("whop_username", displayUsername, {
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
		}

		return response;
	} catch (error) {
		console.error("[Register] Error:", error);
		return NextResponse.json(
			{ error: "Failed to register" },
			{ status: 500 }
		);
	}
}
