import { NextRequest, NextResponse } from "next/server";

const PLACEHOLDER_RESPONSE_URL = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";

const RAPIDAPI_TIKTOK_HOST =
	process.env.RAPIDAPI_TIKTOK_HOST || "tiktok-video-no-watermark2.p.rapidapi.com";
const RAPIDAPI_TIKTOK_KEY = process.env.RAPIDAPI_TIKTOK_KEY;
const RAPIDAPI_TIKTOK_BASE_URL =
	process.env.RAPIDAPI_TIKTOK_BASE_URL || `https://${RAPIDAPI_TIKTOK_HOST}`;

const RAPIDAPI_INSTAGRAM_HOST =
	process.env.RAPIDAPI_INSTAGRAM_HOST || "instagram120.p.rapidapi.com";
const RAPIDAPI_INSTAGRAM_KEY = process.env.RAPIDAPI_INSTAGRAM_KEY;
const RAPIDAPI_INSTAGRAM_ENDPOINT =
	process.env.RAPIDAPI_INSTAGRAM_ENDPOINT || `https://${RAPIDAPI_INSTAGRAM_HOST}/api/instagram/links`;

const RAPIDAPI_YOUTUBE_HOST =
	process.env.RAPIDAPI_YOUTUBE_HOST || "youtube-video-fast-downloader-24-7.p.rapidapi.com";
