"use client";

import { Heading, Text, Card } from "@whop/react/components";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

const sections = [
	{
		title: "1. Information We Collect",
		content:
			"We collect account information you provide, usage analytics, and data from YouTube when you connect your channel to CreatorOS. We do not sell personal information and only use it to deliver and improve the service.",
	},
	{
		title: "2. How We Use Information",
		content:
			"CreatorOS uses your data to authenticate you, power analytics dashboards, and provide content creation features. We may send transactional emails or product updates but never rent or sell your contact details.",
	},
	{
		title: "3. Third-Party Services",
		content:
			"We integrate with YouTube and Whop to deliver features. Each integration follows the respective platform policies. You can revoke access at any time from within those platforms or your Google Account settings.",
	},
	{
		title: "4. Google User Data (YouTube Integration)",
		content: (
			<>
				<strong>Data Accessed:</strong> When you connect your YouTube account to CreatorOS, we access the following types of Google user data through the YouTube Data API v3:
				<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
					<li>Channel information: Channel ID, channel title, profile picture, and custom URL</li>
					<li>Channel statistics: Subscriber count, total video views, and video count</li>
					<li>Video metadata: Video titles, descriptions, thumbnails, publication dates, and video IDs</li>
					<li>Video statistics: View counts, like counts, and comment counts for your videos</li>
					<li>OAuth tokens: Access tokens and refresh tokens for authenticated API requests</li>
					<li>Video upload capabilities: Permission to upload videos, set metadata (title, description, tags, visibility), and upload custom thumbnails</li>
				</ul>
				<br />
				<strong>Data Sharing:</strong> We do not share your Google user data with any third parties. Your YouTube data is used solely within CreatorOS to:
				<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
					<li>Display analytics dashboards showing your channel performance</li>
					<li>Show your video posts and their engagement metrics</li>
					<li>Enable video uploads to your YouTube channel when you choose to post content</li>
					<li>Store your connection status and basic channel information for account management</li>
				</ul>
				We do not sell, rent, or share your Google user data with advertisers, data brokers, or any other third parties.
				<br />
				<br />
				<strong>Data Storage & Protection:</strong> We implement industry-standard security measures to protect your Google user data:
				<ul className="list-disc list-inside ml-4 mt-2 space-y-1">
					<li>OAuth access tokens and refresh tokens are stored in secure, HTTP-only cookies with SameSite protection</li>
					<li>All API requests to Google services are made over HTTPS using encrypted connections</li>
					<li>Analytics data is cached temporarily and displayed in your dashboard; raw data is not permanently stored</li>
					<li>You can revoke access at any time by disconnecting your YouTube account in CreatorOS or through your Google Account settings</li>
					<li>When you disconnect your account, all stored tokens and associated data are immediately deleted</li>
				</ul>
			</>
		),
	},
	{
		title: "5. Data Retention and Deletion",
		content: (
			<>
				We retain content and analytics data for as long as your account is active. You can request deletion of your data at any time through our{" "}
				<Link href="/data-deletion" className="text-blue-10 underline">
					Data Deletion Request page
				</Link>{" "}
				or by contacting support@creatoros.com. When you request deletion, we will permanently remove all your data from our systems within 30 days.
			</>
		),
	},
	{
		title: "6. Security",
		content:
			"We use industry-standard encryption and security practices to protect your data. All connections are secured with HTTPS, and sensitive credentials are stored using secure, encrypted methods. We regularly review and update our security practices.",
	},
	{
		title: "7. Your Rights",
		content:
			"You have the right to access, correct, or delete your personal data. You can disconnect your YouTube account at any time, which will remove your stored credentials and associated data. For data deletion requests or questions about your data, contact us at support@creatoros.com.",
	},
	{
		title: "8. Contact",
		content:
			"For privacy questions or requests, email support@creatoros.com with the subject line 'Privacy'. We respond within 7 business days.",
	},
];

export default function PrivacyPolicyPage() {
	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3 mb-4">
				<BackButton href="/dashboard" />
			</div>
			<div className="space-y-2">
				<Heading size="8" as="h1" className="text-gray-12 dark:text-gray-12">
					Privacy Policy
				</Heading>
				<Text size="4" color="gray" className="text-gray-11 dark:text-gray-11">
					Last updated: January 21, 2026
				</Text>
			</div>

			<Card size="3" variant="surface" className="p-6 space-y-6">
				<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
					At CreatorOS we respect your privacy and handle your information responsibly. This policy explains what data we collect, how we use it, and the choices you have. By using CreatorOS you agree to the practices described here.
				</Text>

				{sections.map((section) => (
					<section key={section.title} className="space-y-2">
						<Heading size="5" as="h2" className="text-gray-12 dark:text-gray-12">
							{section.title}
						</Heading>
						{typeof section.content === "string" ? (
							<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
								{section.content}
							</Text>
						) : (
							<div className="text-gray-11 dark:text-gray-11 text-sm sm:text-base space-y-3">
								{section.content}
							</div>
						)}
					</section>
				))}

				<div className="space-y-2">
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						Please also review our{" "}
						<Link href="/terms" className="text-blue-10 underline">
							Terms of Service
						</Link>{" "}
						for more details on how CreatorOS is provided.
					</Text>
					<Text size="3" color="gray" className="text-gray-11 dark:text-gray-11">
						To request deletion of your data, please visit our{" "}
						<Link href="/data-deletion" className="text-blue-10 underline">
							Data Deletion Request page
						</Link>
						.
					</Text>
				</div>
			</Card>
		</div>
	);
}
