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
	const [selectedPlatforms, setSelectedPlatforms] = useState<("instagram" | "tiktok")[]>([]);
	const [uploading, setUploading] = useState(false);

	const connectedPlatforms = socialConnections.filter(
		(conn) => conn.connected && (conn.platform === "instagram" || conn.platform === "tiktok")
	);

	const handlePlatformToggle = (platform: "instagram" | "tiktok") => {
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
			});

			const result = await response.json();

			if (result.success) {
				alert(`Successfully posted to ${selectedPlatforms.join(", ")}!`);
				onClose();
				setVideo(null);
				setCaption("");
				setSelectedPlatforms([]);
			} else {
				alert(`Failed to post: ${result.message || "Unknown error"}`);
			}
		} catch (error) {
			console.error("Error posting video:", error);
			alert("Failed to post video. Please try again.");
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
						className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-a6 bg-white dark:bg-gray-a2 p-6 shadow-xl"
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

							{/* Platform Selection */}
							<div>
								<Text size="2" weight="medium" className="mb-3 block text-gray-11 dark:text-gray-11">
									Select Platforms * (Choose at least one)
								</Text>
								<div className="flex gap-3">
									{connectedPlatforms.map((conn) => {
										const platform = conn.platform as "instagram" | "tiktok";
										const isSelected = selectedPlatforms.includes(platform);
										return (
											<Button
												key={platform}
												variant={isSelected ? "soft" : "ghost"}
												color={platform === "instagram" ? "purple" : "gray"}
												size="2"
												onClick={() => handlePlatformToggle(platform)}
												className="capitalize"
											>
												{platform}
											</Button>
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


