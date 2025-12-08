"use client";

import { useState, useEffect } from "react";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import {
	VideoIcon,
	TrashIcon,
	DownloadIcon,
	ReloadIcon,
	Link2Icon,
} from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";

interface LibraryItem {
	id: string;
	videoUrl: string;
	platform: "tiktok" | "instagram" | "youtube";
	title: string;
	description: string;
	hashtags: string[];
	ideas: string[];
	audioUrl?: string;
	thumbnail?: string;
	savedAt: string;
	metadata: {
		duration?: number;
		format?: string;
		size?: number;
	};
}

const platformColors = {
	tiktok: "cyan",
	instagram: "pink",
	youtube: "red",
} as const;

const platformLabels = {
	tiktok: "TikTok",
	instagram: "Instagram",
	youtube: "YouTube",
} as const;

export default function LibraryPage() {
	const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<any>(null);
	const router = useRouter();

	useEffect(() => {
		// Check authentication
		fetch("/api/auth/me")
			.then((res) => res.json())
			.then((data) => {
				if (data.success && data.user) {
					setUser(data.user);
					fetchLibrary();
				} else {
					setError("Please login to access your content library");
					setLoading(false);
				}
			})
			.catch(() => {
				setError("Please login to access your content library");
				setLoading(false);
			});
	}, []);

	const fetchLibrary = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/library/save");
			const data = await response.json();
			if (response.ok) {
				setLibraryItems(data.items || []);
			} else if (response.status === 401) {
				setError("Please login to access your content library");
				setUser(null);
			} else {
				setError(data.error || "Failed to load library");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load library");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (itemId: string) => {
		if (!confirm("Are you sure you want to delete this item from your library?")) {
			return;
		}

		try {
			const response = await fetch("/api/library/delete", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ itemId }),
			});

			if (response.ok) {
				setLibraryItems((prev) => prev.filter((item) => item.id !== itemId));
			} else {
				const data = await response.json();
				alert(data.error || "Failed to delete item");
			}
		} catch (err) {
			alert("Failed to delete item");
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return "Unknown";
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>
			<div className="flex items-center justify-between">
				<div>
					<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
						Content Library
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Your saved videos, ideas, and metadata
					</Text>
				</div>
				<Button
					variant="soft"
					color="blue"
					size="3"
					onClick={fetchLibrary}
					disabled={loading}
				>
					<ReloadIcon className="mr-2" />
					Refresh
				</Button>
			</div>

			{error && (
				<Card size="2" variant="surface" className="p-4 border-red-a6 bg-red-a2">
					<Text size="2" color="red" className="text-red-11">
						{error}
					</Text>
				</Card>
			)}

			{loading ? (
				<Card size="3" variant="surface" className="p-8 text-center">
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						Loading library...
					</Text>
				</Card>
			) : !user ? (
				<Card size="3" variant="surface" className="p-8 text-center">
					<VideoIcon className="w-16 h-16 mx-auto mb-4 text-gray-9 dark:text-gray-10" />
					<Heading size="5" as="h2" className="mb-2 text-gray-12 dark:text-gray-12">
						Login Required
					</Heading>
					<Text size="3" color="gray" className="mb-4 text-gray-11 dark:text-gray-11">
						Please login to access your content library. Your videos are saved per account.
					</Text>
					<Button variant="solid" color="blue" size="3" onClick={() => router.push("/login")}>
						Go to Login
					</Button>
				</Card>
			) : libraryItems.length === 0 ? (
				<Card size="3" variant="surface" className="p-8 text-center">
					<VideoIcon className="w-16 h-16 mx-auto mb-4 text-gray-9 dark:text-gray-10" />
					<Heading size="5" as="h2" className="mb-2 text-gray-12 dark:text-gray-12">
						Your library is empty
					</Heading>
					<Text size="3" color="gray" className="mb-4 text-gray-11 dark:text-gray-11">
						Your saved videos will appear here
					</Text>
					<Button variant="solid" color="blue" size="3" asChild>
						<a href="/video-downloader">Go to Video Downloader</a>
					</Button>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<AnimatePresence>
						{libraryItems.map((item, index) => (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ delay: index * 0.05 }}
							>
								<Card size="3" variant="surface" className="p-6 h-full flex flex-col">
									<div className="flex items-start justify-between mb-4">
										<Badge
											color={platformColors[item.platform]}
											size="2"
											variant="soft"
										>
											{platformLabels[item.platform]}
										</Badge>
										<Button
											variant="ghost"
											size="1"
											color="red"
											onClick={() => handleDelete(item.id)}
											title="Delete from library"
										>
											<TrashIcon />
										</Button>
									</div>

									{item.thumbnail ? (
										<img
											src={item.thumbnail}
											alt={item.title}
											className="w-full h-48 object-cover rounded-lg mb-4"
										/>
									) : (
										<div className="w-full h-48 bg-gray-a3 dark:bg-gray-a4 rounded-lg mb-4 flex items-center justify-center">
											<VideoIcon className="w-12 h-12 text-gray-9 dark:text-gray-10" />
										</div>
									)}

									<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12 line-clamp-2">
										{item.title}
									</Heading>

									{item.description && (
										<Text size="2" color="gray" className="mb-3 text-gray-11 dark:text-gray-11 line-clamp-2">
											{item.description}
										</Text>
									)}

									{item.hashtags && item.hashtags.length > 0 && (
										<div className="flex flex-wrap gap-1 mb-3">
											{item.hashtags.slice(0, 5).map((tag) => (
												<Badge key={tag} color="blue" size="1" variant="soft">
													{tag}
												</Badge>
											))}
										</div>
									)}

									{item.ideas && item.ideas.length > 0 && (
										<div className="mb-3">
											<Text size="2" weight="medium" className="mb-1 text-gray-11 dark:text-gray-11">
												Ideas:
											</Text>
											<ul className="space-y-1">
												{item.ideas.slice(0, 3).map((idea, i) => (
													<li key={i} className="text-xs text-gray-10 dark:text-gray-11">
														• {idea}
													</li>
												))}
											</ul>
										</div>
									)}

									{item.metadata && (
										<div className="mb-3 space-y-1">
											{item.metadata.duration && (
												<Text size="1" color="gray" className="text-gray-10">
													Duration: {item.metadata.duration}s
												</Text>
											)}
											{item.metadata.size && (
												<Text size="1" color="gray" className="text-gray-10">
													Size: {formatFileSize(item.metadata.size)}
												</Text>
											)}
											{item.metadata.format && (
												<Text size="1" color="gray" className="text-gray-10">
													Format: {item.metadata.format}
												</Text>
											)}
										</div>
									)}

									<Text size="1" color="gray" className="mb-4 text-gray-10">
										Saved: {formatDate(item.savedAt)}
									</Text>

									<div className="flex gap-2 mt-auto">
										<Button
											variant="soft"
											color="blue"
											size="2"
											asChild
											className="flex-1"
										>
											<a href={item.videoUrl} target="_blank" rel="noopener noreferrer">
												<Link2Icon className="mr-2" />
												View
											</a>
										</Button>
										<Button
											variant="soft"
											color="green"
											size="2"
											asChild
											className="flex-1"
										>
											<a href={item.videoUrl} download>
												<DownloadIcon className="mr-2" />
												Download
											</a>
										</Button>
									</div>
								</Card>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}
		</div>
	);
}

