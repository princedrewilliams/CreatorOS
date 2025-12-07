"use client";

import { useState, useEffect, useRef } from "react";
import { Heading, Text, Card, Button } from "@whop/react/components";
import { ChatBubbleIcon, PaperPlaneIcon, Cross2Icon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

interface ChatMessage {
	id: string;
	userId: string;
	username: string;
	message: string;
	timestamp: string;
	profilePicture?: string;
}

interface NicheChatProps {
	niche: string;
	nicheLabel: string;
	isOpen: boolean;
	onClose: () => void;
}

export function NicheChat({ niche, nicheLabel, isOpen, onClose }: NicheChatProps) {
	const { user } = useAppStore();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Load messages when chat opens
	useEffect(() => {
		if (isOpen) {
			loadMessages();
			// Poll for new messages every 3 seconds
			const interval = setInterval(() => {
				loadMessages();
			}, 3000);
			return () => clearInterval(interval);
		} else {
			// Keep messages when chat closes so they don't disappear
			// Only clear if switching niches
		}
	}, [isOpen, niche]);

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const loadMessages = async () => {
		try {
			const response = await fetch(`/api/collab/chat?niche=${niche}`, {
				credentials: "include",
			});
			if (response.ok) {
				const data = await response.json();
				if (data.success && data.messages) {
					// Only update if we have messages, don't clear existing ones
					setMessages(data.messages);
				}
			}
		} catch (err) {
			console.error("Failed to load messages:", err);
		}
	};

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!user) {
			alert("Please login to send messages");
			return;
		}

		if (!newMessage.trim()) {
			return;
		}

		setSending(true);
		try {
			const response = await fetch("/api/collab/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					message: newMessage.trim(),
					niche,
				}),
			});

			if (response.ok) {
				setNewMessage("");
				// Reload messages to get the new one
				loadMessages();
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

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-a11 dark:bg-gray-a12 backdrop-blur-md"
						onClick={onClose}
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							onClick={(e) => e.stopPropagation()}
							className="w-full max-w-2xl h-[80vh] flex flex-col"
						>
							<Card size="3" variant="surface" className="flex flex-col h-full">
								{/* Chat Header */}
								<div className="flex items-center justify-between p-4 border-b border-gray-a4 dark:border-gray-a6">
									<div className="flex items-center gap-2">
										<ChatBubbleIcon className="w-5 h-5 text-purple-11" />
										<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
											{nicheLabel} Chat
										</Heading>
									</div>
									<Button variant="ghost" size="1" onClick={onClose}>
										<Cross2Icon className="w-4 h-4" />
									</Button>
								</div>

								{/* Messages Area */}
								<div className="flex-1 overflow-y-auto p-4 space-y-3">
									{messages.length === 0 ? (
										<div className="text-center py-8">
											<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
												No messages yet. Be the first to start the conversation!
											</Text>
										</div>
									) : (
										messages.map((msg) => {
											const isOwnMessage = user && msg.userId === user.whop_user_id;
											return (
												<div
													key={msg.id}
													className={`flex items-start gap-2 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
												>
													{/* Profile Picture */}
													<div className="w-8 h-8 rounded-full bg-gray-a3 dark:bg-gray-a4 flex items-center justify-center flex-shrink-0">
														{msg.profilePicture ? (
															<img
																src={msg.profilePicture}
																alt={msg.username}
																className="w-full h-full rounded-full object-cover"
															/>
														) : (
															<span className="text-xs font-medium text-gray-11">
																{msg.username.charAt(0).toUpperCase()}
															</span>
														)}
													</div>
													{/* Message Bubble */}
													<div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[75%]`}>
														{/* Username - always show */}
														<Text size="1" weight="medium" className={`text-gray-11 dark:text-gray-11 mb-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
															{msg.username}
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
											placeholder={user ? "Type a message..." : "Type a message (login to send)..."}
											className="flex-1 px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-purple-9"
											disabled={sending}
										/>
										<Button
											type="submit"
											variant="solid"
											color="purple"
											size="2"
											disabled={sending || !newMessage.trim() || !user}
											title={!user ? "Please login to send messages" : ""}
										>
											<PaperPlaneIcon className="w-4 h-4" />
										</Button>
									</div>
									{!user && (
										<Text size="1" color="gray" className="mt-2 text-center text-gray-11 dark:text-gray-11">
											Login required to send messages
										</Text>
									)}
								</form>
							</Card>
						</motion.div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

