// Learning Lab - Packaging & SEO API

import { NextResponse } from "next/server";
import {
	resolveChannelId,
	fetchChannel,
	fetchRecentVideos,
} from "@/lib/youtube/fetcher";
import { analyzePackaging } from "@/lib/learning-lab/packaging-analyzer";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const channelUrl = body?.channelUrl?.trim();
		const topN = body?.topN || 10;

		if (!channelUrl) {
			return NextResponse.json(
				{ error: "channelUrl is required" },
				{ status: 400 }
			);
		}

		// Resolve channel and fetch videos
		const channelId = await resolveChannelId(channelUrl);
		const channel = await fetchChannel(channelId);

		if (!channel.uploadsPlaylistId) {
			throw new Error("Could not find uploads playlist for this channel.");
		}

		// Fetch videos with descriptions and tags
		const videos = await fetchRecentVideos(channel.uploadsPlaylistId, {
			maxResults: 100,
			includeDescription: true,
			includeTags: true,
		});

		// Analyze packaging
		const packagingResponse = await analyzePackaging(videos, topN);

		return NextResponse.json({
			channel: {
				id: channel.id,
				title: channel.title,
				thumbnail: channel.thumbnail,
			},
			...packagingResponse,
			videosAnalyzed: videos.length,
		});
	} catch (err) {
		console.error("Packaging analysis error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 }
		);
	}
}