const RAPIDAPI_YOUTUBE_KEY = process.env.RAPIDAPI_YOUTUBE_KEY;
const RAPIDAPI_YOUTUBE_BASE_URL =
	process.env.RAPIDAPI_YOUTUBE_BASE_URL || `https://${RAPIDAPI_YOUTUBE_HOST}`;

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

	const { downloadUrl, formatInfo } = await resolveDownloadUrl(platform, url);

		return NextResponse.json({
			message: "Success! Download link generated.",
			downloadUrl,
			formatInfo, // Include format info for compatibility warnings
		});
	} catch (error) {
		console.error("[video-downloader] Fatal error:", error);
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

async function resolveDownloadUrl(
	platform: string,
	url: string
): Promise<{ downloadUrl: string; formatInfo?: { mime?: string; hasOpus?: boolean } }> {
	if (platform === "tiktok") {
		return resolveTikTokDownload(url);
	}
	if (platform === "instagram") {
		return resolveInstagramDownload(url);
	}
	if (platform === "youtube") {
		return resolveYouTubeDownload(url);
	}

	console.warn(`[video-downloader] No downloader configured for platform '${platform}', returning placeholder.`);
	return { downloadUrl: PLACEHOLDER_RESPONSE_URL };
}

async function resolveTikTokDownload(
	videoUrl: string
): Promise<{ downloadUrl: string; formatInfo?: { mime?: string; hasOpus?: boolean } }> {
	if (!RAPIDAPI_TIKTOK_KEY) {
		console.error("[video-downloader] TikTok RapidAPI key missing. Set RAPIDAPI_TIKTOK_KEY environment variable.");
		throw new Error("TikTok downloader is not configured. Please contact support.");
	}

	const requestUrl = new URL("/", RAPIDAPI_TIKTOK_BASE_URL);
	requestUrl.searchParams.set("url", videoUrl);
	requestUrl.searchParams.set("hd", "1");

	const response = await fetch(requestUrl.toString(), {
		method: "GET",
		headers: {
			"X-RapidAPI-Key": RAPIDAPI_TIKTOK_KEY,
			"X-RapidAPI-Host": RAPIDAPI_TIKTOK_HOST,
		},
		cache: "no-store",
	});

	const payload = await parseJsonSafely(response);

	if (!response.ok) {
		const errorMsg = payload?.message || payload?.error || `RapidAPI returned ${response.status}`;
		console.error("[video-downloader] TikTok RapidAPI error", {
			status: response.status,
			statusText: response.statusText,
			body: payload,
		});
		throw new Error(`Failed to download TikTok video: ${errorMsg}`);
	}

	const candidate =
		payload?.data?.play ||
		payload?.data?.hdplay ||
		payload?.data?.wmplay ||
		payload?.play ||
		payload?.hdplay;

	if (typeof candidate === "string" && candidate.startsWith("http")) {
		return { downloadUrl: candidate };
	}

	console.error("[video-downloader] TikTok response missing download URL", payload);
	throw new Error("TikTok API response did not contain a valid download URL. Please try again or contact support.");
}

async function resolveInstagramDownload(
	videoUrl: string
): Promise<{ downloadUrl: string; formatInfo?: { mime?: string; hasOpus?: boolean } }> {
	if (!RAPIDAPI_INSTAGRAM_KEY) {
		console.error("[video-downloader] Instagram RapidAPI key missing. Set RAPIDAPI_INSTAGRAM_KEY environment variable.");
		throw new Error("Instagram downloader is not configured. Please contact support.");
	}

	const response = await fetch(RAPIDAPI_INSTAGRAM_ENDPOINT, {
		method: "POST",
		headers: {
			"X-RapidAPI-Key": RAPIDAPI_INSTAGRAM_KEY,
			"X-RapidAPI-Host": RAPIDAPI_INSTAGRAM_HOST,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ url: videoUrl }),
		cache: "no-store",
	});

	let payload = await parseJsonSafely(response);

	if (!response.ok) {
		const errorMsg = payload?.message || payload?.error || `RapidAPI returned ${response.status}`;
		console.error("[video-downloader] Instagram RapidAPI error", {
			status: response.status,
			statusText: response.statusText,
			body: payload,
		});
		throw new Error(`Failed to download Instagram video: ${errorMsg}`);
	}

	// Handle case where response might be an array
	if (Array.isArray(payload) && payload.length > 0) {
		payload = payload[0];
	}

	// Try various possible response formats from the /api/instagram/links endpoint
	// The response has a urls array, check that first
	let candidate: string | undefined;
	
	if (Array.isArray(payload?.urls) && payload.urls.length > 0) {
		const firstUrl = payload.urls[0];
		// Try common field names for the video URL
		candidate = firstUrl?.url || firstUrl?.videoUrl || firstUrl?.video_url || firstUrl?.downloadUrl || firstUrl?.video;
		
		// If still not found, log the structure for debugging
		if (!candidate) {
			console.log("[video-downloader] Instagram urls[0] structure:", JSON.stringify(firstUrl, null, 2));
		}
	}
	
	// Fallback to other possible locations
	if (!candidate) {
		candidate =
			payload?.data?.videoUrl ||
			payload?.data?.video_url ||
			payload?.data?.downloadUrl ||
			payload?.data?.items?.[0]?.video_versions?.[0]?.url ||
			payload?.data?.items?.[0]?.videoUrl ||
			payload?.videoUrl ||
			payload?.video_url ||
			payload?.downloadUrl ||
			payload?.items?.[0]?.video_versions?.[0]?.url ||
			payload?.items?.[0]?.videoUrl;
	}

	if (typeof candidate === "string" && candidate.startsWith("http")) {
		return { downloadUrl: candidate };
	}

	console.error("[video-downloader] Instagram response missing download URL", payload);
	throw new Error("Instagram API response did not contain a valid download URL. Please try again or contact support.");
}

