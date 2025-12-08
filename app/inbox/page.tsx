"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import {
	ChatBubbleIcon,
	PaperPlaneIcon,
	PlusIcon,
	PersonIcon,
	CheckIcon,
	Cross2Icon,
	EnvelopeClosedIcon,
	ArrowLeftIcon,
} from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/BackButton";

interface Message {
	id: string;
	senderId: string;
	receiverId: string;
	message: string;
	timestamp: string;
	read: boolean;
	senderUsername?: string;
	senderProfilePicture?: string;
}

interface Conversation {
	otherUserId: string;
	otherUsername: string;
	otherProfilePicture: string;
	lastMessage: string;
	lastMessageTime: string;
	unreadCount: number;
}

interface FriendRequest {
	userId: string;
	username: string;
	profilePicture: string;
}

function InboxContent() {
	const { user } = useAppStore();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState<"conversations" | "requests">("conversations");
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
	const [selectedConversation, setSelectedConversation] = useState<string | null>(
		searchParams.get("userId") || null
	);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [loading, setLoading] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Load conversations and friend requests
	useEffect(() => {
		if (user) {
			loadConversations();
			loadFriendRequests();
		}
	}, [user]);

	// Load messages when conversation is selected
	useEffect(() => {
		if (selectedConversation && user) {
			loadMessages(selectedConversation);
			// Poll for new messages every 2 seconds
			const interval = setInterval(() => {
				loadMessages(selectedConversation);
				loadConversations(); // Refresh conversations to update unread counts
			}, 2000);
			return () => clearInterval(interval);
		}
	}, [selectedConversation, user]);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const loadConversations = async () => {
		try {
			const response = await fetch("/api/inbox/messages", {
				credentials: "include",
			});
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					setConversations(data.conversations || []);
				}
			}
		} catch (err) {
			console.error("Failed to load conversations:", err);
		} finally {
			setLoading(false);
		}
	};

	const loadFriendRequests = async () => {
		try {
			const response = await fetch("/api/inbox/friends?type=requests", {
				credentials: "include",
			});
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					setFriendRequests(data.requests || []);
					// Switch to requests tab if there are pending requests
					if (data.requests && data.requests.length > 0 && activeTab === "conversations") {
						setActiveTab("requests");
					}
				}
			}
		} catch (err) {
			console.error("Failed to load friend requests:", err);
		}
	};

	const loadMessages = async (otherUserId: string) => {
		try {
			const response = await fetch(`/api/inbox/messages?userId=${otherUserId}`, {
				credentials: "include",
			});
			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					setMessages(data.messages || []);
				}
			}
		} catch (err) {
			console.error("Failed to load messages:", err);
		}
	};

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!user || !selectedConversation || !newMessage.trim()) {
			return;
		}

		setSending(true);
		try {
			const response = await fetch("/api/inbox/messages", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					receiverId: selectedConversation,
					message: newMessage.trim(),
				}),
			});

			if (response.ok) {
				setNewMessage("");
				loadMessages(selectedConversation);
				loadConversations();
			} else {
				const error = await response.json();
				alert(error.error || "Failed to send message");
			}
		} catch (err) {
			console.error("Failed to send message:", err);
			alert("Failed to send message");
		} finally {
			setSending(false);
		}
	};

	const handleFriendRequest = async (action: "accept" | "decline", userId: string) => {
		try {
			const response = await fetch("/api/inbox/friends", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					action,
					userId,
				}),
			});

			if (response.ok) {
				loadFriendRequests();
				if (action === "accept") {
					loadConversations();
				}
			} else {
				const error = await response.json();
				alert(error.error || `Failed to ${action} friend request`);
			}
		} catch (err) {
			console.error(`Failed to ${action} friend request:`, err);
			alert(`Failed to ${action} friend request`);
		}
	};

	if (!user) {
		return (
			<div className="space-y-6 sm:space-y-8">
				<div className="flex items-center gap-3 mb-4">
					<BackButton href="/dashboard" />
				</div>
				<Card size="3" variant="surface" className="p-6">
					<Text size="3" color="gray" className="text-center text-gray-11 dark:text-gray-11">
						Please login to access your inbox
					</Text>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						Inbox
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Messages and friend requests
					</Text>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
				{/* Conversations/Friends Sidebar */}
				<Card size="3" variant="surface" className="flex flex-col overflow-hidden">
					{/* Tabs */}
					<div className="flex border-b border-gray-a4 dark:border-gray-a6">
						<Button
							variant={activeTab === "conversations" ? "soft" : "ghost"}
							color={activeTab === "conversations" ? "purple" : "gray"}
							size="2"
							className="flex-1 rounded-none border-b-0"
							onClick={() => setActiveTab("conversations")}
						>
							<ChatBubbleIcon className="mr-2" />
							Conversations
							{conversations.some((c) => c.unreadCount > 0) && (
								<Badge color="red" size="1" className="ml-2">
									{conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
								</Badge>
							)}
						</Button>
						<Button
							variant={activeTab === "requests" ? "soft" : "ghost"}
							color={activeTab === "requests" ? "purple" : "gray"}
							size="2"
							className="flex-1 rounded-none border-b-0"
							onClick={() => setActiveTab("requests")}
						>
							<PlusIcon className="mr-2" />
							Requests
							{friendRequests.length > 0 && (
								<Badge color="red" size="1" className="ml-2">
									{friendRequests.length}
								</Badge>
							)}
						</Button>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-2">
						{activeTab === "conversations" ? (
							loading ? (
								<div className="text-center py-8">
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
										Loading conversations...
									</Text>
								</div>
							) : conversations.length === 0 ? (
								<div className="text-center py-8">
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
										No conversations yet. Start by sending a friend request!
									</Text>
								</div>
							) : (
								<div className="space-y-2">
									{conversations.map((conv) => (
										<button
											key={conv.otherUserId}
											onClick={() => setSelectedConversation(conv.otherUserId)}
											className={`w-full text-left p-3 rounded-lg transition-colors ${
												selectedConversation === conv.otherUserId
													? "bg-purple-a3 dark:bg-purple-a4"
													: "hover:bg-gray-a2 dark:hover:bg-gray-a3"
											}`}
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-gray-a3 dark:bg-gray-a4 flex items-center justify-center flex-shrink-0 overflow-hidden">
													{conv.otherProfilePicture ? (
														<img
															src={conv.otherProfilePicture}
															alt={conv.otherUsername}
															className="w-full h-full object-cover"
														/>
													) : (
														<PersonIcon className="w-6 h-6 text-gray-11" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center justify-between mb-1">
														<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12 truncate">
															{conv.otherUsername}
														</Text>
														{conv.unreadCount > 0 && (
															<Badge color="red" size="1">
																{conv.unreadCount}
															</Badge>
														)}
													</div>
													<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 truncate">
														{conv.lastMessage}
													</Text>
													<Text size="1" color="gray" className="text-gray-10 dark:text-gray-10">
														{new Date(conv.lastMessageTime).toLocaleDateString()}
													</Text>
												</div>
											</div>
										</button>
									))}
								</div>
							)
						) : (
							friendRequests.length === 0 ? (
								<div className="text-center py-8">
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
										No pending friend requests
									</Text>
								</div>
							) : (
								<div className="space-y-3">
									{friendRequests.map((request) => (
										<Card key={request.userId} size="2" variant="surface" className="p-3">
											<div className="flex items-center gap-3 mb-3">
												<div className="w-10 h-10 rounded-full bg-gray-a3 dark:bg-gray-a4 flex items-center justify-center flex-shrink-0 overflow-hidden">
													{request.profilePicture ? (
														<img
															src={request.profilePicture}
															alt={request.username}
															className="w-full h-full object-cover"
														/>
													) : (
														<PersonIcon className="w-6 h-6 text-gray-11" />
													)}
												</div>
												<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12">
													{request.username}
												</Text>
											</div>
											<div className="flex gap-2">
												<Button
													variant="solid"
													color="green"
													size="2"
													className="flex-1"
													onClick={() => handleFriendRequest("accept", request.userId)}
												>
													<CheckIcon className="mr-2" />
													Accept
												</Button>
												<Button
													variant="ghost"
													color="gray"
													size="2"
													className="flex-1"
													onClick={() => handleFriendRequest("decline", request.userId)}
												>
													<Cross2Icon className="mr-2" />
													Decline
												</Button>
											</div>
										</Card>
									))}
								</div>
							)
						)}
					</div>
				</Card>

				{/* Messages Area */}
				<Card size="3" variant="surface" className="lg:col-span-2 flex flex-col overflow-hidden">
					{selectedConversation ? (
						<>
							{/* Chat Header */}
							<div className="flex items-center justify-between p-4 border-b border-gray-a4 dark:border-gray-a6">
								<button
									onClick={() => setSelectedConversation(null)}
									className="lg:hidden mr-2"
								>
									<ArrowLeftIcon className="w-5 h-5" />
								</button>
								<div className="flex items-center gap-3 flex-1">
									<div className="w-10 h-10 rounded-full bg-gray-a3 dark:bg-gray-a4 flex items-center justify-center flex-shrink-0 overflow-hidden">
										{(() => {
											const conv = conversations.find((c) => c.otherUserId === selectedConversation);
											return conv?.otherProfilePicture ? (
												<img
													src={conv.otherProfilePicture}
													alt={conv.otherUsername}
													className="w-full h-full object-cover"
												/>
											) : (
												<PersonIcon className="w-6 h-6 text-gray-11" />
											);
										})()}
									</div>
									<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
										{conversations.find((c) => c.otherUserId === selectedConversation)?.otherUsername || "Unknown User"}
									</Heading>
								</div>
							</div>

							{/* Messages */}
							<div className="flex-1 overflow-y-auto p-4 space-y-3">
								{messages.length === 0 ? (
									<div className="text-center py-8">
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
											No messages yet. Start the conversation!
										</Text>
									</div>
								) : (
									messages.map((msg) => {
										const isOwnMessage = msg.senderId === user.whop_user_id;
										return (
											<div
												key={msg.id}
												className={`flex items-start gap-2 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
											>
												{/* Profile Picture */}
												<div className="w-8 h-8 rounded-full bg-gray-a3 dark:bg-gray-a4 flex items-center justify-center flex-shrink-0 overflow-hidden">
													{msg.senderProfilePicture ? (
														<img
															src={msg.senderProfilePicture}
															alt={msg.senderUsername}
															className="w-full h-full object-cover"
														/>
													) : (
														<span className="text-xs font-medium text-gray-11">
															{msg.senderUsername?.charAt(0).toUpperCase() || "?"}
														</span>
													)}
												</div>
												{/* Message Bubble */}
												<div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[75%]`}>
													<Text size="1" weight="medium" className={`text-gray-11 dark:text-gray-11 mb-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
														{msg.senderUsername}
													</Text>
													<div
														className={`rounded-lg p-3 ${
															isOwnMessage
																? "bg-purple-9 text-white rounded-tr-none"
																: "bg-gray-a2 dark:bg-gray-a3 text-gray-12 dark:text-gray-12 rounded-tl-none"
														}`}
													>
														<Text size="2" className={isOwnMessage ? "text-white" : "text-gray-12 dark:text-gray-12"}>
															{msg.message}
														</Text>
														<Text size="1" className={`mt-1 ${isOwnMessage ? "text-purple-11" : "text-gray-10 dark:text-gray-10"}`}>
															{new Date(msg.timestamp).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})}
														</Text>
													</div>
												</div>
											</div>
										);
									})
								)}
								<div ref={messagesEndRef} />
							</div>

							{/* Message Input */}
							<form onSubmit={handleSendMessage} className="p-4 border-t border-gray-a4 dark:border-gray-a6">
								<div className="flex gap-2">
									<input
										type="text"
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										placeholder="Type a message..."
										className="flex-1 px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-purple-9"
										disabled={sending}
									/>
									<Button
										type="submit"
										variant="solid"
										color="purple"
										size="2"
										disabled={sending || !newMessage.trim()}
									>
										<PaperPlaneIcon className="w-4 h-4" />
									</Button>
								</div>
							</form>
						</>
					) : (
						<div className="flex items-center justify-center h-full">
							<div className="text-center">
								<EnvelopeClosedIcon className="w-16 h-16 text-gray-9 mx-auto mb-4" />
								<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
									Select a conversation to start messaging
								</Text>
							</div>
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}

export default function InboxPage() {
	return (
		<Suspense fallback={
			<div className="space-y-6 sm:space-y-8">
				<div className="flex items-center gap-3 mb-4">
					<BackButton href="/dashboard" />
				</div>
				<Card size="3" variant="surface" className="p-6">
					<Text size="3" color="gray" className="text-center text-gray-11 dark:text-gray-11">
						Loading inbox...
					</Text>
				</Card>
			</div>
		}>
			<InboxContent />
		</Suspense>
	);
}

