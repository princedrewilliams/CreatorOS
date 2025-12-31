import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { userAccounts } from "@/lib/user-accounts";

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

		// Find user account
		const userAccount = userAccounts.get(email.toLowerCase());

		if (!userAccount) {
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401 }
			);
		}

		// Verify password
		const passwordValid = await bcrypt.compare(password, userAccount.passwordHash);

		if (!passwordValid) {
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401 }
			);
		}

		// Create response
		const response = NextResponse.json({
			success: true,
			user: {
				whop_user_id: userAccount.whop_user_id,
				whop_username: userAccount.whop_username,
				email: userAccount.email,
			},
		});

		// Set session cookies on the response
		response.cookies.set("whop_user_id", userAccount.whop_user_id, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30, // 30 days
			path: "/",
		});
		response.cookies.set("whop_username", userAccount.whop_username, {
			httpOnly: false,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});
		if (userAccount.email) {
			response.cookies.set("user_email", userAccount.email, {
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
