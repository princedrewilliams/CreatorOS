"use client";

import { useState, useEffect } from "react";
import {
	X,
	Copy,
	Youtube,
	ChevronRight,
	Check,
	Loader2,
	AlertCircle,
	Upload,
	Plus,
	Image as ImageIcon,
} from "lucide-react";
import { ConstraintDisplay } from "./ConstraintDisplay";
import type { ReplicationSettings, UserYouTubeChannel } from "@/lib/replicate/types";

interface ReplicateThisModalProps {
	isOpen: boolean;
	onClose: () => void;
	channelUrl: string;
	referenceChannelName: string;
}

type Step = "connect" | "select" | "deriving" | "post" | "success";

const STEPS: Step[] = ["connect", "select", "deriving", "post", "success"];

export function ReplicateThisModal({
	isOpen,
	onClose,
	channelUrl,
	referenceChannelName,
}: ReplicateThisModalProps) {
	const [step, setStep] = useState<Step>("connect");
	const [channels, setChannels] = useState<UserYouTubeChannel[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<UserYouTubeChannel | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [settings, setSettings] = useState<ReplicationSettings | null>(null);

	// Video upload state
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [videoTitle, setVideoTitle] = useState("");
	const [videoDescription, setVideoDescription] = useState("");
	const [videoTags, setVideoTags] = useState<string[]>([]);
	const [customTag, setCustomTag] = useState("");
	const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
	const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
	const [videoVisibility, setVideoVisibility] = useState<"public" | "unlisted" | "private">("public");
	const [contentType, setContentType] = useState<"video" | "shorts">("video");
	const [uploading, setUploading] = useState(false);
	const [uploadSuccess, setUploadSuccess] = useState(false);

	useEffect(() => {
		if (isOpen) {
			checkYouTubeConnection();
		}
	}, [isOpen]);


	const checkYouTubeConnection = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/youtube/channels");
			const data = await response.json();

			if (data.connected && data.channels?.length > 0) {
				setChannels(data.channels);
				setStep("select");
			} else if (data.needsReauth) {
				setStep("connect");
			} else {
				setStep("connect");
			}
		} catch (err) {
			setError("Failed to check YouTube connection");
		} finally {
			setLoading(false);
		}
	};

	const handleConnectYouTube = () => {
		const returnUrl = encodeURIComponent(window.location.href);
		window.location.href = `/api/auth/youtube?returnUrl=${returnUrl}`;
	};

	const handleSelectChannel = (channel: UserYouTubeChannel) => {
		setSelectedChannel(channel);
	};

	const handleDeriveConstraints = async () => {
		if (!selectedChannel) return;

		setStep("deriving");
		setError(null);

		try {
			const response = await fetch("/api/replicate/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					channelUrl,
					targetChannelId: selectedChannel.id,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to derive constraints");
			}

			setSettings(data.settings);
			setStep("post");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to derive constraints");
			setStep("select");
		}
	};

	const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith("video/")) {
			setVideoFile(file);
		}
	};

	const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
			if (file.size > 2 * 1024 * 1024) {
				setError("Thumbnail must be less than 2MB");
				return;
			}
			setSelectedThumbnail(file);
			const reader = new FileReader();
			reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
			reader.readAsDataURL(file);
		}
	};

	const handleAddTag = (tag: string) => {
		if (tag && !videoTags.includes(tag)) {
			setVideoTags([...videoTags, tag]);
		}
	};

	const handleAddTagToDescription = (tag: string) => {
		const hashtag = `#${tag.replace(/\s+/g, "")}`;
		if (!videoDescription.includes(hashtag)) {
			setVideoDescription((prev) => (prev ? `${prev} ${hashtag}` : hashtag));
		}
	};

	const handleAddCustomTag = () => {
		if (customTag.trim()) {
			handleAddTag(customTag.trim());
			setCustomTag("");
		}
	};

	const handlePostVideo = async () => {
		if (!videoFile) {
			setError("Please select a video file");
			return;
		}

		if (!videoTitle.trim()) {
			setError("Please enter a title for your video");
			return;
		}

		setUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("video", videoFile);
			formData.append("platforms", "youtube");
			formData.append("youtubeTitle", videoTitle);
			formData.append("youtubeDescription", videoDescription);
			formData.append("youtubeTags", videoTags.join(","));
			formData.append("youtubeVisibility", videoVisibility);
			formData.append("youtubeContentType", contentType);

			if (selectedThumbnail) {
				formData.append("youtubeThumbnail", selectedThumbnail);
			}

			const response = await fetch("/api/post-video", {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			const result = await response.json();

			if (result.success) {
				setUploadSuccess(true);
				setStep("success");
			} else {
				throw new Error(result.message || "Failed to upload video");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to upload video");
		} finally {
			setUploading(false);
		}
	};

	const suggestedTags = [
		...(settings?.constraints?.title?.suggestedPowerWords || []),
		...(settings?.constraints?.seo?.primaryKeywords || []),
	].filter((tag, index, self) => self.indexOf(tag) === index);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-2xl mx-4 bg-[var(--frosted-bg)] backdrop-blur-xl border border-[var(--frosted-border)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
				{/* Gradient accent */}
				<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" />

				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors z-10"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Content */}
				<div className="p-6">
					{/* Header */}
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
							<Copy className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-lg font-semibold text-white">
								Replicate This
							</h2>
							<p className="text-sm text-[var(--text-muted)]">
								Derive content constraints from {referenceChannelName}
							</p>
						</div>
					</div>

					{/* Progress steps */}
					<div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
						{STEPS.map((s, i) => (
							<div key={s} className="flex items-center gap-2 flex-shrink-0">
								<div
									className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
										step === s
											? "bg-cyan-500 text-white"
											: STEPS.indexOf(step) > i
											? "bg-green-500 text-white"
											: "bg-white/10 text-[var(--text-muted)]"
									}`}
								>
									{STEPS.indexOf(step) > i ? (
										<Check className="w-3.5 h-3.5" />
									) : (
										i + 1
									)}
								</div>
								{i < STEPS.length - 1 && (
									<div
										className={`w-6 h-0.5 ${
											STEPS.indexOf(step) > i
												? "bg-green-500"
												: "bg-white/10"
										}`}
									/>
								)}
							</div>
						))}
					</div>

					{/* Error */}
					{error && (
						<div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
							<AlertCircle className="w-4 h-4 flex-shrink-0" />
							{error}
						</div>
					)}

					{/* Step content */}
					{step === "connect" && (
						<div className="text-center py-8">
							<div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
								<Youtube className="w-8 h-8 text-red-400" />
							</div>
							<h3 className="text-lg font-medium text-white mb-2">
								Connect Your YouTube Account
							</h3>
							<p className="text-[var(--text-muted)] text-sm mb-6 max-w-sm mx-auto">
								Link your YouTube channel to apply content constraints to your uploads.
							</p>
							<button
								onClick={handleConnectYouTube}
								disabled={loading}
								className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center gap-2 mx-auto"
							>
								{loading ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Youtube className="w-5 h-5" />
								)}
								Connect YouTube
							</button>
						</div>
					)}

					{step === "select" && (
						<div>
							<h3 className="text-sm font-medium text-white mb-3">
								Select Your Channel
							</h3>
							<p className="text-xs text-[var(--text-muted)] mb-4">
								Choose which channel should follow the constraints derived from {referenceChannelName}
							</p>

							<div className="space-y-2 mb-6">
								{channels.map((channel) => (
									<button
										key={channel.id}
										onClick={() => handleSelectChannel(channel)}
										className={`w-full p-3 rounded-xl border transition-all flex items-center gap-3 ${
											selectedChannel?.id === channel.id
												? "border-cyan-500 bg-cyan-500/10"
												: "border-[var(--frosted-border)] hover:border-white/20 hover:bg-white/5"
										}`}
									>
										{channel.thumbnail ? (
											<img
												src={channel.thumbnail}
												alt={channel.title}
												className="w-10 h-10 rounded-full object-cover"
											/>
										) : (
											<div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
												<Youtube className="w-5 h-5 text-[var(--text-muted)]" />
											</div>
										)}
										<div className="flex-1 text-left">
											<p className="font-medium text-white text-sm">
												{channel.title}
											</p>
											{channel.subscriberCount !== undefined && (
												<p className="text-xs text-[var(--text-muted)]">
													{channel.subscriberCount.toLocaleString()} subscribers
												</p>
											)}
										</div>
										{selectedChannel?.id === channel.id && (
											<Check className="w-5 h-5 text-cyan-400" />
										)}
									</button>
								))}
							</div>

							<button
								onClick={handleDeriveConstraints}
								disabled={!selectedChannel}
								className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								Derive Constraints
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					)}

					{step === "deriving" && (
						<div className="text-center py-12">
							<Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
							<h3 className="text-lg font-medium text-white mb-2">
								Analyzing Channel
							</h3>
							<p className="text-[var(--text-muted)] text-sm">
								Extracting patterns from {referenceChannelName}...
							</p>
							<p className="text-[var(--text-muted)] text-xs mt-2">
								This may take a moment
							</p>
						</div>
					)}

					{step === "post" && (
						<div className="space-y-5">
							<div>
								<h3 className="text-sm font-medium text-white mb-1">
									Post Your Video
								</h3>
								<p className="text-xs text-[var(--text-muted)]">
									Upload a video using the constraints derived from {referenceChannelName}
								</p>
							</div>

							{/* Video Upload */}
							<div>
								<label className="text-xs font-medium text-white mb-2 block">
									Video File *
								</label>
								<label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[var(--frosted-border)] rounded-xl cursor-pointer hover:border-cyan-500/50 hover:bg-white/5 transition-all">
									{videoFile ? (
										<div className="flex flex-col items-center">
											<Check className="w-6 h-6 text-green-400 mb-1" />
											<span className="text-sm text-white">{videoFile.name}</span>
											<span className="text-xs text-[var(--text-muted)]">
												{(videoFile.size / 1024 / 1024).toFixed(2)} MB
											</span>
										</div>
									) : (
										<div className="flex flex-col items-center">
											<Upload className="w-6 h-6 text-[var(--text-muted)] mb-1" />
											<span className="text-sm text-[var(--text-muted)]">
												Click to upload video
											</span>
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

							{/* Content Type */}
							<div>
								<label className="text-xs font-medium text-white mb-2 block">
									Content Type
								</label>
								<div className="flex gap-2">
									<button
										onClick={() => setContentType("video")}
										className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
											contentType === "video"
												? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400"
												: "bg-white/5 border border-[var(--frosted-border)] text-white/80 hover:bg-white/10"
										}`}
									>
										Regular Video
									</button>
									<button
										onClick={() => setContentType("shorts")}
										className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
											contentType === "shorts"
												? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400"
												: "bg-white/5 border border-[var(--frosted-border)] text-white/80 hover:bg-white/10"
										}`}
									>
										YouTube Shorts
									</button>
								</div>
							</div>

							{/* Title */}
							<div>
								<label className="text-xs font-medium text-white mb-2 block">
									Title * {settings?.constraints?.title?.maxLength && (
										<span className="text-white/70">
											(max {settings.constraints.title.maxLength} chars)
										</span>
									)}
								</label>
								<input
									type="text"
									value={videoTitle}
									onChange={(e) => setVideoTitle(e.target.value)}
									placeholder="Enter a compelling title..."
									maxLength={settings?.constraints?.title?.maxLength || 100}
									className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-colors"
								/>
								<div className="text-xs text-white/70 mt-1">
									{videoTitle.length}/{settings?.constraints?.title?.maxLength || 100} characters
								</div>
							</div>

							{/* Description */}
							<div>
								<label className="text-xs font-medium text-white mb-2 block">
									Description
								</label>
								<textarea
									value={videoDescription}
									onChange={(e) => setVideoDescription(e.target.value)}
									placeholder="Add a description for your video..."
									rows={4}
									className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
								/>
							</div>

							{/* Tags */}
							<div>
								<label className="text-xs font-medium text-white mb-2 block">
									Tags (click to add to description)
								</label>
								<div className="flex flex-wrap gap-2 mb-3">
									{suggestedTags.map((tag) => (
										<button
											key={tag}
											onClick={() => handleAddTagToDescription(tag)}
											className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
												videoTags.includes(tag)
													? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400"
													: "bg-white/10 border border-white/20 text-white hover:bg-white/20"
											}`}
										>
											#{tag}
										</button>
									))}
								</div>

								{/* Custom tag input */}
								<div className="flex gap-2">
									<input
										type="text"
										value={customTag}
										onChange={(e) => setCustomTag(e.target.value)}
										onKeyPress={(e) => e.key === "Enter" && handleAddCustomTag()}
										placeholder="Add custom tag..."
										className="flex-1 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none focus:border-cyan-500/50 transition-colors"
									/>
									<button
										onClick={handleAddCustomTag}
										className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
									>
										<Plus className="w-4 h-4" />
									</button>
								</div>

							</div>

							{/* Thumbnail Upload */}
							{contentType === "video" && (
								<div>
									<label className="text-xs font-medium text-white mb-2 block">
										Custom Thumbnail (Optional)
									</label>
									<label className="flex items-center gap-4 p-3 border-2 border-dashed border-[var(--frosted-border)] rounded-xl cursor-pointer hover:border-cyan-500/50 hover:bg-white/5 transition-all">
										{thumbnailPreview ? (
											<img
												src={thumbnailPreview}
												alt="Thumbnail preview"
												className="w-20 h-12 object-cover rounded-lg"
											/>
										) : (
											<div className="w-20 h-12 bg-black/40 rounded-lg flex items-center justify-center">
												<ImageIcon className="w-5 h-5 text-white/60" />
											</div>
										)}
										<div className="flex-1">
											<span className="text-sm text-white block">
												{selectedThumbnail ? selectedThumbnail.name : "Click to upload thumbnail"}
											</span>
											<span className="text-xs text-white/70">
												JPG or PNG, max 2MB
											</span>
										</div>
										<input
											type="file"
											accept="image/jpeg,image/png"
											onChange={handleThumbnailSelect}
											className="hidden"
										/>
									</label>
								</div>
							)}

							{/* Visibility */}
							<div>
								<label className="text-xs font-medium text-white mb-2 block">
									Visibility
								</label>
								<div className="flex gap-2">
									{(["public", "unlisted", "private"] as const).map((v) => (
										<button
											key={v}
											onClick={() => setVideoVisibility(v)}
											className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${
												videoVisibility === v
													? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-400"
													: "bg-white/5 border border-[var(--frosted-border)] text-white/80 hover:bg-white/10"
											}`}
										>
											{v}
										</button>
									))}
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-3 pt-2">
								<button
									onClick={() => setStep("select")}
									className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
								>
									Back
								</button>
								<button
									onClick={handlePostVideo}
									disabled={uploading || !videoFile || !videoTitle.trim()}
									className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									{uploading ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Uploading...
										</>
									) : (
										<>
											<Upload className="w-4 h-4" />
											Post Video
										</>
									)}
								</button>
							</div>

							{/* Skip option */}
							<button
								onClick={() => setStep("success")}
								className="w-full py-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors flex items-center justify-center gap-1"
							>
								Skip for now
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
					)}

					{step === "success" && settings && (
						<div>
							<div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
								<Check className="w-5 h-5 text-green-400" />
								<span className="text-green-400 text-sm font-medium">
									{uploadSuccess ? "Video uploaded successfully!" : "Constraints derived successfully!"}
								</span>
							</div>

							<ConstraintDisplay constraints={settings.constraints} />

							<div className="mt-6">
								<button
									onClick={onClose}
									className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium transition-all hover:opacity-90"
								>
									Done
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
