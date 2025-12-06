"use client";

import { useState } from "react";
import { Heading, Text, Card, Button, TextArea } from "@whop/react/components";
import { 
	PersonIcon, 
	MagnifyingGlassIcon, 
	ChatBubbleIcon, 
	LightningBoltIcon,
	CheckIcon,
	Cross2Icon
} from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface Creator {
	id: string;
	username: string;
	platform: "instagram" | "tiktok" | "youtube";
	followers: number;
	location?: string;
	niche: string[];
	audienceOverlap: number;
	matchScore: number;
	profilePicture?: string;
}

interface CollabIdea {
	id: string;
	title: string;
	description: string;
	script: string;
	estimatedViews: string;
	estimatedEngagement: string;
}

export default function AutoCollabPage() {
	const [searchCriteria, setSearchCriteria] = useState({
		niche: "",
		minFollowers: "",
		maxFollowers: "",
		location: "",
		minAudienceOverlap: "30",
	});
	const [isSearching, setIsSearching] = useState(false);
	const [matchedCreators, setMatchedCreators] = useState<Creator[]>([]);
	const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
	const [collabIdeas, setCollabIdeas] = useState<CollabIdea[]>([]);
	const [selectedIdea, setSelectedIdea] = useState<CollabIdea | null>(null);
	const [dmTemplate, setDmTemplate] = useState("");
	const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
	const [isSendingDM, setIsSendingDM] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleSearch = async () => {
		if (!searchCriteria.niche) {
			setError("Please enter a niche to search for");
			return;
		}

		setIsSearching(true);
		setError(null);
		setMatchedCreators([]);
		setSelectedCreator(null);
		setCollabIdeas([]);

		try {
			const response = await fetch("/api/collab/find-creators", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(searchCriteria),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to find creators");
			}

			setMatchedCreators(data.creators || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to search for creators");
		} finally {
			setIsSearching(false);
		}
	};

	const handleGenerateIdeas = async (creator: Creator) => {
		setSelectedCreator(creator);
		setIsGeneratingIdeas(true);
		setError(null);
		setCollabIdeas([]);

		try {
			const response = await fetch("/api/collab/generate-ideas", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					creatorId: creator.id,
					creatorUsername: creator.username,
					creatorNiche: creator.niche,
					audienceOverlap: creator.audienceOverlap,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to generate collab ideas");
			}

			setCollabIdeas(data.ideas || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate ideas");
		} finally {
			setIsGeneratingIdeas(false);
		}
	};

	const handleSendDM = async (idea: CollabIdea) => {
		if (!selectedCreator) {
			setError("No creator selected");
			return;
		}

		setIsSendingDM(true);
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/collab/send-dm", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					creatorId: selectedCreator.id,
					creatorUsername: selectedCreator.username,
					platform: selectedCreator.platform,
					collabIdea: idea,
					template: dmTemplate || idea.script,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to send DM");
			}

			setSuccess(`DM sent successfully to @${selectedCreator.username}!`);
			setDmTemplate("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send DM");
		} finally {
			setIsSendingDM(false);
		}
	};

	const formatNumber = (num: number) => {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
		return num.toString();
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
						Auto-Collab Finder
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Find perfect collaboration partners and automate outreach
					</Text>
				</div>
			</div>

			{/* Search Criteria */}
			<Card size="3" variant="surface" className="p-6 sm:p-10">
				<Heading size="6" as="h2" className="mb-6 text-gray-12 dark:text-gray-12">
					Search Criteria
				</Heading>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
							Niche *
						</Text>
						<input
							type="text"
							placeholder="e.g., fitness, gaming, beauty"
							value={searchCriteria.niche}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchCriteria({ ...searchCriteria, niche: e.target.value })}
							className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
						/>
					</div>
					<div>
						<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
							Location (optional)
						</Text>
						<input
							type="text"
							placeholder="e.g., Los Angeles, CA"
							value={searchCriteria.location}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchCriteria({ ...searchCriteria, location: e.target.value })}
							className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
						/>
					</div>
					<div>
						<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
							Min Followers
						</Text>
						<input
							type="number"
							placeholder="e.g., 10000"
							value={searchCriteria.minFollowers}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchCriteria({ ...searchCriteria, minFollowers: e.target.value })}
							className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
						/>
					</div>
					<div>
						<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
							Max Followers
						</Text>
						<input
							type="number"
							placeholder="e.g., 100000"
							value={searchCriteria.maxFollowers}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchCriteria({ ...searchCriteria, maxFollowers: e.target.value })}
							className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
						/>
					</div>
					<div className="md:col-span-2">
						<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
							Min Audience Overlap (%)
						</Text>
						<input
							type="number"
							placeholder="30"
							value={searchCriteria.minAudienceOverlap}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchCriteria({ ...searchCriteria, minAudienceOverlap: e.target.value })}
							className="w-full px-3 py-2 border border-gray-a6 rounded-md bg-white dark:bg-gray-a2 text-gray-12 dark:text-gray-12"
						/>
					</div>
				</div>
				<Button
					variant="solid"
					color="purple"
					size="3"
					onClick={handleSearch}
					disabled={isSearching}
					className="mt-6"
				>
					<MagnifyingGlassIcon className="mr-2" />
					{isSearching ? "Searching..." : "Find Creators"}
				</Button>
			</Card>

			{/* Error/Success Messages */}
			<AnimatePresence>
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
					>
						<Card size="2" variant="surface" className="p-4 bg-red-a2 border-red-a6">
							<div className="flex items-center gap-2">
								<Cross2Icon className="text-red-9" />
								<Text size="3" className="text-red-11">{error}</Text>
							</div>
						</Card>
					</motion.div>
				)}
				{success && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
					>
						<Card size="2" variant="surface" className="p-4 bg-green-a2 border-green-a6">
							<div className="flex items-center gap-2">
								<CheckIcon className="text-green-9" />
								<Text size="3" className="text-green-11">{success}</Text>
							</div>
						</Card>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Matched Creators */}
			{matchedCreators.length > 0 && (
				<Card size="3" variant="surface" className="p-6 sm:p-10">
					<Heading size="6" as="h2" className="mb-6 text-gray-12 dark:text-gray-12">
						Matched Creators ({matchedCreators.length})
					</Heading>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{matchedCreators.map((creator) => (
							<Card
								key={creator.id}
								size="2"
								variant="surface"
								className="p-4 hover:border-purple-a6 transition-colors cursor-pointer"
								onClick={() => handleGenerateIdeas(creator)}
							>
								<div className="flex items-start gap-3">
									{creator.profilePicture ? (
										<img
											src={creator.profilePicture}
											alt={creator.username}
											className="w-12 h-12 rounded-full"
										/>
									) : (
										<div className="w-12 h-12 rounded-full bg-purple-a3 flex items-center justify-center">
											<PersonIcon className="w-6 h-6 text-purple-9" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
											@{creator.username}
										</Text>
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
											{formatNumber(creator.followers)} followers
										</Text>
										<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
											{creator.audienceOverlap}% audience overlap
										</Text>
										<div className="flex flex-wrap gap-1 mt-2">
											{creator.niche.slice(0, 2).map((n) => (
												<span
													key={n}
													className="text-xs px-2 py-0.5 bg-purple-a3 text-purple-11 rounded"
												>
													{n}
												</span>
											))}
										</div>
										<div className="mt-2">
											<Text size="1" color="gray" className="text-gray-10">
												Match Score: {creator.matchScore}%
											</Text>
										</div>
									</div>
								</div>
							</Card>
						))}
					</div>
				</Card>
			)}

			{/* Collab Ideas */}
			{selectedCreator && (
				<Card size="3" variant="surface" className="p-6 sm:p-10">
					<div className="flex items-center justify-between mb-6">
						<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
							Collab Ideas for @{selectedCreator.username}
						</Heading>
						<Button
							variant="ghost"
							size="2"
							onClick={() => {
								setSelectedCreator(null);
								setCollabIdeas([]);
							}}
						>
							<Cross2Icon />
						</Button>
					</div>

					{isGeneratingIdeas ? (
						<div className="text-center py-8">
							<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
								Generating collab ideas...
							</Text>
						</div>
					) : collabIdeas.length > 0 ? (
						<div className="space-y-4">
							{collabIdeas.map((idea) => (
								<Card key={idea.id} size="2" variant="surface" className="p-4">
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1">
											<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
												{idea.title}
											</Heading>
											<Text size="3" color="gray" className="mb-3 text-gray-11 dark:text-gray-11">
												{idea.description}
											</Text>
											<Card size="1" variant="surface" className="p-3 bg-gray-a2 mb-3">
												<Text size="2" className="text-gray-12 dark:text-gray-12 whitespace-pre-wrap">
													{idea.script}
												</Text>
											</Card>
											<div className="flex gap-4 text-sm text-gray-11 dark:text-gray-11">
												<span>📊 {idea.estimatedViews}</span>
												<span>💬 {idea.estimatedEngagement}</span>
											</div>
										</div>
										<div className="flex flex-col gap-2">
											<Button
												variant="solid"
												color="purple"
												size="2"
												onClick={() => {
													setSelectedIdea(idea);
													setDmTemplate(idea.script);
												}}
											>
												<ChatBubbleIcon className="mr-2" />
												Send DM
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
								No ideas generated yet. Click "Generate Ideas" to get started.
							</Text>
						</div>
					)}
				</Card>
			)}

			{/* DM Template Editor */}
			{selectedIdea && selectedCreator && (
				<Card size="3" variant="surface" className="p-6 sm:p-10">
					<div className="flex items-center justify-between mb-6">
						<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
							Send DM to @{selectedCreator.username}
						</Heading>
						<Button
							variant="ghost"
							size="2"
							onClick={() => {
								setSelectedIdea(null);
								setDmTemplate("");
							}}
						>
							<Cross2Icon />
						</Button>
					</div>
					<div className="space-y-4">
						<div>
							<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
								Message Template
							</Text>
							<TextArea
								value={dmTemplate}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDmTemplate(e.target.value)}
								placeholder="Edit the message template..."
								rows={8}
								className="w-full"
							/>
						</div>
						<Button
							variant="solid"
							color="purple"
							size="3"
							onClick={() => handleSendDM(selectedIdea)}
							disabled={isSendingDM || !dmTemplate.trim()}
							className="w-full"
						>
							<LightningBoltIcon className="mr-2" />
							{isSendingDM ? "Sending..." : "Send DM"}
						</Button>
					</div>
				</Card>
			)}
		</div>
	);
}

