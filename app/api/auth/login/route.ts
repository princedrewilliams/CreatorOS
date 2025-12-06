import { NextRequest, NextResponse } from "next/server";
import { setUserSession } from "@/lib/auth";
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

		// Set session cookies
		await setUserSession({
			whop_user_id: userAccount.whop_user_id,
			whop_username: userAccount.whop_username,
			email: userAccount.email,
		});

		return NextResponse.json({
			success: true,
			user: {
				whop_user_id: userAccount.whop_user_id,
				whop_username: userAccount.whop_username,
				email: userAccount.email,
			},
		});
	} catch (error) {
		console.error("[Login] Error:", error);
		return NextResponse.json(
			{ error: "Failed to login" },
			{ status: 500 }
		);
	}
}
