"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { 
	ArrowRightIcon,
	MagnifyingGlassIcon
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

	const features = [
		{
			icon: (
				<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
			),
			title: "Channel DNA Breakdown",
			description: "Uncover niche, bio, and content positioning"
		},
		{
			icon: (
				<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
			),
			title: "Top Video Pattern Analysis",
			description: "Identify repeating topics, title style, and formats"
		},
		{
			icon: (
				<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			),
			title: "Thumbnail Strategy Insights",
			description: "Analyze design choices and hook elements"
		},
		{
			icon: (
				<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
				</svg>
			),
			title: "Tag & Metadata Signals",
			description: "Reveal common tags and keyword themes"
		}
	];

	return (
		<div className="relative min-h-screen overflow-hidden">
			{/* Layered Background Gradients */}
			<div className="fixed inset-0 -z-10">
				{/* Base dark gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-gray-12 via-gray-11 to-gray-12"></div>
				
				{/* Radial gradients in corners - pink/magenta zones */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(236,72,153,0.15),transparent_50%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(219,39,119,0.12),transparent_50%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(232,121,249,0.1),transparent_50%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(244,114,182,0.08),transparent_50%)]"></div>
				
				{/* Linear gradient overlay */}
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-12/50"></div>
				
				{/* Abstract light streaks - pink */}
				<div className="absolute top-0 left-0 w-full h-full opacity-30">
					<div className="absolute top-1/4 left-0 w-96 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent blur-xl transform -rotate-12"></div>
					<div className="absolute bottom-1/3 right-0 w-96 h-1 bg-gradient-to-l from-transparent via-fuchsia-500 to-transparent blur-xl transform rotate-12"></div>
					<div className="absolute top-1/2 left-1/4 w-64 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent blur-lg transform rotate-45"></div>
				</div>
				
				{/* Subtle particle texture */}
				<div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
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
							className="inline-flex items-center gap-2"
						>
							<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
							Introducing Channel DNA Analyzer
						</Badge>
					</motion.div>

					{/* Main Headline */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3, duration: 0.6 }}
						className="mb-6"
					>
						<Heading size="7" as="h1" className="mb-4 text-gray-12 dark:text-gray-12 sm:text-8">
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
						<Text size="4" className="text-gray-11 dark:text-gray-11 sm:text-5 max-w-3xl mx-auto">
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
						<Card size="3" variant="surface" className="p-6 mb-4 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm border-pink-500/20">
							<div className="flex flex-col sm:flex-row gap-4">
								{/* Input Field */}
								<div className="flex-1 relative">
									<div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
										</svg>
									</div>
									<Text size="2" weight="medium" className="mb-2 ml-1 text-gray-11 dark:text-gray-11">
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
										className="w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-gray-a2 border border-gray-a6 dark:border-gray-a6 text-gray-12 dark:text-gray-12 placeholder:text-gray-9 dark:placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-200"
									/>
								</div>

								{/* CTA Button */}
								<div className="flex items-end">
									<Button
										onClick={handleAnalyze}
										variant="solid"
										color="purple"
										size="4"
										className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
									>
										Analyze Channel
										<ArrowRightIcon className="ml-2 w-5 h-5" />
									</Button>
								</div>
							</div>
						</Card>

						{/* Helper Text */}
						<Text size="1" color="gray" className="text-center">
							Try these example formats:{" "}
							<span className="text-gray-10 dark:text-gray-10">youtube.com/@channelname</span>{" "}
							<span className="text-gray-10 dark:text-gray-10">youtube.com/c/channelname</span>
						</Text>
					</motion.div>
				</motion.div>

				{/* Compatibility Statement */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6, duration: 0.5 }}
					className="mb-12 sm:mb-16"
				>
					<Text size="3" color="gray" className="text-center text-gray-10 dark:text-gray-10">
						Works on any public YouTube channel
					</Text>
				</motion.div>

				{/* Feature Cards */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.7, duration: 0.6 }}
					className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto"
				>
					{features.map((feature, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
							whileHover={{ y: -4, transition: { duration: 0.2 } }}
						>
							<Card 
								size="3" 
								variant="surface" 
								className="group relative p-6 bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm border-pink-500/10 hover:border-pink-500/30 transition-all duration-300"
							>
								{/* Glow effect on hover */}
								<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
								
								<div className="relative z-10">
									{/* Icon */}
									<div className="mb-4 text-pink-400 group-hover:text-pink-300 transition-colors duration-200">
										{feature.icon}
									</div>
									
									{/* Title */}
									<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
										{feature.title}
									</Heading>
									
									{/* Description */}
									<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 leading-relaxed">
										{feature.description}
									</Text>
								</div>
							</Card>
						</motion.div>
					))}
				</motion.div>

				{/* Bottom Compatibility Statement */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.2, duration: 0.5 }}
					className="mt-12 sm:mt-16"
				>
					<Text size="3" color="gray" className="text-center text-gray-10 dark:text-gray-10">
						Works on any public YouTube channel
					</Text>
				</motion.div>
			</div>
		</div>
	);
}
