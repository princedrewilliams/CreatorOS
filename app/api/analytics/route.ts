import { NextRequest, NextResponse } from "next/server";
import { analyticsMocks, type AnalyticsPlatform } from "@/lib/mockAnalytics";

export async function GET(request: NextRequest) {
	const url = request.nextUrl;
	const requestedPlatforms = url.searchParams.getAll("platform") as AnalyticsPlatform[];

	const platforms =
		requestedPlatforms.length > 0
			? requestedPlatforms.filter((platform) => platform in analyticsMocks)
			: (Object.keys(analyticsMocks) as AnalyticsPlatform[]);

	const payload = platforms.map((platform) => ({
		platform,
		data: analyticsMocks[platform],
	}));

	return NextResponse.json({ platforms: payload, generatedAt: new Date().toISOString() });
}

