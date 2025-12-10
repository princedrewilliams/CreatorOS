import { NextRequest, NextResponse } from "next/server";

interface Clip {
	id: string;
	startTime: number;
	endTime: number;
	title: string;
	caption: string;
	thumbnail?: string;
	downloadUrl?: string;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const videoUrl = body.videoUrl as string;
		const clipCount = Math.min(7, Math.max(3, parseInt(body.clipCount as string) || 5));

		if (!videoUrl) {
			return NextResponse.json(
				{ error: "Video URL is required" },
				{ status: 400 }
			);
		}

		// Estimate video duration (in production, get actual duration from video metadata)
		const videoDuration = 300; // Default to 5 minutes

		// Use AI to detect key moments
		let moments: Array<{ startTime: number; endTime: number; title: string; description: string; reason: string }> = [];
		
		try {
			// Import the detect-key-moments function directly instead of making HTTP call
			const { detectKeyMoments } = await import("../detect-key-moments/route");
			const keyMomentsRequest = new NextRequest("http://localhost/api/automation/detect-key-moments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ videoUrl, videoDuration, clipCount }),
			});
			const keyMomentsResponse = await detectKeyMoments(keyMomentsRequest);
			
			if (keyMomentsResponse.ok) {
				const keyMomentsData = await keyMomentsResponse.json();
				moments = keyMomentsData.moments || [];
			}
		} catch (error) {
			console.warn("[Auto Repurpose] Failed to detect key moments with AI, using fallback:", error);
		}

		// If AI detection failed, use fallback: evenly distribute clips
		if (moments.length === 0) {
			const clipDuration = 15; // 15 seconds per clip
			for (let i = 0; i < clipCount; i++) {
				const startTime = (videoDuration / clipCount) * i;
				const endTime = Math.min(startTime + clipDuration, videoDuration);
				moments.push({
					startTime,
					endTime,
					title: `Key Moment ${i + 1}`,
					description: `Engaging clip from the video`,
					reason: "Evenly distributed key moment",
				});
			}
		}

		// Convert moments to clips
		const clips: Clip[] = moments.map((moment, index) => ({
			id: `clip-${Date.now()}-${index + 1}`,
			startTime: moment.startTime,
			endTime: moment.endTime,
			title: moment.title,
			caption: `${moment.description}\n\n${moment.reason}\n\n#shorts #viral #trending`,
			downloadUrl: `/api/download-clip?clipId=clip-${index + 1}&start=${moment.startTime}&end=${moment.endTime}&source=${encodeURIComponent(videoUrl)}`,
		}));

		return NextResponse.json({
			success: true,
			clips,
		});
	} catch (error) {
		console.error("[Auto Repurpose] Error:", error);
		return NextResponse.json(
			{ error: "Failed to repurpose video" },
			{ status: 500 }
		);
	}
}

