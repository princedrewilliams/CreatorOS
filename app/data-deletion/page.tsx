"use client";

import { Heading, Text, Card, Button } from "@whop/react/components";
import Link from "next/link";
import { TrashIcon } from "@radix-ui/react-icons";
import { BackButton } from "@/components/BackButton";

export default function DataDeletionPage() {
	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>
			<div className="space-y-2">
				<Heading size="8" as="h1" className="text-gray-12 dark:text-gray-12">
					Data Deletion Request
				</Heading>
				<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
					Request deletion of your data from CreatorOS
				</Text>
			</div>

			<Card size="3" variant="surface" className="p-6 space-y-6">
				<div className="space-y-4">
					<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
						How to Delete Your Data
					</Heading>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						You can request deletion of your data from CreatorOS using the methods below. We respect your privacy and will process all deletion requests promptly.
					</Text>
				</div>

				<div className="space-y-4">
					<div className="p-4 border border-gray-6 dark:border-gray-6 rounded-lg space-y-2">
						<Heading size="4" as="h3" className="text-gray-12 dark:text-gray-12 flex items-center gap-2">
							<TrashIcon className="w-5 h-5" />
							Method 1: Through YouTube/Google
						</Heading>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							If you connected your YouTube account, you can revoke CreatorOS access and request data deletion through Google:
						</Text>
						<ul className="list-disc list-inside space-y-1 text-gray-11 dark:text-gray-11 text-sm ml-4">
							<li>Go to your Google Account at myaccount.google.com</li>
							<li>Navigate to Security → Third-party apps with account access</li>
							<li>Find CreatorOS and click "Remove Access"</li>
						</ul>
						<Text size="2" color="gray" className="text-gray-10 dark:text-gray-10 mt-2">
							When you revoke access, we will automatically delete all associated data from our systems.
						</Text>
					</div>

					<div className="p-4 border border-gray-6 dark:border-gray-6 rounded-lg space-y-2">
						<Heading size="4" as="h3" className="text-gray-12 dark:text-gray-12 flex items-center gap-2">
							<TrashIcon className="w-5 h-5" />
							Method 2: Direct Request via Email
						</Heading>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							Send an email to{" "}
							<a
								href="mailto:support@creatoros.com?subject=Data%20Deletion%20Request"
								className="text-blue-10 underline hover:text-blue-11"
							>
								support@creatoros.com
							</a>{" "}
							with the subject line "Data Deletion Request" and include:
						</Text>
						<ul className="list-disc list-inside space-y-1 text-gray-11 dark:text-gray-11 text-sm ml-4">
							<li>Your account email address or username</li>
							<li>Your YouTube channel name (if connected)</li>
							<li>Confirmation that you want to delete all your data</li>
						</ul>
						<Text size="2" color="gray" className="text-gray-10 dark:text-gray-10 mt-2">
							We will process your request within 30 days and confirm deletion via email.
						</Text>
					</div>

					<div className="p-4 border border-gray-6 dark:border-gray-6 rounded-lg space-y-2">
						<Heading size="4" as="h3" className="text-gray-12 dark:text-gray-12">
							What Data Will Be Deleted?
						</Heading>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							When you request data deletion, we will permanently remove:
						</Text>
						<ul className="list-disc list-inside space-y-1 text-gray-11 dark:text-gray-11 text-sm ml-4">
							<li>Your account information and profile data</li>
							<li>All analytics data and channel metrics</li>
							<li>YouTube OAuth access tokens and credentials</li>
							<li>Saved channel analyses and reports</li>
							<li>Pro subscription data (subscription itself managed by Whop)</li>
							<li>Any cached content or media</li>
						</ul>
						<Text size="2" color="gray" className="text-gray-10 dark:text-gray-10 mt-2">
							Note: Some data may be retained for legal compliance purposes as required by law, but will not be used for any other purpose.
						</Text>
					</div>

					<div className="p-4 bg-blue-2 dark:bg-blue-2 border border-blue-6 dark:border-blue-6 rounded-lg">
						<Text size="3" color="gray" className="text-gray-12 dark:text-gray-12">
							<strong>Important:</strong> Data deletion is permanent and cannot be undone. Once your data is deleted, you will need to create a new account and reconnect your YouTube channel if you wish to use CreatorOS again.
						</Text>
					</div>
				</div>

				<div className="flex gap-4 pt-4">
					<Button asChild variant="solid" color="blue">
						<a href="mailto:support@creatoros.com?subject=Data%20Deletion%20Request">
							Request Data Deletion
						</a>
					</Button>
					<Button asChild variant="soft">
						<Link href="/privacy">
							View Privacy Policy
						</Link>
					</Button>
				</div>
			</Card>

			<Card size="2" variant="surface" className="p-4">
				<Text size="2" color="gray" className="text-gray-10 dark:text-gray-10">
					For more information about how we handle your data, please review our{" "}
					<Link href="/privacy" className="text-blue-10 underline">
						Privacy Policy
					</Link>
					{" "}and{" "}
					<Link href="/terms" className="text-blue-10 underline">
						Terms of Service
					</Link>
					.
				</Text>
			</Card>
		</div>
	);
}
