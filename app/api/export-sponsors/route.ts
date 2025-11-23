import { NextRequest, NextResponse } from "next/server";

// Note: This route is a placeholder. The actual CSV export is handled client-side
// in the sponsors page component using data from the Zustand store.
// In a production app with a database, you could fetch sponsor data here and return CSV.

export async function GET(request: NextRequest) {
	try {
		// Return a CSV template with headers
		// In production, fetch sponsor data from your database/API here
		const csvRows: string[] = [];
		
		// Header
		csvRows.push("Brand,Type,Amount (USD),Status,Deadline,Notes,Created At,Updated At");

		// Return CSV file
		const csv = csvRows.join("\n");

		return new NextResponse(csv, {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="sponsors-export-${new Date().toISOString().split("T")[0]}.csv"`,
			},
		});
	} catch (error) {
		console.error("[export-sponsors] Error:", error);
		return NextResponse.json(
			{ error: "Failed to export sponsor data" },
			{ status: 500 }
		);
	}
}

