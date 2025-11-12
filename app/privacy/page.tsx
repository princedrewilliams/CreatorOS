"use client";

import { Heading, Text, Card } from "@whop/react/components";
import Link from "next/link";

const sections = [
	{
		title: "1. Information We Collect",
		content:
			"We collect account information you provide, usage analytics, and third-party platform data you connect to CreatorOS. We do not sell personal information and only use it to deliver and improve the service.",
	},
	{
		title: "2. How We Use Information",
		content:
			"CreatorOS uses your data to authenticate you, power analytics dashboards, and provide automation features. We may send transactional emails or product updates but never rent or sell your contact details.",
	},
	{
		title: "3. Third-Party Services",
		content:
			"We integrate with platforms such as YouTube, TikTok, Instagram, Whop, and Apify to deliver features. Each integration follows the respective platform policies. You can revoke access at any time from within those platforms.",
	},
	{
		title: "4. Data Retention",
		content:
			"We retain content and analytics data for as long as your account is active. You can request deletion by contacting support@creatoros.com.",
	},
	{
		title: "5. Contact",
		content:
			"For privacy questions or requests, email support@creatoros.com with the subject line 'Privacy'. We respond within 7 business days.",
	},
];

export default function PrivacyPolicyPage() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<Heading size="8" as="h1" className="text-gray-12 dark:text-gray-12">
					Privacy Policy
				</Heading>
				<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
					Effective date: {new Date().toISOString().slice(0, 10)}
				</Text>
			</div>

			<Card size="3" variant="surface" className="p-6 space-y-6">
				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
					At CreatorOS we respect your privacy and handle your information responsibly. This policy explains what data we
					collect, how we use it, and the choices you have. By using CreatorOS you agree to the practices described here.
				</Text>

				{sections.map((section) => (
					<section key={section.title} className="space-y-2">
						<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
							{section.title}
						</Heading>
						<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
							{section.content}
						</Text>
					</section>
				))}

				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
					Please also review our{" "}
					<Link href="/terms" className="text-blue-10 underline">
						Terms of Service
					</Link>{" "}
					for more details on how CreatorOS is provided.
				</Text>
			</Card>
		</div>
	);
}

