"use client";

import { Heading, Text, Card, Button, Badge } from "@whop/react/components";
import { VideoIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AutoclipPage() {
	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<Heading size="8" as="h1" className="mb-2 text-gray-12 dark:text-gray-12">
						Auto Clip
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Automatically create engaging clips from your videos using AI
					</Text>
				</div>
			</div>

			<Card size="3" variant="surface" className="p-10">
				<div className="flex flex-col items-center gap-6 text-center">
					<div className="w-24 h-24 rounded-full bg-purple-a2 dark:bg-purple-a3 flex items-center justify-center">
						<VideoIcon className="w-12 h-12 text-purple-11 dark:text-purple-10" />
					</div>
					<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
						Smart clipping is coming soon
					</Heading>
					<Text size="3" color="gray" className="max-w-2xl text-gray-11 dark:text-gray-11">
						We&apos;re building an AI workflow that uploads your videos, transcribes them, detects the highest-energy
						moments, and returns multiple ready-to-post clips complete with transcripts. Stay tuned!
					</Text>
					<div className="grid gap-4 sm:grid-cols-3 w-full max-w-3xl">
						{[
							"Upload to secure storage with automatic processing queue",
							"AI-powered scene detection and keyword analysis",
							"Clip-ready downloads plus transcript JSON with timestamps",
						].map((item, index) => (
							<motion.div
								key={item}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="p-4 rounded-xl border border-purple-a4/40 dark:border-purple-a5/40 bg-purple-a2/30 dark:bg-purple-a3/30 text-left"
							>
								<Text size="2" color="purple" weight="medium">
									{item}
								</Text>
							</motion.div>
						))}
					</div>
					<Badge color="purple" size="2" variant="soft">
						Launching soon
					</Badge>
				</div>
			</Card>
		</div>
	);
}
