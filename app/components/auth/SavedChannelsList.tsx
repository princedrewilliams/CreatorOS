"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Bookmark, Trash2 } from "lucide-react";

interface SavedChannel {
	channelId: string;
	channelName: string;
	thumbnail: string;
	notes: string;
	savedAt: string;
}

export function SavedChannelsList() {
	const [isOpen, setIsOpen] = useState(false);
	const [channels, setChannels] = useState<SavedChannel[]>([]);
	const [loading, setLoading] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		fetchSavedChannels();
	}, []);

	const fetchSavedChannels = async () => {
		try {
			const authRes = await fetch("/api/auth/me");
			if (authRes.ok) {
				const authData = await authRes.json();
				if (authData.user) {
					setIsLoggedIn(true);

					const res = await fetch("/api/saved-channels");
					if (res.ok) {
						const data = await res.json();
						setChannels(data.channels || []);
					}
				}
			}
		} catch (error) {
			console.error("Error fetching saved channels:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleRemove = async (channelId: string) => {
		try {
			const res = await fetch(
				`/api/saved-channels?channelId=${encodeURIComponent(channelId)}`,
				{ method: "DELETE" }
			);
			if (res.ok) {
				setChannels(channels.filter((c) => c.channelId !== channelId));
			}
		} catch (error) {
			console.error("Error removing channel:", error);
		}
	};

	if (!isLoggedIn || loading) {
		return null;
	}

	if (channels.length === 0) {
		return null;
	}

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.08] hover:text-white transition-all"
			>
				<Bookmark className="w-4 h-4" />
				<span className="text-sm font-medium">Saved ({channels.length})</span>
				<ChevronDown
					className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen && (
				<div className="absolute top-full right-0 mt-2 w-72 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
					<div className="max-h-80 overflow-y-auto">
						{channels.map((channel) => (
							<div
								key={channel.channelId}
								className="flex items-center gap-3 p-3 hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-0"
							>
								<div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
									{channel.thumbnail && (
										<Image
											src={channel.thumbnail}
											alt={channel.channelName}
											width={40}
											height={40}
											className="object-cover"
										/>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<Link
										href={`/channel-dna?url=${encodeURIComponent(channel.channelId)}`}
										className="text-sm font-medium text-white hover:text-[var(--accent-primary)] truncate block"
										onClick={() => setIsOpen(false)}
									>
										{channel.channelName}
									</Link>
									{channel.notes && (
										<p className="text-xs text-[var(--text-muted)] truncate">
											{channel.notes}
										</p>
									)}
								</div>
								<button
									onClick={() => handleRemove(channel.channelId)}
									className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
