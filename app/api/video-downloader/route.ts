import { NextRequest, NextResponse } from "next/server";

const MOCK_VIDEO_URL =
	"https://files.creatos-cdn.com/demos/creatoros-sample-shorts.mp4";

export async function POST(request: NextRequest) {
	try {
		const { platform, url } = (await request.json()) as {
			platform?: string;
			url?: string;
		};

		if (!platform || !url) {
			return NextResponse.json({ error: "Missing platform or video URL." }, { status: 400 });
		}

		// Basic validation that the url looks like it belongs to the chosen platform.
		if (!isUrlValidForPlatform(url, platform)) {
			return NextResponse.json(
				{
					error: "That link doesn’t look valid for the selected platform. Double-check and try again.",
				},
				{ status: 400 }
			);
		}

		// In production, call your downloader service here. For MVP we return a mock asset.
		return NextResponse.json({
			message: "Success! Download link generated.",
			downloadUrl: MOCK_VIDEO_URL,
		});
	} catch (error) {
		console.error("Video download error:", error);
		return NextResponse.json(
			{ error: "Unable to prepare download at the moment. Please try again shortly." },
			{ status: 500 }
		);
	}
}

function isUrlValidForPlatform(url: string, platform: string): boolean {
	try {
		const parsed = new URL(url);
		if (platform === "tiktok") {
			return parsed.hostname.includes("tiktok.com");
		}
		if (platform === "instagram") {
			return parsed.hostname.includes("instagram.com") || parsed.hostname.includes("instagr.am");
		}
		if (platform === "youtube") {
			return parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be");
		}
		return false;
	} catch {
		return false;
	}
}

