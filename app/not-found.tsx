"use client";

import Link from "next/link";
import { Button, Heading, Text, Card } from "@whop/react/components";
import { HomeIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

export default function NotFound() {
	const router = useRouter();
	
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-a1 dark:bg-gray-a2">
			<Card size="3" variant="surface" className="p-8 max-w-md w-full text-center">
				<div className="mb-6">
					<Heading size="9" className="text-gray-12 dark:text-gray-12 mb-2">
						404
					</Heading>
					<Heading size="6" className="text-gray-12 dark:text-gray-12 mb-4">
						Page Not Found
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						The page you're looking for doesn't exist or has been moved.
					</Text>
				</div>
				<div className="flex flex-col gap-3">
					<Button variant="solid" color="blue" size="3" onClick={() => router.back()}>
						<ArrowLeftIcon className="mr-2" />
						Go Back
					</Button>
					<Button variant="solid" color="blue" size="3" asChild>
						<Link href="/dashboard">
							<HomeIcon className="mr-2" />
							Go to Dashboard
						</Link>
					</Button>
				</div>
			</Card>
		</div>
	);
}


