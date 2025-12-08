import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userProfilePictures } from "@/app/api/collab/chat/route";
import { friends } from "../friends/route";

// In-memory store for messages (replace with database in production)
// Messages: Map<conversationId, Array<message>>
// conversationId is a sorted combination of userIds: "userId1_userId2" (sorted alphabetically)
const messages = new Map<string, Array<{
	id: string;
	senderId: string;
	receiverId: string;
	message: string;
	timestamp: string;
	read: boolean;
}>>();

function getConversationId(userId1: string, userId2: string): string {
	return [userId1, userId2].sort().join("_");
}

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		
		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const searchParams = request.nextUrl.searchParams;
		const otherUserId = searchParams.get("userId");

		if (otherUserId) {
			// Get messages for a specific conversation
			// Check if users are friends
			const userFriends = friends.get(user.whop_user_id) || new Set();
			if (!userFriends.has(otherUserId) && otherUserId !== user.whop_user_id) {
				return NextResponse.json(
					{ error: "You must be friends to view messages" },
					{ status: 403 }
				);
			}

			const conversationId = getConversationId(user.whop_user_id, otherUserId);
			const conversationMessages = messages.get(conversationId) || [];

			// Mark messages as read
			conversationMessages.forEach((msg) => {
				if (msg.receiverId === user.whop_user_id && !msg.read) {
					msg.read = true;
				}
			});

			// Get user profiles
			const { userProfiles } = await import("@/app/api/user/profile/route");
			const { creatorProfiles } = await import("@/app/api/collab/creators/route");

			const messagesWithProfiles = conversationMessages.map((msg) => {
				const senderProfile = creatorProfiles.get(msg.senderId) || userProfiles.get(msg.senderId);
				const profilePicture = userProfilePictures.get(msg.senderId) || 
					senderProfile?.profilePicture || "";

				return {
					...msg,
					senderUsername: senderProfile?.username || "Unknown User",
					senderProfilePicture: profilePicture,
				};
			});

			return NextResponse.json({
				success: true,
				messages: messagesWithProfiles.sort((a, b) => 
					new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
				),
			});
		} else {
			// Get all conversations for the user
			const userConversations = new Map<string, {
				otherUserId: string;
				otherUsername: string;
				otherProfilePicture: string;
				lastMessage: string;
				lastMessageTime: string;
				unreadCount: number;
			}>();

			// Get user profiles
			const { userProfiles } = await import("@/app/api/user/profile/route");
			const { creatorProfiles } = await import("@/app/api/collab/creators/route");

			messages.forEach((conversationMessages, conversationId) => {
				const [userId1, userId2] = conversationId.split("_");
				const otherUserId = userId1 === user.whop_user_id ? userId2 : userId1;

				if (userId1 === user.whop_user_id || userId2 === user.whop_user_id) {
					// Get last message
					const lastMessage = conversationMessages[conversationMessages.length - 1];
					if (lastMessage) {
						const otherProfile = creatorProfiles.get(otherUserId) || userProfiles.get(otherUserId);
						const profilePicture = userProfilePictures.get(otherUserId) || 
							otherProfile?.profilePicture || "";

						// Count unread messages
						const unreadCount = conversationMessages.filter(
							(msg) => msg.receiverId === user.whop_user_id && !msg.read
						).length;

						userConversations.set(conversationId, {
							otherUserId,
							otherUsername: otherProfile?.username || "Unknown User",
							otherProfilePicture: profilePicture,
							lastMessage: lastMessage.message,
							lastMessageTime: lastMessage.timestamp,
							unreadCount,
						});
					}
				}
			});

			// Convert to array and sort by last message time
			const conversationsArray = Array.from(userConversations.values())
				.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

			return NextResponse.json({
				success: true,
				conversations: conversationsArray,
			});
		}
	} catch (error) {
		console.error("[Get Messages] Error:", error);
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
		const { receiverId, message } = body;

		if (!receiverId || !message) {
			return NextResponse.json(
				{ error: "Receiver ID and message are required" },
				{ status: 400 }
			);
		}

		if (receiverId === user.whop_user_id) {
			return NextResponse.json(
				{ error: "Cannot send message to yourself" },
				{ status: 400 }
			);
		}

		// Check if users are friends
		const userFriends = friends.get(user.whop_user_id) || new Set();
		if (!userFriends.has(receiverId)) {
			return NextResponse.json(
				{ error: "You must be friends to send messages" },
				{ status: 403 }
			);
		}

		const conversationId = getConversationId(user.whop_user_id, receiverId);
		const conversationMessages = messages.get(conversationId) || [];

		const newMessage = {
			id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
			senderId: user.whop_user_id,
			receiverId,
			message: message.trim(),
			timestamp: new Date().toISOString(),
			read: false,
		};

		conversationMessages.push(newMessage);
		
		// Keep last 500 messages per conversation
		if (conversationMessages.length > 500) {
			conversationMessages.shift();
		}

		messages.set(conversationId, conversationMessages);

		return NextResponse.json({
			success: true,
			message: newMessage,
		});
	} catch (error) {
		console.error("[Send Message] Error:", error);
		return NextResponse.json(
			{ error: "Failed to send message" },
			{ status: 500 }
		);
	}
}

