import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const source = searchParams.get("source");

		if (!source) {
			return NextResponse.json(
				{ error: "Source video URL is required" },
				{ status: 400 }
			);
		}

		// Decode the source URL
		const videoUrl = decodeURIComponent(source);

		// In production, this would:
		// 1. Download the video from the source URL
		// 2. Use FFmpeg or a video processing service to extract the clip from start to end time
		// 3. Return the processed clip URL or stream it directly
		// 4. Optionally add captions, resize, or apply other transformations

		// For now, redirect to the original video URL
		// In a production environment, you would process the video here and return the clip
		return NextResponse.redirect(videoUrl);
	} catch (error) {
		console.error("[Download Clip] Error:", error);
		return NextResponse.json(
			{ error: "Failed to process clip" },
			{ status: 500 }
		);
	}
}

