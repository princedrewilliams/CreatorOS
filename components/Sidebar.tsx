"use client";

import { Button, Text, Separator } from "@whop/react/components";
import {
	Cross2Icon,
	HomeIcon,
	CalendarIcon,
	VideoIcon,
	ImageIcon,
	FileTextIcon,
	BarChartIcon,
	DownloadIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: HomeIcon },
	{ href: "/planner", label: "Content Planner", icon: CalendarIcon },
	{ href: "/autoclip", label: "Auto Clip", icon: VideoIcon },
	{ href: "/thumbnail", label: "Thumbnail Gen", icon: ImageIcon },
	{ href: "/sponsors", label: "Sponsors", icon: FileTextIcon },
	{ href: "/video-downloader", label: "Video Downloader", icon: DownloadIcon },
	{ href: "/analytics", label: "Analytics", icon: BarChartIcon },
];

export function Sidebar() {
	const pathname = usePathname();
	const { sidebarOpen, setSidebarOpen } = useAppStore();

	return (
		<>
			{/* Mobile Overlay */}
			<AnimatePresence>
				{sidebarOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-40 bg-gray-a11 dark:bg-gray-a12 backdrop-blur-md lg:hidden"
							onClick={() => setSidebarOpen(false)}
						/>
						<motion.aside
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
							className="fixed left-0 top-0 z-50 h-full w-64 bg-gray-a1 dark:bg-gray-a2 border-r border-gray-a4 dark:border-gray-a6 lg:hidden overflow-hidden"
						>
							<div className="flex h-16 items-center justify-between px-4 border-b border-gray-a4 dark:border-gray-a6 gap-2">
								<span className="text-5 font-bold text-gray-12 dark:text-gray-12 whitespace-nowrap truncate flex-1 min-w-0">CreatorOS</span>
								<Button
									variant="ghost"
									size="1"
									onClick={() => setSidebarOpen(false)}
									className="flex-shrink-0"
								>
									<Cross2Icon />
								</Button>
							</div>
							<nav className="p-4 space-y-1">
								{navItems.map((item) => {
									const Icon = item.icon;
									const isActive = pathname === item.href;
									return (
										<Button
											key={item.href}
											variant={isActive ? "soft" : "ghost"}
											color={isActive ? "blue" : "gray"}
											size="2"
											className="w-full justify-start"
											asChild
										>
											<Link href={item.href} onClick={() => setSidebarOpen(false)}>
												<Icon className="mr-2" />
												{item.label}
											</Link>
										</Button>
									);
								})}
							</nav>
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* Desktop Sidebar */}
			<aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:top-16 lg:border-r lg:border-gray-a4 dark:lg:border-gray-a6 lg:bg-gray-a1 dark:lg:bg-gray-a2">
				<nav className="flex-1 p-4 space-y-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;
						return (
							<Button
								key={item.href}
								variant={isActive ? "soft" : "ghost"}
								color={isActive ? "blue" : "gray"}
								size="2"
								className="w-full justify-start"
								asChild
							>
								<Link href={item.href}>
									<Icon className="mr-2" />
									{item.label}
								</Link>
							</Button>
						);
					})}
				</nav>
			</aside>
		</>
	);
}

