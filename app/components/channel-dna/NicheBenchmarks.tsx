"use client";

import { useState } from "react";
import { Users, TrendingUp, BarChart3, Loader2, ChevronRight } from "lucide-react";
import { Portal } from "@/app/components/ui/Portal";

interface NicheChannel {
	id: string;
	title: string;
	thumbnail: string;
	subscriberCount: number;
	viewCount: number;
	videoCount: number;
	avgViews: number;
}

interface NicheBenchmark {
	channels: NicheChannel[];
	medianSubscribers: number;
	medianViews: number;
	medianVideos: number;
	avgUploadFrequency: string;
	topPatterns: string[];
	channelPosition: {
		subscriberPercentile: number;
		viewsPercentile: number;
		verdict: string;
	};
}

interface NicheBenchmarksProps {
	channelId: string;
	keywords: string[];
	subscriberCount?: number;
	viewCount?: number;
	videoCount?: number;
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
	return num.toString();
}

export function NicheBenchmarks({
	channelId,
	keywords,
	subscriberCount,
	viewCount,
	videoCount,
}: NicheBenchmarksProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<NicheBenchmark | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchBenchmarks = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/niche-benchmarks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					channelId,
					keywords,
					subscriberCount,
					viewCount,
					videoCount,
				}),
			});
			if (!res.ok) throw new Error("Failed to fetch benchmarks");
			const result = await res.json();
			setData(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load");
		} finally {
			setLoading(false);
		}
	};

	const handleOpen = () => {
		setIsOpen(true);
		if (!data) fetchBenchmarks();
	};

	const getPercentileColor = (pct: number) => {
		if (pct >= 75) return "text-[var(--status-success-text)]";
		if (pct >= 50) return "text-[var(--text-primary)]";
		if (pct >= 25) return "text-[var(--status-warning-text)]";
		return "text-[var(--status-error-text)]";
	};

	return (
		<>
			{/* Trigger Button */}
			<button
				onClick={handleOpen}
				className="flex items-center gap-2 px-4 py-2 bg-[var(--frosted-bg)] backdrop-blur-sm border border-[var(--frosted-border)] rounded-xl hover:bg-[var(--frosted-bg-hover)] transition-colors text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
			>
				<BarChart3 className="w-4 h-4" />
				<span>Niche Benchmarks</span>
			</button>

			{/* Modal */}
			{isOpen && (
				<Portal>
					<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
						<div
							className="fixed inset-0 bg-black/80 backdrop-blur-sm"
							onClick={() => setIsOpen(false)}
						/>

						<div className="relative w-full max-w-3xl my-8 bg-[var(--surface-bg)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl">
						{/* Header */}
						<div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[var(--border-subtle)] bg-[var(--surface-bg)] rounded-t-2xl">
							<div>
								<h2 className="text-lg font-semibold text-[var(--text-primary)]">Niche Benchmarks</h2>
								<p className="text-sm text-[var(--text-muted)] mt-1">
									Comparing against {data?.channels.length || 0} similar channels
								</p>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-primary)] text-xl font-bold"
							>
								×
							</button>
						</div>

						{/* Content */}
						<div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
							{loading ? (
								<div className="flex flex-col items-center justify-center py-12 space-y-4">
									<Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
									<p className="text-[var(--text-secondary)]">Finding similar channels...</p>
								</div>
							) : error ? (
								<div className="text-center py-12">
									<p className="text-[var(--status-error-text)]">{error}</p>
									<button
										onClick={fetchBenchmarks}
										className="mt-4 px-4 py-2 bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-sm text-[var(--text-primary)]"
									>
										Try Again
									</button>
								</div>
							) : data ? (
								<>
									{/* Position Summary */}
									<div className="p-4 bg-gradient-to-r from-[var(--accent-primary)]/10 to-purple-500/10 border border-[var(--accent-primary)]/20 rounded-xl">
										<h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Your Position</h3>
										<div className="grid grid-cols-2 gap-4 mb-3">
											<div>
												<p className="text-xs text-[var(--text-muted)]">Subscriber Percentile</p>
												<p className={`text-2xl font-bold ${getPercentileColor(data.channelPosition.subscriberPercentile)}`}>
													{data.channelPosition.subscriberPercentile}%
												</p>
											</div>
											<div>
												<p className="text-xs text-[var(--text-muted)]">Views Percentile</p>
												<p className={`text-2xl font-bold ${getPercentileColor(data.channelPosition.viewsPercentile)}`}>
													{data.channelPosition.viewsPercentile}%
												</p>
											</div>
										</div>
										<p className="text-sm text-[var(--text-primary)]">
											{data.channelPosition.verdict}
										</p>
									</div>

									{/* Niche Medians */}
									<div className="space-y-3">
										<h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
											Niche Medians
										</h3>
										<div className="grid grid-cols-3 gap-3">
											<div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
												<Users className="w-4 h-4 text-[var(--text-muted)] mb-2" />
												<p className="text-lg font-semibold text-[var(--text-primary)]">
													{formatNumber(data.medianSubscribers)}
												</p>
												<p className="text-xs text-[var(--text-muted)]">Subscribers</p>
											</div>
											<div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
												<TrendingUp className="w-4 h-4 text-[var(--text-muted)] mb-2" />
												<p className="text-lg font-semibold text-[var(--text-primary)]">
													{formatNumber(data.medianViews)}
												</p>
												<p className="text-xs text-[var(--text-muted)]">Total Views</p>
											</div>
											<div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
												<BarChart3 className="w-4 h-4 text-[var(--text-muted)] mb-2" />
												<p className="text-lg font-semibold text-[var(--text-primary)]">
													{data.medianVideos}
												</p>
												<p className="text-xs text-[var(--text-muted)]">Videos</p>
											</div>
										</div>
									</div>

									{/* Patterns */}
									<div className="space-y-3">
										<h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
											Niche Patterns
										</h3>
										<div className="space-y-2">
											{data.topPatterns.map((pattern, i) => (
												<div
													key={i}
													className="flex items-start gap-2 p-3 bg-[var(--surface-elevated)] rounded-lg"
												>
													<ChevronRight className="w-4 h-4 text-[var(--accent-primary)] mt-0.5" />
													<p className="text-sm text-[var(--text-primary)]">{pattern}</p>
												</div>
											))}
										</div>
									</div>

									{/* Similar Channels */}
									<div className="space-y-3">
										<h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
											Similar Channels
										</h3>
										<div className="grid grid-cols-2 gap-3">
											{data.channels.map((channel) => (
												<a
													key={channel.id}
													href={`https://youtube.com/channel/${channel.id}`}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-3 p-3 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-default)] transition-colors"
												>
													<img
														src={channel.thumbnail}
														alt={channel.title}
														className="w-10 h-10 rounded-full"
													/>
													<div className="flex-1 min-w-0">
														<p className="text-sm text-[var(--text-primary)] truncate">{channel.title}</p>
														<p className="text-xs text-[var(--text-muted)]">
															{formatNumber(channel.subscriberCount)} subs
														</p>
													</div>
												</a>
											))}
										</div>
									</div>
								</>
							) : null}
							</div>
						</div>
					</div>
				</Portal>
			)}
		</>
	);
}
