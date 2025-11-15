import Link from "next/link";
import { Button, Heading, Text, Card } from "@whop/react/components";
import { HomeIcon } from "@radix-ui/react-icons";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8">
			<Card size="3" variant="surface" className="p-8 max-w-md w-full text-center">
				<div className="mb-6">
					<Heading size="9" className="text-gray-12 dark:text-gray-12 mb-2">
						404
					</Heading>
					<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
						This page could not be found.
					</Text>
				</div>
				<Button variant="solid" color="blue" size="3" asChild>
					<Link href="/dashboard">
						<HomeIcon className="mr-2" />
						Go to Dashboard
					</Link>
				</Button>
			</Card>
		</div>
	);
}

