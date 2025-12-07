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
			const interval = setInterval(loadMessages, 3000);
			return () => clearInterval(interval);
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
													className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
												>
													<div
														className={`max-w-[80%] rounded-lg p-3 ${
															isOwnMessage
																? "bg-purple-a3 dark:bg-purple-a4"
																: "bg-gray-a2 dark:bg-gray-a3"
														}`}
													>
														{!isOwnMessage && (
															<Text size="1" weight="medium" className="text-gray-11 dark:text-gray-11 mb-1">
																{msg.username}
															</Text>
														)}
														<Text size="2" className="text-gray-12 dark:text-gray-12">
															{msg.message}
														</Text>
														<Text size="1" color="gray" className="text-gray-10 dark:text-gray-10 mt-1">
															{new Date(msg.timestamp).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})}
														</Text>
													</div>
												</div>
											);
										})
									)}
									<div ref={messagesEndRef} />
								</div>

								{/* Message Input */}
								{user ? (
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
								) : (
									<div className="p-4 border-t border-gray-a4 dark:border-gray-a6">
										<Text size="2" color="gray" className="text-center text-gray-11 dark:text-gray-11">
											Please login to send messages
										</Text>
									</div>
								)}
							</Card>
						</motion.div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

