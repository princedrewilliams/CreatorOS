"use client";

import { useState, useEffect } from "react";
import {
	X,
	Copy,
	Youtube,
	ChevronRight,
	Check,
	Loader2,
	ExternalLink,
	AlertCircle,
} from "lucide-react";
import { ConstraintDisplay } from "./ConstraintDisplay";
import { ThumbnailStep } from "./ThumbnailStep";
import { useAppStore } from "@/lib/store";
import type { ReplicationSettings, UserYouTubeChannel } from "@/lib/replicate/types";

interface ReplicateThisModalProps {
	isOpen: boolean;
	onClose: () => void;
	channelUrl: string;
	referenceChannelName: string;
}

type Step = "connect" | "select" | "deriving" | "thumbnail" | "success";

const STEPS: Step[] = ["connect", "select", "deriving", "thumbnail", "success"];

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
	const isPro = useAppStore((state) => state.isPro);

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
		// Pass current URL as return URL so user comes back here after OAuth
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
			// Go to thumbnail step if we have format profile data
			if (data.settings?.constraints?.thumbnail?.formatProfile) {
				setStep("thumbnail");
			} else {
				setStep("success");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to derive constraints");
			setStep("select");
		}
	};

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
					<div className="flex items-center gap-2 mb-6">
						{STEPS.map((s, i) => (
							<div key={s} className="flex items-center gap-2">
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

					{step === "thumbnail" && settings?.constraints?.thumbnail && (
						<ThumbnailStep
							formatProfile={settings.constraints.thumbnail.formatProfile!}
							matchedTemplate={settings.constraints.thumbnail.matchedTemplate!}
							suggestedColors={settings.constraints.thumbnail.suggestedColors}
							isPro={isPro}
							onOpenCanva={() => {
								window.open(
									settings.constraints.thumbnail.matchedTemplate?.deepLinkUrl ||
										"https://www.canva.com/design?create&type=TABzW6DJhNk&category=youtube-thumbnails",
									"_blank"
								);
							}}
							onSkip={() => setStep("success")}
							onContinue={() => setStep("success")}
						/>
					)}

					{step === "success" && settings && (
						<div>
							<div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
								<Check className="w-5 h-5 text-green-400" />
								<span className="text-green-400 text-sm font-medium">
									Constraints derived successfully!
								</span>
							</div>

							<ConstraintDisplay constraints={settings.constraints} />

							<div className="mt-6 flex gap-3">
								<button
									onClick={onClose}
									className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
								>
									Done
								</button>
								<a
									href="/planner"
									className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
								>
									Go to Planner
									<ExternalLink className="w-4 h-4" />
								</a>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
