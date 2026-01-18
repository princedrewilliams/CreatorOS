"use client";

import { useState } from "react";
import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ZAxis,
	Cell,
	ReferenceLine,
} from "recharts";
import { Info, ChevronDown, ExternalLink } from "lucide-react";

interface DataPoint {
	id?: string;
	title: string;
	ctrProxy: number;
	views: number;
}

interface ThumbnailCTRChartProps {
	data: DataPoint[];
}

const QUADRANT_INFO = [
	{
		title: "High Views + Low Engagement",
		color: "text-amber-400",
		bgColor: "bg-amber-500/10",
		description: "The thumbnail got clicks, but the content didn't deliver",
		reasons: [
			"Misleading thumbnail",
			"Overhyped visual",
			"Content didn't match expectation",
		],
	},
	{
		title: "Low Views + High Engagement",
		color: "text-emerald-400",
		bgColor: "bg-emerald-500/10",
		description: "The thumbnail/content combo is strong, but not enough people saw it",
		highlight: "This is gold:",
		reasons: [
			"Thumbnail works",
			"Video resonates",
			"Needs better distribution or SEO",
		],
	},
	{
		title: "High Views + High Engagement",
		color: "text-pink-400",
		bgColor: "bg-pink-500/10",
		description: "Best-case scenario",
		reasons: [
			"Thumbnail attracts",
			"Content delivers",
			"Algorithm likely to push it further",
		],
	},
	{
		title: "Low Views + Low Engagement",
		color: "text-red-400",
		bgColor: "bg-red-500/10",
		description: "Neither the thumbnail nor the content is working",
		reasons: [],
	},
];

