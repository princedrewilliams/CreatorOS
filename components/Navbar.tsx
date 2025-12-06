"use client";

import { Button, Text } from "@whop/react/components";
import { HamburgerMenuIcon, PersonIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const { setSidebarOpen, isPro, user, setUser } = useAppStore();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check if user is logged in
		fetch("/api/auth/me", {
			credentials: "include",
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.success && data.user) {
					setUser(data.user);
				} else {
					setUser(null);
				}
			})
			.catch(() => {
				setUser(null);
			})
			.finally(() => {
				setLoading(false);
			});
	}, [setUser]);

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", { 
				method: "POST",
				credentials: "include",
			});
			setUser(null);
			// Clear social connections
			const { setSocialConnection } = useAppStore.getState();
			["youtube", "instagram", "tiktok"].forEach((platform) => {
				setSocialConnection({
					platform: platform as "youtube" | "instagram" | "tiktok",
					connected: false,
				});
			});
			router.push("/");
		} catch (err) {
			console.error("Logout error:", err);
			// Still clear user state even if API call fails
			setUser(null);
			router.push("/");
		}
	};

	const isDashboard = pathname === "/" || pathname === "/dashboard" || pathname === "/about";

	return (
		<nav className="sticky top-0 z-50 w-full border-b border-gray-a6 dark:border-gray-a7 bg-white dark:bg-gray-a2 backdrop-blur-lg shadow-sm">
			<div className="mx-auto flex h-16 items-center justify-between px-3 sm:px-4 lg:px-8 gap-2 sm:gap-4">
				<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0">
					<Button
						variant="ghost"
						size="2"
						className="lg:hidden flex-shrink-0"
						onClick={() => useAppStore.getState().setSidebarOpen(true)}
					>
						<HamburgerMenuIcon className="w-5 h-5 text-gray-12 dark:text-gray-12" />
					</Button>
					<Link href="/" className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 no-underline min-w-0">
						<span className="text-5 sm:text-6 font-bold text-gray-12 dark:text-gray-12 truncate">CreatorOS</span>
					</Link>
				</div>

				<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
					{!loading && user ? (
						<>
							<Text size="2" color="gray" className="hidden sm:block text-gray-11 dark:text-gray-11">
								{user.whop_username}
							</Text>
							{/* Mobile logout button */}
							<button
								onClick={handleLogout}
								className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-a4 dark:hover:bg-gray-a5 text-gray-11 dark:text-gray-11 transition-colors"
								title="Logout"
							>
								<PersonIcon className="w-5 h-5" />
							</button>
							{/* Desktop logout button */}
							<Button
								variant="ghost"
								color="gray"
								size="2"
								onClick={handleLogout}
								className="hidden sm:inline-flex"
							>
								Logout
							</Button>
						</>
					) : !loading ? (
						<>
							{/* Mobile login button - always show when not logged in */}
							<Link 
								href="/login" 
								className="sm:hidden flex items-center justify-center w-8 h-8 rounded-md bg-blue-9 hover:bg-blue-10 text-white transition-colors"
								title="Login"
							>
								<PersonIcon className="w-5 h-5" />
							</Link>
							{/* Desktop login button */}
							<Button
								variant="solid"
								color="blue"
								size="2"
								className="hidden sm:inline-flex"
								asChild
							>
								<Link href="/login">
									<PersonIcon className="mr-2" />
									Login
								</Link>
							</Button>
						</>
					) : null}
					{!isPro && user && !loading && (
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

