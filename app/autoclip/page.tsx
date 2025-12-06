"use client";

import { useState, useRef } from "react";
import { Heading, Text, Card, Button, Progress } from "@whop/react/components";
import { VideoIcon, UploadIcon, CheckIcon } from "@radix-ui/react-icons";
import { motion, AnimatePresence } from "framer-motion";

interface Clip {
	id: string;
	startTime: number;
	endTime: number;
	score: number;
	text?: string;
	thumbnail?: string;
	downloadUrl?: string;
}

export default function AutoclipPage() {
	const [file, setFile] = useState<File | null>(null);
	const [clipCount, setClipCount] = useState(5);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [clips, setClips] = useState<Clip[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
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

	const handleGenerateClips = async () => {
		if (!file) {
			setError("Please select a video file first");
			return;
		}

		setIsProcessing(true);
		setProgress(0);
		setError(null);
		setClips([]);

		try {
			const formData = new FormData();
			formData.append("video", file);
			formData.append("clipCount", clipCount.toString());

			const response = await fetch("/api/generate-clips", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				// Try to parse as JSON, but handle non-JSON responses
				let errorMessage = "Failed to generate clips";
				const contentType = response.headers.get("content-type");
				if (contentType && contentType.includes("application/json")) {
					try {
						const data = await response.json();
						errorMessage = data.error || errorMessage;
					} catch {
						// If JSON parsing fails, use status text
						errorMessage = response.statusText || errorMessage;
					}
				} else {
					// Non-JSON response (like "Forbidden")
					const text = await response.text();
					errorMessage = text || response.statusText || errorMessage;
				}
				throw new Error(errorMessage);
			}

			const data = await response.json();
			setJobId(data.jobId);

			// If cached, return immediately
			if (data.cached && data.clips) {
				setClips(data.clips);
				setProgress(100);
				setIsProcessing(false);
				return;
			}

			// Poll for progress
			const pollInterval = setInterval(async () => {
				try {
					const statusResponse = await fetch(`/api/generate-clips?jobId=${data.jobId}`);
					if (statusResponse.ok) {
						const contentType = statusResponse.headers.get("content-type");
						if (contentType && contentType.includes("application/json")) {
							try {
								const statusData = await statusResponse.json();
								setProgress(statusData.progress);

								if (statusData.status === "completed" && statusData.clips) {
									clearInterval(pollInterval);
									setClips(statusData.clips);
									setIsProcessing(false);
								} else if (statusData.status === "failed") {
									clearInterval(pollInterval);
									setError("Failed to generate clips");
									setIsProcessing(false);
								}
							} catch (parseError) {
								console.error("Failed to parse status response:", parseError);
								clearInterval(pollInterval);
								setError("Failed to parse progress update");
								setIsProcessing(false);
							}
						} else {
							// Non-JSON response
							const text = await statusResponse.text();
							console.error("Non-JSON response:", text);
							clearInterval(pollInterval);
							setError("Unexpected response format");
							setIsProcessing(false);
						}
					} else {
						// Handle non-OK responses
						const text = await statusResponse.text();
						console.error("Status check failed:", statusResponse.status, text);
						clearInterval(pollInterval);
						setError(`Status check failed: ${statusResponse.statusText || statusResponse.status}`);
						setIsProcessing(false);
					}
				} catch (err) {
					clearInterval(pollInterval);
					setError(err instanceof Error ? err.message : "Failed to check progress");
					setIsProcessing(false);
				}
			}, 2000);

			// Timeout after 5 minutes
			setTimeout(() => {
				clearInterval(pollInterval);
				if (isProcessing) {
					setError("Processing timed out. Please try again.");
					setIsProcessing(false);
				}
			}, 5 * 60 * 1000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate clips");
			setIsProcessing(false);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
						Auto Clip
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Automatically create engaging clips from your videos using AI
					</Text>
				</div>
			</div>

			<Card size="3" variant="surface" className="p-6 sm:p-10">
				<div className="space-y-6">
					{/* File Upload Section */}
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<input
								ref={fileInputRef}
								type="file"
								accept="video/*"
								onChange={handleFileSelect}
								className="hidden"
								disabled={isProcessing}
							/>
							<Button
								variant="soft"
								color="purple"
								size="3"
								onClick={() => fileInputRef.current?.click()}
								disabled={isProcessing}
								className="flex items-center gap-2"
							>
								<UploadIcon className="w-4 h-4" />
								{file ? "Change Video" : "Upload Video"}
							</Button>
							{file && (
								<div className="flex items-center gap-2">
									<CheckIcon className="w-5 h-5 text-green-9" />
									<Text size="3" className="text-gray-11 dark:text-gray-11">
										{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
									</Text>
								</div>
							)}
						</div>

						{/* Clip Count Selector */}
						<div className="space-y-2">
							<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
								Number of Clips: {clipCount}
							</Text>
							<input
								type="range"
								min="5"
								max="10"
								value={clipCount}
								onChange={(e) => setClipCount(parseInt(e.target.value))}
								disabled={isProcessing}
								className="w-full h-2 bg-gray-a4 rounded-lg appearance-none cursor-pointer accent-purple-9"
							/>
							<div className="flex justify-between text-xs text-gray-10">
								<span>5</span>
								<span>10</span>
							</div>
						</div>

						{/* Generate Button */}
						<Button
							color="purple"
							size="3"
							variant="solid"
							onClick={handleGenerateClips}
							disabled={!file || isProcessing}
							className="w-full"
						>
							{isProcessing ? "Generating Clips..." : "Generate Clips"}
						</Button>
					</div>

					{/* Progress Bar */}
					<AnimatePresence>
						{isProcessing && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="space-y-2"
							>
								<Text size="2" className="text-gray-11 dark:text-gray-11">
									Processing video... {progress}%
								</Text>
								<Progress value={progress} className="w-full" />
							</motion.div>
						)}
					</AnimatePresence>

					{/* Error Message */}
					{error && (
						<Card size="2" variant="surface" className="p-4 bg-red-a2 border-red-a6">
							<Text size="3" className="text-red-11">
								{error}
							</Text>
						</Card>
					)}

					{/* Generated Clips */}
					{clips.length > 0 && (
						<div className="space-y-4">
							<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
								Generated Clips ({clips.length})
							</Heading>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{clips.map((clip, index) => (
									<motion.div
										key={clip.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<Card size="3" variant="surface" className="p-4">
											<div className="space-y-3">
												{clip.thumbnail ? (
													<img
														src={clip.thumbnail}
														alt={`Clip ${index + 1}`}
														className="w-full h-32 object-cover rounded-lg"
													/>
												) : (
													<div className="w-full h-32 bg-purple-a2 dark:bg-purple-a3 rounded-lg flex items-center justify-center">
														<VideoIcon className="w-8 h-8 text-purple-9" />
													</div>
												)}
												<div>
													<Text size="2" weight="medium" className="text-gray-12 dark:text-gray-12">
														Clip {index + 1}
													</Text>
													<Text size="1" className="text-gray-10">
														{formatTime(clip.startTime)} - {formatTime(clip.endTime)}
													</Text>
													<Text size="1" className="text-gray-10">
														Engagement: {(clip.score * 100).toFixed(0)}%
													</Text>
												</div>
												{clip.text && (
													<Text size="1" className="text-gray-10 italic line-clamp-2">
														"{clip.text}"
													</Text>
												)}
												{clip.downloadUrl ? (
													<a
														href={clip.downloadUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="block"
													>
														<Button variant="soft" color="purple" size="2" className="w-full">
															Download Clip
														</Button>
													</a>
												) : (
													<Button variant="soft" color="purple" size="2" className="w-full" disabled>
														Processing...
													</Button>
												)}
											</div>
										</Card>
									</motion.div>
								))}
							</div>
						</div>
					)}

					{/* Info Section */}
					{clips.length === 0 && !isProcessing && (
						<div className="grid gap-4 sm:grid-cols-3 w-full max-w-3xl mx-auto pt-4">
							{[
								"Upload to secure storage with automatic processing queue",
								"AI-powered scene detection and keyword analysis",
								"Clip-ready downloads plus transcript JSON with timestamps",
							].map((item, index) => (
								<motion.div
									key={item}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className="p-4 rounded-xl border border-purple-a4/40 dark:border-purple-a5/40 bg-purple-a2/30 dark:bg-purple-a3/30 text-left"
								>
									<Text size="2" color="purple" weight="medium">
										{item}
									</Text>
								</motion.div>
							))}
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
