import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { FacebookSDK } from "@/components/FacebookSDK";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

export const metadata: Metadata = {
	title: "CreatorOS - All-in-One Creator Tool",
	description: "Professional content planning, video automation, and analytics for creators",
	openGraph: {
		title: "CreatorOS - All-in-One Creator Tool",
		description: "Professional content planning, video automation, and analytics for creators",
		type: "website",
		url: process.env.NEXT_PUBLIC_APP_URL || "https://creatoros.online",
		images: [
			{
				url: `${process.env.NEXT_PUBLIC_APP_URL || "https://creatoros.online"}/og-image.png`,
				width: 1200,
				height: 630,
				alt: "CreatorOS - All-in-One Creator Tool",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "CreatorOS - All-in-One Creator Tool",
		description: "Professional content planning, video automation, and analytics for creators",
		images: [`${process.env.NEXT_PUBLIC_APP_URL || "https://creatoros.online"}/og-image.png`],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} antialiased`}>
				<FacebookSDK />
				<WhopApp accentColor="blue" appearance="inherit">
					<div className="flex min-h-screen flex-col">
						<Navbar />
						<div className="flex flex-1">
							<Sidebar />
							<main className="flex-1 w-full lg:pl-64">
								<div className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
									{children}
								</div>
							</main>
						</div>
						<Footer />
					</div>
				</WhopApp>
			</body>
		</html>
	);
}
