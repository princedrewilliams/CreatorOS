"use client";

import { useState } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { ChatBubbleIcon, PersonIcon, VideoIcon, EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

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
	const { user } = useAppStore();
	const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
	const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

	const filteredCreators = selectedNiche
		? mockCreators.filter((creator) => creator.niche === selectedNiche)
		: mockCreators;

	return (
		<div className="space-y-6 sm:space-y-8">
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
			</div>

			{/* Niche Categories */}
			<Card size="3" variant="surface" className="p-6">
				<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					Browse by Niche
				</Heading>
				<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
					{NICHE_CATEGORIES.map((niche) => (
						<Button
							key={niche.id}
							variant={selectedNiche === niche.id ? "soft" : "ghost"}
							color={selectedNiche === niche.id ? niche.color : "gray"}
							size="3"
							onClick={() => setSelectedNiche(selectedNiche === niche.id ? null : niche.id)}
							className="flex flex-col items-center gap-2 h-auto py-4"
						>
							<Text size="5">{niche.icon}</Text>
							<Text size="2" weight="medium">
								{niche.label}
							</Text>
						</Button>
					))}
				</div>
			</Card>

			{/* Creators List */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{filteredCreators.map((creator) => {
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
		</div>
	);
}

