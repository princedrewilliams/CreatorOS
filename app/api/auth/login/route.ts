import { NextRequest, NextResponse } from "next/server";
import { whopsdk, isWhopConfigured } from "@/lib/whop-sdk";
import { setUserSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		if (!isWhopConfigured || !whopsdk) {
			return NextResponse.json(
				{ error: "Whop integration is not configured" },
				{ status: 503 }
			);
		}

		const body = await request.json();
		const { email } = body;

		if (!email) {
			return NextResponse.json(
				{ error: "Email is required" },
				{ status: 400 }
			);
		}

		// In production, you would:
		// 1. Send a magic link email via Whop's email service
		// 2. User clicks link, which validates and creates session
		// 3. For now, we'll simulate the login flow
		// 
		// According to Whop docs, users can login with email at:
		// https://whop.com/@me/settings/memberships/
		// They use the same email to access your SaaS without a password

		// For demo purposes, we'll create a session based on email
		// In production, you'd validate the user via Whop SDK
		const whop_user_id = `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
		const whop_username = email.split("@")[0];

		// Set session cookies
		await setUserSession({
			whop_user_id,
			whop_username,
			email,
		});

		return NextResponse.json({
			success: true,
			user: {
				whop_user_id,
				whop_username,
				email,
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

