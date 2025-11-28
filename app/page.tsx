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
	InfoCircledIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const features = [
	{
		title: "Content Planner",
		description: "Plan and schedule your content across YouTube, TikTok, and Instagram with an intuitive calendar interface. Organize your content strategy and never miss a posting deadline.",
		icon: CalendarIcon,
		href: "/planner",
		color: "blue" as const,
	},
	{
		title: "Cross-Platform Posting",
		description: "Upload videos once and post to multiple platforms simultaneously. Support for YouTube (regular videos and Shorts), Instagram, and TikTok with platform-specific metadata.",
		icon: VideoIcon,
		href: "/planner",
		color: "purple" as const,
	},
	{
		title: "Analytics Dashboard",
		description: "Track performance across YouTube, TikTok, and Instagram. View views, followers, engagement rates, and revenue metrics all in one place with real-time data synchronization.",
		icon: BarChartIcon,
		href: "/analytics",
		color: "cyan" as const,
	},
	{
		title: "Thumbnail Generator",
		description: "Generate eye-catching thumbnails with AI-powered design tools. Create professional thumbnails that increase click-through rates.",
		icon: ImageIcon,
		href: "/thumbnail",
		color: "violet" as const,
	},
	{
		title: "Video Downloader",
		description: "Download videos from TikTok, Instagram Reels, and YouTube Shorts for repurposing and content creation.",
		icon: DownloadIcon,
		href: "/video-downloader",
		color: "blue" as const,
	},
	{
		title: "Sponsor Management",
		description: "Track deals, revenue, and invoices from brand partnerships. Manage your sponsorship pipeline and never miss a deadline.",
		icon: FileTextIcon,
		href: "/sponsors",
		color: "green" as const,
	},
];

const dataUsagePurposes = [
	{
		icon: BarChartIcon,
		title: "Analytics & Performance Tracking",
		description: "We access your social media analytics data (views, followers, engagement metrics) to display comprehensive performance dashboards and help you track your growth across platforms.",
	},
	{
		icon: CalendarIcon,
		title: "Content Planning & Scheduling",
		description: "We store your content plans, scheduled posts, and task information to help you organize and manage your content calendar effectively.",
	},
	{
		icon: VideoIcon,
		title: "Cross-Platform Posting",
		description: "We use your access tokens to post content to your connected social media accounts (YouTube, TikTok, Instagram) on your behalf, as authorized by you.",
	},
	{
		icon: LockClosedIcon,
		title: "Account Authentication",
		description: "We securely store OAuth tokens to maintain your connection to social media platforms, allowing seamless access to your accounts without requiring repeated logins.",
	},
];

export default function HomePage() {
	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<div className="bg-gradient-to-br from-blue-a2 to-purple-a2 dark:from-blue-a3 dark:to-purple-a3 py-16 sm:py-24">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="text-center"
					>
						<Heading size="9" as="h1" className="mb-4 text-gray-12 dark:text-gray-12">
							CreatorOS
						</Heading>
						<Text size="5" color="gray" className="mb-6 text-gray-11 dark:text-gray-11 max-w-3xl mx-auto">
							All-in-One Creator Tool for Content Planning, Cross-Platform Posting, and Analytics
						</Text>
						<Text size="3" color="gray" className="mb-8 text-gray-10 dark:text-gray-10 max-w-2xl mx-auto">
							Streamline your content creation workflow with professional tools for YouTube, TikTok, and Instagram. 
							Plan, post, and analyze your content all in one place.
						</Text>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
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
				<Heading size="7" as="h2" className="mb-4 text-center text-gray-12 dark:text-gray-12">
					Complete Creator Toolkit
				</Heading>
				<Text size="3" color="gray" className="mb-12 text-center text-gray-11 dark:text-gray-11 max-w-2xl mx-auto">
					Everything you need to manage your content creation business, from planning to posting to analytics.
				</Text>
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
										<div className="flex-1">
											<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
												{feature.title}
											</Heading>
											<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
												{feature.description}
											</Text>
										</div>
									</div>
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
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 max-w-3xl mx-auto">
						We believe in complete transparency about how we use your data. CreatorOS only accesses the information 
						necessary to provide our services, and we never sell your personal data to third parties.
					</Text>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					{dataUsagePurposes.map((purpose, index) => {
						const Icon = purpose.icon;
						return (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<Card size="3" variant="surface" className="p-6 h-full">
									<div className="flex gap-4">
										<div className="flex-shrink-0">
											<div className="w-10 h-10 rounded-lg bg-blue-a2 dark:bg-blue-a3 flex items-center justify-center">
												<Icon className="w-5 h-5 text-blue-11 dark:text-blue-10" />
											</div>
										</div>
										<div>
											<Heading size="4" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
												{purpose.title}
											</Heading>
											<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
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
					<div className="flex gap-4">
						<EyeOpenIcon className="w-6 h-6 text-blue-11 dark:text-blue-10 flex-shrink-0 mt-1" />
						<div>
							<Heading size="4" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
								Your Data Rights
							</Heading>
							<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 mb-4">
								You have full control over your data. You can:
							</Text>
							<ul className="list-disc list-inside space-y-2 text-gray-11 dark:text-gray-11 text-sm">
								<li>Disconnect your social media accounts at any time</li>
								<li>Request deletion of your data (see our <Link href="/data-deletion" className="text-blue-10 underline">Data Deletion page</Link>)</li>
								<li>Review what data we collect in our <Link href="/privacy" className="text-blue-10 underline">Privacy Policy</Link></li>
								<li>Export your analytics and sponsor data at any time</li>
							</ul>
						</div>
					</div>
				</Card>
			</div>

			<Separator className="my-16" />

			{/* CTA Section */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
				<Heading size="6" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					Ready to streamline your content creation?
				</Heading>
				<Text size="3" color="gray" className="mb-6 text-gray-11 dark:text-gray-11">
					Join creators who are using CreatorOS to grow their audience and manage their content business.
				</Text>
				<Button color="blue" size="3" variant="solid" asChild>
					<Link href="/dashboard">Start Using CreatorOS</Link>
				</Button>
			</div>
		</div>
	);
}
