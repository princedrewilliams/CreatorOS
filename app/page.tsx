"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
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
		<main className="relative min-h-screen overflow-hidden bg-[#0b000c] text-white selection:bg-pink-500/30 selection:text-pink-200">
			{/* Deep gradient wash */}
			<div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#0b0018] via-[#090013] to-[#020008]" />
			{/* Radial glows */}
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_25%,rgba(255,66,166,0.35),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(255,130,230,0.32),transparent_45%),radial-gradient(circle_at_50%_78%,rgba(120,0,90,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,30,140,0.2),transparent_55%)]" />
			{/* Subtle curved strokes */}
			<div className="absolute inset-0 pointer-events-none opacity-80 mix-blend-screen">
				<svg className="w-full h-full" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
					<path d="M0 640 C 260 520, 480 760, 820 240 C 1160 -280, 1520 220, 1700 820" stroke="rgba(255,92,177,0.38)" strokeWidth="2" fill="none" strokeDasharray="6 10" />
					<path d="M-40 820 C 320 660, 540 920, 960 320 C 1320 -180, 1640 320, 1840 860" stroke="rgba(255,92,177,0.26)" strokeWidth="2" fill="none" strokeDasharray="8 14" />
				</svg>
			</div>
			{/* Noise */}
			<div
				className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
				}}
			/>

			<section className="relative z-10 max-w-6xl mx-auto px-5 md:px-10 py-16 md:py-24 lg:py-28 flex flex-col items-center gap-10">
				{/* Hero text */}
				<div className="text-center space-y-4 md:space-y-6 max-w-4xl">
					<h1 className="text-[180px] md:text-[240px] lg:text-[280px] font-bold leading-tight md:leading-[1.02] tracking-tight">
						Reverse-Engineer What Makes
						<br className="hidden md:block" />
						<span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#ff5abf] via-[#ff3ea7] to-[#ff8bf5]">
							YouTube Channels Win
						</span>
					</h1>
					<p className="text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
						Analyze posting patterns, titles, thumbnails, and content strategy — instantly.
					</p>
				</div>

				{/* Input bar */}
				<div className="w-full max-w-4xl">
					<div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-pink-500/35 via-pink-400/15 to-pink-500/35 shadow-[0_0_45px_rgba(255,60,160,0.35)] backdrop-blur-xl">
						<div className="relative rounded-[18px] bg-[#060008]/80 border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.55)] px-4 py-3 flex flex-col gap-2">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									void handleAnalyze();
								}}
								className="flex flex-col md:flex-row items-stretch gap-3"
							>
								<div className="flex-1">
									<div className="flex items-center gap-3 rounded-xl px-4 h-14 bg-transparent border border-pink-500/20 backdrop-blur-xl">
										<svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
										</svg>
										<input
											type="url"
											value={channelUrl}
											onChange={(e) => setChannelUrl(e.target.value)}
											placeholder="Paste your YouTube URL here... (e.g., youtube.com/@channelname)"
											className="w-full bg-transparent text-white placeholder:text-white/65 text-base md:text-lg border-0 outline-none ring-0 focus:outline-none focus:ring-0"
											style={{
												backgroundColor: "transparent !important",
												background: "transparent !important",
												WebkitAppearance: "none",
												WebkitTextFillColor: "#ffffff",
												WebkitBoxShadow: "0 0 0px 1000px transparent inset !important",
												boxShadow: "none !important",
											}}
											autoComplete="off"
										/>
									</div>
								</div>
								<button
									type="submit"
									disabled={loading}
									className="md:w-[190px] h-14 rounded-xl bg-gradient-to-r from-[#ff4fb6] to-[#ff79c9] text-white font-semibold text-base shadow-[0_15px_45px_rgba(255,90,191,0.45)] hover:shadow-[0_18px_55px_rgba(255,90,191,0.6)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									{loading ? "Analyzing..." : "Start Analyzing"}
									<ArrowRight className="w-4 h-4" />
								</button>
							</form>
							<div className="text-[11px] tracking-[0.18em] uppercase text-white/35 px-1">
								Example: youtube.com/@channelname
							</div>
							{error && (
								<div className="text-sm text-red-300 font-medium px-1">
									{error}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Brand mark */}
				<div className="pt-6 text-center text-lg font-semibold tracking-tight text-white/90">
					CreatorOS
				</div>
			</section>
		</main>
	);
}
