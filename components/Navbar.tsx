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

	const isDashboard = pathname === "/" || pathname === "/dashboard" || pathname === "/about";

	return (
		<nav className="sticky top-0 z-50 w-full border-b border-gray-a4 dark:border-gray-a6 bg-gray-a1 dark:bg-gray-a2 backdrop-blur-md">
			<div className="mx-auto flex h-16 items-center justify-between px-3 sm:px-4 lg:px-8 gap-2 sm:gap-4">
				<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0">
					<Button
						variant="ghost"
						size="2"
						className="lg:hidden flex-shrink-0"
						onClick={() => useAppStore.getState().setSidebarOpen(true)}
					>
						<HamburgerMenuIcon className="w-5 h-5" />
					</Button>
					<Link href="/" className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 no-underline min-w-0">
						<span className="text-5 sm:text-6 font-bold text-gray-12 dark:text-gray-12 truncate">CreatorOS</span>
					</Link>
				</div>

				<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
					{!isPro && (
						<Button
							variant="solid"
							color="blue"
							size="2"
							className="hidden sm:inline-flex"
							asChild
						>
							<Link href="/upgrade">Upgrade to Pro</Link>
						</Button>
					)}
				</div>
			</div>
		</nav>
	);
}

