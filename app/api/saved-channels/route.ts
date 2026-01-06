import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
	getSavedChannels,
	saveChannel,
	removeChannel,
	updateChannelNotes,
} from "@/lib/saved-channels";

// GET - List saved channels for current user
export async function GET() {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required", channels: [] },
				{ status: 401 }
			);
		}

		const channels = getSavedChannels(user.whop_user_id);
		return NextResponse.json({ channels });
	} catch (error) {
		console.error("[SavedChannels] GET error:", error);
		return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
	}
}

// POST - Save a new channel
export async function POST(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await req.json();
		const { channelId, channelName, thumbnail, notes } = body;

		if (!channelId || !channelName) {
			return NextResponse.json(
				{ error: "channelId and channelName are required" },
				{ status: 400 }
			);
		}

		const channel = saveChannel(user.whop_user_id, {
			channelId,
			channelName,
			thumbnail: thumbnail || "",
			notes: notes || "",
		});

		return NextResponse.json({ channel });
	} catch (error) {
		console.error("[SavedChannels] POST error:", error);
		return NextResponse.json({ error: "Failed to save channel" }, { status: 500 });
	}
}

// DELETE - Remove a saved channel
export async function DELETE(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(req.url);
		const channelId = searchParams.get("channelId");

		if (!channelId) {
			return NextResponse.json(
				{ error: "channelId is required" },
				{ status: 400 }
			);
		}

		const removed = removeChannel(user.whop_user_id, channelId);

		if (!removed) {
			return NextResponse.json(
				{ error: "Channel not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[SavedChannels] DELETE error:", error);
		return NextResponse.json({ error: "Failed to remove channel" }, { status: 500 });
	}
}

// PATCH - Update channel notes
export async function PATCH(req: Request) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await req.json();
		const { channelId, notes } = body;

		if (!channelId) {
			return NextResponse.json(
				{ error: "channelId is required" },
				{ status: 400 }
			);
		}

		const channel = updateChannelNotes(user.whop_user_id, channelId, notes || "");

		if (!channel) {
			return NextResponse.json(
				{ error: "Channel not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ channel });
	} catch (error) {
		console.error("[SavedChannels] PATCH error:", error);
		return NextResponse.json({ error: "Failed to update notes" }, { status: 500 });
	}
}
