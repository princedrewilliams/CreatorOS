"use client";

import { useState, useRef } from "react";
import { Card, Button, Text, Heading, Badge } from "@whop/react/components";
import { VideoIcon, Cross2Icon, CheckIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface AutoFormatModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AutoFormatModal({ isOpen, onClose }: AutoFormatModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
	const [processing, setProcessing] = useState(false);
	const [formattedVideos, setFormattedVideos] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const platforms = [
		{ id: "tiktok", label: "TikTok", color: "cyan" as const },
		{ id: "instagram", label: "Instagram Reels", color: "pink" as const },
		{ id: "youtube", label: "YouTube Shorts", color: "red" as const },
	];

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			if (selectedFile.type.startsWith("video/")) {
				setFile(selectedFile);
				setError(null);
			} else {
				setError("Please select a video file");
			}
		}
	};

	const handlePlatformToggle = (platformId: string) => {
		setSelectedPlatforms((prev) =>
			prev.includes(platformId)
				? prev.filter((p) => p !== platformId)
				: [...prev, platformId]
		);
	};

	const handleFormat = async () => {
		if (!file) {
			setError("Please select a video file");
			return;
		}

		if (selectedPlatforms.length === 0) {
			setError("Please select at least one platform");
			return;
		}

		setProcessing(true);
		setError(null);
		setFormattedVideos([]);

		try {
			const formData = new FormData();
			formData.append("video", file);
			selectedPlatforms.forEach((platform) => {
				formData.append("platforms", platform);
			});

			const response = await fetch("/api/automation/auto-format-video", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to format video");
			}

			setFormattedVideos(data.formattedVideos || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to format video");
		} finally {
			setProcessing(false);
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
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
					className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
				>
					<Card size="3" variant="surface" className="p-6">
						<div className="flex items-center justify-between mb-6">
							<Heading size="5" as="h3" className="text-gray-12 dark:text-gray-12">
								Auto-Format Video
							</Heading>
							<Button variant="ghost" size="2" onClick={onClose}>
								<Cross2Icon />
							</Button>
						</div>

						<div className="space-y-6">
							{/* File Upload */}
							<div>
								<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
									Upload Video
								</Text>
								<input
									type="file"
									accept="video/*"
									ref={fileInputRef}
									onChange={handleFileSelect}
									className="hidden"
								/>
								<Button
									variant="ghost"
									color="blue"
									size="3"
									onClick={() => fileInputRef.current?.click()}
									className="w-full"
									disabled={processing}
								>
									<VideoIcon className="mr-2" />
									{file ? file.name : "Select Video File"}
								</Button>
								{file && (
									<Text size="2" color="gray" className="mt-2 text-gray-10">
										{(file.size / (1024 * 1024)).toFixed(2)} MB
									</Text>
								)}
							</div>

							{/* Platform Selection */}
							<div>
								<Text size="2" weight="medium" className="mb-3 text-gray-11 dark:text-gray-11">
									Select Platforms
								</Text>
								<div className="flex flex-wrap gap-2">
									{platforms.map((platform) => (
										<Button
											key={platform.id}
											variant={selectedPlatforms.includes(platform.id) ? "soft" : "ghost"}
											color={selectedPlatforms.includes(platform.id) ? platform.color : "gray"}
											size="2"
											onClick={() => handlePlatformToggle(platform.id)}
											disabled={processing}
										>
											{platform.label}
										</Button>
									))}
								</div>
							</div>

							{/* Error */}
							{error && (
								<Card size="1" variant="surface" className="p-3 bg-red-a2 border-red-a6">
									<Text size="2" color="red" className="text-red-11">
										{error}
									</Text>
								</Card>
							)}

							{/* Format Button */}
							<Button
								variant="solid"
								color="purple"
								size="3"
								onClick={handleFormat}
								disabled={processing || !file || selectedPlatforms.length === 0}
								className="w-full"
							>
								{processing ? "Formatting..." : "Format Video"}
							</Button>

							{/* Formatted Videos */}
							{formattedVideos.length > 0 && (
								<div className="space-y-3">
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Formatted Videos
									</Text>
									{formattedVideos.map((video) => (
										<Card key={video.platform} size="2" variant="surface" className="p-4">
											<div className="flex items-center justify-between">
												<div>
													<Badge
														color={platforms.find((p) => p.id === video.platform)?.color || "blue"}
														size="2"
														variant="soft"
													>
														{platforms.find((p) => p.id === video.platform)?.label || video.platform}
													</Badge>
													<Text size="2" color="gray" className="mt-2 text-gray-11 dark:text-gray-11">
														{video.format.aspectRatio} • {video.format.resolution}
													</Text>
													<ul className="mt-2 space-y-1">
														{video.features.map((feature: string, i: number) => (
															<li key={i} className="text-xs text-gray-10 dark:text-gray-11">
																✓ {feature}
															</li>
														))}
													</ul>
												</div>
												{video.status === "completed" && (
													<Button variant="soft" color="green" size="2" asChild>
														<a href={video.downloadUrl} download>
															<VideoIcon className="mr-2" />
															Download
														</a>
													</Button>
												)}
											</div>
										</Card>
									))}
								</div>
							)}
						</div>
					</Card>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}

