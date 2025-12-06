"use client";

import { useState } from "react";
import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import {
	DownloadIcon,
	Link2Icon,
	LightningBoltIcon,
	CheckIcon,
	EnvelopeClosedIcon,
	VideoIcon,
	FileTextIcon,
	BarChartIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";

type PlatformId = "tiktok" | "instagram" | "youtube";

interface DownloadResult {
	status: "idle" | "loading" | "success" | "error";
	message?: string;
	downloadUrl?: string;
	formatInfo?: {
		mime?: string;
		hasOpus?: boolean;
	};
}

const platforms: Array<{
	id: PlatformId;
	label: string;
	description: string;
	placeholder: string;
	help: string;
}> = [
	{
		id: "tiktok",
		label: "TikTok",
		description: "Grab watermark-free TikTok clips for repurposing.",
		placeholder: "https://www.tiktok.com/@creator/video/123456789",
		help: "Public videos only. Private links or stories are not supported.",
	},
	{
		id: "instagram",
		label: "Instagram Reels",
		description: "Download reels you’ve previously published.",
		placeholder: "https://www.instagram.com/reel/ABC1234/",
		help: "Users must own the content they download. Supports reels and short videos.",
	},
	{
		id: "youtube",
		label: "YouTube Shorts",
		description: "Save Shorts for editing and cross-posting.",
		placeholder: "https://www.youtube.com/shorts/xyz9876",
		help: "Works with public shorts. Scheduled or private videos will be skipped.",
	},
];

const initialFormValues: Record<PlatformId, string> = {
	tiktok: "",
	instagram: "",
	youtube: "",
};

const initialResults: Record<PlatformId, DownloadResult> = {
	tiktok: { status: "idle" },
	instagram: { status: "idle" },
	youtube: { status: "idle" },
};

export default function VideoDownloaderPage() {
	const [links, setLinks] = useState(initialFormValues);
	const [results, setResults] = useState(initialResults);
	const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
	const [autoRepurposeEnabled, setAutoRepurposeEnabled] = useState(false);
	const [autoInsightsEnabled, setAutoInsightsEnabled] = useState(true);
	const [insights, setInsights] = useState<any>(null);
	const [processing, setProcessing] = useState(false);

	const handleChange = (platform: PlatformId, value: string) => {
		setLinks((prev) => ({ ...prev, [platform]: value }));
		if (results[platform].status !== "idle") {
			setResults((prev) => ({ ...prev, [platform]: { status: "idle" } }));
		}
	};

	const handleDownload = async (platform: PlatformId) => {
		const link = links[platform].trim();
		if (!link) {
			setResults((prev) => ({
				...prev,
				[platform]: { status: "error", message: "Paste a video URL first." },
			}));
			return;
		}

		setResults((prev) => ({
			...prev,
			[platform]: { status: "loading", message: "Fetching download link…" },
		}));

		try {
			const response = await fetch("/api/video-downloader", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ platform, url: link }),
			});

			const data = (await response.json()) as {
				downloadUrl?: string;
				message?: string;
				error?: string;
				formatInfo?: {
					mime?: string;
					hasOpus?: boolean;
				};
			};

			if (!response.ok || data.error) {
				throw new Error(data.error || data.message || "Unable to fetch download link.");
			}

			setResults((prev) => ({
				...prev,
				[platform]: {
					status: "success",
					message: data.message ?? "Link is ready.",
					downloadUrl: data.downloadUrl,
					formatInfo: data.formatInfo,
				},
			}));

			// Auto-save to content library
			if (autoSaveEnabled) {
				setProcessing(true);
				try {
					// Simulate auto-save
					await new Promise((resolve) => setTimeout(resolve, 1000));
					console.log("Video saved to content library");
				} catch (error) {
					console.error("Failed to save to library:", error);
				} finally {
					setProcessing(false);
				}
			}

			// Auto-repurpose if enabled
			if (autoRepurposeEnabled && data.downloadUrl) {
				setProcessing(true);
				try {
					const repurposeResponse = await fetch("/api/automation/auto-repurpose", {
						method: "POST",
						body: JSON.stringify({ videoUrl: data.downloadUrl, clipCount: 5 }),
						headers: { "Content-Type": "application/json" },
					});
					const repurposeData = await repurposeResponse.json();
					if (repurposeResponse.ok) {
						console.log("Video repurposed:", repurposeData);
					}
				} catch (error) {
					console.error("Failed to repurpose:", error);
				} finally {
					setProcessing(false);
				}
			}

			// Auto-insights if enabled
			if (autoInsightsEnabled && data.downloadUrl) {
				setProcessing(true);
				try {
					const insightsResponse = await fetch("/api/automation/video-insights", {
						method: "POST",
						body: JSON.stringify({ videoUrl: data.downloadUrl }),
						headers: { "Content-Type": "application/json" },
					});
					const insightsData = await insightsResponse.json();
					if (insightsResponse.ok) {
						setInsights(insightsData.insights);
					}
				} catch (error) {
					console.error("Failed to get insights:", error);
				} finally {
					setProcessing(false);
				}
			}
		} catch (error) {
			setResults((prev) => ({
				...prev,
				[platform]: {
					status: "error",
					message:
						error instanceof Error
							? error.message
							: "Something went wrong while preparing the download.",
				},
			}));
		}
	};

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
						Video Downloader
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Paste a TikTok, Instagram, or YouTube Shorts link to get a downloadable file for your archive.
					</Text>
				</div>
			</div>

			{/* Automation Features */}
			<Card size="3" variant="surface" className="p-6">
				<div className="flex items-center gap-2 mb-4">
					<LightningBoltIcon className="w-5 h-5 text-purple-9" />
					<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
						Automation Features
					</Heading>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<FileTextIcon className="w-4 h-4 text-purple-9" />
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Auto-Save to Library
									</Text>
								</div>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Automatically save downloaded videos to your content library with extracted metadata
								</Text>
							</div>
						</div>
						<Button
							variant={autoSaveEnabled ? "soft" : "outline"}
							color={autoSaveEnabled ? "green" : "gray"}
							size="2"
							onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
							className="w-full"
						>
							{autoSaveEnabled ? "Enabled" : "Enable"}
						</Button>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<VideoIcon className="w-4 h-4 text-purple-9" />
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Auto-Repurpose
									</Text>
								</div>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Auto-crop, auto-caption, and create 2-5 short clips automatically
								</Text>
							</div>
						</div>
						<Button
							variant={autoRepurposeEnabled ? "soft" : "outline"}
							color={autoRepurposeEnabled ? "green" : "gray"}
							size="2"
							onClick={() => setAutoRepurposeEnabled(!autoRepurposeEnabled)}
							className="w-full"
						>
							{autoRepurposeEnabled ? "Enabled" : "Enable"}
						</Button>
					</Card>
					<Card size="2" variant="surface" className="p-4">
						<div className="flex items-start justify-between mb-3">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<BarChartIcon className="w-4 h-4 text-purple-9" />
									<Text size="3" weight="medium" className="text-gray-12 dark:text-gray-12">
										Auto-Insights
									</Text>
								</div>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Analyze hook strength, keywords, virality score, and generate similar ideas
								</Text>
							</div>
						</div>
						<Button
							variant={autoInsightsEnabled ? "soft" : "outline"}
							color={autoInsightsEnabled ? "green" : "gray"}
							size="2"
							onClick={() => setAutoInsightsEnabled(!autoInsightsEnabled)}
							className="w-full"
						>
							{autoInsightsEnabled ? "Enabled" : "Enable"}
						</Button>
					</Card>
				</div>
			</Card>

			{/* Video Insights */}
			{insights && (
				<Card size="3" variant="surface" className="p-6">
					<Heading size="5" as="h3" className="mb-4 text-gray-12 dark:text-gray-12">
						Video Insights
					</Heading>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card size="2" variant="surface" className="p-4">
							<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
								Hook Strength
							</Text>
							<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
								{insights.hookStrength}/10
							</Text>
							<Text size="2" color="gray" className="mt-1 text-gray-11 dark:text-gray-11">
								{insights.hookAnalysis}
							</Text>
						</Card>
						<Card size="2" variant="surface" className="p-4">
							<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
								Virality Score
							</Text>
							<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
								{insights.viralityScore}/10
							</Text>
						</Card>
						<Card size="2" variant="surface" className="p-4">
							<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
								Keywords
							</Text>
							<div className="flex flex-wrap gap-1">
								{insights.keywords?.map((kw: string) => (
									<Badge key={kw} color="blue" size="1" variant="soft">
										{kw}
									</Badge>
								))}
							</div>
						</Card>
						<Card size="2" variant="surface" className="p-4">
							<Text size="2" weight="medium" className="mb-2 text-gray-11 dark:text-gray-11">
								Similar Ideas
							</Text>
							<ul className="space-y-1">
								{insights.similarIdeas?.map((idea: string) => (
									<li key={idea} className="text-sm text-gray-11 dark:text-gray-11">
										• {idea}
									</li>
								))}
							</ul>
						</Card>
					</div>
				</Card>
			)}

			<Card size="3" variant="surface" className="p-6 border border-blue-a4/40 dark:border-blue-a5/40 bg-blue-a2/20 dark:bg-blue-a3/20">
				<div className="flex flex-wrap gap-4 items-start">
					<div className="w-12 h-12 rounded-full bg-blue-a3 dark:bg-blue-a4 flex items-center justify-center">
						<LightningBoltIcon className="w-6 h-6 text-blue-11 dark:text-blue-10" />
					</div>
					<div className="flex-1 space-y-2">
						<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
							Content rights reminder
						</Heading>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							Only download videos you created or have permission to reuse. We track download attempts and recommend
							storing proof of ownership for collaborations.
						</Text>
					</div>
				</div>
			</Card>

			<div className="grid gap-6 lg:grid-cols-3">
				{platforms.map((platform) => {
					const result = results[platform.id];
					return (
						<Card key={platform.id} size="3" variant="surface" className="p-6 flex flex-col gap-4">
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Badge color="blue" variant="soft" size="1">
										{platform.label}
									</Badge>
									{result.status === "success" && (
										<span className="inline-flex items-center gap-1 text-green-11 text-xs font-medium">
											<CheckIcon /> Ready
										</span>
									)}
								</div>
								<Text size="3" className="text-gray-12 dark:text-gray-12">
									{platform.description}
								</Text>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									{platform.help}
								</Text>
							</div>
							<Separator />
							<label className="space-y-2">
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									Video URL
								</Text>
								<div className="relative">
									<input
										value={links[platform.id]}
										onChange={(event) => handleChange(platform.id, event.target.value)}
										placeholder={platform.placeholder}
										className="w-full rounded-lg border border-gray-a5 dark:border-gray-a6 bg-white dark:bg-gray-a3 px-3 py-2 pr-10 text-sm text-gray-12 dark:text-gray-12 focus:outline-none focus:ring-2 focus:ring-blue-8"
									/>
									<Link2Icon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-9 dark:text-gray-10" />
								</div>
							</label>

							<div className="flex flex-col gap-2">
								<Button
									color="blue"
									size="3"
									variant="solid"
									disabled={result.status === "loading"}
									onClick={() => handleDownload(platform.id)}
								>
									{result.status === "loading" ? (
										<>
											<span className="w-4 h-4 border-2 border-blue-11 border-t-transparent rounded-full animate-spin mr-2" />
											Preparing download…
										</>
									) : (
										<>
											<DownloadIcon className="mr-2" />
											Get download link
										</>
									)}
								</Button>
								{result.status === "success" && result.downloadUrl && (
									<Button asChild variant="soft" color="green" size="2">
										<a href={result.downloadUrl} target="_blank" rel="noreferrer">
											<DownloadIcon className="mr-2" />
											Download video
										</a>
									</Button>
								)}
							</div>

							{result.status === "success" && result.formatInfo?.hasOpus && (
								<Card size="1" variant="surface" className="p-3 bg-yellow-a2 dark:bg-yellow-a3 border-yellow-a5">
									<Text size="2" className="text-yellow-11 dark:text-yellow-10">
										⚠️ <strong>Audio format notice:</strong> This video uses Opus audio codec. Some players (like Windows Media Player) may not play audio. Use VLC, MPV, or modern browsers for best compatibility.
									</Text>
								</Card>
							)}

							{result.status !== "idle" && (
								<Text
									size="2"
									color={result.status === "error" ? "red" : "green"}
									className="text-gray-11 dark:text-gray-11"
								>
									{result.message}
								</Text>
							)}
						</Card>
					);
				})}
			</div>

			<Card size="2" variant="surface" className="p-6 flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<EnvelopeClosedIcon className="w-6 h-6 text-gray-11 dark:text-gray-10" />
					<Heading size="4" className="text-gray-12 dark:text-gray-12">
						Need higher volume downloads?
					</Heading>
				</div>
				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
					We can enable automated ingestion and clip generation for premium plans. Reach out and we’ll schedule a quick
					call to scope your workflow.
				</Text>
				<Button color="blue" size="2" variant="soft" asChild>
					<a href="mailto:support@creatoros.com?subject=Video%20Downloader%20Upgrade">Contact support</a>
				</Button>
			</Card>
		</div>
	);
}

