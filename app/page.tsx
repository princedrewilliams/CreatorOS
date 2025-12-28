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
							className="inline-flex items-center gap-2 bg-pink-500/20 border-pink-500/30"
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
							<span className="text-pink-400">
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
						<Card size="3" variant="surface" className="p-6 mb-4 bg-gray-900/50 backdrop-blur-sm border-pink-500/30">
							<div className="flex flex-col sm:flex-row gap-4">
								{/* Input Field */}
								<div className="flex-1 relative">
									<div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
										</svg>
									</div>
									<Text size="2" weight="medium" className="mb-2 ml-1 text-white">
										Paste a YouTube channel link
									</Text>
									<input
										type="url"
										value={channelUrl}
										onChange={(e) => setChannelUrl(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												handleAnalyze();
											}
										}}
										placeholder="Example: youtube.com/@channelname"
										className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-700 border-0 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all duration-200"
									/>
								</div>

								{/* CTA Button */}
								<div className="flex items-end">
									<Button
										onClick={handleAnalyze}
										variant="solid"
										color="purple"
										size="4"
										className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap text-white"
									>
										Analyze Channel
										<ArrowRightIcon className="ml-2 w-5 h-5" />
									</Button>
								</div>
							</div>
						</Card>

						{/* Helper Text */}
						<Text size="1" className="text-center text-gray-300">
							Try these example formats:{" "}
							<span className="text-gray-400">youtube.com/@channelname</span>{" "}
							<span className="text-gray-400">youtube.com/c/channelname</span>
						</Text>
					</motion.div>
				</motion.div>

				{/* Compatibility Statement */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6, duration: 0.5 }}
					className="mt-8"
				>
					<Text size="2" className="text-center text-gray-400">
						Works on any public YouTube channel
					</Text>
				</motion.div>
			</div>
		</div>
	);
}
