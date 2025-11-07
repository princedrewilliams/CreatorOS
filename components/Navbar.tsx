"use client";

import { Button } from "@whop/react/components";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";

export function Navbar() {
	const pathname = usePathname();
	const { setSidebarOpen, isPro } = useAppStore();

	const isDashboard = pathname === "/" || pathname === "/dashboard";

	return (
		<nav className="sticky top-0 z-50 w-full border-b border-gray-a4 dark:border-gray-a6 bg-gray-a1 dark:bg-gray-a2 backdrop-blur-md">
			<div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
				<div className="flex items-center gap-4 flex-shrink-0 overflow-visible">
					<Button
						variant="ghost"
						size="2"
						className="lg:hidden flex-shrink-0"
						onClick={() => useAppStore.getState().setSidebarOpen(true)}
					>
						<HamburgerMenuIcon />
					</Button>
					<Link href="/" className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 no-underline overflow-visible">
						<span className="text-6 font-bold text-gray-12 dark:text-gray-12">CreatorOS</span>
					</Link>
				</div>

				<div className="flex items-center gap-3 flex-shrink-0">
					{!isPro && (
						<Button
							variant="solid"
							color="blue"
							size="2"
							asChild
						>
							<Link href="/upgrade">Upgrade to Pro</Link>
						</Button>
					)}
					{!isDashboard && (
						<Button variant="ghost" size="2" asChild>
							<Link href="/dashboard">Back to Dashboard</Link>
						</Button>
					)}
				</div>
			</div>
		</nav>
	);
}

