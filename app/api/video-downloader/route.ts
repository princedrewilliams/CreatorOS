import { NextRequest, NextResponse } from "next/server";

const PLACEHOLDER_RESPONSE_URL = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";

const PLATFORM_ENDPOINTS: Record<string, string> = {
	tiktok: "/download",
	instagram: "/download",
	youtube: "/download",
};

const RAPIDAPI_HOST = process.env.RAPIDAPI_VIDEO_HOST;
const RAPIDAPI_KEY = process.env.RAPIDAPI_VIDEO_KEY;
const RAPIDAPI_BASE_URL =
	process.env.RAPIDAPI_VIDEO_BASE_URL ||
	(RAPIDAPI_HOST ? `https://${RAPIDAPI_HOST}` : undefined);

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

		const downloadUrl = await resolveDownloadUrl(platform, url);

		return NextResponse.json({
			message: "Success! Download link generated.",
			downloadUrl,
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

async function resolveDownloadUrl(platform: string, url: string): Promise<string> {
	if (!RAPIDAPI_BASE_URL || !RAPIDAPI_KEY || !RAPIDAPI_HOST) {
		console.warn(
			"[video-downloader] RapidAPI credentials missing. Falling back to placeholder response."
		);
		return PLACEHOLDER_RESPONSE_URL;
	}

	const endpoint = PLATFORM_ENDPOINTS[platform];
	if (!endpoint) {
		throw new Error("Unsupported platform.");
	}

	const requestUrl = new URL(endpoint, RAPIDAPI_BASE_URL);
	requestUrl.searchParams.set("url", url);
	requestUrl.searchParams.set("platform", platform);

	const response = await fetch(requestUrl.toString(), {
		method: "GET",
		headers: {
			"X-RapidAPI-Key": RAPIDAPI_KEY,
			"X-RapidAPI-Host": RAPIDAPI_HOST,
		},
		cache: "no-store",
	});

	const payload = await parseJsonSafely(response);

	if (!response.ok) {
		throw new Error(
			(payload?.error as string) ||
				(payload?.message as string) ||
				"Could not generate download link."
		);
	}

	const candidate =
		payload?.downloadUrl ||
		payload?.download_link ||
		payload?.url ||
		payload?.video_url ||
		payload?.data?.download_url;

	if (typeof candidate === "string" && candidate.startsWith("http")) {
		return candidate;
	}

	console.warn(
		"[video-downloader] Received unexpected payload shape from RapidAPI. Falling back to placeholder.",
		payload
	);

	return PLACEHOLDER_RESPONSE_URL;
}

async function parseJsonSafely(response: Response): Promise<any> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

