"use client";

import { useState } from "react";
import { X, FlaskConical, Copy, Calendar, Image, Check } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface UpgradeModalProps {
	isOpen: boolean;
	onClose: () => void;
	feature?: string;
}

const PRO_FEATURES = [
	{
		icon: <FlaskConical className="w-4 h-4" />,
		title: "Learning Lab Pro",
		description: "Understand why videos perform — not just the numbers.",
	},
	{
		icon: <Copy className="w-4 h-4" />,
		title: "Replicate This",
		description: "Publish using the same structure as top channels.",
	},
	{
		icon: <Image className="w-4 h-4" />,
		title: "Thumbnail Templates",
		description: "Design thumbnails that follow winning layouts.",
	},
	{
		icon: <Calendar className="w-4 h-4" />,
		title: "Smart Scheduling",
		description: "Publish on-strategy every time.",
	},
];

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
	const [loading, setLoading] = useState<"monthly" | "annual" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const setIsPro = useAppStore((state) => state.setIsPro);

	if (!isOpen) return null;

	const handlePurchase = async (planType: "monthly" | "annual") => {
		setLoading(planType);
		setError(null);

		try {
			const response = await fetch("/api/subscription/purchase", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planType }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to process purchase");
			}

			setIsPro(true);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Purchase failed");
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-md"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-md bg-[#0a0a12] border border-[var(--frosted-border)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
				{/* Gradient accent */}
				<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500" />

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
					<div className="mb-6">
						<h2 className="text-xl font-semibold text-white mb-2">
							Unlock Pro
						</h2>
						<p className="text-[var(--text-secondary)] text-sm">
							Replicate proven creators, publish with data-backed constraints, and access advanced insights.
						</p>
						{feature && (
							<p className="text-[var(--text-muted)] text-xs mt-2">
								<span className="text-violet-400">{feature}</span> requires Pro
							</p>
						)}
					</div>

					{/* Features */}
					<div className="space-y-3 mb-6">
						{PRO_FEATURES.map((item, index) => (
							<div key={index} className="flex items-start gap-3">
								<div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
									{item.icon}
								</div>
								<div>
									<h3 className="text-sm font-medium text-white">
										{item.title}
									</h3>
									<p className="text-xs text-[var(--text-muted)]">
										{item.description}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Error */}
					{error && (
						<div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
							{error}
						</div>
					)}

					{/* Pricing */}
					<div className="space-y-3 mb-4">
						{/* Monthly - Primary */}
						<button
							onClick={() => handlePurchase("monthly")}
							disabled={loading !== null}
							className="relative w-full p-4 rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-pink-500/10 hover:from-violet-500/20 hover:to-pink-500/20 transition-all disabled:opacity-50"
						>
							<div className="flex items-center justify-between">
								<div className="text-left">
									<span className="text-2xl font-bold text-white">$29</span>
									<span className="text-[var(--text-muted)] text-sm"> / month</span>
								</div>
								<span className="text-xs text-violet-400 font-medium">Recommended</span>
							</div>
							{loading === "monthly" && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</button>

						{/* Annual */}
						<button
							onClick={() => handlePurchase("annual")}
							disabled={loading !== null}
							className="relative w-full p-4 rounded-xl border border-[var(--frosted-border)] bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
						>
							<div className="flex items-center justify-between">
								<div className="text-left">
									<span className="text-2xl font-bold text-white">$290</span>
									<span className="text-[var(--text-muted)] text-sm"> / year</span>
								</div>
								<span className="text-xs text-emerald-400 font-medium">Save 2 months</span>
							</div>
							{loading === "annual" && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</button>
					</div>

					{/* Secondary CTA */}
					<button
						onClick={onClose}
						className="w-full text-center text-sm text-[var(--text-muted)] hover:text-white transition-colors py-2"
					>
						Continue with Free Analytics
					</button>

					{/* Trust signals */}
					<div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/5">
						<span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
							<Check className="w-3 h-3 text-emerald-400" />
							No credits
						</span>
						<span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
							<Check className="w-3 h-3 text-emerald-400" />
							No hidden limits
						</span>
						<span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
							<Check className="w-3 h-3 text-emerald-400" />
							Cancel anytime
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