async function resolveYouTubeDownload(
	videoUrl: string
): Promise<{ downloadUrl: string; formatInfo?: { mime?: string; hasOpus?: boolean } }> {
	if (!RAPIDAPI_YOUTUBE_KEY) {
		console.error("[video-downloader] YouTube RapidAPI key missing. Set RAPIDAPI_YOUTUBE_KEY environment variable.");
		throw new Error("YouTube downloader is not configured. Please contact support.");
	}

	const videoId = extractYouTubeVideoId(videoUrl);
	if (!videoId) {
		console.error("[video-downloader] Could not extract YouTube video ID from URL:", videoUrl);
		throw new Error("Invalid YouTube URL. Please provide a valid YouTube video link (youtube.com/watch?v=..., youtu.be/..., or youtube.com/shorts/...).");
	}

	// Use the download_short endpoint with quality parameter
	const requestUrl = new URL(`/download_short/${videoId}`, RAPIDAPI_YOUTUBE_BASE_URL);
	requestUrl.searchParams.set("quality", "247"); // Default quality as per API docs

	const response = await fetch(requestUrl.toString(), {
		method: "GET",
		headers: {
			"X-RapidAPI-Key": RAPIDAPI_YOUTUBE_KEY,
			"X-RapidAPI-Host": RAPIDAPI_YOUTUBE_HOST,
		},
		cache: "no-store",
	});

	const payload = await parseJsonSafely(response);

	if (!response.ok) {
		const errorMsg = payload?.message || payload?.error || `RapidAPI returned ${response.status}`;
		console.error("[video-downloader] YouTube RapidAPI error", {
			status: response.status,
			statusText: response.statusText,
			body: payload,
		});
		throw new Error(`Failed to download YouTube video: ${errorMsg}`);
	}

	// Try various possible response formats
	// The API returns 'file' and 'reserved_file' fields with the download URLs
	const candidate =
		payload?.file ||
		payload?.reserved_file ||
		payload?.data?.file ||
		payload?.data?.reserved_file ||
		payload?.data?.url ||
		payload?.data?.downloadUrl ||
		payload?.data?.videoUrl ||
		payload?.url ||
		payload?.downloadUrl ||
		payload?.videoUrl ||
		payload?.link;

	if (typeof candidate === "string" && candidate.startsWith("http")) {
		// Check for Opus audio in the mime type or other indicators
		const mime = payload?.mime || payload?.data?.mime;
		let hasOpus = false;
		
		if (mime && typeof mime === "string") {
			const mimeLower = mime.toLowerCase();
			// Check for Opus in mime type (could be in codecs parameter)
			hasOpus = mimeLower.includes("opus") || mimeLower.includes("codec=\"opus") || mimeLower.includes("codecs=\"opus");
		}
		
		// Also check the file URL extension as a fallback
		if (!hasOpus && candidate.toLowerCase().includes(".opus")) {
			hasOpus = true;
		}
		
		// Log for debugging
		if (mime) {
			console.log("[video-downloader] YouTube format info:", { mime, hasOpus, candidate });
		}
		
		return {
			downloadUrl: candidate,
			formatInfo: {
				mime: typeof mime === "string" ? mime : undefined,
				hasOpus,
			},
		};
	}

	console.error("[video-downloader] YouTube response missing download URL", payload);
	throw new Error("YouTube API response did not contain a valid download URL. Please try again or contact support.");
}

function extractYouTubeVideoId(url: string): string | null {
	try {
		const parsed = new URL(url);
		
		// Handle youtu.be/VIDEO_ID
		if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
			const pathSegments = parsed.pathname.split("/").filter(Boolean);
			if (pathSegments.length > 0) {
				return pathSegments[0];
			}
		}
		
		// Handle youtube.com/watch?v=VIDEO_ID
		if (parsed.hostname.includes("youtube.com")) {
			const videoId = parsed.searchParams.get("v");
			if (videoId) {
				return videoId;
			}
		}
		
		// Handle youtube.com/shorts/VIDEO_ID
		if (parsed.hostname.includes("youtube.com")) {
			const pathSegments = parsed.pathname.split("/").filter(Boolean);
			if (pathSegments.length >= 2 && pathSegments[0] === "shorts") {
				return pathSegments[1];
			}
		}
		
		return null;
	} catch {
		return null;
	}
}

async function parseJsonSafely(response: Response): Promise<any> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

