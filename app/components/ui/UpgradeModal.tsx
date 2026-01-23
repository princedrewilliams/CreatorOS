"use client";

import { X, FlaskConical, Copy, Calendar, Image, Check, Search } from "lucide-react";

// Sparkle elements for decoration
function SparkleElements() {
	return (
		<>
			{[...Array(8)].map((_, i) => (
				<div
					key={i}
					className={`sparkle sparkle-${(i % 5) + 1}`}
					style={{
						top: `${15 + Math.random() * 70}%`,
						left: `${10 + Math.random() * 80}%`,
						width: `${3 + Math.random() * 5}px`,
						height: `${3 + Math.random() * 5}px`,
					}}
				/>
			))}
		</>
	);
}

// Floating particles
function FloatingParticles() {
	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			{[...Array(5)].map((_, i) => (
				<div
					key={i}
					className="particle"
					style={{
						left: `${15 + i * 18}%`,
						top: `${70 + (i % 2) * 15}%`,
						animationDelay: `${i * 2}s`,
						animationDuration: `${6 + i * 2}s`,
					}}
				/>
			))}
		</div>
	);
}

interface UpgradeModalProps {
	isOpen: boolean;
	onClose: () => void;
	feature?: string;
}

const PRO_FEATURES = [
	{
		icon: <FlaskConical className="w-5 h-5" />,
		title: "Learning Lab",
		description: "Understand why videos perform — not just the numbers.",
		iconColor: "text-emerald-400",
		bgColor: "bg-emerald-500/20",
	},
	{
		icon: <Copy className="w-5 h-5" />,
		title: "Replicate This",
		description: "Publish using the same structure as top channels.",
		iconColor: "text-blue-400",
		bgColor: "bg-blue-500/20",
	},
	{
		icon: <Image className="w-5 h-5" />,
		title: "Thumbnail Templates",
		description: "Design thumbnails that follow winning layouts.",
		iconColor: "text-pink-400",
		bgColor: "bg-pink-500/20",
	},
	{
		icon: <Calendar className="w-5 h-5" />,
		title: "Smart Scheduling",
		description: "Publish on-strategy, every time.",
		iconColor: "text-amber-400",
		bgColor: "bg-amber-500/20",
	},
	{
		icon: <Search className="w-5 h-5" />,
		title: "SEO Constraints",
		description: "Optimize titles and descriptions for discoverability.",
		iconColor: "text-cyan-400",
		bgColor: "bg-cyan-500/20",
	},
];

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
	if (!isOpen) return null;

	const WHOP_MONTHLY_URL = "https://whop.com/checkout/plan_uCWZ74OHuB0JW";
	const WHOP_ANNUAL_URL = "https://whop.com/checkout/plan_Mz6XWM8o9oz2C";

	const handlePurchase = (planType: "monthly" | "annual") => {
		const url = planType === "monthly" ? WHOP_MONTHLY_URL : WHOP_ANNUAL_URL;
		window.open(url, "_blank");
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-md"
				onClick={onClose}
			/>

			{/* Modal with rainbow animated border */}
			<div className="relative w-full max-w-md rainbow-border-animated rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
				<div className="relative bg-[#0a0a12] rounded-2xl overflow-hidden">
					{/* Animated gradient accent */}
					<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 animate-pulse" />

					{/* Sparkle effects */}
					<SparkleElements />

					{/* Floating particles */}
					<FloatingParticles />

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
								<div className={`flex-shrink-0 w-9 h-9 rounded-lg ${item.bgColor} flex items-center justify-center ${item.iconColor}`}>
									{item.icon}
								</div>
								<div>
									<h3 className="text-sm font-medium text-white">
										{item.title}
									</h3>
									<p className="text-xs text-white/80">
										{item.description}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Pricing */}
					<div className="space-y-3 mb-4">
						{/* Monthly - Primary */}
						<button
							onClick={() => handlePurchase("monthly")}
							className="relative w-full p-4 rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-pink-500/10 hover:from-violet-500/20 hover:to-pink-500/20 transition-all"
						>
							<div className="flex items-center justify-between">
								<div className="text-left">
									<span className="text-2xl font-bold text-white">$29</span>
									<span className="text-white/90 text-sm"> / month</span>
								</div>
								<span className="text-xs text-white font-medium bg-violet-500/30 px-2 py-1 rounded pulse-badge">Recommended</span>
							</div>
						</button>

						{/* Annual */}
						<button
							onClick={() => handlePurchase("annual")}
							className="relative w-full p-4 rounded-xl border border-[var(--frosted-border)] bg-white/5 hover:bg-white/10 transition-all"
						>
							<div className="flex items-center justify-between">
								<div className="text-left">
									<span className="text-2xl font-bold text-white">$290</span>
									<span className="text-white/90 text-sm"> / year</span>
								</div>
								<span className="text-xs text-white font-medium bg-emerald-500/30 px-2 py-1 rounded">Save 2 months</span>
							</div>
						</button>
					</div>

					{/* Secondary CTA */}
					<button
						onClick={onClose}
						className="w-full text-center text-sm text-white/60 hover:text-white transition-colors py-2"
					>
						Continue with Free Analytics
					</button>

					{/* Trust signals */}
					<div className="flex items-center justify-center gap-2 sm:gap-4 mt-4 pt-4 border-t border-white/5 flex-wrap">
						<span className="flex items-center gap-1 text-xs text-white/90">
							<Check className="w-3 h-3 text-emerald-400" />
							No credits
						</span>
						<span className="flex items-center gap-1 text-xs text-white/90">
							<Check className="w-3 h-3 text-emerald-400" />
							No hidden limits
						</span>
						<span className="flex items-center gap-1 text-xs text-white/90">
							<Check className="w-3 h-3 text-emerald-400" />
							Cancel anytime
						</span>
					</div>
				</div>
				</div>
			</div>
		</div>
	);
}
