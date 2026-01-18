"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ReferenceLine,
	Cell,
} from "recharts";

interface DataPoint {
	label: string;
	views: number;
}

interface ViralMedianChartProps {
	data: DataPoint[];
	median: number;
}

export function ViralMedianChart({ data, median }: ViralMedianChartProps) {
	const formatViews = (value: number) => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
		return value.toString();
	};

	// Color bars based on performance relative to median
	const getBarColor = (views: number) => {
		const ratio = views / (median || 1);
		if (ratio >= 2) return "#22c55e"; // Viral - 2x median
		if (ratio >= 1) return "#ec4899"; // Above median
		if (ratio >= 0.5) return "#d946ef"; // Close to median
		return "#a855f7"; // Below median
	};

	const aboveMedian = data.filter(d => d.views > median).length;

	return (
		<div className="w-full h-full flex flex-col">
			<div className="flex-1 min-h-0">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{ top: 20, right: 80, left: 0, bottom: 20 }}>
						<defs>
							{/* Glow effect for bars */}
							<filter id="viralGlow" x="-20%" y="-20%" width="140%" height="140%">
								<feGaussianBlur stdDeviation="2" result="coloredBlur" />
								<feMerge>
									<feMergeNode in="coloredBlur" />
									<feMergeNode in="SourceGraphic" />
								</feMerge>
							</filter>
						</defs>
						<XAxis
							dataKey="label"
							axisLine={false}
							tickLine={false}
							tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
							label={{
								value: "Videos (Recent)",
								position: "bottom",
								fill: "rgba(255,255,255,0.4)",
								fontSize: 10,
								offset: -5,
							}}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
							tickFormatter={formatViews}
							width={50}
							label={{
								value: "Views",
								angle: -90,
								position: "insideLeft",
								fill: "rgba(255,255,255,0.4)",
								fontSize: 10,
								dx: -5,
							}}
						/>
						<Tooltip
							contentStyle={{
								background: "rgba(0,0,0,0.9)",
								border: "1px solid rgba(236,72,153,0.3)",
								borderRadius: "12px",
								fontSize: "12px",
								boxShadow: "0 8px 32px rgba(236,72,153,0.2)",
								backdropFilter: "blur(8px)",
							}}
							labelStyle={{ color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}
							formatter={(value: number) => [
								<span key="value" className="text-white font-medium">
									Views: <span className="text-[#ec4899]">{formatViews(value)}</span>
								</span>,
								""
							]}
							separator=""
							cursor={{ fill: "rgba(236,72,153,0.1)" }}
						/>
						<ReferenceLine
							y={median}
							stroke="rgba(255,255,255,0.4)"
							strokeDasharray="6 4"
							label={{
								value: `Median: ${formatViews(median)}`,
								fill: "rgba(255,255,255,0.6)",
								fontSize: 10,
								position: "insideTopRight",
							}}
						/>
						<Bar
							dataKey="views"
							radius={[6, 6, 0, 0]}
							animationDuration={1200}
							animationEasing="ease-out"
							filter="url(#viralGlow)"
						>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={getBarColor(entry.views)}
									fillOpacity={0.9}
									style={{
										transition: "all 0.3s ease",
									}}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
			{/* Caption */}
			<div className="mt-2 text-center">
				<p className="text-xs text-white/50">
					<span className="text-white/70 font-medium">{aboveMedian}</span> of{" "}
					<span className="text-white/70 font-medium">{data.length}</span> videos
					exceeded the channel median view count.
				</p>
			</div>
		</div>
	);
}
