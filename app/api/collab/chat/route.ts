import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// In-memory store for chat messages (replace with database in production)
const nicheChats = new Map<string, Array<{
	id: string;
	userId: string;
	username: string;
	message: string;
	niche: string;
	timestamp: string;
	profilePicture?: string;
}>>();

// Store user profile pictures (in production, fetch from user profile API)
// This is shared with the profile picture API
export const userProfilePictures = new Map<string, string>();

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const niche = searchParams.get("niche");

		if (!niche) {
			return NextResponse.json(
				{ error: "Niche parameter is required" },
				{ status: 400 }
			);
		}

		// Get messages for this niche
		const messages = nicheChats.get(niche) || [];

		// Add profile pictures to messages
		const messagesWithPictures = messages.map((msg) => ({
			...msg,
			profilePicture: userProfilePictures.get(msg.userId),
		}));

		return NextResponse.json({
			success: true,
			messages: messagesWithPictures.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
		});
	} catch (error) {
		console.error("[Get Chat Messages] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get messages" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { message, niche } = body;

		if (!message || !niche) {
			return NextResponse.json(
				{ error: "Message and niche are required" },
				{ status: 400 }
			);
		}

		// Get existing messages for this niche
		const messages = nicheChats.get(niche) || [];

		// Get user's profile picture if available
		const profilePicture = userProfilePictures.get(user.whop_user_id);

		// Create new message
		const newMessage = {
			id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
			userId: user.whop_user_id,
			username: user.whop_username,
			message: message.trim(),
			niche,
			timestamp: new Date().toISOString(),
			profilePicture,
		};

		// Add to messages (keep last 100 messages per niche)
		messages.push(newMessage);
		if (messages.length > 100) {
			messages.shift();
		}

		nicheChats.set(niche, messages);

		return NextResponse.json({
			success: true,
			message: newMessage,
		});
	} catch (error) {
		console.error("[Send Chat Message] Error:", error);
		return NextResponse.json(
			{ error: "Failed to send message" },
			{ status: 500 }
		);
	}
}

