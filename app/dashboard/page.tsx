"use client";

import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import {
	CalendarIcon,
	VideoIcon,
	ImageIcon,
	FileTextIcon,
	BarChartIcon,
	ArrowRightIcon,
	DownloadIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const features = [
	{
		title: "Content Planner",
		description: "Plan and schedule your content with an intuitive calendar",
		icon: CalendarIcon,
		href: "/planner",
		color: "blue" as const,
	},
	{
		title: "Auto Clip",
		description: "Automatically create engaging clips from your videos",
		icon: VideoIcon,
		href: "/autoclip",
		color: "purple" as const,
	},
	{
		title: "Thumbnail Generator",
		description: "Generate eye-catching thumbnails with AI",
		icon: ImageIcon,
		href: "/thumbnail",
		color: "violet" as const,
	},
	{
		title: "Video Downloader",
		description: "Download TikTok, IG Reels, and YouTube Shorts",
		icon: DownloadIcon,
		href: "/video-downloader",
		color: "blue" as const,
	},
	{
		title: "Sponsor Management",
		description: "Track deals, revenue, and invoices",
		icon: FileTextIcon,
		href: "/sponsors",
		color: "green" as const,
	},
	{
		title: "Analytics Dashboard",
		description: "View performance across YouTube, TikTok, and Instagram",
		icon: BarChartIcon,
		href: "/analytics",
		color: "cyan" as const,
	},
];

const stats = [
	{ label: "Total Revenue", value: "$12,450", change: "+12%" },
	{ label: "Active Deals", value: "8", change: "+2" },
	{ label: "Content Planned", value: "24", change: "+8" },
	{ label: "Engagement Rate", value: "4.2%", change: "+0.5%" },
];

export default function DashboardPage() {
	return (
		<div className="space-y-8">
			<div>
				<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
					Welcome to CreatorOS
				</Heading>
				<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
					Your all-in-one creator toolkit
				</Text>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat, index) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<Card size="3" variant="surface" className="p-6">
							<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
								{stat.label}
							</Text>
							<div className="flex items-center gap-2">
								<Text size="6" weight="bold" className="text-gray-12 dark:text-gray-12">
									{stat.value}
								</Text>
								<Badge color="green" variant="soft" size="1">
									{stat.change}
								</Badge>
							</div>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Features Grid */}
			<div>
				<Heading size="6" as="h2" className="mb-6 text-gray-12 dark:text-gray-12">
					Tools
				</Heading>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.href}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								whileHover={{ y: -4 }}
							>
								<Card size="3" variant="surface" className="h-full p-6 hover:border-blue-6 transition-colors">
									<Link href={feature.href}>
										<div className="flex flex-col gap-4 h-full">
											<div 
												className="w-12 h-12 rounded-lg flex items-center justify-center"
												style={{ 
													backgroundColor: `var(--${feature.color}-a2)`,
													color: `var(--${feature.color}-11)` 
												}}
											>
												<Icon className="w-6 h-6" />
											</div>
											<div className="flex-1">
												<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
													{feature.title}
												</Heading>
												<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
													{feature.description}
												</Text>
											</div>
											<Button
												variant="ghost"
												color={feature.color}
												size="2"
												className="w-full justify-between"
											>
												Open
												<ArrowRightIcon />
											</Button>
										</div>
									</Link>
								</Card>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

