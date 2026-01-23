"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

// Glowing dots for background
function BackgroundDots() {
	return (
		<>
			{[...Array(15)].map((_, i) => (
				<div
					key={i}
					className={`absolute rounded-full bg-dot-glow sparkle sparkle-${(i % 5) + 1}`}
					style={{
						top: `${5 + (i * 7) % 90}%`,
						left: `${2 + (i * 9) % 96}%`,
						width: `${4 + (i % 4) * 2}px`,
						height: `${4 + (i % 4) * 2}px`,
					}}
				/>
			))}
		</>
	);
}

export default function DashboardPage() {
	const [channelUrl, setChannelUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleAnalyze = async () => {
		if (!channelUrl.trim()) {
			setError("Please enter a channel URL or username.");
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const res = await fetch("/api/channel-analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ channelUrl: channelUrl.trim() }),
			});
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Analysis failed. Please try again.");
			}
			await res.json();
			router.push(`/channel-dna?url=${encodeURIComponent(channelUrl.trim())}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="relative min-h-screen overflow-hidden bg-[var(--page-bg)] text-white flex flex-col">
			{/* Glowing dots background */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
				<BackgroundDots />
			</div>

			{/* Gradient overlays */}
			<div className="absolute inset-0 -z-10">
				<div className="absolute inset-0 bg-gradient-to-b from-[#0a0012] via-[var(--page-bg)] to-[var(--page-bg)]" />
				<div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)]/20 rounded-full blur-[120px]" />
				<div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[100px]" />
			</div>

			{/* Header */}
			<motion.header
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="relative z-20 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full"
			>
				<div className="flex items-center gap-2">
					<Sparkles className="w-6 h-6 text-[var(--accent-primary)]" />
					<span className="text-xl font-bold">CreatorOS</span>
				</div>
			</motion.header>

			{/* Hero section - centered vertically */}
			<section className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-5 md:px-10 pb-20">
				{/* Hero text with animations */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.1 }}
					className="text-center space-y-6 max-w-5xl"
				>
					<h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight">
						Reverse-Engineer
						<br />
						<span className="text-shimmer">
							YouTube Success
						</span>
					</h1>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.7, delay: 0.3 }}
						className="text-lg md:text-xl lg:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed"
					>
						Analyze any channel's patterns, titles, thumbnails, and strategy in seconds.
					</motion.p>
				</motion.div>

				{/* Input bar */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.4 }}
					className="w-full max-w-2xl mt-12"
				>
					<div className="relative">
						{/* Floating particles around input */}
						<FloatingParticles />

						{/* Animated glow effect */}
						<div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-primary)]/30 via-purple-500/20 to-[var(--accent-primary)]/30 rounded-2xl blur-xl opacity-60 animate-pulse" />

						<div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									void handleAnalyze();
								}}
								className="flex flex-col gap-3"
							>
								<div className="flex flex-col sm:flex-row gap-2">
									<div className="flex-1">
										<input
											type="text"
											value={channelUrl}
											onChange={(e) => setChannelUrl(e.target.value)}
											placeholder="youtube.com/@channelname"
											className="w-full h-14 px-5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/40 text-base focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
										/>
									</div>
									<button
										type="submit"
										disabled={loading}
										className="h-14 px-8 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[#ff79c9] text-white font-semibold text-base shadow-[0_10px_40px_rgba(236,72,153,0.4)] hover:shadow-[0_15px_50px_rgba(236,72,153,0.5)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-pulse-glow"
									>
										{loading ? (
											<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										) : (
											<>
												Analyze
												<ArrowRight className="w-4 h-4" />
											</>
										)}
									</button>
								</div>
							</form>
							{error && (
								<motion.p
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="text-sm text-red-400 mt-3 px-2"
								>
									{error}
								</motion.p>
							)}
						</div>
					</div>

					{/* Example hint */}
					<p className="text-center text-white/30 text-sm mt-4">
						Try: youtube.com/@MrBeast or @mkbhd
					</p>
				</motion.div>

				{/* Features grid with 3D hover effects */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.7, delay: 0.6 }}
					className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full max-w-3xl"
				>
					{[
						{ label: "Viral Score", desc: "View patterns that drive views", icon: Zap, color: "text-pink-400" },
						{ label: "SEO Analysis", desc: "Discover keyword strategies", icon: Search, color: "text-purple-400" },
						{ label: "Content DNA", desc: "Understand what works", icon: Dna, color: "text-cyan-400" },
					].map((feature, i) => (
						<motion.div
							key={feature.label}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
							className="group relative p-5 rounded-xl bg-white/[0.03] border border-white/5 card-3d-hover overflow-hidden"
						>
							{/* Animated border on hover */}
							<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
								<div className="absolute inset-0 rounded-xl border-glow-animated" />
							</div>

							{/* Sparkle on hover */}
							<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
								<SparkleElements count={3} />
							</div>

							<div className="relative flex items-start gap-3">
								{/* Animated icon */}
								<div className={`${feature.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`}>
									<feature.icon className="w-5 h-5" />
								</div>
								<div>
									<h3 className="text-sm font-semibold text-white mb-1">
										{feature.label}
									</h3>
									<p className="text-xs text-white/40">{feature.desc}</p>
								</div>
							</div>
						</motion.div>
					))}
				</motion.div>

				{/* Privacy Footer */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 1 }}
					className="mt-16 text-center"
				>
					<p className="text-xs text-white/40">
						Disconnect accounts anytime • Request data deletion • <Link href="/privacy" className="text-[var(--accent-primary)]/70 hover:text-[var(--accent-primary)] underline">Privacy Policy</Link>
					</p>
				</motion.div>
			</section>
		</main>
	);
}
