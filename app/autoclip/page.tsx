"use client";

import { Heading, Text, Card, Button, Badge, Separator } from "@whop/react/components";
import { ArrowLeftIcon, VideoIcon, UploadIcon, PlayIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AutoclipPage() {
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
						Auto Clip
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						Automatically create engaging clips from your videos using AI
					</Text>
				</div>
			</div>

			{/* Upload Section */}
			<Card size="3" variant="surface" className="p-8">
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="w-20 h-20 rounded-full bg-purple-a2 dark:bg-purple-a3 flex items-center justify-center">
						<VideoIcon className="w-10 h-10 text-purple-11 dark:text-purple-10" />
					</div>
					<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
						Upload Your Video
					</Heading>
					<Text size="3" color="gray" className="max-w-md text-gray-11 dark:text-gray-11">
						Upload a video and our AI will automatically identify the best moments to create clips
					</Text>
					<Button color="purple" size="3" variant="solid" className="mt-4">
						<UploadIcon className="mr-2" />
						Choose Video File
					</Button>
					<Text size="1" color="gray" className="text-gray-11 dark:text-gray-11">
						Supports MP4, MOV, AVI up to 500MB
					</Text>
				</div>
			</Card>

			{/* AI Processing Placeholder */}
			<Card size="3" variant="surface" className="p-6">
				<Heading size="5" as="h2" className="mb-4 text-gray-12 dark:text-gray-12">
					AI Processing
				</Heading>
				<div className="flex flex-col gap-4">
					<div className="p-4 rounded-lg bg-gray-a2 dark:bg-gray-a3 border border-gray-a4 dark:border-gray-a6">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-lg bg-purple-a2 dark:bg-purple-a3 flex items-center justify-center">
								<PlayIcon className="w-6 h-6 text-purple-11 dark:text-purple-10" />
							</div>
							<div className="flex-1">
								<Heading size="4" as="h3" className="mb-1 text-gray-12 dark:text-gray-12">
									Clip 1: Best Moments
								</Heading>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									0:45 - 1:23 • High engagement detected
								</Text>
							</div>
							<Button variant="ghost" size="2" color="purple">
								Preview
							</Button>
						</div>
					</div>
					<div className="p-4 rounded-lg bg-gray-a2 dark:bg-gray-a3 border border-gray-a4 dark:border-gray-a6">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-lg bg-purple-a2 dark:bg-purple-a3 flex items-center justify-center">
								<PlayIcon className="w-6 h-6 text-purple-11 dark:text-purple-10" />
							</div>
							<div className="flex-1">
								<Heading size="4" as="h3" className="mb-1 text-gray-12 dark:text-gray-12">
									Clip 2: Key Highlights
								</Heading>
								<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11">
									2:10 - 3:05 • Peak viewer retention
								</Text>
							</div>
							<Button variant="ghost" size="2" color="purple">
								Preview
							</Button>
						</div>
					</div>
				</div>
			</Card>

			{/* Pro Feature Badge */}
			<Card size="2" variant="surface" className="p-4 bg-blue-a2 dark:bg-blue-a3 border-blue-6 dark:border-blue-5">
				<div className="flex items-center gap-3">
					<Badge color="blue" size="2" variant="solid">
						Pro Feature
					</Badge>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						Unlock unlimited AI-powered clips with Pro
					</Text>
					<Button color="blue" size="2" variant="solid" className="ml-auto" asChild>
						<Link href="/upgrade">Upgrade</Link>
					</Button>
				</div>
			</Card>
		</div>
	);
}

