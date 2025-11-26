"use client";

import { useState } from "react";
import { Heading, Text, Button } from "@whop/react/components";
import { Cross2Icon, UploadIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

interface PostVideoModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function PostVideoModal({ isOpen, onClose }: PostVideoModalProps) {
	const { socialConnections } = useAppStore();
	const [video, setVideo] = useState<File | null>(null);
	const [caption, setCaption] = useState("");
	const [selectedPlatforms, setSelectedPlatforms] = useState<("youtube" | "instagram" | "tiktok")[]>([]);
	const [uploading, setUploading] = useState(false);

	const connectedPlatforms = socialConnections.filter(
		(conn) => conn.connected && (conn.platform === "youtube" || conn.platform === "instagram" || conn.platform === "tiktok")
	);

	const handlePlatformToggle = (platform: "youtube" | "instagram" | "tiktok") => {
		setSelectedPlatforms((prev) =>
			prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
		);
	};

	const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith("video/")) {
			setVideo(file);
		} else {
			alert("Please select a valid video file");
		}
	};

	const handlePost = async () => {
		if (!video) {
			alert("Please select a video file");
			return;
		}

		if (selectedPlatforms.length === 0) {
			alert("Please select at least one platform");
			return;
		}

		setUploading(true);

		try {
			const formData = new FormData();
			formData.append("video", video);
			formData.append("caption", caption);
			formData.append("platforms", selectedPlatforms.join(","));

			const response = await fetch("/api/post-video", {
				method: "POST",
				body: formData,
				credentials: "include", // Include cookies (access tokens)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: "Network error" }));
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const result = await response.json();

			if (result.success) {
				alert(`Successfully posted to ${selectedPlatforms.join(", ")}!`);
				onClose();
				setVideo(null);
				setCaption("");
				setSelectedPlatforms([]);
			} else {
				// Show detailed error messages
				const failedPlatforms = result.results?.filter((r: any) => !r.success) || [];
				const errorMessages = failedPlatforms.map((r: any) => `${r.platform}: ${r.error || "Unknown error"}`).join("\n");
				alert(`Failed to post: ${result.message || "Unknown error"}${errorMessages ? `\n\nDetails:\n${errorMessages}` : ""}`);
			}
		} catch (error) {
			console.error("Error posting video:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			alert(`Failed to post video: ${errorMessage}. Please make sure you're connected to the selected platforms.`);
		} finally {
			setUploading(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-gray-a11 dark:bg-gray-a12 backdrop-blur-md"
						onClick={onClose}
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-a6 bg-white dark:bg-gray-a2 p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-6">
							<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
								Post to All Social Media
							</Heading>
							<Button variant="ghost" size="1" onClick={onClose}>
								<Cross2Icon />
							</Button>
						</div>

						<div className="space-y-4">
							{/* Video Upload */}
							<div>
								<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
									Video File *
								</Text>
								<label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-a6 border-dashed rounded-lg cursor-pointer hover:bg-gray-a2 dark:hover:bg-gray-a3 transition-colors">
									{video ? (
										<div className="flex flex-col items-center">
											<Text size="2" className="text-gray-12 dark:text-gray-12">
												{video.name}
											</Text>
											<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
												{(video.size / 1024 / 1024).toFixed(2)} MB
											</Text>
										</div>
									) : (
										<div className="flex flex-col items-center">
											<UploadIcon className="w-8 h-8 text-gray-9 dark:text-gray-10 mb-2" />
											<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
												Click to upload video
											</Text>
										</div>
									)}
									<input
										type="file"
										accept="video/*"
										onChange={handleVideoSelect}
										className="hidden"
									/>
								</label>
							</div>

							{/* Caption */}
							<div>
								<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
									Caption
								</Text>
								<textarea
									value={caption}
									onChange={(e) => setCaption(e.target.value)}
									placeholder="Write a caption for your post..."
									rows={4}
									className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 placeholder-gray-9 dark:placeholder-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-blue-6 transition-colors resize-none"
								/>
							</div>

							{/* Connected Accounts Summary */}
							{connectedPlatforms.length > 0 && (
								<div className="p-3 rounded-lg border border-blue-a6 bg-blue-a2 dark:bg-blue-a3">
									<Text size="2" weight="medium" className="mb-2 block text-gray-12 dark:text-gray-12">
										Connected Accounts
									</Text>
									<div className="flex flex-wrap gap-2">
										{connectedPlatforms.map((conn) => (
											<div
												key={conn.platform}
												className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-gray-a4 border border-blue-a6"
											>
												<Text size="1" weight="medium" className="capitalize text-gray-12 dark:text-gray-12">
													{conn.platform}:
												</Text>
												<Text size="1" className="text-gray-11 dark:text-gray-11 font-mono">
													@{conn.username || `${conn.platform} User`}
												</Text>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Platform Selection */}
							<div>
								<Text size="2" weight="medium" className="mb-3 block text-gray-11 dark:text-gray-11">
									Select Platforms * (Choose at least one)
								</Text>
								<div className="flex flex-wrap gap-3">
									{connectedPlatforms.map((conn) => {
										const platform = conn.platform as "youtube" | "instagram" | "tiktok";
										const isSelected = selectedPlatforms.includes(platform);
										const username = conn.username || `${platform} User`;
										const platformColors: Record<"youtube" | "instagram" | "tiktok", "red" | "purple" | "gray"> = {
											youtube: "red",
											instagram: "purple",
											tiktok: "gray",
										};
										return (
											<div key={platform} className="flex flex-col gap-1">
												<Button
													variant={isSelected ? "soft" : "ghost"}
													color={platformColors[platform]}
													size="2"
													onClick={() => handlePlatformToggle(platform)}
													className="capitalize"
												>
													{platform}
												</Button>
												<Text size="1" color="gray" className="text-center text-gray-11 dark:text-gray-11">
													@{username}
												</Text>
											</div>
										);
									})}
								</div>
								{connectedPlatforms.length === 0 && (
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 mt-2">
										Please connect at least one social media account first.
									</Text>
								)}
							</div>

							{/* Actions */}
							<div className="flex items-center justify-end gap-3 pt-4">
								<Button variant="ghost" size="2" onClick={onClose} disabled={uploading}>
									Cancel
								</Button>
								<Button
									color="blue"
									size="2"
									variant="solid"
									onClick={handlePost}
									disabled={uploading || !video || selectedPlatforms.length === 0}
								>
									{uploading ? "Posting..." : "Post Now"}
								</Button>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}


