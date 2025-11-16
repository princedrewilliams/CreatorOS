import { NextRequest, NextResponse } from "next/server";
import { analyticsMocks, type AnalyticsPlatform } from "@/lib/mockAnalytics";

export async function GET(request: NextRequest) {
	try {
		const url = request.nextUrl;
		const requestedPlatforms = url.searchParams.getAll("platform") as AnalyticsPlatform[];

		// Get analytics data (simplified - in production, fetch real data)
		const platforms = requestedPlatforms.length > 0 ? requestedPlatforms : (["youtube", "tiktok", "instagram"] as AnalyticsPlatform[]);

		// Generate CSV format for Google Sheets
		const csvRows: string[] = [];
		
		// Header
		csvRows.push("Platform,Views,Followers,Engagement %,Revenue,Updated At");

		// Data rows
		for (const platform of platforms) {
			const data = analyticsMocks[platform];
			csvRows.push(
				`${platform},${data.views},${data.followers},${data.engagement.toFixed(2)},${data.revenue},${data.updatedAt}`
			);
		}

		const csv = csvRows.join("\n");

		// Return CSV file
		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().split("T")[0]}.csv"`,
			},
		});
	} catch (error) {
		console.error("[export-analytics] Error:", error);
		return NextResponse.json(
			{ error: "Failed to export analytics data" },
			{ status: 500 }
		);
	}
}

