"use client";

import { useState } from "react";
import { X, Crown, FlaskConical, Copy, Calendar, Search, Image } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface UpgradeModalProps {
	isOpen: boolean;
	onClose: () => void;
	feature?: string;
}

const PRO_BENEFITS = [
	{
		icon: <FlaskConical className="w-4 h-4" />,
		title: "Learning Lab",
		description: "Deep analysis of any channel's content strategy",
	},
	{
		icon: <Copy className="w-4 h-4" />,
		title: "Replicate This",
		description: "Derive content constraints from top performers",
	},
	{
		icon: <Calendar className="w-4 h-4" />,
		title: "Advanced Scheduling",
		description: "Plan and schedule content with constraints",
	},
	{
		icon: <Search className="w-4 h-4" />,
		title: "SEO Constraints",
		description: "Optimize titles and descriptions automatically",
	},
	{
		icon: <Image className="w-4 h-4" />,
		title: "Thumbnail Templates",
		description: "Generate thumbnails matching top performers",
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

			// Update local store
			setIsPro(true);

			// Close modal and show success
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Purchase failed");
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg mx-4 bg-[var(--surface-bg)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
				{/* Gradient accent */}
				<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500" />

				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Content */}
				<div className="p-6">
					{/* Header */}
					<div className="text-center mb-6">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
							<Crown className="w-6 h-6 text-white" />
						</div>
						<h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
							Upgrade to Pro
						</h2>
						{feature && (
							<p className="text-[var(--text-secondary)] text-sm">
								<span className="text-[var(--text-primary)] font-medium">{feature}</span> is a Pro feature
							</p>
						)}
					</div>

					{/* Benefits */}
					<div className="space-y-3 mb-6">
						{PRO_BENEFITS.map((benefit, index) => (
							<div
								key={index}
								className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-elevated)]"
							>
								<div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-violet-400">
									{benefit.icon}
								</div>
								<div>
									<h3 className="text-sm font-medium text-[var(--text-primary)]">
										{benefit.title}
									</h3>
									<p className="text-xs text-[var(--text-muted)]">
										{benefit.description}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Error */}
					{error && (
						<div className="mb-4 p-3 rounded-lg bg-[var(--status-error-bg)] border border-[var(--status-error-border)] text-[var(--status-error-text)] text-sm">
							{error}
						</div>
					)}

					{/* Pricing buttons */}
					<div className="grid grid-cols-2 gap-3">
						{/* Monthly */}
						<button
							onClick={() => handlePurchase("monthly")}
							disabled={loading !== null}
							className="relative p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] transition-all group disabled:opacity-50"
						>
							<div className="text-left">
								<span className="text-2xl font-bold text-[var(--text-primary)]">$19</span>
								<span className="text-[var(--text-muted)] text-sm">/mo</span>
							</div>
							<p className="text-xs text-[var(--text-muted)] mt-1">
								Monthly billing
							</p>
							{loading === "monthly" && (
								<div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-bg)]/80 rounded-xl">
									<div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</button>

						{/* Annual */}
						<button
							onClick={() => handlePurchase("annual")}
							disabled={loading !== null}
							className="relative p-4 rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-pink-500/10 hover:from-violet-500/20 hover:to-pink-500/20 transition-all group disabled:opacity-50"
						>
							<div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-[10px] font-semibold text-white uppercase">
								Save 35%
							</div>
							<div className="text-left">
								<span className="text-2xl font-bold text-[var(--text-primary)]">$149</span>
								<span className="text-[var(--text-muted)] text-sm">/yr</span>
							</div>
							<p className="text-xs text-[var(--text-muted)] mt-1">
								$12.42/mo billed annually
							</p>
							{loading === "annual" && (
								<div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-bg)]/80 rounded-xl">
									<div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</button>
					</div>

					{/* Footer */}
					<p className="text-center text-xs text-[var(--text-muted)] mt-4">
						Cancel anytime. 7-day money-back guarantee.
					</p>
				</div>
			</div>
		</div>
	);
}
