"use client";

import { Heading, Text, Card, Button, Separator } from "@whop/react/components";
import {
	CalendarIcon,
	VideoIcon,
	ImageIcon,
	FileTextIcon,
	BarChartIcon,
	DownloadIcon,
	LockClosedIcon,
	EyeOpenIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const features = [
	{
		title: "Content Planner",
		description: "Plan and schedule content across platforms",
		icon: CalendarIcon,
		href: "/planner",
		color: "blue" as const,
	},
	{
		title: "Cross-Platform Posting",
		description: "Post to YouTube, TikTok, and Instagram at once",
		icon: VideoIcon,
		href: "/planner",
		color: "purple" as const,
	},
	{
		title: "Analytics Dashboard",
		description: "Track performance across all platforms",
		icon: BarChartIcon,
		href: "/analytics",
		color: "cyan" as const,
	},
	{
		title: "Thumbnail Generator",
		description: "AI-powered thumbnail creation",
		icon: ImageIcon,
		href: "/thumbnail",
		color: "violet" as const,
	},
	{
		title: "Video Downloader",
		description: "Download videos for repurposing",
		icon: DownloadIcon,
		href: "/video-downloader",
		color: "blue" as const,
	},
	{
		title: "Sponsor Management",
		description: "Track deals and revenue",
		icon: FileTextIcon,
		href: "/sponsors",
		color: "green" as const,
	},
];

const dataUsagePurposes = [
	{
		icon: BarChartIcon,
		title: "Analytics Data",
		description: "Access analytics to display performance dashboards",
	},
	{
		icon: CalendarIcon,
		title: "Content Plans",
		description: "Store your content calendar and scheduled posts",
	},
	{
		icon: VideoIcon,
		title: "Post Content",
		description: "Use access tokens to post on your behalf",
	},
	{
		icon: LockClosedIcon,
		title: "Account Access",
		description: "Store OAuth tokens for seamless platform access",
	},
];

export default function AboutPage() {
	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<div className="bg-gradient-to-br from-blue-a2 to-purple-a2 dark:from-blue-a3 dark:to-purple-a3 py-20 sm:py-28">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="text-center"
					>
						<Heading size="9" as="h1" className="mb-6 text-gray-12 dark:text-gray-12">
							CreatorOS
						</Heading>
						<Text size="4" color="gray" className="mb-10 text-gray-11 dark:text-gray-11 max-w-2xl mx-auto">
							All-in-One Creator Tool for Content Planning, Cross-Platform Posting, and Analytics
						</Text>
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<Button color="blue" size="3" variant="solid" asChild>
								<Link href="/dashboard">Get Started</Link>
							</Button>
							<Button color="gray" size="3" variant="ghost" asChild>
								<Link href="/privacy">Privacy Policy</Link>
							</Button>
						</div>
					</motion.div>
				</div>
			</div>

			{/* Features Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<Heading size="7" as="h2" className="mb-12 text-center text-gray-12 dark:text-gray-12">
					Complete Creator Toolkit
				</Heading>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.href}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<Card size="3" variant="surface" className="h-full p-6 hover:border-blue-6 transition-colors">
									<Link href={feature.href} className="block">
										<div className="flex flex-col gap-4 h-full">
											<div
												className="w-12 h-12 rounded-lg flex items-center justify-center"
												style={{
													backgroundColor: `var(--${feature.color}-a2)`,
													color: `var(--${feature.color}-11)`,
												}}
											>
												<Icon className="w-6 h-6" />
											</div>
											<div>
												<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
													{feature.title}
												</Heading>
												<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
													{feature.description}
												</Text>
											</div>
										</div>
									</Link>
								</Card>
							</motion.div>
						);
					})}
				</div>
			</div>

			<Separator className="my-16" />

			{/* Data Usage Transparency Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="text-center mb-12">
					<div className="flex items-center justify-center gap-3 mb-4">
						<LockClosedIcon className="w-8 h-8 text-blue-11 dark:text-blue-10" />
						<Heading size="7" as="h2" className="text-gray-12 dark:text-gray-12">
							Data Usage & Privacy
						</Heading>
					</div>
					<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 max-w-2xl mx-auto">
						We only access data necessary to provide our services. We never sell your personal data.
					</Text>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
					{dataUsagePurposes.map((purpose, index) => {
						const Icon = purpose.icon;
						return (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<Card size="2" variant="surface" className="p-4 h-full text-center">
									<div className="flex flex-col items-center gap-3">
										<div className="w-10 h-10 rounded-lg bg-blue-a2 dark:bg-blue-a3 flex items-center justify-center">
											<Icon className="w-5 h-5 text-blue-11 dark:text-blue-10" />
										</div>
										<div>
											<Heading size="3" as="h3" className="mb-1 text-gray-12 dark:text-gray-12">
												{purpose.title}
											</Heading>
											<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
												{purpose.description}
											</Text>
										</div>
									</div>
								</Card>
							</motion.div>
						);
					})}
				</div>

				<Card size="3" variant="surface" className="p-6 bg-blue-a2 dark:bg-blue-a3 border-blue-a6">
					<div className="flex flex-col sm:flex-row gap-4 items-start">
						<EyeOpenIcon className="w-6 h-6 text-blue-11 dark:text-blue-10 flex-shrink-0" />
						<div className="flex-1">
							<Heading size="4" as="h3" className="mb-3 text-gray-12 dark:text-gray-12">
								Your Data Rights
							</Heading>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-11 dark:text-gray-11">
								<div>✓ Disconnect accounts anytime</div>
								<div>✓ Request data deletion</div>
								<div>✓ Review our <Link href="/privacy" className="text-blue-10 underline">Privacy Policy</Link></div>
								<div>✓ Export your data anytime</div>
							</div>
						</div>
					</div>
				</Card>
			</div>

			<Separator className="my-16" />

			{/* CTA Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
				<Heading size="6" as="h2" className="mb-6 text-gray-12 dark:text-gray-12">
					Ready to get started?
				</Heading>
				<Button color="blue" size="3" variant="solid" asChild>
					<Link href="/dashboard">Start Using CreatorOS</Link>
				</Button>
			</div>
		</div>
	);
}

