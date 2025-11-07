"use client";

import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { ArrowLeftIcon, BarChartIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const platforms = [
	{
		name: "YouTube",
		color: "red" as const,
		stats: {
			views: "1.2M",
			subscribers: "45K",
			engagement: "4.2%",
			revenue: "$2,450",
		},
	},
	{
		name: "TikTok",
		color: "cyan" as const,
		stats: {
			views: "850K",
			followers: "32K",
			engagement: "6.8%",
			revenue: "$1,200",
		},
	},
	{
		name: "Instagram",
		color: "pink" as const,
		stats: {
			views: "520K",
			followers: "28K",
			engagement: "5.1%",
			revenue: "$980",
		},
	},
];

export default function AnalyticsPage() {
	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Link href="/dashboard">
						<Button variant="ghost" size="2" className="mb-4">
							<ArrowLeftIcon className="mr-2" />
							Back
						</Button>
					</Link>
					<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
						Analytics Dashboard
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Track performance across YouTube, TikTok, and Instagram
					</Text>
				</div>
			</div>

			{/* Platform Cards */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{platforms.map((platform, index) => (
					<motion.div
						key={platform.name}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<Card size="3" variant="surface" className="p-6">
							<div className="flex flex-col gap-4">
								<div className="flex items-center gap-3">
									<div 
										className="w-12 h-12 rounded-lg flex items-center justify-center"
										style={{ 
											backgroundColor: `var(--${platform.color}-a2)`,
											color: `var(--${platform.color}-11)` 
										}}
									>
										<BarChartIcon className="w-6 h-6" />
									</div>
									<Heading size="5" weight="bold" className="text-gray-12 dark:text-gray-12">
										{platform.name}
									</Heading>
								</div>
								<Separator />
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
											Views
										</Text>
										<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
											{platform.stats.views}
										</Text>
									</div>
									<div>
										<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
											Followers
										</Text>
										<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
											{platform.stats.followers}
										</Text>
									</div>
									<div>
										<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
											Engagement
										</Text>
										<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
											{platform.stats.engagement}
										</Text>
									</div>
									<div>
										<Text size="1" color="gray" className="mb-1 text-gray-11 dark:text-gray-11">
											Revenue
										</Text>
										<Text size="4" weight="bold" className="text-gray-12 dark:text-gray-12">
											{platform.stats.revenue}
										</Text>
									</div>
								</div>
								<Button variant="soft" color={platform.color} size="2" className="w-full">
									View Details
								</Button>
							</div>
						</Card>
					</motion.div>
				))}
			</div>

			{/* Overall Stats */}
			<Card size="3" variant="surface" className="p-6">
				<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					Overall Performance
				</Heading>
				<div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
					<div>
						<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
							Total Views
						</Text>
						<Heading size="7" weight="bold" className="text-gray-12 dark:text-gray-12">
							2.57M
						</Heading>
						<Badge color="green" size="1" variant="soft" className="mt-2">
							+12.5%
						</Badge>
					</div>
					<div>
						<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
							Total Followers
						</Text>
						<Heading size="7" weight="bold" className="text-gray-12 dark:text-gray-12">
							105K
						</Heading>
						<Badge color="green" size="1" variant="soft" className="mt-2">
							+8.3%
						</Badge>
					</div>
					<div>
						<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
							Avg Engagement
						</Text>
						<Heading size="7" weight="bold" className="text-gray-12 dark:text-gray-12">
							5.4%
						</Heading>
						<Badge color="green" size="1" variant="soft" className="mt-2">
							+1.2%
						</Badge>
					</div>
					<div>
						<Text size="2" color="gray" className="mb-2 text-gray-11 dark:text-gray-11">
							Total Revenue
						</Text>
						<Heading size="7" weight="bold" className="text-gray-12 dark:text-gray-12">
							$4,630
						</Heading>
						<Badge color="green" size="1" variant="soft" className="mt-2">
							+15.8%
						</Badge>
					</div>
				</div>
			</Card>
		</div>
	);
}