export function ThumbnailCTRChart({ data }: ThumbnailCTRChartProps) {
	const [showInfo, setShowInfo] = useState(false);

	const formatViews = (value: number) => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
		return value.toString();
	};

	// Calculate medians for quadrant lines
	const medianViews = data.length > 0
		? [...data].sort((a, b) => a.views - b.views)[Math.floor(data.length / 2)]?.views || 0
		: 0;
	const medianEngagement = data.length > 0
		? [...data].sort((a, b) => a.ctrProxy - b.ctrProxy)[Math.floor(data.length / 2)]?.ctrProxy || 0
		: 0;

	// Calculate color based on CTR value - higher CTR = more vibrant
	const getColor = (ctr: number) => {
		const maxCtr = Math.max(...data.map(d => d.ctrProxy), 10);
		const ratio = ctr / maxCtr;
		// Interpolate from purple to pink based on performance
		if (ratio > 0.7) return "#ec4899"; // High performers - bright pink
		if (ratio > 0.4) return "#d946ef"; // Medium - magenta
		return "#a855f7"; // Lower - purple
	};

	const handleDotClick = (videoId?: string) => {
		if (videoId) {
			window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
		}
	};

	return (
		<div className="relative w-full h-full">
			{/* Info dropdown button */}
			<div className="absolute top-0 right-0 z-10">
				<button
					onClick={() => setShowInfo(!showInfo)}
					className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-white hover:bg-white/5 rounded-lg transition-all"
				>
					<Info className="w-3.5 h-3.5" />
					<span>Guide</span>
					<ChevronDown className={`w-3 h-3 transition-transform ${showInfo ? "rotate-180" : ""}`} />
				</button>

				{/* Info dropdown panel */}
				{showInfo && (
					<div className="absolute top-full right-0 mt-1 w-80 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
						<div className="p-3 border-b border-white/5">
							<h4 className="text-sm font-medium text-white">Understanding the Chart</h4>
							<p className="text-xs text-[var(--text-muted)] mt-1">
								Click any dot to watch the video on YouTube
							</p>
						</div>
						<div className="max-h-64 overflow-y-auto p-2 space-y-2">
							{QUADRANT_INFO.map((quadrant, idx) => (
								<div key={idx} className={`p-2.5 rounded-lg ${quadrant.bgColor}`}>
									<h5 className={`text-xs font-semibold ${quadrant.color}`}>
										{quadrant.title}
									</h5>
									<p className="text-xs text-[var(--text-secondary)] mt-1">
										{quadrant.description}
									</p>
									{quadrant.highlight && (
										<p className="text-xs text-emerald-300 font-medium mt-1">
											{quadrant.highlight}
										</p>
									)}
									{quadrant.reasons.length > 0 && (
										<ul className="mt-1.5 space-y-0.5">
											{quadrant.reasons.map((reason, i) => (
												<li key={i} className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
													<span className={`w-1 h-1 rounded-full ${quadrant.color.replace("text-", "bg-")}`} />
													{reason}
												</li>
											))}
										</ul>
									)}
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			<ResponsiveContainer width="100%" height="100%">
				<ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 30 }}>
					<defs>
						{/* Glow filter for dots */}
						<filter id="scatterGlow" x="-100%" y="-100%" width="300%" height="300%">
							<feGaussianBlur stdDeviation="3" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						{/* Radial gradient for each dot */}
						<radialGradient id="dotGradient" cx="30%" cy="30%">
							<stop offset="0%" stopColor="#fff" stopOpacity={0.4} />
							<stop offset="100%" stopColor="#ec4899" stopOpacity={1} />
						</radialGradient>
					</defs>

					{/* Quadrant reference lines */}
					<ReferenceLine
						y={medianViews}
						stroke="rgba(255,255,255,0.1)"
						strokeDasharray="4 4"
					/>
					<ReferenceLine
						x={medianEngagement}
						stroke="rgba(255,255,255,0.1)"
						strokeDasharray="4 4"
					/>

					<XAxis
						dataKey="ctrProxy"
						name="Engagement Rate"
						axisLine={false}
						tickLine={false}
						tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
						tickFormatter={(v) => `${v}%`}
						domain={[0, "auto"]}
						label={{
							value: "Engagement Rate →",
							position: "bottom",
							fill: "rgba(255,255,255,0.5)",
							fontSize: 10,
							offset: 10,
						}}
					/>
					<YAxis
						dataKey="views"
						name="Views"
						axisLine={false}
						tickLine={false}
						tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
						tickFormatter={formatViews}
						width={50}
						label={{
							value: "Views →",
							angle: -90,
							position: "insideLeft",
							fill: "rgba(255,255,255,0.5)",
							fontSize: 10,
							dx: -5,
						}}
					/>
					<ZAxis range={[60, 180]} />
					<Tooltip
						contentStyle={{
							background: "rgba(0,0,0,0.9)",
							border: "1px solid rgba(236,72,153,0.3)",
							borderRadius: "12px",
							fontSize: "12px",
							boxShadow: "0 8px 32px rgba(236,72,153,0.2)",
							backdropFilter: "blur(8px)",
							padding: "12px 16px",
						}}
						formatter={(value: number, name: string) => {
							if (name === "Views") return [
								<span key="views" className="text-white font-medium">
									Views: <span className="text-[#a855f7]">{formatViews(value)}</span>
								</span>,
								""
							];
							return [
								<span key="engagement" className="text-white font-medium">
									Engagement: <span className="text-[#ec4899]">{value}%</span>
								</span>,
								""
							];
						}}
						labelFormatter={(_, payload) => {
							const item = payload?.[0]?.payload;
							return (
								<div className="flex items-center gap-2">
									<span className="text-white/70 text-xs">
										{item?.title || ""}
									</span>
									{item?.id && (
										<ExternalLink className="w-3 h-3 text-[var(--accent-primary)]" />
									)}
								</div>
							);
						}}
						separator=""
						cursor={{ stroke: "rgba(236,72,153,0.2)", strokeWidth: 1 }}
					/>
					<Scatter
						data={data}
						animationDuration={1200}
						animationEasing="ease-out"
						onClick={(data) => handleDotClick(data?.id)}
						style={{ cursor: "pointer" }}
					>
						{data.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={getColor(entry.ctrProxy)}
								fillOpacity={0.85}
								filter="url(#scatterGlow)"
								style={{
									transition: "all 0.3s ease",
									cursor: "pointer",
								}}
							/>
						))}
					</Scatter>
				</ScatterChart>
			</ResponsiveContainer>
		</div>
	);
}
