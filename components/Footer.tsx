"use client";

import { Text } from "@whop/react/components";
import Link from "next/link";

export function Footer() {
	return (
		<footer className="border-t border-gray-a4 dark:border-gray-a6 bg-gray-a1 dark:bg-gray-a2 mt-auto">
			<div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<Text size="2" color="gray" className="text-gray-11 dark:text-gray-11 text-center sm:text-left">
						© 2024 CreatorOS. Built with Whop.
					</Text>
					<nav className="flex items-center justify-center gap-4 text-sm">
						<Link href="/privacy" className="text-blue-10 hover:underline">
							Privacy Policy
						</Link>
						<Link href="/terms" className="text-blue-10 hover:underline">
							Terms of Service
						</Link>
						<a href="mailto:support@creatoros.com" className="text-blue-10 hover:underline">
							Contact
						</a>
					</nav>
				</div>
			</div>
		</footer>
	);
}

