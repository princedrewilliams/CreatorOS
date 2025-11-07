"use client";

import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { ArrowLeftIcon, ImageIcon, UploadIcon, MagicWandIcon, DownloadIcon, TrashIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";

interface Thumbnail {
	id: string;
	style: string;
	imageUrl: string;
	title: string;
	createdAt: Date;
}

const thumbnailStyles = [
	{ name: "Modern", description: "Clean and contemporary design" },
	{ name: "Bold", description: "High contrast and eye-catching" },
	{ name: "Minimalist", description: "Simple and elegant" },
	{ name: "Gradient", description: "Colorful gradient backgrounds" },
	{ name: "Dark", description: "Dark theme with neon accents" },
	{ name: "Bright", description: "Vibrant and energetic colors" },
];

export default function ThumbnailPage() {
	const [title, setTitle] = useState("");
	const [uploadedImage, setUploadedImage] = useState<string | null>(null);
	const [generatedThumbnails, setGeneratedThumbnails] = useState<Thumbnail[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { isPro } = useAppStore();

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 10 * 1024 * 1024) {
				alert("File size must be less than 10MB");
				return;
			}
			const reader = new FileReader();
			reader.onloadend = () => {
				setUploadedImage(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const generateThumbnail = async (style: string) => {
		if (!title.trim() && !uploadedImage) {
			alert("Please enter a title or upload an image");
			return;
		}

		setIsGenerating(true);
		setSelectedStyle(style);

		try {
			// Build the prompt
			let prompt = title.trim();
			
			// Add style-specific instructions
			const styleInstructions: Record<string, string> = {
				Modern: "modern, clean, contemporary design, professional, sleek, minimalist aesthetic",
				Bold: "bold, high contrast, vibrant colors, eye-catching, dramatic lighting, striking composition",
				Minimalist: "minimalist, simple, elegant, clean lines, lots of white space, subtle colors",
				Gradient: "colorful gradient backgrounds, vibrant hues, smooth color transitions, dynamic",
				Dark: "dark theme, neon accents, cyberpunk aesthetic, moody lighting, dramatic shadows",
				Bright: "bright, vibrant, energetic colors, cheerful, sunny, high saturation, lively",
			};

			if (!prompt) {
				prompt = `YouTube thumbnail for a video about ${style.toLowerCase()} style content`;
			}

			prompt = `YouTube thumbnail, ${prompt}, ${styleInstructions[style] || styleInstructions.Modern}, 16:9 aspect ratio, high quality, professional design, text overlay friendly, engaging composition`;

			// Call the API route
			const response = await fetch("/api/generate-thumbnail", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt,
					style,
					aspectRatio: "16:9",
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to generate thumbnail");
			}

			const newThumbnail: Thumbnail = {
				id: Date.now().toString(),
				style,
				imageUrl: data.imageUrl,
				title: title || "Untitled",
				createdAt: new Date(),
			};

			setGeneratedThumbnails((prev) => [newThumbnail, ...prev]);
		} catch (error) {
			console.error("Error generating thumbnail:", error);
			alert(
				error instanceof Error
					? error.message
					: "Failed to generate thumbnail. Please try again."
			);
		} finally {
			setIsGenerating(false);
			setSelectedStyle(null);
		}
	};

	const generateAllStyles = async () => {
		if (!isPro) {
			alert("Pro feature: Upgrade to generate multiple styles at once");
			return;
		}

		setIsGenerating(true);
		try {
			for (const style of thumbnailStyles) {
				await generateThumbnail(style.name);
				// Small delay between generations to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		} finally {
			setIsGenerating(false);
		}
	};

	const downloadThumbnail = async (thumbnail: Thumbnail) => {
		try {
			// Fetch the image from the URL (handles CORS)
			const response = await fetch(thumbnail.imageUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			
			const link = document.createElement("a");
			link.href = url;
			link.download = `thumbnail-${thumbnail.style}-${Date.now()}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Clean up the object URL
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error downloading thumbnail:", error);
			// Fallback: open in new tab
			window.open(thumbnail.imageUrl, "_blank");
		}
	};

	const removeThumbnail = (id: string) => {
		setGeneratedThumbnails((prev) => prev.filter((t) => t.id !== id));
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Link href="/dashboard">
						<Button variant="ghost" size="2" className="mb-4">
							<ArrowLeftIcon className="mr-2" />
							Back
						</Button>
					</Link>
					<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
						Thumbnail Generator
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Create eye-catching thumbnails with AI-powered design
					</Text>
				</div>
			</div>

			{/* Upload Section */}
			<Card size="3" variant="surface" className="p-8">
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="w-20 h-20 rounded-full bg-violet-a2 dark:bg-violet-a3 flex items-center justify-center">
						<ImageIcon className="w-10 h-10 text-violet-11 dark:text-violet-10" />
					</div>
					<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
						Generate Thumbnail
					</Heading>
					<Text size="3" color="gray" className="max-w-md text-gray-11 dark:text-gray-11">
						Enter a video title or upload an image to create stunning thumbnails
					</Text>

					<div className="flex flex-col gap-4 w-full max-w-md mt-4">
						{/* Text Input */}
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Enter video title or description..."
							className="px-4 py-3 rounded-lg border border-gray-a6 bg-white dark:bg-gray-a4 text-gray-12 dark:text-gray-12 placeholder-gray-9 dark:placeholder-gray-10 focus:outline-none focus:ring-2 focus:ring-violet-6 focus:border-violet-6 transition-colors"
						/>

						{/* Upload Image */}
						<div className="relative">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								className="hidden"
							/>
							<Button
								color="violet"
								size="3"
								variant={uploadedImage ? "soft" : "solid"}
								className="w-full"
								onClick={() => fileInputRef.current?.click()}
							>
								<UploadIcon className="mr-2" />
								{uploadedImage ? "Change Image" : "Upload Image"}
							</Button>
							{uploadedImage && (
								<div className="mt-3 relative">
									<img
										src={uploadedImage}
										alt="Uploaded"
										className="w-full h-32 object-cover rounded-lg border border-gray-a4"
									/>
									<Button
										variant="ghost"
										size="1"
										className="absolute top-2 right-2"
										onClick={() => setUploadedImage(null)}
									>
										<TrashIcon />
									</Button>
								</div>
							)}
						</div>

						<Separator />

						{/* Generate Options */}
						<div className="flex flex-col gap-2">
							<Button
								color="violet"
								size="3"
								variant="solid"
								className="w-full"
								onClick={() => generateThumbnail(selectedStyle || "Modern")}
								disabled={isGenerating || (!title.trim() && !uploadedImage)}
							>
							{isGenerating ? (
								<>
									<div className="w-4 h-4 border-2 border-violet-11 border-t-transparent rounded-full animate-spin mr-2" />
									Generating with AI...
								</>
							) : (
									<>
										<MagicWandIcon className="mr-2" />
										Generate Single Thumbnail
									</>
								)}
							</Button>

							{isPro && (
								<Button
									color="violet"
									size="3"
									variant="soft"
									className="w-full"
									onClick={generateAllStyles}
									disabled={isGenerating || (!title.trim() && !uploadedImage)}
								>
									<MagicWandIcon className="mr-2" />
									Generate All Styles (Pro)
								</Button>
							)}
						</div>

						{/* Style Selector */}
						<div className="mt-4">
							<Text size="2" color="gray" className="mb-2">
								Select Style:
							</Text>
							<div className="grid grid-cols-3 gap-2">
								{thumbnailStyles.slice(0, 6).map((style) => (
									<Button
										key={style.name}
										variant={selectedStyle === style.name ? "soft" : "ghost"}
										color={selectedStyle === style.name ? "violet" : "gray"}
										size="2"
										onClick={() => setSelectedStyle(style.name)}
										className="text-xs"
									>
										{style.name}
									</Button>
								))}
							</div>
						</div>
					</div>
				</div>
			</Card>

			{/* Generated Thumbnails */}
			{generatedThumbnails.length > 0 && (
				<div>
					<div className="flex items-center justify-between mb-4">
						<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
							Generated Thumbnails ({generatedThumbnails.length})
						</Heading>
						<Button
							variant="ghost"
							size="2"
							onClick={() => setGeneratedThumbnails([])}
						>
							Clear All
						</Button>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<AnimatePresence>
							{generatedThumbnails.map((thumbnail, index) => (
								<motion.div
									key={thumbnail.id}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									transition={{ delay: index * 0.05 }}
								>
									<Card size="2" variant="surface" className="p-4 overflow-hidden group">
										<div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-gray-a2 border border-gray-a4">
											<img
												src={thumbnail.imageUrl}
												alt={`${thumbnail.style} thumbnail`}
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center gap-2">
												<Button
													variant="ghost"
													size="2"
													color="violet"
													className="opacity-0 group-hover:opacity-100 transition-opacity"
													onClick={() => downloadThumbnail(thumbnail)}
												>
													<DownloadIcon className="mr-1" />
													Download
												</Button>
												<Button
													variant="ghost"
													size="2"
													color="red"
													className="opacity-0 group-hover:opacity-100 transition-opacity"
													onClick={() => removeThumbnail(thumbnail.id)}
												>
													<TrashIcon />
												</Button>
											</div>
										</div>
										<div className="flex items-center justify-between">
											<div className="flex-1">
												<Text size="3" weight="medium" className="mb-1 text-gray-12 dark:text-gray-12">
													{thumbnail.style} Style
												</Text>
												<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
													{thumbnail.title}
												</Text>
											</div>
											<Badge color="violet" size="1" variant="soft">
												{thumbnail.createdAt.toLocaleTimeString()}
											</Badge>
										</div>
									</Card>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</div>
			)}

			{/* Pro Feature Badge */}
			{!isPro && (
				<Card size="2" variant="surface" className="p-4 bg-blue-a2 dark:bg-blue-a3 border-blue-6 dark:border-blue-5">
					<div className="flex items-center gap-3">
						<Badge color="blue" size="2" variant="solid">
							Pro Feature
						</Badge>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							Unlock unlimited AI thumbnail generation and batch generation with Pro
						</Text>
						<Button color="blue" size="2" variant="solid" className="ml-auto" asChild>
							<Link href="/upgrade">Upgrade</Link>
						</Button>
					</div>
				</Card>
			)}
		</div>
	);
}
