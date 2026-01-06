"use client";

import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

interface SaveChannelButtonProps {
	channelId: string;
	channelName: string;
	thumbnail: string;
}

export function SaveChannelButton({
	channelId,
	channelName,
	thumbnail,
}: SaveChannelButtonProps) {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isSaved, setIsSaved] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkAuthAndSaved();
	}, [channelId]);

	const checkAuthAndSaved = async () => {
		try {
			// Check if logged in
			const authRes = await fetch("/api/auth/me");
			if (authRes.ok) {
				const authData = await authRes.json();
				if (authData.user) {
					setIsLoggedIn(true);

					// Check if channel is saved
					const savedRes = await fetch("/api/saved-channels");
					if (savedRes.ok) {
						const savedData = await savedRes.json();
						const saved = savedData.channels?.some(
							(c: { channelId: string }) => c.channelId === channelId
						);
						setIsSaved(saved);
					}
				}
			}
		} catch (error) {
			console.error("Error checking auth:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!isLoggedIn) {
			// Redirect to login
			window.location.href = "/login?redirect=" + encodeURIComponent(window.location.href);
			return;
		}

		setLoading(true);

		try {
			if (isSaved) {
				// Remove channel
				const res = await fetch(
					`/api/saved-channels?channelId=${encodeURIComponent(channelId)}`,
					{ method: "DELETE" }
				);
				if (res.ok) {
					setIsSaved(false);
				}
			} else {
				// Save channel
				const res = await fetch("/api/saved-channels", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ channelId, channelName, thumbnail }),
				});
				if (res.ok) {
					setIsSaved(true);
				}
			}
		} catch (error) {
			console.error("Error saving channel:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<button
				disabled
				className="px-4 py-2 rounded-xl bg-white/[0.05] text-[var(--text-muted)] flex items-center gap-2"
			>
				<Loader2 className="w-4 h-4 animate-spin" />
			</button>
		);
	}

	return (
		<button
			onClick={handleSave}
			className={`
				px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-all
				${
					isSaved
						? "bg-[var(--accent-muted)] text-white"
						: "bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.08] hover:text-white"
				}
			`}
		>
			{isSaved ? (
				<>
					<BookmarkCheck className="w-4 h-4" />
					Saved
				</>
			) : (
				<>
					<Bookmark className="w-4 h-4" />
					{isLoggedIn ? "Save" : "Login to Save"}
				</>
			)}
		</button>
	);
}
