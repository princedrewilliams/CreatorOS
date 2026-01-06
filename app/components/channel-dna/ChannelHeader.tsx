"use client";

import Image from "next/image";
import { CircularScoreBadge } from "../ui/CircularScoreBadge";
import { SaveChannelButton } from "../auth/SaveChannelButton";

interface ChannelHeaderProps {
	channelId: string;
	thumbnail: string;
	name: string;
	summary: string;
	score: number;
}

export function ChannelHeader({ channelId, thumbnail, name, summary, score }: ChannelHeaderProps) {
	return (
		<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
			{/* Avatar */}
			<div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0">
				{thumbnail ? (
					<Image
						src={thumbnail}
						alt={name}
						fill
						className="object-cover"
					/>
				) : (
					<div className="w-full h-full bg-white/10 flex items-center justify-center">
						<span className="text-2xl font-bold text-white/40">
							{name?.charAt(0) || "?"}
						</span>
					</div>
				)}
			</div>

			{/* Channel info */}
			<div className="flex-1 min-w-0">
				<h1 className="text-xl sm:text-2xl font-bold text-white truncate">
					{name}
				</h1>
				<p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
					{summary}
				</p>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-center">
				<SaveChannelButton
					channelId={channelId}
					channelName={name}
					thumbnail={thumbnail}
				/>
				<CircularScoreBadge score={score} size="lg" label="Score" />
			</div>
		</div>
	);
}
