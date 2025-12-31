"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useSpring, useTransform, animate } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { CheckCircle2, TrendingUp, Users, Eye, Calendar } from "lucide-react";

function Counter({
	value,
	suffix = "",
	duration = 2,
}: {
	value: number;
	suffix?: string;
	duration?: number;
}) {
	const count = useSpring(0, {
		duration: duration * 1000,
	});
	const rounded = useTransform(count, (latest) => Math.floor(latest).toLocaleString());
	useEffect(() => {
		animate(count, value, {
			duration,
		});
	}, [count, value, duration]);
	return <motion.span>{rounded}</motion.span>;
}

function MetricBar({
	label,
	value,
	color,
	delay,
}: {
	label: string;
	value: number;
	color: string;
	delay: number;
}) {
	const [isHovered, setIsHovered] = useState(false);
	return (
		<div
			className="flex flex-col gap-2 group cursor-pointer"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="flex justify-between items-end">
				<span className="text-sm text-white/60 group-hover:text-white transition-colors">
					{label}
				</span>
				<span className="text-sm font-bold text-white flex items-center gap-1">
					{value}/100
					<motion.div
						initial={{ opacity: 0, x: -5 }}
						animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -5 }}
						className="text-xs text-green-400"
					>
						+2%
					</motion.div>
				</span>
			</div>
			<div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
				<motion.div
					className={`h-full ${color} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] relative overflow-hidden`}
					initial={{ width: 0 }}
					animate={{ width: `${value}%` }}
					transition={{
						duration: 1,
						delay,
						type: "spring",
						stiffness: 50,
					}}
				>
					<motion.div
						animate={{ x: ["-100%", "200%"] }}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: "linear",
							repeatDelay: 1,
						}}
						className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full"
					/>
				</motion.div>
			</div>
		</div>
	);
}

interface ChannelProfileProps {
	baseStats: {
		title: string;
		description: string;
		thumbnail: string;
		subscribers: any;
		views: any;
		postingFrequency: string;
	};
	score: {
		total: number;
		categories: Record<string, number>;
		contextLabel?: string;
	} | null;
}

function formatNumber(val: any) {
	if (val === null || val === undefined) return "—";
	if (typeof val === "string") return val;
	if (typeof val === "number") {
		if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
		if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
		if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
		return `${val}`;
	}
	return `${val}`;
}

