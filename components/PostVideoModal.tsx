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
	
	// YouTube-specific fields
	const [youtubeTitle, setYoutubeTitle] = useState("");
	const [youtubeDescription, setYoutubeDescription] = useState("");
	const [youtubeTags, setYoutubeTags] = useState("");
	const [youtubeThumbnail, setYoutubeThumbnail] = useState<File | null>(null);
	const [youtubeVisibility, setYoutubeVisibility] = useState<"public" | "private" | "unlisted">("public");
	const [youtubeContentType, setYoutubeContentType] = useState<"video" | "shorts">("video");
	
	const isYouTubeSelected = selectedPlatforms.includes("youtube");

	const connectedPlatforms = socialConnections.filter(
		(conn) => conn.connected && (conn.platform === "youtube" || conn.platform === "instagram" || conn.platform === "tiktok")
	);

	const handlePlatformToggle = (platform: "youtube" | "instagram" | "tiktok") => {
		setSelectedPlatforms((prev) => {
			const isAdding = !prev.includes(platform);
			const newPlatforms = isAdding ? [...prev, platform] : prev.filter((p) => p !== platform);
			
			// Auto-fill YouTube title when YouTube is selected and video is already chosen
			if (isAdding && platform === "youtube" && video && !youtubeTitle) {
				setYoutubeTitle(video.name.replace(/\.[^/.]+$/, ""));
			}
			
			return newPlatforms;
		});
	};

	const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith("video/")) {
			setVideo(file);
			// Auto-fill YouTube title from filename if YouTube is already selected
			if (selectedPlatforms.includes("youtube") && !youtubeTitle) {
				setYoutubeTitle(file.name.replace(/\.[^/.]+$/, ""));
			}
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
			
			// Add YouTube-specific metadata if YouTube is selected
			if (isYouTubeSelected) {
				formData.append("youtubeTitle", youtubeTitle || video.name.replace(/\.[^/.]+$/, ""));
				formData.append("youtubeDescription", youtubeDescription || caption || "");
				formData.append("youtubeTags", youtubeTags);
				formData.append("youtubeVisibility", youtubeVisibility);
				formData.append("youtubeContentType", youtubeContentType);
				if (youtubeThumbnail) {
					formData.append("youtubeThumbnail", youtubeThumbnail);
				}
			}

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
				// Reset YouTube-specific fields
				setYoutubeTitle("");
				setYoutubeDescription("");
				setYoutubeTags("");
				setYoutubeThumbnail(null);
				setYoutubeVisibility("public");
				setYoutubeContentType("video");
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
									Caption {!isYouTubeSelected && "(for Instagram/TikTok)"}
								</Text>
								<textarea
									value={caption}
									onChange={(e) => setCaption(e.target.value)}
									placeholder="Write a caption for your post..."
									rows={4}
									className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 placeholder-gray-9 dark:placeholder-gray-10 focus:outline-none focus:ring-2 focus:ring-blue-6 focus:border-blue-6 transition-colors resize-none"
								/>
							</div>

							{/* YouTube-Specific Fields */}
							{isYouTubeSelected && (
								<div className="space-y-4 p-4 rounded-lg border-2 border-red-a6 bg-red-a2 dark:bg-red-a3">
									<Text size="2" weight="bold" className="mb-3 block text-gray-12 dark:text-gray-12">
										YouTube Video Settings
									</Text>

									{/* Content Type: Shorts or Regular Video */}
									<div className="bg-white dark:bg-gray-a4 p-3 rounded-lg border border-red-a6">
										<Text size="2" weight="bold" className="mb-3 block text-gray-12 dark:text-gray-12">
											Content Type *
										</Text>
										<div className="flex gap-2 flex-wrap">
											<Button
												variant={youtubeContentType === "video" ? "soft" : "ghost"}
												color={youtubeContentType === "video" ? "red" : "gray"}
												size="3"
												onClick={() => setYoutubeContentType("video")}
												className="flex-1 sm:flex-initial min-w-[140px]"
											>
												📹 Regular Video
											</Button>
											<Button
												variant={youtubeContentType === "shorts" ? "soft" : "ghost"}
												color={youtubeContentType === "shorts" ? "red" : "gray"}
												size="3"
												onClick={() => setYoutubeContentType("shorts")}
												className="flex-1 sm:flex-initial min-w-[140px]"
											>
												🎬 YouTube Shorts
											</Button>
										</div>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-3 block">
											{youtubeContentType === "shorts" 
												? "✓ Shorts are vertical videos (9:16 aspect ratio) up to 60 seconds long"
												: "✓ Regular videos can be any length and aspect ratio"}
										</Text>
									</div>
									
									{/* Title */}
									<div>
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Title *
										</Text>
										<input
											type="text"
											value={youtubeTitle}
											onChange={(e) => setYoutubeTitle(e.target.value)}
											placeholder={video ? video.name.replace(/\.[^/.]+$/, "") : "Enter video title..."}
											maxLength={100}
											className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 placeholder-gray-9 dark:placeholder-gray-10 focus:outline-none focus:ring-2 focus:ring-red-6 focus:border-red-6 transition-colors"
										/>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
											{youtubeTitle.length}/100 characters
										</Text>
									</div>

									{/* Description */}
									<div>
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Description
										</Text>
										<textarea
											value={youtubeDescription}
											onChange={(e) => setYoutubeDescription(e.target.value)}
											placeholder={caption || "Enter video description..."}
											rows={5}
											maxLength={5000}
											className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 placeholder-gray-9 dark:placeholder-gray-10 focus:outline-none focus:ring-2 focus:ring-red-6 focus:border-red-6 transition-colors resize-none"
										/>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
											{youtubeDescription.length}/5000 characters
										</Text>
									</div>

									{/* Tags */}
									<div>
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Tags
										</Text>
										<input
											type="text"
											value={youtubeTags}
											onChange={(e) => setYoutubeTags(e.target.value)}
											placeholder="gaming, tutorial, vlog (comma-separated)"
											className="w-full px-4 py-2 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 placeholder-gray-9 dark:placeholder-gray-10 focus:outline-none focus:ring-2 focus:ring-red-6 focus:border-red-6 transition-colors"
										/>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
											Separate tags with commas (max 500 characters)
										</Text>
									</div>

									{/* Thumbnail Upload - Hidden for Shorts */}
									{youtubeContentType === "video" && (
										<div>
											<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
												Custom Thumbnail (Optional)
											</Text>
										<label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-a6 border-dashed rounded-lg cursor-pointer hover:bg-gray-a2 dark:hover:bg-gray-a3 transition-colors">
											{youtubeThumbnail ? (
												<div className="flex flex-col items-center">
													<Text size="2" className="text-gray-12 dark:text-gray-12">
														{youtubeThumbnail.name}
													</Text>
													<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-1">
														{(youtubeThumbnail.size / 1024).toFixed(2)} KB
													</Text>
												</div>
											) : (
												<div className="flex flex-col items-center">
													<UploadIcon className="w-6 h-6 text-gray-9 dark:text-gray-10 mb-1" />
													<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
														Click to upload thumbnail (JPG, PNG, max 2MB)
													</Text>
												</div>
											)}
											<input
												type="file"
												accept="image/jpeg,image/png,image/jpg"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) {
														if (file.size > 2 * 1024 * 1024) {
															alert("Thumbnail must be less than 2MB");
															return;
														}
														setYoutubeThumbnail(file);
													}
												}}
												className="hidden"
											/>
										</label>
										</div>
									)}

									{/* Visibility */}
									<div>
										<Text size="2" weight="medium" className="mb-2 block text-gray-11 dark:text-gray-11">
											Visibility
										</Text>
										<div className="flex gap-2 flex-wrap">
											{(["public", "unlisted", "private"] as const).map((visibility) => (
												<Button
													key={visibility}
													variant={youtubeVisibility === visibility ? "soft" : "ghost"}
													color={youtubeVisibility === visibility ? "red" : "gray"}
													size="2"
													onClick={() => setYoutubeVisibility(visibility)}
													className="capitalize"
												>
													{visibility}
												</Button>
											))}
										</div>
										<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11 mt-2">
											{youtubeVisibility === "public" && "Anyone can search for and view this video"}
											{youtubeVisibility === "unlisted" && "Anyone with the link can view this video"}
											{youtubeVisibility === "private" && "Only you can view this video"}
										</Text>
									</div>
								</div>
							)}

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


