import { NextRequest, NextResponse } from "next/server";
import { setUserSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { userAccounts, type UserAccount } from "@/lib/user-accounts";

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

		// Check if user already exists
		if (userAccounts.has(email.toLowerCase())) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 409 }
			);
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, 10);

		// Create user account
		const whop_user_id = `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
		const whop_username = username || email.split("@")[0];

		const userAccount: UserAccount = {
			whop_user_id,
			whop_username,
			email: email.toLowerCase(),
			passwordHash,
			createdAt: new Date().toISOString(),
		};

		userAccounts.set(email.toLowerCase(), userAccount);

		// Set session cookies
		await setUserSession({
			whop_user_id,
			whop_username,
			email: email.toLowerCase(),
		});

		return NextResponse.json({
			success: true,
			user: {
				whop_user_id,
				whop_username,
				email: email.toLowerCase(),
			},
		});
	} catch (error) {
		console.error("[Register] Error:", error);
		return NextResponse.json(
			{ error: "Failed to register" },
			{ status: 500 }
		);
	}
}

