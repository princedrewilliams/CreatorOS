import { NextResponse } from "next/server";
import { checkProStatus } from "@/lib/paywall";

export async function GET() {
	try {
		const status = await checkProStatus();

		return NextResponse.json({
			isPro: status.isPro,
			userId: status.userId,
			isAuthenticated: status.isAuthenticated,
		});
	} catch (error) {
		console.error("[Pro Status] Error:", error);
		return NextResponse.json(
			{ error: "Failed to check Pro status" },
			{ status: 500 }
		);
	}
}
