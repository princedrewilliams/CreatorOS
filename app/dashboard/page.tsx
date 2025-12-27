"use client";

import { Heading, Text, Card, Button } from "@whop/react/components";
import { CalendarIcon, ArrowRightIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
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
];

export default function DashboardPage() {
	return (
		<div className="space-y-6 sm:space-y-8">
			{/* Header */}
			<div>
				<Heading size="6" as="h1" className="mb-2 text-gray-12 dark:text-gray-12 sm:text-7">
					Channel Deconstruction Engine
				</Heading>
				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11 sm:text-4 mb-6">
					Analyze any YouTube channel and extract repeatable success patterns
				</Text>
			</div>

			{/* Content Planner - Full Width */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
			>
				<Card size="3" variant="surface" className="p-6 hover:border-blue-6 transition-colors">
					<Link href={features[0].href}>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4 flex-1">
								<div 
									className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
									style={{ 
										backgroundColor: `var(--${features[0].color}-a2)`,
										color: `var(--${features[0].color}-11)` 
									}}
								>
									<CalendarIcon className="w-6 h-6" />
								</div>
								<div className="flex-1 min-w-0">
									<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
										{features[0].title}
									</Heading>
									<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
										{features[0].description}
									</Text>
								</div>
							</div>
							<Button
								variant="ghost"
								color={features[0].color}
								size="2"
								className="flex-shrink-0"
							>
								Open
								<ArrowRightIcon />
							</Button>
						</div>
					</Link>
				</Card>
			</motion.div>

			{/* Tools Section */}
			<div>
				<Heading size="5" as="h2" className="mb-4 sm:mb-6 text-gray-12 dark:text-gray-12 sm:text-6">
					Tools
				</Heading>
				<div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						whileHover={{ y: -4 }}
					>
						<Card size="3" variant="surface" className="h-full p-6 hover:border-blue-6 transition-colors">
							<Link href="/channel-dna">
								<div className="flex flex-col gap-4 h-full">
									<div 
										className="w-12 h-12 rounded-lg flex items-center justify-center"
										style={{ 
											backgroundColor: `var(--purple-a2)`,
											color: `var(--purple-11)` 
										}}
									>
										<MagnifyingGlassIcon className="w-6 h-6" />
									</div>
									<div className="flex-1">
										<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
											Channel DNA
										</Heading>
										<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
											Analyze any YouTube channel and extract repeatable success patterns
										</Text>
									</div>
									<Button
										variant="ghost"
										color="purple"
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
				</div>
			</div>

			{/* Privacy Footer Items */}
			<div className="mt-8 pt-6 border-t border-gray-a4 dark:border-gray-a6">
				<div className="text-center">
					<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
						✓ Disconnect accounts anytime • ✓ Request data deletion • <Link href="/privacy" className="text-blue-10 underline">Privacy Policy</Link>
					</Text>
				</div>
			</div>
		</div>
	);
}
