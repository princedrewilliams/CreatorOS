"use client";

import { Heading, Text, Card, Button } from "@whop/react/components";
import { CalendarIcon, ArrowRightIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DashboardPage() {
	return (
		<div className="relative min-h-screen">
			{/* Gradient Background */}
			<div className="fixed inset-0 bg-gradient-to-br from-gray-12 via-blue-12 to-purple-12 -z-10">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.2),transparent_50%)]"></div>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(37,99,235,0.25),transparent_50%)]"></div>
			</div>

			<div className="relative space-y-6 sm:space-y-8">
				{/* Header */}
				<div className="text-center pt-8 pb-12">
					<Heading size="7" as="h1" className="mb-4 text-white sm:text-8">
						Channel Deconstruction Engine
					</Heading>
					<Text size="4" className="text-gray-300 sm:text-5 max-w-2xl mx-auto">
						Analyze any YouTube channel and extract repeatable success patterns to skyrocket your reach and engagement
					</Text>
				</div>

				{/* Tools Section */}
				<div className="max-w-4xl mx-auto">
					<div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							whileHover={{ y: -4 }}
						>
							<Card size="3" variant="surface" className="h-full p-6 hover:border-blue-6 transition-colors bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
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
											Analyze Channel
											<ArrowRightIcon />
										</Button>
									</div>
								</Link>
							</Card>
						</motion.div>
					</div>
				</div>

				{/* Content Planner - At Bottom */}
				<div className="max-w-4xl mx-auto pb-12">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<Card size="3" variant="surface" className="p-6 hover:border-blue-6 transition-colors bg-white/95 dark:bg-gray-a2/95 backdrop-blur-sm">
							<Link href="/planner">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4 flex-1">
										<div 
											className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
											style={{ 
												backgroundColor: `var(--blue-a2)`,
												color: `var(--blue-11)` 
											}}
										>
											<CalendarIcon className="w-6 h-6" />
										</div>
										<div className="flex-1 min-w-0">
											<Heading size="5" as="h3" className="mb-2 text-gray-12 dark:text-gray-12">
												Content Planner
											</Heading>
											<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
												Plan and schedule your content with an intuitive calendar
											</Text>
										</div>
									</div>
									<Button
										variant="ghost"
										color="blue"
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
				</div>

				{/* Privacy Footer Items */}
				<div className="mt-8 pt-6 border-t border-white/20">
					<div className="text-center">
						<Text size="1" className="text-gray-300">
							✓ Disconnect accounts anytime • ✓ Request data deletion • <Link href="/privacy" className="text-blue-400 underline hover:text-blue-300">Privacy Policy</Link>
						</Text>
					</div>
				</div>
			</div>
		</div>
	);
}
