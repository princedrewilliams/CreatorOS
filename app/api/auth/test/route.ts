import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		// Check if env vars are set
		if (!url || !key) {
			return NextResponse.json({
				success: false,
				error: "Missing environment variables",
				hasUrl: !!url,
				hasKey: !!key,
			});
		}

		const supabase = await createClient();

		if (!supabase) {
			return NextResponse.json({
				success: false,
				error: "Failed to create Supabase client",
			});
		}

		// Test the connection by trying to get auth settings
		const { data, error } = await supabase.auth.getSession();

		return NextResponse.json({
			success: true,
			message: "Supabase connection working",
			supabaseUrl: url,
			hasSession: !!data.session,
			error: error?.message || null,
		});
	} catch (err) {
		return NextResponse.json({
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
		});
	}
}
