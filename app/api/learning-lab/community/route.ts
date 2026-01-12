// Learning Lab - Community Intelligence API

import { NextResponse } from "next/server";
import {
	resolveChannelId,
	fetchChannel,
	fetchRecentVideos,
	fetchCommentsForVideos,
} from "@/lib/youtube/fetcher";
import { analyzeCommunity } from "@/lib/learning-lab/community-analyzer";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const channelUrl = body?.channelUrl?.trim();
		const topVideoCount = body?.topVideoCount || 5;
		const commentsPerVideo = body?.commentsPerVideo || 50;

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

		// Fetch recent videos
		const videos = await fetchRecentVideos(channel.uploadsPlaylistId, {
			maxResults: 50,
		});

		// Get top videos by views for comment analysis
		const topVideos = [...videos]
			.sort((a, b) => (b.views || 0) - (a.views || 0))
			.slice(0, topVideoCount);

		const topVideoIds = topVideos.map((v) => v.id);

		// Fetch comments for top videos
		const comments = await fetchCommentsForVideos(topVideoIds, commentsPerVideo);

		// Analyze community
		const communityResponse = await analyzeCommunity(comments, videos);

		return NextResponse.json({
			channel: {
				id: channel.id,
				title: channel.title,
				thumbnail: channel.thumbnail,
			},
			...communityResponse,
			videosAnalyzed: videos.length,
			commentsAnalyzed: comments.length,
			topVideosUsed: topVideos.map((v) => ({
				id: v.id,
				title: v.title,
				views: v.views,
			})),
		});
	} catch (err) {
		console.error("Community analysis error:", err);
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Unknown error" },
			{ status: 500 }
		);
	}
}
