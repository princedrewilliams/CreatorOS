"use client";

import { Heading, Text, Card } from "@whop/react/components";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

const clauses = [
	{
		title: "1. Acceptance of Terms",
		body: "By accessing or using CreatorOS, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.",
	},
	{
		title: "2. Description of Service",
		body: "CreatorOS is a YouTube analytics and content creation platform that helps creators understand their channel performance and optimize their content strategy. The service includes channel analysis, video metrics, content recommendations, and Pro features available through subscription.",
	},
	{
		title: "3. Account Registration",
		body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account. We reserve the right to suspend or terminate accounts that violate these terms or platform policies.",
	},
	{
		title: "4. Content and Intellectual Property",
		body: "You retain all ownership rights to the content you create and upload. By using CreatorOS, you grant us a limited, non-exclusive license to process your content solely for the purpose of providing our services. This includes displaying analytics, generating insights, and facilitating content creation features.",
	},
	{
		title: "5. Acceptable Use",
		body: "You agree not to use CreatorOS to: violate any applicable laws or regulations; infringe on the rights of others; distribute malicious software; attempt to gain unauthorized access to our systems; or violate YouTube's Terms of Service or Community Guidelines. We reserve the right to terminate access for violations.",
	},
	{
		title: "6. Pro Subscription",
		body: "Pro features are available through paid subscription plans. Subscription fees are billed in advance on a monthly or annual basis. You may cancel your subscription at any time, and cancellation will take effect at the end of the current billing period. Refunds are available within 14 days of initial purchase.",
	},
	{
		title: "7. YouTube API Services",
		body: "CreatorOS uses YouTube API Services. By using our service, you also agree to be bound by the YouTube Terms of Service (https://www.youtube.com/t/terms) and Google Privacy Policy (https://policies.google.com/privacy). You can revoke our access to your YouTube data at any time through your Google Account settings.",
	},
	{
		title: "8. Disclaimer of Warranties",
		body: "CreatorOS is provided 'as is' and 'as available' without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free. Analytics and recommendations are provided for informational purposes and do not guarantee specific results.",
	},
	{
		title: "9. Limitation of Liability",
		body: "To the maximum extent permitted by law, CreatorOS and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to loss of profits, data, or goodwill.",
	},
	{
		title: "10. Modifications to Service",
		body: "We reserve the right to modify, suspend, or discontinue any part of the service at any time. We will provide reasonable notice of significant changes when possible. Continued use of the service after changes constitutes acceptance of the modified terms.",
	},
	{
		title: "11. Termination",
		body: "We may terminate or suspend your access to the service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the service will immediately cease.",
	},
	{
		title: "12. Contact Information",
		body: "For questions about these Terms of Service, please contact us at support@creatoros.com.",
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
					Last updated: January 21, 2026
				</Text>
			</div>

			<Card size="3" variant="surface" className="p-6 space-y-6">
				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
					Welcome to CreatorOS. These Terms of Service govern your access to and use of our platform and services. Please read them carefully before using CreatorOS. By using our service, you agree to be bound by these terms.
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

				<div className="pt-4 border-t border-gray-6">
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						For information on how we collect and process personal data, please see our{" "}
						<Link href="/privacy" className="text-blue-10 underline">
							Privacy Policy
						</Link>
						. To request deletion of your data, visit our{" "}
						<Link href="/data-deletion" className="text-blue-10 underline">
							Data Deletion page
						</Link>
						.
					</Text>
				</div>
			</Card>
		</div>
	);
}
