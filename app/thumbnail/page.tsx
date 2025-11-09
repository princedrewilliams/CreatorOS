"use client";

import { Heading, Text, Card, Button } from "@whop/react/components";
import { ArrowLeftIcon, ImageIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

const roadmapHighlights = [
	"Upload artwork or let AI design variations automatically",
	"Generate YouTube-ready sizes with text-safe zones",
	"Pull brand colors, fonts, and recent video stats to personalize each design",
	"Serve downloadable PNG/WebP files and structured metadata for automation",
];

export default function ThumbnailPage() {
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
						Thumbnail Generator
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Create eye-catching thumbnails with AI-powered design
					</Text>
				</div>
			</div>

			<Card size="3" variant="surface" className="p-10">
				<div className="flex flex-col items-center gap-6 text-center">
					<div className="w-24 h-24 rounded-full bg-violet-a2 dark:bg-violet-a3 flex items-center justify-center">
						<ImageIcon className="w-12 h-12 text-violet-11 dark:text-violet-10" />
					</div>
					<Heading size="6" as="h2" className="text-gray-12 dark:text-gray-12">
						AI thumbnail design is coming soon
					</Heading>
					<Text size="3" color="gray" className="max-w-2xl text-gray-11 dark:text-gray-11">
						We&apos;re building a pipeline that combines brand-safe uploads, preset layouts, and AI art models to turn
						your ideas into scroll-stopping thumbnails in seconds.
					</Text>
					<div className="grid gap-4 sm:grid-cols-2 w-full max-w-3xl text-left">
						{roadmapHighlights.map((item, index) => (
							<motion.div
								key={item}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
								className="p-4 rounded-xl border border-violet-a4/40 dark:border-violet-a5/40 bg-violet-a2/30 dark:bg-violet-a3/30"
							>
								<Text size="2" color="violet" weight="medium">
									{item}
								</Text>
							</motion.div>
						))}
					</div>
					<Button color="violet" size="3" variant="soft" disabled className="cursor-not-allowed opacity-80">
						Launching soon
					</Button>
				</div>
			</Card>
		</div>
	);
}
