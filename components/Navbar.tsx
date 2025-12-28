"use client";

import Link from "next/link";

export function Navbar() {
	return (
		<nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black backdrop-blur-lg shadow-sm">
			<div className="mx-auto flex h-16 items-center justify-between px-3 sm:px-4 lg:px-8 gap-2 sm:gap-4">
				<div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0">
					<Link href="/" className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 no-underline min-w-0">
						<span className="text-5 sm:text-6 font-bold text-white truncate">CreatorOS</span>
					</Link>
				</div>
			</div>
		</nav>
	);
}

