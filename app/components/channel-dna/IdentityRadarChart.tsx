"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Fingerprint, Maximize2 } from "lucide-react";

export function IdentityRadarChart() {
	const axes = [
		{ label: "Content Focus", value: 85 },
		{ label: "Format Consistency", value: 78 },
		{ label: "Topic Concentration", value: 82 },
		{ label: "Audience Reaction", value: 75 },
		{ label: "Brand Signal", value: 80 },
	];

	const centerX = 200;
	const centerY = 100;
	const radius = 70;
	const angleStep = (2 * Math.PI) / axes.length;

	return (
		<GlassCard className="h-full flex flex-col" delay={0.3} hoverEffect={true}>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
						<Fingerprint className="w-5 h-5 text-pink-400" />
					</div>
					<h3 className="text-xl font-bold text-white">Channel Identity</h3>
				</div>
				<button className="p-2 rounded-full hover:bg-pink-500/10 transition-colors text-white/40 hover:text-white">
					<Maximize2 className="w-4 h-4" />
				</button>
			</div>
			<p className="text-sm text-white/40 mb-6">
				The channel maintains a clear and repeatable content identity.
			</p>

			<div className="relative flex-1 rounded-2xl bg-pink-950/20 border border-pink-500/20 p-6 overflow-hidden group">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute inset-0 bg-[linear-gradient(to_right,#ec489912_1px,transparent_1px),linear-gradient(to_bottom,#ec489912_1px,transparent_1px)] bg-[size:24px_24px]" />
				</div>

				<div className="relative h-48 w-full z-10 flex items-center justify-center">
					<svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
						<defs>
							<linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" stopColor="#ec4899" stopOpacity="0.6" />
								<stop offset="100%" stopColor="#f472b6" stopOpacity="0.3" />
							</linearGradient>
						</defs>
						{/* Grid circles */}
						{[0.25, 0.5, 0.75, 1].map((scale, i) => (
							<circle
								key={i}
								cx={centerX}
								cy={centerY}
								r={radius * scale}
								fill="none"
								stroke="#ec4899"
								strokeWidth="0.5"
								opacity="0.2"
							/>
						))}
						{/* Axes lines */}
						{axes.map((_, i) => {
							const angle = i * angleStep - Math.PI / 2;
							const x = centerX + radius * Math.cos(angle);
							const y = centerY + radius * Math.sin(angle);
							return (
								<line
									key={i}
									x1={centerX}
									y1={centerY}
									x2={x}
									y2={y}
									stroke="#ec4899"
									strokeWidth="0.5"
									opacity="0.2"
								/>
							);
						})}
						{/* Data polygon */}
						<motion.polygon
							points={axes
								.map((axis, i) => {
									const angle = i * angleStep - Math.PI / 2;
									const distance = (radius * axis.value) / 100;
									const x = centerX + distance * Math.cos(angle);
									const y = centerY + distance * Math.sin(angle);
									return `${x},${y}`;
								})
								.join(" ")}
							fill="url(#radarGradient)"
							stroke="#ec4899"
							strokeWidth="2"
							opacity="0.6"
							initial={{ pathLength: 0, opacity: 0 }}
							animate={{ pathLength: 1, opacity: 0.6 }}
							transition={{ duration: 1.5, delay: 0.5 }}
						/>
						{/* Data points */}
						{axes.map((axis, i) => {
							const angle = i * angleStep - Math.PI / 2;
							const distance = (radius * axis.value) / 100;
							const x = centerX + distance * Math.cos(angle);
							const y = centerY + distance * Math.sin(angle);
							return (
								<motion.circle
									key={i}
									cx={x}
									cy={y}
									r="4"
									fill="#ec4899"
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
								/>
							);
						})}
						{/* Labels */}
						{axes.map((axis, i) => {
							const angle = i * angleStep - Math.PI / 2;
							const labelDistance = radius + 20;
							const x = centerX + labelDistance * Math.cos(angle);
							const y = centerY + labelDistance * Math.sin(angle);
							return (
								<text
									key={i}
									x={x}
									y={y}
									textAnchor="middle"
									dominantBaseline="middle"
									className="text-[8px] fill-white/60"
								>
									{axis.label}
								</text>
							);
						})}
					</svg>
				</div>

				<div className="mt-4 text-center relative z-10">
					<p className="text-xs text-white/40 bg-pink-500/5 inline-block px-3 py-1 rounded-full border border-pink-500/10">
						Identity strength reflects how predictable the channel's content promise is.
					</p>
				</div>
			</div>
		</GlassCard>
	);
}

