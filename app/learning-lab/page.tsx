"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, FlaskConical, AlertCircle } from "lucide-react";
import Link from "next/link";
import { LearningLabTabs, LEARNING_LAB_TABS } from "@/app/components/learning-lab/LearningLabTabs";
import { PillarsPanel } from "@/app/components/learning-lab/PillarsPanel";
import { PackagingPanel } from "@/app/components/learning-lab/PackagingPanel";
import { CommunityPanel } from "@/app/components/learning-lab/CommunityPanel";
import type { LearningLabResponse } from "@/lib/learning-lab/types";

function LearningLabContent() {
	const searchParams = useSearchParams();
	const channelUrl = searchParams.get("channelUrl") || "";

	const [activeTab, setActiveTab] = useState(LEARNING_LAB_TABS[0].id);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<LearningLabResponse | null>(null);

	const fetchAnalysis = useCallback(async () => {
		if (!channelUrl) {
			setError("No channel URL provided. Please go back and enter a channel.");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/learning-lab", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					channelUrl,
					modules: ["pillars", "packaging", "community"],
				}),
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || `Request failed: ${res.status}`);
			}

			const result = await res.json();
			setData(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to analyze channel");
		} finally {
			setLoading(false);
		}
	}, [channelUrl]);

	useEffect(() => {
		fetchAnalysis();
	}, [fetchAnalysis]);

	const renderTabContent = () => {
		if (!data) return null;

		switch (activeTab) {
			case "pillars":
				return data.pillars ? (
					<PillarsPanel data={data.pillars} />
				) : (
					<div className="text-center py-12 text-white/60">
						Pillar analysis not available
					</div>
				);
			case "packaging":
				return data.packaging ? (
					<PackagingPanel data={data.packaging} />
				) : (
					<div className="text-center py-12 text-white/60">
						Packaging analysis not available
					</div>
				);
			case "community":
				return data.community ? (
					<CommunityPanel data={data.community} />
				) : (
					<div className="text-center py-12 text-white/60">
						Community analysis not available
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-[var(--bg-primary)]">
			{/* Header */}
			<div className="border-b border-[var(--frosted-border)] bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)]">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center gap-4">
						<Link
							href={channelUrl ? `/channel-dna?url=${encodeURIComponent(channelUrl)}` : "/"}
							className="p-2 rounded-lg hover:bg-white/5 transition-colors"
						>
							<ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
						</Link>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
								<FlaskConical className="w-5 h-5 text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold text-white">Learning Lab</h1>
								{data?.channel && (
									<p className="text-sm text-[var(--text-muted)]">
										Analyzing: {data.channel.title}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{loading && (
					<div className="flex flex-col items-center justify-center py-24">
						<Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin mb-4" />
						<p className="text-lg text-white font-medium">Analyzing channel...</p>
						<p className="text-sm text-[var(--text-muted)] mt-2">
							This may take up to 30 seconds for 100 videos
						</p>
					</div>
				)}

				{error && !loading && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="max-w-md mx-auto text-center py-24"
					>
						<div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
							<AlertCircle className="w-8 h-8 text-red-400" />
						</div>
						<h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
						<p className="text-[var(--text-muted)] mb-6">{error}</p>
						<button
							onClick={fetchAnalysis}
							className="px-6 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-primary)]/80 transition-colors"
						>
							Try Again
						</button>
					</motion.div>
				)}

				{data && !loading && !error && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
					>
						{/* Channel Info Bar */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-[var(--frosted-bg)] border border-[var(--frosted-border)]">
							<div className="flex items-center gap-3">
								{data.channel.thumbnail && (
									<img
										src={data.channel.thumbnail}
										alt={data.channel.title}
										className="w-12 h-12 rounded-full"
									/>
								)}
								<div>
									<h2 className="text-lg font-semibold text-white">
										{data.channel.title}
									</h2>
									<p className="text-sm text-[var(--text-muted)]">
										{data.videosAnalyzed} videos analyzed
									</p>
								</div>
							</div>
							<div className="flex flex-wrap gap-2">
								{data.overallInsights && (
									<>
										<span className="px-3 py-1 rounded-full text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30">
											{data.overallInsights.contentStrategy.slice(0, 50)}...
										</span>
									</>
								)}
							</div>
						</div>

						{/* Tabs */}
						<div className="mb-6">
							<LearningLabTabs activeTab={activeTab} onTabChange={setActiveTab} />
						</div>

						{/* Tab Content */}
						{renderTabContent()}
					</motion.div>
				)}
			</div>
		</div>
	);
}

export default function LearningLabPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
					<Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
				</div>
			}
		>
			<LearningLabContent />
		</Suspense>
	);
}
