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

// Mock creators data - in production, this would come from a database
const mockCreators: Creator[] = [
	{
		id: "1",
		username: "FitnessGuru",
		niche: "fitness",
		followers: 125000,
		highestViews: 2500000,
		platforms: ["youtube", "instagram"],
		socialLinks: {
			youtube: "https://youtube.com/@fitnessguru",
			instagram: "https://instagram.com/fitnessguru",
		},
	},
	{
		id: "2",
		username: "ChefMaster",
		niche: "cooking",
		followers: 89000,
		highestViews: 1800000,
		platforms: ["youtube", "tiktok"],
		socialLinks: {
			youtube: "https://youtube.com/@chefmaster",
			tiktok: "https://tiktok.com/@chefmaster",
		},
	},
];

export default function CollabPage() {
	const { user, socialConnections } = useAppStore();
	const router = useRouter();
	const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
	const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
	const [creators, setCreators] = useState<Creator[]>([]);
	const [loading, setLoading] = useState(true);
	const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [chatNiche, setChatNiche] = useState<string | null>(null);
	const [joinForm, setJoinForm] = useState({
		username: user?.whop_username || "",
		niche: "",
		socialLinks: {
			youtube: "",
			instagram: "",
			tiktok: "",
		},
	});

	// Load creators from API
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
					}
				}
			} catch (err) {
				console.error("Failed to load creators:", err);
			} finally {
				setLoading(false);
			}
		};

		loadCreators();
	}, [selectedNiche]);

	// Update form when user changes
	useEffect(() => {
		if (user) {
			setJoinForm((prev) => ({
				...prev,
				username: user.whop_username || prev.username,
			}));
		}
	}, [user]);

	const handleJoinNiche = async () => {
		if (!user) {
			router.push("/login?redirect=/collab");
			return;
		}

		if (!joinForm.username || !joinForm.niche) {
			alert("Please enter a username and select a niche");
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
					<Button
						variant="solid"
						color="purple"
						size="3"
						onClick={() => setIsJoinModalOpen(true)}
					>
						<PlusIcon className="mr-2" />
						Join Niche
					</Button>
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
									setChatNiche(niche.id);
									setIsChatOpen(true);
								}}
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
									<Button
										variant="ghost"
										color="blue"
										size="2"
										asChild
										className="text-xs"
									>
										<a href="/profile">My Profile</a>
									</Button>
									<Button
										variant="ghost"
										color="purple"
										size="2"
										onClick={() => {
											// Open DM modal or navigate to chat
											alert(`Opening chat with ${creator.username}`);
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
									<Button
										variant="solid"
										color="purple"
										size="3"
										onClick={() => {
											alert(`Opening chat with ${selectedCreator.username}`);
										}}
										className="flex-1"
									>
										<ChatBubbleIcon className="mr-2" />
										Send Message
									</Button>
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
														onChange={(e) =>
															setJoinForm({
																...joinForm,
																socialLinks: { ...joinForm.socialLinks, youtube: e.target.value },
															})
														}
														placeholder="https://youtube.com/@yourchannel"
														className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
													/>
												</div>
												<div>
													<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
														Instagram URL
													</Text>
													<input
														type="url"
														value={joinForm.socialLinks.instagram}
														onChange={(e) =>
															setJoinForm({
																...joinForm,
																socialLinks: { ...joinForm.socialLinks, instagram: e.target.value },
															})
														}
														placeholder="https://instagram.com/yourhandle"
														className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
													/>
												</div>
												<div>
													<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
														TikTok URL
													</Text>
													<input
														type="url"
														value={joinForm.socialLinks.tiktok}
														onChange={(e) =>
															setJoinForm({
																...joinForm,
																socialLinks: { ...joinForm.socialLinks, tiktok: e.target.value },
															})
														}
														placeholder="https://tiktok.com/@yourhandle"
														className="w-full px-3 py-2 border border-gray-a6 dark:border-gray-a7 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
													/>
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

