"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";

export function UserMenu() {
	const { user, loading, isConfigured, signOut } = useAuth();
	const [isOpen, setIsOpen] = useState(false);

	// Don't show login if Supabase isn't configured
	if (!isConfigured) {
		return null;
	}

	if (loading) {
		return (
			<div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
		);
	}

	if (!user) {
		return (
			<Link
				href="/login"
				className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-sm font-medium transition-all"
			>
				<LogIn className="w-4 h-4" />
				<span>Sign In</span>
			</Link>
		);
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] transition-all"
			>
				{user.user_metadata?.avatar_url ? (
					<Image
						src={user.user_metadata.avatar_url}
						alt={user.user_metadata?.full_name || "User"}
						width={28}
						height={28}
						className="rounded-full"
					/>
				) : (
					<div className="w-7 h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
						<User className="w-4 h-4 text-white" />
					</div>
				)}
				<span className="text-sm text-[var(--text-secondary)] hidden sm:block max-w-[100px] truncate">
					{user.user_metadata?.full_name || user.email?.split("@")[0]}
				</span>
				<ChevronDown
					className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen && (
				<>
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>
					<div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface-bg)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-50 overflow-hidden">
						<div className="px-4 py-3 border-b border-[var(--border-subtle)]">
							<p className="text-sm font-medium text-[var(--text-primary)] truncate">
								{user.user_metadata?.full_name || "User"}
							</p>
							<p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
						</div>
						<button
							onClick={() => {
								signOut();
								setIsOpen(false);
							}}
							className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--status-error-text)] hover:bg-[var(--surface-hover)] transition-colors"
						>
							<LogOut className="w-4 h-4" />
							Sign Out
						</button>
					</div>
				</>
			)}
		</div>
	);
}
