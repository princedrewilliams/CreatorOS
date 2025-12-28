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
						Reverse-Engineer What Makes YouTube Channels Win
					</Heading>
					<Text size="4" className="text-gray-300 sm:text-5 max-w-2xl mx-auto">
						Analyze posting patterns, titles, thumbnails, and content strategy — instantly.
					</Text>
				</div>

				{/* Tools Section */}
				<div className="max-w-4xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Link href="/channel-dna">
							<Button
								variant="solid"
								color="blue"
								size="4"
								className="w-full py-6 text-lg"
							>
								Channel Deconstruction Engine
								<ArrowRightIcon className="ml-2 w-5 h-5" />
							</Button>
						</Link>
					</motion.div>
				</div>

				{/* Content Planner - At Bottom */}
				<div className="max-w-4xl mx-auto pb-12">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<Link href="/planner">
							<Button
								variant="ghost"
								color="blue"
								size="4"
								className="w-full py-6 text-lg border-2 border-blue-8/50 hover:border-blue-8"
							>
								<CalendarIcon className="mr-2 w-5 h-5" />
								Content Planner
								<ArrowRightIcon className="ml-2 w-5 h-5" />
							</Button>
						</Link>
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
