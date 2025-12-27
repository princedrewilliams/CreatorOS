import { NextRequest, NextResponse } from "next/server";

function extractChannelId(url: string): string | null {
	// Handle various YouTube URL formats
	const patterns = [
		/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
		/youtube\.com\/@([a-zA-Z0-9_-]+)/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return match[1];
		}
	}

	return null;
}

async function getChannelIdFromHandle(handle: string, apiKey: string): Promise<string | null> {
	try {
		// Try to get channel by handle
		const response = await fetch(
			`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${apiKey}`
		);
		const data = await response.json();
		if (data.items && data.items.length > 0) {
			return data.items[0].id;
		}
	} catch (error) {
		console.error("[Channel DNA] Error fetching channel by handle:", error);
	}
	return null;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { channelUrl } = body;

		if (!channelUrl) {
			return NextResponse.json(
				{ error: "Channel URL is required" },
				{ status: 400 }
			);
		}

		const apiKey = process.env.YOUTUBE_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "YouTube API key is not configured" },
				{ status: 500 }
			);
		}

		// Extract channel ID or handle from URL
		let channelId = extractChannelId(channelUrl);
		let isHandle = false;

		if (!channelId) {
			// Try to extract handle from URL
			const handleMatch = channelUrl.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
			if (handleMatch) {
				const handle = handleMatch[1];
				channelId = await getChannelIdFromHandle(handle, apiKey);
				isHandle = true;
			}
		}

		if (!channelId) {
			return NextResponse.json(
				{ error: "Could not extract channel ID from URL. Please provide a valid YouTube channel URL." },
				{ status: 400 }
			);
		}

		// Fetch channel data
		const channelResponse = await fetch(
			`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`
		);

		if (!channelResponse.ok) {
			throw new Error("Failed to fetch channel data");
		}

		const channelData = await channelResponse.json();
		if (!channelData.items || channelData.items.length === 0) {
			return NextResponse.json(
				{ error: "Channel not found" },
				{ status: 404 }
			);
		}

		const channel = channelData.items[0];
		const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

		// Fetch recent videos
		let videos: any[] = [];
		if (uploadsPlaylistId) {
			const videosResponse = await fetch(
				`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
			);

			if (videosResponse.ok) {
				const videosData = await videosResponse.json();
				const videoIds = videosData.items
					?.map((item: any) => item.contentDetails?.videoId)
					.filter(Boolean)
					.slice(0, 50)
					.join(",");

				if (videoIds) {
					const videoDetailsResponse = await fetch(
					`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKey}`
				);

				if (videoDetailsResponse.ok) {
					const videoDetails = await videoDetailsResponse.json();
					videos = videoDetails.items || [];
				}
			}
		}

		// Parse video duration
		function parseDuration(duration: string): number {
			const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
			if (!match) return 0;
			const hours = parseInt(match[1] || "0", 10);
			const minutes = parseInt(match[2] || "0", 10);
			const seconds = parseInt(match[3] || "0", 10);
			return hours * 3600 + minutes * 60 + seconds;
		}

		// Analyze data
		const sortedVideos = videos
			.map((v) => ({
				title: v.snippet.title,
				views: parseInt(v.statistics.viewCount || "0", 10),
				length: parseDuration(v.contentDetails.duration),
				description: v.snippet.description || "",
				publishedAt: v.snippet.publishedAt,
			}))
			.sort((a, b) => b.views - a.views);

		const topVideos = sortedVideos.slice(0, 10);
		const totalLength = sortedVideos.reduce((sum, v) => sum + v.length, 0);
		const averageLength = sortedVideos.length > 0 ? totalLength / sortedVideos.length : 0;

		// Calculate upload frequency
		if (sortedVideos.length < 2) {
			return NextResponse.json(
				{ error: "Channel needs at least 2 videos to analyze" },
				{ status: 400 }
			);
		}

		const oldestVideo = new Date(sortedVideos[sortedVideos.length - 1].publishedAt);
		const newestVideo = new Date(sortedVideos[0].publishedAt);
		const daysDiff = (newestVideo.getTime() - oldestVideo.getTime()) / (1000 * 60 * 60 * 24);
		const videosPerWeek = (sortedVideos.length / daysDiff) * 7;
		const uploadFrequency = videosPerWeek >= 1 
			? `${videosPerWeek.toFixed(1)} videos per week`
			: `${(videosPerWeek * 7).toFixed(1)} videos per month`;

		// Analyze titles
		const titleLengths = sortedVideos.map((v) => v.title.length);
		const avgTitleLength = titleLengths.reduce((sum, len) => sum + len, 0) / titleLengths.length;

		// Extract common keywords from titles
		const allWords = sortedVideos
			.flatMap((v) => v.title.toLowerCase().split(/\s+/))
			.filter((word) => word.length > 3);
		const wordCounts: Record<string, number> = {};
		allWords.forEach((word) => {
			wordCounts[word] = (wordCounts[word] || 0) + 1;
		});
		const commonKeywords = Object.entries(wordCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([word]) => word);

		// Detect title patterns
		const titlePatterns: string[] = [];
		if (sortedVideos.some((v) => v.title.includes(":"))) titlePatterns.push("Colon separator");
		if (sortedVideos.some((v) => /^\d+/.test(v.title))) titlePatterns.push("Number prefix");
		if (sortedVideos.some((v) => v.title.includes("?"))) titlePatterns.push("Question format");
		if (sortedVideos.some((v) => v.title.includes("How to"))) titlePatterns.push("How-to format");
		if (sortedVideos.some((v) => v.title.includes("vs"))) titlePatterns.push("Comparison format");

		// Analyze content formats
		const shortsCount = sortedVideos.filter((v) => v.length <= 60).length;
		const longFormCount = sortedVideos.length - shortsCount;

		// Infer niche from descriptions and titles
		const allText = [...sortedVideos.map((v) => v.title), channel.snippet.description || ""].join(" ").toLowerCase();
		let niche = "General";
		if (allText.includes("tech") || allText.includes("software")) niche = "Technology";
		else if (allText.includes("gaming") || allText.includes("game")) niche = "Gaming";
		else if (allText.includes("cooking") || allText.includes("recipe")) niche = "Food & Cooking";
		else if (allText.includes("fitness") || allText.includes("workout")) niche = "Fitness";
		else if (allText.includes("education") || allText.includes("learn")) niche = "Education";
		else if (allText.includes("music")) niche = "Music";
		else if (allText.includes("travel")) niche = "Travel";
		else if (allText.includes("beauty") || allText.includes("makeup")) niche = "Beauty";
		else if (allText.includes("business") || allText.includes("entrepreneur")) niche = "Business";

		// Format video length
		function formatLength(seconds: number): string {
			if (seconds < 60) return `${seconds}s`;
			const minutes = Math.floor(seconds / 60);
			const secs = seconds % 60;
			if (minutes < 60) return `${minutes}m ${secs}s`;
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			return `${hours}h ${mins}m`;
		}

		const channelData = {
			channelName: channel.snippet.title,
			channelDescription: channel.snippet.description || "",
			subscriberCount: parseInt(channel.statistics.subscriberCount || "0", 10),
			totalVideos: parseInt(channel.statistics.videoCount || "0", 10),
			uploadFrequency,
			topVideos: topVideos.map((v) => ({
				title: v.title,
				views: v.views,
				length: formatLength(v.length),
			})),
			averageVideoLength: formatLength(averageLength),
			titleLength: Math.round(avgTitleLength),
			commonTitlePatterns: titlePatterns.slice(0, 5),
			commonKeywords: commonKeywords.slice(0, 10),
			thumbnailPatterns: {
				hasFaces: false, // Would need image analysis API
				hasText: false, // Would need image analysis API
				dominantColors: [], // Would need image analysis API
			},
			contentFormats: {
				shorts: shortsCount,
				longForm: longFormCount,
			},
			niche,
		};

		return NextResponse.json({
			success: true,
			data: channelData,
		});
	} catch (error) {
		console.error("[Channel DNA] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch channel data", message: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

