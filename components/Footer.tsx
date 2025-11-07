"use client";

import { Text } from "@whop/react/components";

export function Footer() {
	return (
		<footer className="border-t border-gray-a4 dark:border-gray-a6 bg-gray-a1 dark:bg-gray-a2 mt-auto">
			<div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
				<Text size="2" color="gray" align="center" className="text-gray-11 dark:text-gray-11">
					© 2024 CreatorOS. Built with Whop.
				</Text>
			</div>
		</footer>
	);
}

