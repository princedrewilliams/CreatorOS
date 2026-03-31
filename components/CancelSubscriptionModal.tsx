"use client";

import { useState } from "react";
import { X, AlertTriangle, FlaskConical, Copy, Calendar, Search, Image } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface CancelSubscriptionModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const FEATURES_TO_LOSE = [
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
		icon: <Image className="w-4 h-4" />,
		title: "Thumbnail Templates",
		description: "Generate thumbnails matching top performers",
	},
	{
		icon: <Calendar className="w-4 h-4" />,
		title: "Smart Scheduling",
		description: "Plan and schedule content with constraints",
	},
	{
		icon: <Search className="w-4 h-4" />,
		title: "SEO Constraints",
		description: "Optimize titles and descriptions automatically",
	},
];

export function CancelSubscriptionModal({ isOpen, onClose }: CancelSubscriptionModalProps) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const cancelSubscription = useAppStore((state) => state.cancelSubscription);

	if (!isOpen) return null;

	const handleCancel = async () => {
		setLoading(true);
		setError(null);

		const result = await cancelSubscription();

		if (result.success) {
			onClose();
		} else {
			setError(result.error || "Failed to cancel subscription");
		}

		setLoading(false);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg mx-4 bg-[var(--frosted-bg)] backdrop-blur-xl border border-[var(--frosted-border)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
				{/* Gradient accent - red for warning */}
				<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 p-1 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors"
				>
					<X className="w-5 h-5" />
				</button>

				{/* Content */}
				<div className="p-6">
					{/* Header */}
					<div className="text-center mb-6">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 mb-4">
							<AlertTriangle className="w-6 h-6 text-white" />
						</div>
						<h2 className="text-xl font-semibold text-white mb-2">
							Cancel Subscription?
						</h2>
						<p className="text-[var(--text-secondary)] text-sm">
							Are you sure you want to cancel your Pro subscription?
						</p>
					</div>

					{/* Features they'll lose */}
					<div className="mb-6">
						<p className="text-sm text-[var(--text-muted)] mb-3">
							You&apos;ll lose access to these Pro features:
						</p>
						<div className="space-y-2">
							{FEATURES_TO_LOSE.map((feature, index) => (
								<div
									key={index}
									className="flex items-center gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10"
								>
									<div className="flex-shrink-0 w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
										{feature.icon}
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="text-sm font-medium text-white">
											{feature.title}
										</h3>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Error */}
					{error && (
						<div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
							{error}
						</div>
					)}

					{/* Action buttons */}
					<div className="grid grid-cols-2 gap-3">
						{/* Keep Subscription */}
						<button
							onClick={onClose}
							disabled={loading}
							className="p-3 rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-pink-500/10 hover:from-violet-500/20 hover:to-pink-500/20 transition-all text-white font-medium disabled:opacity-50"
						>
							Keep My Subscription
						</button>

						{/* Confirm Cancel */}
						<button
							onClick={handleCancel}
							disabled={loading}
							className="relative p-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-all text-red-400 font-medium disabled:opacity-50"
						>
							{loading ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
									<span>Cancelling...</span>
								</div>
							) : (
								"Yes, Cancel"
							)}
						</button>
					</div>

					{/* Footer */}
					<p className="text-center text-xs text-[var(--text-muted)] mt-4">
						You can re-subscribe anytime to regain access to Pro features.
					</p>
				</div>
			</div>
		</div>
	);
}
