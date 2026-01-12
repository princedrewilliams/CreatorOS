"use client";

import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ZAxis,
	Cell,
} from "recharts";

interface DataPoint {
	title: string;
	ctrProxy: number;
	views: number;
}

interface ThumbnailCTRChartProps {
	data: DataPoint[];
}

export function ThumbnailCTRChart({ data }: ThumbnailCTRChartProps) {
	const formatViews = (value: number) => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
		return value.toString();
	};

	// Calculate color based on CTR value - higher CTR = more vibrant
	const getColor = (ctr: number) => {
		const maxCtr = Math.max(...data.map(d => d.ctrProxy), 10);
		const ratio = ctr / maxCtr;
		// Interpolate from purple to pink based on performance
		if (ratio > 0.7) return "#ec4899"; // High performers - bright pink
		if (ratio > 0.4) return "#d946ef"; // Medium - magenta
		return "#a855f7"; // Lower - purple
	};

	return (
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
				<XAxis
					dataKey="ctrProxy"
					name="Engagement Rate"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
					tickFormatter={(v) => `${v}%`}
					domain={[0, "auto"]}
					label={{
						value: "Engagement Rate",
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
							<span className="text-white/70 text-xs block mb-1">
								{item?.title || ""}
							</span>
						);
					}}
					separator=""
					cursor={{ stroke: "rgba(236,72,153,0.2)", strokeWidth: 1 }}
				/>
				<Scatter
					data={data}
					animationDuration={1200}
					animationEasing="ease-out"
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={getColor(entry.ctrProxy)}
							fillOpacity={0.85}
							filter="url(#scatterGlow)"
							style={{
								transition: "all 0.3s ease",
							}}
						/>
					))}
				</Scatter>
			</ScatterChart>
		</ResponsiveContainer>
	);
}
