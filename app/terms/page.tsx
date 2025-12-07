"use client";

import { Heading, Text, Card } from "@whop/react/components";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

const clauses = [
	{
		title: "1. Acceptance of Terms",
		body: "By using CreatorOS you agree to these terms and all referenced policies. If you do not agree, do not use the service.",
	},
	{
		title: "2. Accounts and Access",
		body: "You are responsible for maintaining the confidentiality of your login credentials and ensuring that the information you provide is accurate. We may suspend accounts that violate platform policies.",
	},
	{
		title: "3. Content Ownership",
		body: "You retain ownership of the content you upload or connect. You grant CreatorOS a limited license to process that content for the purpose of delivering features such as analytics, scheduling, and automation.",
	},
	{
		title: "4. Acceptable Use",
		body: "You will not use CreatorOS to violate other platforms' terms, harass individuals, or distribute malware. Automated downloads must respect the terms of the original platforms.",
	},
	{
		title: "5. Termination",
		body: "We may suspend or terminate the service at any time. You may cancel by requesting account deletion via support@creatoros.com. Upon termination we will remove stored data in accordance with our Privacy Policy.",
	},
	{
		title: "6. Limitation of Liability",
		body: "CreatorOS is provided 'as-is' without warranties. We are not liable for indirect or consequential damages arising from use of the service.",
	},
	{
		title: "7. Changes",
		body: "We may update these terms from time to time. Continued use of the service constitutes acceptance of the updated terms.",
	},
];

export default function TermsPage() {
	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>
			<div className="space-y-2">
				<Heading size="8" as="h1" className="text-gray-12 dark:text-gray-12">
					Terms of Service
				</Heading>
				<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
					Last updated: {new Date().toISOString().slice(0, 10)}
				</Text>
			</div>

			<Card size="3" variant="surface" className="p-6 space-y-6">
				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
					These Terms of Service govern your access to and use of CreatorOS. Please read them carefully. If you have any
					questions, contact support@creatoros.com.
				</Text>

				{clauses.map((clause) => (
					<section key={clause.title} className="space-y-2">
						<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
							{clause.title}
						</Heading>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							{clause.body}
						</Text>
					</section>
				))}

				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
					For information on how we collect and process personal data, please see our{" "}
					<Link href="/privacy" className="text-blue-10 underline">
						Privacy Policy
					</Link>
					.
				</Text>
			</Card>
		</div>
	);
}

