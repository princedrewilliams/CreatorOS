// Learning Lab - Content Pillars API

import { NextResponse } from "next/server";
import {
	resolveChannelId,
	fetchChannel,
	fetchRecentVideos,
} from "@/lib/youtube/fetcher";
import { analyzePillars } from "@/lib/learning-lab/pillar-analyzer";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const channelUrl = body?.channelUrl?.trim();

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

		// Fetch up to 100 videos with descriptions
		const videos = await fetchRecentVideos(channel.uploadsPlaylistId, {
			maxResults: 100,
			includeDescription: true,
		});

		// Analyze pillars
		const pillarsResponse = await analyzePillars(videos);

		return NextResponse.json({
			channel: {
				id: channel.id,
				title: channel.title,
				thumbnail: channel.thumbnail,
			},
			...pillarsResponse,
			videosAnalyzed: videos.length,
		});
	} catch (err) {
		console.error("Pillars analysis error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 }
		);
	}
}
