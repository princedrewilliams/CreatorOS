"use client";

import { useState, useRef } from "react";
import { Card, Button, Text, Heading, Badge } from "@whop/react/components";
import { VideoIcon, Cross2Icon, DownloadIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface AutoRepurposeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onClipsGenerated?: (clips: any[]) => void;
}

export function AutoRepurposeModal({ isOpen, onClose, onClipsGenerated }: AutoRepurposeModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [clipCount, setClipCount] = useState(5);
	const [processing, setProcessing] = useState(false);
	const [clips, setClips] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			if (selectedFile.type.startsWith("video/")) {
				setFile(selectedFile);
				setError(null);
				setClips([]);
			} else {
				setError("Please select a video file");
			}
		}
	};

	const handleRepurpose = async () => {
		if (!file) {
			setError("Please select a video file");
			return;
		}

		setProcessing(true);
		setError(null);
		setClips([]);

		try {
			const formData = new FormData();
			formData.append("video", file);
			formData.append("clipCount", clipCount.toString());

			const response = await fetch("/api/automation/auto-repurpose", {
				method: "POST",
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to repurpose video");
			}

			setClips(data.clips || []);
			if (onClipsGenerated && data.clips) {
				onClipsGenerated(data.clips);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to repurpose video");
		} finally {
			setProcessing(false);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
								Auto-Repurpose Video
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

							{/* Clip Count */}
							<div>
								<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
									Number of Clips: {clipCount}
								</Text>
								<input
									type="range"
									min="3"
									max="10"
									value={clipCount}
									onChange={(e) => setClipCount(parseInt(e.target.value))}
									className="w-full accent-purple-9"
									disabled={processing}
								/>
							</div>

							{/* Error */}
							{error && (
								<Card size="1" variant="surface" className="p-3 bg-red-a2 border-red-a6">
									<Text size="2" color="red" className="text-red-11">
										{error}
									</Text>
								</Card>
							)}

							{/* Repurpose Button */}
							<Button
								variant="solid"
								color="purple"
								size="3"
								onClick={handleRepurpose}
								disabled={processing || !file}
								className="w-full"
							>
								{processing ? "Repurposing..." : "Generate Clips"}
							</Button>

							{/* Generated Clips */}
							{clips.length > 0 && (
								<div className="space-y-3">
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Generated Clips ({clips.length})
									</Text>
									{clips.map((clip) => (
										<Card key={clip.id} size="2" variant="surface" className="p-4">
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1">
													<Text size="3" weight="medium" className="mb-1 text-gray-12 dark:text-gray-12">
														{clip.title}
													</Text>
													<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
														{formatTime(clip.startTime)} - {formatTime(clip.endTime)}
													</Text>
													{clip.caption && (
														<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 line-clamp-2">
															{clip.caption}
														</Text>
													)}
												</div>
												{clip.downloadUrl && (
													<Button variant="soft" color="green" size="2" asChild>
														<a href={clip.downloadUrl} download>
															<DownloadIcon className="mr-2" />
															Download
														</a>
													</Button>
												)}
											</div>
										</Card>
									))}
									{data?.scheduled && (
										<Card size="1" variant="surface" className="p-3 bg-green-a2 border-green-a6">
											<Text size="2" color="green" className="text-green-11">
												✓ Clips have been scheduled to your content calendar
											</Text>
										</Card>
									)}
								</div>
							)}
						</div>
					</Card>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}