export function ChannelProfile({ baseStats, score }: ChannelProfileProps) {
	const categories = score?.categories || {};
	const totalScore = score?.total ?? 71;
	const contextLabel = score?.contextLabel || "High Growth";
	const discoverability = categories["Search & Discovery"] ?? categories["Discoverability / SEO"] ?? 86;
	const consistency = categories["Upload Consistency"] ?? 95;
	const engagement = categories["Audience Engagement"] ?? 22;
	const winningTopics = categories["Winning Topics"] ?? categories["Content Clusters"] ?? 98;

	return (
		<GlassCard className="w-full p-8" delay={0.1} hoverEffect={true}>
			<div className="flex flex-col md:flex-row items-center justify-between gap-8">
				<div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left flex-1">
					<div className="relative group cursor-pointer">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{
								duration: 20,
								repeat: Infinity,
								ease: "linear",
							}}
							className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-75 blur-md group-hover:opacity-100 transition-opacity"
						/>
						<div className="relative">
							{baseStats?.thumbnail ? (
								<Image
									src={baseStats.thumbnail}
									alt="Channel Avatar"
									width={96}
									height={96}
									className="relative h-24 w-24 rounded-full border-2 border-white/20 object-cover shadow-2xl z-10"
								/>
							) : (
								<div className="relative h-24 w-24 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-white/50 text-xs">
									No avatar
								</div>
							)}
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									delay: 1,
									type: "spring",
								}}
								className="absolute bottom-0 right-0 z-20 bg-blue-500 rounded-full p-1 border-2 border-[#0a0a0f]"
							>
								<CheckCircle2 className="w-4 h-4 text-white" />
							</motion.div>
						</div>
					</div>

					<div>
						<motion.h2
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-2 justify-center md:justify-start"
						>
							{baseStats?.title || "Channel"}
							<span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-normal text-white/60 border border-white/10">
								Verified
							</span>
						</motion.h2>

						<div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/60 mb-3">
							<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
								<Users className="w-3.5 h-3.5 text-purple-400" />
								<span className="font-medium text-white">{formatNumber(baseStats?.subscribers)}</span>{" "}
								subscribers
							</div>
							<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
								<Eye className="w-3.5 h-3.5 text-blue-400" />
								<span className="font-medium text-white">{formatNumber(baseStats?.views)}</span> views
							</div>
							<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
								<Calendar className="w-3.5 h-3.5 text-pink-400" />
								<span className="font-medium text-white">{baseStats?.postingFrequency || "Daily"}</span>{" "}
								uploads
							</div>
						</div>

						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.4 }}
							className="text-white/50 text-sm max-w-lg"
						>
							{baseStats?.description || "Position around a clear promise and niche proof. Videos consistently outperform peer channels of similar size."}
						</motion.p>
					</div>
				</div>

				<div className="flex-shrink-0">
					<motion.div
						whileHover={{ scale: 1.05, rotate: 5 }}
						className="relative flex h-36 w-36 items-center justify-center rounded-full bg-black/40 border border-white/10 shadow-[0_0_40px_-10px_rgba(236,72,153,0.3)] group cursor-pointer"
					>
						<svg
							className="absolute inset-0 h-full w-full -rotate-90 transform"
							viewBox="0 0 100 100"
						>
							<circle
								className="text-white/5"
								strokeWidth="6"
								stroke="currentColor"
								fill="transparent"
								r="44"
								cx="50"
								cy="50"
							/>
							<motion.circle
								className="text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"
								strokeWidth="6"
								strokeLinecap="round"
								stroke="currentColor"
								fill="transparent"
								r="44"
								cx="50"
								cy="50"
								initial={{
									strokeDasharray: "276 276",
									strokeDashoffset: 276,
								}}
								animate={{
									strokeDashoffset: 276 - 276 * (totalScore / 100),
								}}
								transition={{
									duration: 2,
									ease: "easeOut",
									delay: 0.5,
								}}
							/>
						</svg>

						<div className="flex flex-col items-center justify-center z-10">
							<span className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1 group-hover:text-white/80 transition-colors">
								Channel
							</span>
							<div className="text-5xl font-bold text-white leading-none tracking-tighter flex">
								<Counter value={totalScore} />
							</div>
							<div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30">
								<TrendingUp className="w-3 h-3 text-pink-400" />
								<span className="text-[10px] font-bold text-pink-400 uppercase tracking-wide">
									{contextLabel}
								</span>
							</div>
						</div>

						<motion.div
							animate={{
								scale: [1, 1.2, 1],
								opacity: [0.2, 0.4, 0.2],
							}}
							transition={{
								duration: 3,
								repeat: Infinity,
								ease: "easeInOut",
							}}
							className="absolute inset-0 rounded-full bg-pink-500/20 blur-2xl -z-10"
						/>

						<motion.div
							animate={{ rotate: 360 }}
							transition={{
								duration: 10,
								repeat: Infinity,
								ease: "linear",
							}}
							className="absolute inset-0 rounded-full"
						>
							<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
						</motion.div>
					</motion.div>
				</div>
			</div>

			<div className="mt-8 pt-8 border-t border-white/10">
				<div className="flex items-center gap-2 mb-6">
					<h3 className="text-lg font-bold text-white">Performance Snapshot</h3>
					<span className="text-sm text-white/40">
						Videos consistently outperform peer channels of similar size.
					</span>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					<MetricBar label="Discoverability" value={discoverability} color="bg-blue-500" delay={0.6} />
					<MetricBar label="Consistency" value={consistency} color="bg-purple-500" delay={0.7} />
					<MetricBar label="Engagement" value={engagement} color="bg-yellow-500" delay={0.8} />
					<MetricBar label="Winning Topics" value={winningTopics} color="bg-green-500" delay={0.9} />
				</div>
			</div>
		</GlassCard>
	);
}

