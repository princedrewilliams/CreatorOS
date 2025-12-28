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
	const router = useRouter();

	const handleAnalyze = () => {
		if (channelUrl.trim()) {
			// Navigate to channel-dna page with the URL
			router.push(`/channel-dna?url=${encodeURIComponent(channelUrl.trim())}`);
		} else {
			// Navigate to channel-dna page without URL
			router.push("/channel-dna");
		}
	};


	return (
		<div className="relative min-h-screen overflow-hidden bg-[#05000b]">
			{/* Neon cosmic background */}
			<div className="fixed inset-0 -z-10 overflow-hidden bg-[#05000b]">
				{/* Deep base gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-[#0b0018] via-[#090013] to-[#020008]" />

				{/* Radial glow zones */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,66,166,0.35),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(255,130,230,0.32),transparent_45%),radial-gradient(circle_at_50%_78%,rgba(120,0,90,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,30,140,0.2),transparent_55%)]" />

				{/* Sweeping light streaks */}
				<div className="absolute inset-0 opacity-80 bg-[linear-gradient(120deg,rgba(255,52,160,0.4),rgba(255,52,160,0)_38%),linear-gradient(-115deg,rgba(255,105,200,0.34),rgba(255,105,200,0)_32%),linear-gradient(150deg,rgba(255,90,170,0.28),rgba(255,90,170,0)_42%)]" />

				{/* Bold neon streaks */}
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute -left-28 top-10 w-[150%] h-[4px] bg-gradient-to-r from-transparent via-[#ff5bd9] to-transparent blur-[14px] rotate-[10deg] opacity-80" />
					<div className="absolute -right-16 top-1/3 w-[130%] h-[4px] bg-gradient-to-r from-transparent via-[#ff3ea7] to-transparent blur-[12px] -rotate-[14deg] opacity-68" />
					<div className="absolute left-12 bottom-1/4 w-[140%] h-[5px] bg-gradient-to-r from-transparent via-[#ff6ad5] to-transparent blur-[16px] rotate-[18deg] opacity-62" />
				</div>

				{/* Particle sparkle layer */}
				<div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
			</div>

			{/* Main Content */}
			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
				{/* Hero Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16 sm:mb-20"
				>
					{/* Badge */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.5 }}
						className="mb-6"
					>
						<Badge 
							color="purple" 
							variant="soft" 
							size="2"
							className="inline-flex items-center gap-2 bg-pink-500/20 border-pink-500/30 !bg-pink-500/20"
						>
							<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
							<span className="text-white">Introducing Channel DNA Analyzer</span>
						</Badge>
					</motion.div>

					{/* Main Headline */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3, duration: 0.6 }}
						className="mb-6"
					>
						<h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold mb-4 text-white leading-tight tracking-tight">
							Reverse-Engineer What Makes{" "}
							<span
								className="inline-block"
								style={{
									backgroundImage: "linear-gradient(90deg, #ff5abf 0%, #ff3ea7 45%, #d742ff 80%, #ff8bf5 100%)",
									backgroundClip: "text",
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
									color: "#ff5abf",
								}}
							>
								YouTube Channels Win
							</span>
						</h1>
					</motion.div>

					{/* Subtitle */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4, duration: 0.6 }}
						className="mb-12"
					>
						<Text size="2" className="text-white max-w-3xl mx-auto">
							Analyze posting patterns, titles, thumbnails, and content strategy — instantly.
						</Text>
					</motion.div>

					{/* Input Section */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5, duration: 0.6 }}
						className="max-w-3xl mx-auto"
					>
						<div className="relative p-[2px] mb-4 rounded-2xl bg-gradient-to-r from-pink-500/50 via-pink-400/20 to-pink-500/50 shadow-[0_0_35px_rgba(255,60,160,0.3)] backdrop-blur-md">
							<div className="relative rounded-[14px] bg-[#0a0013]/90 px-4 py-5 pl-12 pr-44 shadow-[inset_0_0_18px_rgba(0,0,0,0.65)] border border-pink-500/10">
								{/* Icon on far left */}
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200">
									<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
									</svg>
								</div>
								
								{/* Example text - left bottom */}
								<Text
									size="1"
									className="absolute left-12 bottom-2 text-white text-[10px] sm:text-[11px]"
								>
									Example: youtube.com/@channelname
								</Text>
								
								{/* Input Field with placeholder */}
								<input
									type="url"
									value={channelUrl}
									onChange={(e) => setChannelUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleAnalyze();
										}
									}}
									placeholder="Paste your YouTube URL here... (e.g., https://www.youtube.com/watch?v=PcZ2funGjYM)"
									className="w-full bg-transparent !bg-transparent appearance-none border-0 text-sm sm:text-base text-white placeholder:text-gray-400 focus:outline-none focus:text-white focus:bg-transparent transition-colors pr-48 pt-3 pb-5 leading-snug"
									style={{ backgroundColor: "transparent", color: "#f8fafc" }}
									autoComplete="off"
								/>

								{/* Start Analyzing button at bottom right */}
								<button
									onClick={handleAnalyze}
									className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold shadow-[0_10px_25px_rgba(255,60,160,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
								>
									Start Analyzing
									<span className="ml-1 text-lg">›</span>
								</button>
							</div>
						</div>
					</motion.div>
				</motion.div>

				{/* Bottom brand mark */}
				<div className="mt-10 text-center">
					<Text size="5" className="text-white font-bold tracking-tight">
						CreatorOS
					</Text>
				</div>

			</div>
		</div>
	);
}
