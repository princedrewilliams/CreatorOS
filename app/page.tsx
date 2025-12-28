"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
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
		<div className="relative min-h-screen overflow-hidden bg-black">
			{/* Black Background with Pink Accent Lines */}
			<div className="fixed inset-0 -z-10 bg-black">
				{/* Pink accent lines */}
				<div className="absolute top-0 left-0 w-full h-full">
					{/* Diagonal line top-left to bottom-right */}
					<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-30"></div>
					<div className="absolute top-20 left-0 w-px h-64 bg-gradient-to-b from-transparent via-pink-500/50 to-transparent opacity-40"></div>
					<div className="absolute top-40 right-0 w-px h-96 bg-gradient-to-b from-transparent via-fuchsia-500/50 to-transparent opacity-40"></div>
					<div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-30"></div>
					<div className="absolute bottom-20 right-0 w-px h-64 bg-gradient-to-t from-transparent via-pink-500/50 to-transparent opacity-40"></div>
					
					{/* Curved pink lines */}
					<svg className="absolute top-1/4 left-0 w-full h-full opacity-20" viewBox="0 0 1200 800" preserveAspectRatio="none">
						<path d="M0,200 Q300,150 600,200 T1200,200" stroke="rgb(236, 72, 153)" strokeWidth="2" fill="none" />
						<path d="M0,400 Q300,350 600,400 T1200,400" stroke="rgb(219, 39, 119)" strokeWidth="2" fill="none" />
						<path d="M0,600 Q300,550 600,600 T1200,600" stroke="rgb(244, 114, 182)" strokeWidth="2" fill="none" />
					</svg>
					
					{/* Vertical pink lines on sides */}
					<div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-pink-500/20 to-transparent"></div>
					<div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-fuchsia-500/20 to-transparent"></div>
				</div>
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
						<Heading size="7" as="h1" className="mb-4 text-white sm:text-8">
							Reverse-Engineer What Makes{" "}
							<span className="bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
								YouTube Channels Win
							</span>
						</Heading>
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
						<div className="relative p-6 mb-4 bg-gray-800 rounded-2xl">
							{/* Icon on far left */}
							<div className="absolute left-4 top-1/2 -translate-y-1/2 text-white">
								<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
								</svg>
							</div>
							
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
								className="w-full pl-12 pr-32 py-4 bg-transparent border-0 text-gray-300 placeholder:text-gray-400 focus:outline-none focus:text-white transition-colors"
							/>

							{/* Start Analyzing button at bottom right */}
							<button
								onClick={handleAnalyze}
								className="absolute bottom-4 right-4 text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
							>
								<span>Start Analyzing</span>
								<span className="text-lg">›</span>
							</button>
						</div>
					</motion.div>
				</motion.div>

			</div>
		</div>
	);
}
