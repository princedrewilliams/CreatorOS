"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Text, Badge } from "@whop/react/components";
import { 
	ArrowRightIcon
} from "@radix-ui/react-icons";

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
		<main className="relative min-h-screen w-full overflow-hidden bg-[#050505] selection:bg-pink-500/30 selection:text-pink-200">
			{/* Deep atmospheric background from MagicPatterns export */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a0510] via-[#050505] to-[#050505] z-0" />

			{/* Animated luminous orbs / waves */}
			<div
				className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-pink-600/10 blur-[120px] animate-pulse mix-blend-screen"
				style={{ animationDuration: "8s" }}
			/>
			<div
				className="absolute bottom-[-20%] left-[-10%] w-[900px] h-[900px] rounded-full bg-rose-600/10 blur-[120px] animate-pulse mix-blend-screen"
				style={{ animationDuration: "10s" }}
			/>

			{/* Curved lines overlay */}
			<div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
				<svg className="w-full h-full" viewBox="0 0 1440 900" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M-100 600 C 200 400, 400 800, 800 200 C 1200 -400, 1600 200, 1800 800"
						stroke="url(#grad1)"
						strokeWidth="2"
						fill="none"
						className="animate-[dash_20s_linear_infinite]"
						strokeDasharray="10 10"
					/>
					<path
						d="M-100 800 C 300 600, 500 900, 900 300 C 1300 -300, 1700 300, 1900 900"
						stroke="url(#grad2)"
						strokeWidth="1"
						fill="none"
						opacity="0.5"
					/>
					<defs>
						<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="rgba(236, 72, 153, 0)" />
							<stop offset="50%" stopColor="rgba(236, 72, 153, 0.3)" />
							<stop offset="100%" stopColor="rgba(236, 72, 153, 0)" />
						</linearGradient>
						<linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="rgba(244, 63, 94, 0)" />
							<stop offset="50%" stopColor="rgba(244, 63, 94, 0.2)" />
							<stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
						</linearGradient>
					</defs>
				</svg>
			</div>

			{/* Noise film grain */}
			<div
				className="absolute inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-overlay"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
				}}
			/>

			{/* Content */}
			<div className="relative z-10 w-full px-4 py-12 sm:py-16 lg:py-20 flex flex-col items-center">
				{/* Badge */}
				<div className="mb-8">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.15)]">
						<svg className="w-3 h-3 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.38 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
						<span className="text-xs font-medium tracking-wider text-pink-100/90 uppercase">
							Introducing Channel DNA Analyzer
						</span>
					</div>
				</div>

				{/* Hero text */}
				<div className="text-center mb-12 space-y-6 max-w-4xl">
					<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
						Reverse-Engineer What Makes{" "}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400">
							YouTube Channels Win
						</span>
					</h1>
					<p className="text-lg md:text-xl text-white/70 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
						Analyze posting patterns, titles, thumbnails, and content strategy — instantly.
					</p>
				</div>

				{/* Input card */}
				<div className="w-full max-w-3xl">
					<div className="relative group">
						<div className="absolute -inset-1 bg-gradient-to-r from-pink-600/30 via-rose-600/30 to-pink-600/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
						<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/70 backdrop-blur-2xl p-3 shadow-2xl">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									void handleAnalyze();
								}}
								className="flex flex-col md:flex-row gap-2"
							>
								<div className="flex-1 relative">
									<div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
										<svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
										</svg>
									</div>
									<input
										type="url"
										value={channelUrl}
										onChange={(e) => setChannelUrl(e.target.value)}
										placeholder="Paste your YouTube URL here... (e.g., youtube.com/@channelname)"
										className="w-full h-14 pl-12 pr-4 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-base md:text-lg font-light tracking-wide rounded-xl transition-colors focus:bg-white/5"
										autoComplete="off"
									/>
								</div>
								<button
									type="submit"
									disabled={loading}
									className="liquid-btn md:w-auto w-full h-14 md:px-8 text-base shadow-none hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
								>
									{loading ? "Analyzing..." : "Start Analyzing"}
									<ArrowRightIcon className="w-4 h-4 ml-1 inline-block" />
								</button>
							</form>
							<div className="px-4 py-2 flex justify-center md:justify-start">
								<p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
									Example: youtube.com/@channelname
								</p>
							</div>
							{error && (
								<div className="px-4 pb-2 text-center md:text-left">
									<Text size="2" className="text-red-400">{error}</Text>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Brand footer */}
				<div className="mt-20 text-center">
					<span className="text-2xl font-bold tracking-tight text-white/90">
						CreatorOS
					</span>
				</div>
			</div>
		</main>
	);
}
