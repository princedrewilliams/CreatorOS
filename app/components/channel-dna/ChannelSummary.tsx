"use client";

import { useState } from "react";
import { FileText, Download, X, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Portal } from "@/app/components/ui/Portal";

interface ChannelSummaryProps {
	channelName: string;
	channelId: string;
	score: {
		total: number;
		categories: Record<string, number>;
		strengths: { category: string; score: number }[];
		weaknesses: { category: string; score: number }[];
	};
	metrics: {
		postingFrequency: string;
		averageTitleLength: number;
		commonKeywords: { word: string; count: number }[];
	};
	videos: { views?: number; likes?: number; comments?: number }[];
}

interface Summary {
	snapshot: {
		name: string;
		niche: string;
		sizeTier: string;
		healthScore: number;
		confidence: "high" | "medium" | "low";
	};
	whatsWorking: string[];
	whatsHurting: string[];
	patternDiagnosis: string;
	confidenceLevel: "high" | "medium" | "low";
}

export function ChannelSummary({
	channelName,
	channelId,
	score,
	metrics,
	videos,
}: ChannelSummaryProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [summary, setSummary] = useState<Summary | null>(null);
	const [exporting, setExporting] = useState<string | null>(null);

	const fetchSummary = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/channel-summary", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelName, channelId, score, metrics, videos }),
			});
			if (!res.ok) throw new Error("Failed to generate summary");
			const data = await res.json();
			setSummary(data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleOpen = () => {
		setIsOpen(true);
		if (!summary) fetchSummary();
	};

	const handleExport = async (format: "csv" | "markdown") => {
		setExporting(format);
		try {
			const res = await fetch("/api/channel-summary", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelName, channelId, score, metrics, videos, format }),
			});
			if (!res.ok) throw new Error("Export failed");

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${channelName.replace(/[^a-zA-Z0-9]/g, "_")}_summary.${format === "csv" ? "csv" : "md"}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error(err);
		} finally {
			setExporting(null);
		}
	};

	const getConfidenceBadge = (confidence: string) => {
		const colors = {
			high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
			medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
			low: "bg-red-500/20 text-red-400 border-red-500/30",
		};
		return colors[confidence as keyof typeof colors] || colors.medium;
	};

	return (
		<>
			{/* Trigger Button */}
			<button
				onClick={handleOpen}
				className="flex items-center gap-2 px-4 py-2 bg-[var(--frosted-bg)] backdrop-blur-sm border border-[var(--frosted-border)] rounded-xl hover:bg-[var(--frosted-bg-hover)] transition-colors text-sm text-[var(--text-secondary)] hover:text-white"
			>
				<FileText className="w-4 h-4" />
				<span>Summary</span>
			</button>

			{/* Modal Overlay */}
			{isOpen && (
				<Portal>
					<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
						{/* Backdrop */}
						<div
							className="fixed inset-0 bg-black/80 backdrop-blur-sm"
							onClick={() => setIsOpen(false)}
						/>

						{/* Modal */}
						<div className="relative w-full max-w-2xl my-8 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl">
						{/* Header */}
						<div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10 bg-[#0a0a0a] rounded-t-2xl">
							<h2 className="text-lg font-semibold text-white">Channel Summary</h2>
							<button
								onClick={() => setIsOpen(false)}
								className="p-2 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5 text-white" />
							</button>
						</div>

						{/* Content */}
						<div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
							{loading ? (
								<div className="flex flex-col items-center justify-center py-12 space-y-4">
									<Loader2 className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
									<p className="text-white">Generating summary...</p>
								</div>
							) : summary ? (
								<>
									{/* Snapshot */}
									<div className="space-y-3">
										<h3 className="text-sm font-medium text-white uppercase tracking-wider">
											Channel Snapshot
										</h3>
										<div className="grid grid-cols-2 gap-3">
											<div className="p-3 bg-white/5 rounded-lg">
												<p className="text-xs text-white/70">Niche</p>
												<p className="text-sm text-white mt-1">{summary.snapshot.niche}</p>
											</div>
											<div className="p-3 bg-white/5 rounded-lg">
												<p className="text-xs text-white/70">Health Score</p>
												<p className="text-sm text-white mt-1">
													<span className={`font-semibold ${summary.snapshot.healthScore >= 70 ? "text-emerald-400" : summary.snapshot.healthScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
														{summary.snapshot.healthScore}
													</span>
													/100
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-white/70">Confidence:</span>
											<span className={`px-2 py-0.5 text-xs rounded-full border ${getConfidenceBadge(summary.confidenceLevel)}`}>
												{summary.confidenceLevel}
											</span>
										</div>
									</div>

									{/* What's Working */}
									<div className="space-y-3">
										<h3 className="flex items-center gap-2 text-sm font-medium text-emerald-400">
											<CheckCircle className="w-4 h-4" />
											What's Working
										</h3>
										<div className="space-y-2">
											{summary.whatsWorking.map((item, i) => (
												<div
													key={i}
													className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg"
												>
													<p className="text-sm text-white">{item}</p>
												</div>
											))}
										</div>
									</div>

									{/* What's Hurting */}
									<div className="space-y-3">
										<h3 className="flex items-center gap-2 text-sm font-medium text-amber-400">
											<AlertTriangle className="w-4 h-4" />
											What's Hurting Growth
										</h3>
										<div className="space-y-2">
											{summary.whatsHurting.map((item, i) => (
												<div
													key={i}
													className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg"
												>
													<p className="text-sm text-white">{item}</p>
												</div>
											))}
										</div>
									</div>

									{/* Pattern Diagnosis */}
									<div className="space-y-3">
										<h3 className="text-sm font-medium text-white uppercase tracking-wider">
											Pattern Diagnosis
										</h3>
										<div className="p-4 bg-white/5 border border-white/10 rounded-lg">
											<p className="text-sm text-white leading-relaxed">
												{summary.patternDiagnosis}
											</p>
										</div>
									</div>

									{/* Export Buttons */}
									<div className="pt-4 border-t border-white/10">
										<p className="text-xs text-white/70 mb-3">Export Summary</p>
										<div className="flex gap-3">
											<button
												onClick={() => handleExport("csv")}
												disabled={exporting !== null}
												className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
											>
												{exporting === "csv" ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Download className="w-4 h-4" />
												)}
												CSV (Sheets)
											</button>
											<button
												onClick={() => handleExport("markdown")}
												disabled={exporting !== null}
												className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
											>
												{exporting === "markdown" ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Download className="w-4 h-4" />
												)}
												Markdown (Notion)
											</button>
										</div>
									</div>
								</>
							) : (
								<div className="py-12 text-center text-white">
									Failed to load summary. Please try again.
								</div>
							)}
							</div>
						</div>
					</div>
				</Portal>
			)}
		</>
	);
}
