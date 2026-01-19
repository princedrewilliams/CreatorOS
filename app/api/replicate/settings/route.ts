// Replication Settings CRUD API

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requirePro } from "@/lib/paywall";
import {
	getUserReplicationSettings,
	setUserReplicationSettings,
	deleteReplicationSettings,
} from "@/lib/user-data";
import { deriveConstraints } from "@/lib/replicate/derive-constraints";
import { resolveChannelId, fetchChannel, fetchRecentVideos } from "@/lib/youtube/fetcher";
import { analyzePackaging } from "@/lib/learning-lab/packaging-analyzer";
import { analyzePillars } from "@/lib/learning-lab/pillar-analyzer";
import type { ReplicationSettings } from "@/lib/replicate/types";

function generateId(): string {
	return `rep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// GET - List user's replication settings
export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const settings = getUserReplicationSettings(user.whop_user_id);

		return NextResponse.json({ settings });
	} catch (error) {
		console.error("[Replicate Settings GET] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch settings" },
			{ status: 500 }
		);
	}
}

// POST - Create new replication settings (derives constraints from channel)
export async function POST(request: NextRequest) {
	try {
		// Pro feature check - temporarily disabled for testing
		// const { allowed, reason } = await requirePro("replicate-this");
		// if (!allowed) {
		// 	return NextResponse.json(
		// 		{ error: reason, requiresPro: true },
		// 		{ status: 403 }
		// 	);
		// }

		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { channelUrl, targetChannelId } = body;

		if (!channelUrl) {
			return NextResponse.json(
				{ error: "channelUrl is required" },
				{ status: 400 }
			);
		}

		if (!targetChannelId) {
			return NextResponse.json(
				{ error: "targetChannelId is required" },
				{ status: 400 }
			);
		}

		// Resolve and fetch channel data
		const channelId = await resolveChannelId(channelUrl);
		const channel = await fetchChannel(channelId);

		if (!channel.uploadsPlaylistId) {
			return NextResponse.json(
				{ error: "Could not find uploads playlist for this channel" },
				{ status: 400 }
			);
		}

		// Fetch recent videos
		const videos = await fetchRecentVideos(channel.uploadsPlaylistId, {
			maxResults: 50,
			includeDescription: true,
			includeTags: true,
		});

		// Run packaging and pillar analysis in parallel
		const [packaging, pillars] = await Promise.all([
			analyzePackaging(videos, 10),
			analyzePillars(videos),
		]);

		// Derive constraints from analysis
		const constraints = deriveConstraints({
			packaging,
			pillars,
			videos,
		});

		// Create replication settings
		const now = new Date().toISOString();
		const settings: ReplicationSettings = {
			id: generateId(),
			userId: user.whop_user_id,
			targetChannelId,
			referenceChannelId: channelId,
			referenceChannelName: channel.title,
			referenceChannelThumbnail: channel.thumbnail,
			constraints,
			createdAt: now,
			updatedAt: now,
		};

		// Save settings
		setUserReplicationSettings(user.whop_user_id, settings);

		return NextResponse.json({
			success: true,
			settings,
		});
	} catch (error) {
		console.error("[Replicate Settings POST] Error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to create settings" },
			{ status: 500 }
		);
	}
}

// DELETE - Remove replication settings
export async function DELETE(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const settingsId = searchParams.get("id");

		if (!settingsId) {
			return NextResponse.json(
				{ error: "Settings ID is required" },
				{ status: 400 }
			);
		}

		const deleted = deleteReplicationSettings(user.whop_user_id, settingsId);

		if (!deleted) {
			return NextResponse.json(
				{ error: "Settings not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Replicate Settings DELETE] Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete settings" },
			{ status: 500 }
		);
	}
}
