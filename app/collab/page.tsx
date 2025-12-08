"use client";

import { useState, useEffect } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { ChatBubbleIcon, PersonIcon, VideoIcon, EnvelopeClosedIcon, PlusIcon, Cross2Icon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { NicheChat } from "@/components/NicheChat";
import { BackButton } from "@/components/BackButton";

const NICHE_CATEGORIES = [
	{ id: "fitness", label: "Fitness", icon: "💪", color: "red" as const },
	{ id: "cooking", label: "Cooking", icon: "👨‍🍳", color: "orange" as const },
	{ id: "streamer", label: "Streamer", icon: "🎮", color: "purple" as const },
	{ id: "gamer", label: "Gamer", icon: "🎯", color: "blue" as const },
	{ id: "beauty", label: "Beauty", icon: "💄", color: "pink" as const },
	{ id: "tech", label: "Tech", icon: "💻", color: "cyan" as const },
	{ id: "travel", label: "Travel", icon: "✈️", color: "green" as const },
	{ id: "lifestyle", label: "Lifestyle", icon: "🌟", color: "amber" as const },
];

// Validation functions for social media links
function isValidYouTubeUrl(url: string): boolean {
	if (!url) return true; // Empty is valid
	const urlLower = url.toLowerCase();
	return urlLower.includes("youtube.com") || urlLower.includes("youtu.be");
}

function isValidInstagramUrl(url: string): boolean {
	if (!url) return true; // Empty is valid
	const urlLower = url.toLowerCase();
	return urlLower.includes("instagram.com") || urlLower.includes("instagr.am");
}

function isValidTikTokUrl(url: string): boolean {
	if (!url) return true; // Empty is valid
	const urlLower = url.toLowerCase();
	return urlLower.includes("tiktok.com");
}

interface Creator {
	id: string;
	username: string;
	niche: string;
	followers: number;
	highestViews: number;
	platforms: string[];
	profilePicture?: string;
	socialLinks: {
		youtube?: string;
		instagram?: string;
		tiktok?: string;
	};
}

export default function CollabPage() {
	const { user, socialConnections, setUser } = useAppStore();
	const router = useRouter();
	const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
	const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
	const [creators, setCreators] = useState<Creator[]>([]);
	const [loading, setLoading] = useState(true);
	const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [chatNiche, setChatNiche] = useState<string | null>(null);
	const [friendStatus, setFriendStatus] = useState<"friends" | "pending_outgoing" | "pending_incoming" | "not_friends" | "loading" | "self">("loading");
	const [socialLinkErrors, setSocialLinkErrors] = useState({
		youtube: "",
		instagram: "",
		tiktok: "",
	});
	const [userNiche, setUserNiche] = useState<string | null>(null);
	const [joinForm, setJoinForm] = useState({
		username: user?.whop_username || "",
		niche: "",
		socialLinks: {
			youtube: "",
			instagram: "",
			tiktok: "",
		},
	});

	// Sync user data on mount to ensure it's loaded
	useEffect(() => {
		const syncUser = async () => {
			try {
				const response = await fetch("/api/auth/me", {
					credentials: "include",
				});
				const data = await response.json();
				if (data.success && data.user) {
					setUser(data.user);
				} else {
					setUser(null);
				}
			} catch (err) {
				console.error("Failed to sync user:", err);
				// Don't clear user on error, keep existing state
			}
		};
		syncUser();
	}, [setUser]);

	// Load creators from API and user's niche
	useEffect(() => {
		const loadCreators = async () => {
			setLoading(true);
			try {
				const nicheParam = selectedNiche ? `?niche=${selectedNiche}` : "";
				const response = await fetch(`/api/collab/creators${nicheParam}`, {
					credentials: "include",
				});
				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						setCreators(data.creators || []);
						// Check if user has a niche
						if (user && data.currentUserProfile) {
							setUserNiche(data.currentUserProfile.niche);
						} else if (user) {
							// Also check creators list for user's profile
							const userProfile = data.creators?.find((c: Creator) => c.id === user.whop_user_id);
							setUserNiche(userProfile?.niche || null);
						} else {
							setUserNiche(null);
						}
					}
				}
			} catch (err) {
				console.error("Failed to load creators:", err);
			} finally {
				setLoading(false);
			}
		};

		loadCreators();
	}, [selectedNiche, user]);

	// Update form when user changes
	useEffect(() => {
		if (user) {
			setJoinForm((prev) => ({
				...prev,
				username: user.whop_username || prev.username,
			}));
		}
	}, [user]);

	// Load friend status when creator is selected
	useEffect(() => {
		if (selectedCreator && user && selectedCreator.id !== user.whop_user_id) {
			setFriendStatus("loading");
			fetch(`/api/inbox/friend-status?userId=${selectedCreator.id}`, {
				credentials: "include",
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.success) {
						setFriendStatus(data.status);
					}
				})
				.catch(() => setFriendStatus("not_friends"));
		} else if (selectedCreator && user && selectedCreator.id === user.whop_user_id) {
			setFriendStatus("self");
		}
	}, [selectedCreator, user]);

	const handleJoinNiche = async () => {
		if (!user) {
			router.push("/login?redirect=/collab");
			return;
		}

		if (!joinForm.username || !joinForm.niche) {
			alert("Please enter a username and select a niche");
			return;
		}

		// Check if at least one social media link is provided
		const hasSocialLink = joinForm.socialLinks.youtube || 
			joinForm.socialLinks.instagram || 
			joinForm.socialLinks.tiktok;
		
		if (!hasSocialLink) {
			alert("Please provide at least one social media link to join a niche");
			return;
		}

		// Validate social links before submitting
		if (joinForm.socialLinks.youtube && !isValidYouTubeUrl(joinForm.socialLinks.youtube)) {
			alert("Please enter a valid YouTube URL");
			return;
		}
		if (joinForm.socialLinks.instagram && !isValidInstagramUrl(joinForm.socialLinks.instagram)) {
			alert("Please enter a valid Instagram URL");
			return;
		}
		if (joinForm.socialLinks.tiktok && !isValidTikTokUrl(joinForm.socialLinks.tiktok)) {
			alert("Please enter a valid TikTok URL");
			return;
		}

		try {
			// Get stats from social connections
			const connectedPlatforms = socialConnections
				.filter((conn) => conn.connected)
				.map((conn) => conn.platform);

			// Mock stats - in production, fetch from analytics
			const followers = 10000; // Would come from analytics
			const highestViews = 250000; // Would come from analytics

			const response = await fetch("/api/collab/creators", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					username: joinForm.username,
					niche: joinForm.niche,
					socialLinks: joinForm.socialLinks,
					followers,
					highestViews,
					platforms: connectedPlatforms,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.success) {
					alert(`Successfully joined ${NICHE_CATEGORIES.find((n) => n.id === joinForm.niche)?.label} niche!`);
					setIsJoinModalOpen(false);
					setJoinForm({
						username: user.whop_username || "",
						niche: "",
						socialLinks: { youtube: "", instagram: "", tiktok: "" },
					});
					// Reload creators
					const reloadResponse = await fetch(`/api/collab/creators${selectedNiche ? `?niche=${selectedNiche}` : ""}`, {
						credentials: "include",
					});
					if (reloadResponse.ok) {
						const reloadData = await reloadResponse.json();
						if (reloadData.success) {
							setCreators(reloadData.creators || []);
							if (reloadData.currentUserProfile) {
								setUserNiche(reloadData.currentUserProfile.niche);
							}
						}
					}
				}
			} else {
				const error = await response.json();
				alert(error.error || "Failed to join niche");
			}
		} catch (err) {
			console.error("Failed to join niche:", err);
			alert("Failed to join niche");
		}
	};

	const handleLeaveNiche = async () => {
		if (!user) return;

		if (!confirm("Are you sure you want to leave this niche? You will no longer be able to chat in it.")) {
			return;
		}

		try {
			const response = await fetch("/api/collab/creators", {
				method: "DELETE",
				credentials: "include",
			});

			if (response.ok) {
				alert("Successfully left niche");
				setUserNiche(null);
				// Reload creators
				const reloadResponse = await fetch(`/api/collab/creators${selectedNiche ? `?niche=${selectedNiche}` : ""}`, {
					credentials: "include",
				});
				if (reloadResponse.ok) {
					const reloadData = await reloadResponse.json();
					if (reloadData.success) {
						setCreators(reloadData.creators || []);
					}
				}
			} else {
				const error = await response.json();
				alert(error.error || "Failed to leave niche");
			}
		} catch (err) {
			console.error("Failed to leave niche:", err);
			alert("Failed to leave niche");
		}
	};

	return (
		<div className="space-y-6 sm:space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="min-w-0 flex-1">
					<Heading size="7" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-8">
						Creator Collab
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4">
						Connect and collaborate with creators in your niche
					</Text>
				</div>
				{user ? (
					<div className="flex gap-2">
						{userNiche ? (
							<Button
								variant="solid"
								color="red"
								size="3"
								onClick={handleLeaveNiche}
							>
								Leave Niche
							</Button>
						) : (
							<Button
								variant="solid"
								color="purple"
								size="3"
								onClick={() => setIsJoinModalOpen(true)}
							>
								<PlusIcon className="mr-2" />
								Join Niche
							</Button>
						)}
					</div>
				) : (
					<Button
						variant="solid"
						color="blue"
						size="3"
						onClick={() => router.push("/login?redirect=/collab")}
					>
						Login to Join
					</Button>
				)}
			</div>

			{/* Niche Categories */}
			<Card size="3" variant="surface" className="p-6">
				<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					Browse by Niche
				</Heading>
				<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
					{NICHE_CATEGORIES.map((niche) => (
						<div key={niche.id} className="flex flex-col items-center gap-2">
							<Button
								variant={selectedNiche === niche.id ? "soft" : "ghost"}
								color={selectedNiche === niche.id ? niche.color : "gray"}
								size="3"
								onClick={() => setSelectedNiche(selectedNiche === niche.id ? null : niche.id)}
								className="flex flex-col items-center gap-2 h-auto py-4 w-full"
							>
								<Text size="5">{niche.icon}</Text>
								<Text size="2" weight="medium">
									{niche.label}
								</Text>
							</Button>
							<Button
								variant="ghost"
								color="purple"
								size="1"
							onClick={() => {
								if (!user) {
									router.push("/login?redirect=/collab");
									return;
								}
								// Check if user has joined this niche
								if (userNiche !== niche.id) {
									alert("You must join this niche to chat in it");
									return;
								}
								setChatNiche(niche.id);
								setIsChatOpen(true);
							}}
							disabled={user ? userNiche !== niche.id : false}
								className="text-xs"
							>
								<ChatBubbleIcon className="w-3 h-3 mr-1" />
								Chat
							</Button>
						</div>
					))}
				</div>
			</Card>

			{/* Creators List */}
			{loading ? (
				<Card size="3" variant="surface" className="p-6">
					<Text size="3" color="gray" className="text-center text-gray-11 dark:text-gray-11">
						Loading creators...
					</Text>
				</Card>
			) : creators.length === 0 ? (
				<Card size="3" variant="surface" className="p-6">
					<Text size="3" color="gray" className="text-center text-gray-11 dark:text-gray-11">
						No creators found in this niche yet. Be the first to join!
					</Text>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{creators.map((creator) => {
					const nicheInfo = NICHE_CATEGORIES.find((n) => n.id === creator.niche);
					return (
						<motion.div
							key={creator.id}
							whileHover={{ scale: 1.02 }}
							transition={{ duration: 0.2 }}
						>
							<Card size="3" variant="surface" className="p-6">
								<div className="flex items-start gap-4 mb-4">
									<div className="w-16 h-16 rounded-full bg-gray-a3 dark:bg-gray-a4 flex items-center justify-center flex-shrink-0">
										{creator.profilePicture ? (
											<img
												src={creator.profilePicture}
												alt={creator.username}
												className="w-full h-full rounded-full object-cover"
											/>
										) : (
											<PersonIcon className="w-8 h-8 text-gray-11" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12 mb-1">
											{creator.username}
										</Heading>
										{nicheInfo && (
											<Badge color={nicheInfo.color} size="1" variant="soft" className="mb-2">
												{nicheInfo.icon} {nicheInfo.label}
											</Badge>
										)}
									</div>
								</div>

								<div className="space-y-3 mb-4">
									<div>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
											Followers
										</Text>
										<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
											{new Intl.NumberFormat("en", { notation: "compact" }).format(creator.followers)}
										</Text>
									</div>
									<div>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
											Highest Viewed Video
										</Text>
										<Text size="3" weight="bold" className="text-gray-12 dark:text-gray-12">
											{new Intl.NumberFormat("en", { notation: "compact" }).format(creator.highestViews)} views
										</Text>
									</div>
									<div>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mb-1">
											Platforms
										</Text>
										<div className="flex gap-2">
											{creator.platforms.map((platform) => (
												<Badge key={platform} color="blue" size="1" variant="soft">
													{platform}
												</Badge>
											))}
										</div>
									</div>
								</div>

								<div className="flex gap-2">
									<Button
										variant="solid"
										color="blue"
										size="2"
										onClick={() => setSelectedCreator(creator)}
										className="flex-1"
									>
										<PersonIcon className="mr-2" />
										View Profile
									</Button>
									{user && creator.id === user.whop_user_id && (
										<Button
											variant="ghost"
											color="blue"
											size="2"
											asChild
											className="text-xs"
										>
											<a href="/profile">My Profile</a>
										</Button>
									)}
									<Button
										variant="ghost"
										color="purple"
										size="2"
										onClick={() => {
											if (user && creator.id === user.whop_user_id) {
												alert("You cannot message yourself");
												return;
											}
											router.push(`/inbox?userId=${creator.id}`);
										}}
									>
										<ChatBubbleIcon />
									</Button>
								</div>
							</Card>
						</motion.div>
					);
					})}
				</div>
			)}

			{/* Creator Profile Modal */}
			{selectedCreator && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-a11 dark:bg-gray-a12 backdrop-blur-md"
					onClick={() => setSelectedCreator(null)}
				>
					<motion.div
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						onClick={(e) => e.stopPropagation()}
					>
						<Card size="3" variant="surface" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
							<div className="flex items-center justify-between mb-6">
								<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
									{selectedCreator.username}'s Profile
								</Heading>
								<Button variant="ghost" size="1" onClick={() => setSelectedCreator(null)}>
									×
								</Button>
							</div>

							<div className="space-y-6">
								<div className="flex items-center gap-4">
									<div className="w-24 h-24 rounded-full bg-gray-a3 dark:bg-gray-a4 flex items-center justify-center">
										{selectedCreator.profilePicture ? (
											<img
												src={selectedCreator.profilePicture}
												alt={selectedCreator.username}
												className="w-full h-full rounded-full object-cover"
											/>
										) : (
											<PersonIcon className="w-12 h-12 text-gray-11" />
										)}
									</div>
									<div>
										<Heading size="6" as="h3" className="text-gray-12 dark:text-gray-12 mb-2">
											{selectedCreator.username}
										</Heading>
										{(() => {
											const nicheInfo = NICHE_CATEGORIES.find((n) => n.id === selectedCreator.niche);
											return nicheInfo ? (
												<Badge color={nicheInfo.color} size="2" variant="soft">
													{nicheInfo.icon} {nicheInfo.label}
												</Badge>
											) : null;
										})()}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<Card size="2" variant="surface" className="p-4">
										<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
											Followers
										</Text>
										<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
											{new Intl.NumberFormat("en", { notation: "compact" }).format(selectedCreator.followers)}
										</Heading>
									</Card>
									<Card size="2" variant="surface" className="p-4">
										<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
											Highest Views
										</Text>
										<Heading size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
											{new Intl.NumberFormat("en", { notation: "compact" }).format(selectedCreator.highestViews)}
										</Heading>
									</Card>
								</div>

								<div>
									<Text size="2" weight="medium" className="mb-3 text-gray-12 dark:text-gray-12">
										Social Media Links
									</Text>
									<div className="space-y-2">
										{selectedCreator.socialLinks.youtube && (
											<Button
												variant="ghost"
												size="2"
												asChild
												className="w-full justify-start"
											>
												<a href={selectedCreator.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
													<VideoIcon className="mr-2" />
													YouTube
												</a>
											</Button>
										)}
										{selectedCreator.socialLinks.instagram && (
											<Button
												variant="ghost"
												size="2"
												asChild
												className="w-full justify-start"
											>
												<a href={selectedCreator.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
													📷 Instagram
												</a>
											</Button>
										)}
										{selectedCreator.socialLinks.tiktok && (
											<Button
												variant="ghost"
												size="2"
												asChild
												className="w-full justify-start"
											>
												<a href={selectedCreator.socialLinks.tiktok} target="_blank" rel="noopener noreferrer">
													🎵 TikTok
												</a>
											</Button>
										)}
									</div>
								</div>

								<div className="flex gap-3">
									{user && selectedCreator.id === user.whop_user_id ? (
										<Button
											variant="solid"
											color="blue"
											size="3"
											onClick={() => {
												setSelectedCreator(null);
												router.push("/profile");
											}}
											className="flex-1"
										>
											<PersonIcon className="mr-2" />
											My Profile
										</Button>
									) : friendStatus === "friends" ? (
										<Button
											variant="solid"
											color="purple"
											size="3"
											onClick={() => {
												setSelectedCreator(null);
												router.push(`/inbox?userId=${selectedCreator.id}`);
											}}
											className="flex-1"
										>
											<ChatBubbleIcon className="mr-2" />
											Send Message
										</Button>
									) : friendStatus === "pending_outgoing" ? (
										<Button
											variant="soft"
											color="gray"
											size="3"
											disabled
											className="flex-1"
										>
											<PlusIcon className="mr-2" />
											Friend Request Sent
										</Button>
									) : friendStatus === "pending_incoming" ? (
										<>
											<Button
												variant="solid"
												color="green"
												size="3"
												onClick={async () => {
													try {
														const response = await fetch("/api/inbox/friends", {
															method: "POST",
															headers: { "Content-Type": "application/json" },
															credentials: "include",
															body: JSON.stringify({
																action: "accept",
																userId: selectedCreator.id,
															}),
														});
														if (response.ok) {
															setFriendStatus("friends");
														}
													} catch (err) {
														console.error("Failed to accept friend request:", err);
													}
												}}
												className="flex-1"
											>
												Accept Request
											</Button>
											<Button
												variant="solid"
												color="purple"
												size="3"
												onClick={() => {
													setSelectedCreator(null);
													router.push(`/inbox?userId=${selectedCreator.id}`);
												}}
												className="flex-1"
											>
												<ChatBubbleIcon className="mr-2" />
												Send Message
											</Button>
										</>
									) : (
										<Button
											variant="solid"
											color="purple"
											size="3"
											onClick={async () => {
												try {
													const response = await fetch("/api/inbox/friends", {
														method: "POST",
														headers: { "Content-Type": "application/json" },
														credentials: "include",
														body: JSON.stringify({
															action: "send",
															userId: selectedCreator.id,
														}),
													});
													if (response.ok) {
														setFriendStatus("pending_outgoing");
													} else {
														const error = await response.json();
														alert(error.error || "Failed to send friend request");
													}
												} catch (err) {
													console.error("Failed to send friend request:", err);
													alert("Failed to send friend request");
												}
											}}
											className="flex-1"
											disabled={friendStatus === "loading"}
										>
											<PlusIcon className="mr-2" />
											Add Friend
										</Button>
									)}
									<Button
										variant="ghost"
										color="gray"
										size="3"
										onClick={() => setSelectedCreator(null)}
										className="flex-1"
									>
										Close
									</Button>
								</div>
							</div>
						</Card>
					</motion.div>
				</motion.div>
			)}

			{/* Join Niche Modal */}
			<AnimatePresence>
				{isJoinModalOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-a11 dark:bg-gray-a12 backdrop-blur-md"
							onClick={() => setIsJoinModalOpen(false)}
						>
							<motion.div
								initial={{ scale: 0.95, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.95, opacity: 0 }}
								onClick={(e) => e.stopPropagation()}
							>
								<Card size="3" variant="surface" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
									<div className="flex items-center justify-between mb-6">
										<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
											Join a Niche
										</Heading>
										<Button variant="ghost" size="1" onClick={() => setIsJoinModalOpen(false)}>
											<Cross2Icon className="w-4 h-4" />
										</Button>
									</div>

									<div className="space-y-4">
										<div>
											<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
												Username <span className="text-red-11">*</span>
											</Text>
											<input
												type="text"
												value={joinForm.username}
												onChange={(e) => setJoinForm({ ...joinForm, username: e.target.value })}
												placeholder="Your creator username"
												required
												className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
											/>
										</div>

										<div>
											<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
												Select Niche <span className="text-red-11">*</span>
											</Text>
											<div className="grid grid-cols-4 gap-2">
												{NICHE_CATEGORIES.map((niche) => (
													<Button
														key={niche.id}
														variant={joinForm.niche === niche.id ? "soft" : "ghost"}
														color={joinForm.niche === niche.id ? niche.color : "gray"}
														size="2"
														onClick={() => setJoinForm({ ...joinForm, niche: niche.id })}
														className="flex flex-col items-center gap-1 h-auto py-3"
													>
														<Text size="4">{niche.icon}</Text>
														<Text size="1">{niche.label}</Text>
													</Button>
												))}
											</div>
										</div>

										<div>
											<Text size="2" weight="medium" className="mb-3 block text-gray-11 dark:text-gray-11">
												Social Media Links (Optional)
											</Text>
											<div className="space-y-2">
												<div>
													<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
														YouTube URL
													</Text>
													<input
														type="url"
														value={joinForm.socialLinks.youtube}
														onChange={(e) => {
															const value = e.target.value;
															if (value && !isValidYouTubeUrl(value)) {
																setSocialLinkErrors(prev => ({ ...prev, youtube: "Please enter a valid YouTube URL" }));
															} else {
																setSocialLinkErrors(prev => ({ ...prev, youtube: "" }));
															}
															setJoinForm({
																...joinForm,
																socialLinks: { ...joinForm.socialLinks, youtube: value },
															});
														}}
														placeholder="https://youtube.com/@yourchannel"
														className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 ${
															socialLinkErrors.youtube ? "border-red-9 dark:border-red-9" : "border-gray-a6 dark:border-gray-a7"
														}`}
													/>
													{socialLinkErrors.youtube && (
														<Text size="1" className="text-red-11 mt-1">
															{socialLinkErrors.youtube}
														</Text>
													)}
												</div>
												<div>
													<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
														Instagram URL
													</Text>
													<input
														type="url"
														value={joinForm.socialLinks.instagram}
														onChange={(e) => {
															const value = e.target.value;
															if (value && !isValidInstagramUrl(value)) {
																setSocialLinkErrors(prev => ({ ...prev, instagram: "Please enter a valid Instagram URL" }));
															} else {
																setSocialLinkErrors(prev => ({ ...prev, instagram: "" }));
															}
															setJoinForm({
																...joinForm,
																socialLinks: { ...joinForm.socialLinks, instagram: value },
															});
														}}
														placeholder="https://instagram.com/yourhandle"
														className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 ${
															socialLinkErrors.instagram ? "border-red-9 dark:border-red-9" : "border-gray-a6 dark:border-gray-a7"
														}`}
													/>
													{socialLinkErrors.instagram && (
														<Text size="1" className="text-red-11 mt-1">
															{socialLinkErrors.instagram}
														</Text>
													)}
												</div>
												<div>
													<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
														TikTok URL
													</Text>
													<input
														type="url"
														value={joinForm.socialLinks.tiktok}
														onChange={(e) => {
															const value = e.target.value;
															if (value && !isValidTikTokUrl(value)) {
																setSocialLinkErrors(prev => ({ ...prev, tiktok: "Please enter a valid TikTok URL" }));
															} else {
																setSocialLinkErrors(prev => ({ ...prev, tiktok: "" }));
															}
															setJoinForm({
																...joinForm,
																socialLinks: { ...joinForm.socialLinks, tiktok: value },
															});
														}}
														placeholder="https://tiktok.com/@yourhandle"
														className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12 ${
															socialLinkErrors.tiktok ? "border-red-9 dark:border-red-9" : "border-gray-a6 dark:border-gray-a7"
														}`}
													/>
													{socialLinkErrors.tiktok && (
														<Text size="1" className="text-red-11 mt-1">
															{socialLinkErrors.tiktok}
														</Text>
													)}
												</div>
											</div>
										</div>

										<div className="flex gap-3 pt-4">
											<Button
												variant="ghost"
												color="gray"
												size="3"
												onClick={() => setIsJoinModalOpen(false)}
												className="flex-1"
											>
												Cancel
											</Button>
											<Button
												variant="solid"
												color="purple"
												size="3"
												onClick={handleJoinNiche}
												disabled={!joinForm.username || !joinForm.niche}
												className="flex-1"
											>
												Join Niche
											</Button>
										</div>
									</div>
								</Card>
							</motion.div>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Niche Chat */}
			{chatNiche && (
				<NicheChat
					niche={chatNiche}
					nicheLabel={NICHE_CATEGORIES.find((n) => n.id === chatNiche)?.label || chatNiche}
					isOpen={isChatOpen}
					onClose={() => {
						setIsChatOpen(false);
						setChatNiche(null);
					}}
				/>
			)}
		</div>
	);
}

