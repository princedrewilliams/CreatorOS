"use client";

import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ReferenceLine,
} from "recharts";

interface DataPoint {
	label: string;
	score: number;
}

interface FormatConsistencyChartProps {
	data: DataPoint[];
	average: number;
}

export function FormatConsistencyChart({ data, average }: FormatConsistencyChartProps) {
	return (
		<div className="w-full h-full">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={data} margin={{ top: 20, right: 80, left: 10, bottom: 20 }}>
					<defs>
						{/* Gradient fill */}
						<linearGradient id="formatGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
							<stop offset="50%" stopColor="#d946ef" stopOpacity={0.25} />
							<stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
						</linearGradient>
						{/* Line gradient */}
						<linearGradient id="formatLineGradient" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#ec4899" />
							<stop offset="50%" stopColor="#d946ef" />
							<stop offset="100%" stopColor="#f472b6" />
						</linearGradient>
						{/* Glow filter */}
						<filter id="formatGlow" x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="4" result="coloredBlur" />
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
							value: "Uploads (Old → New)",
							position: "bottom",
							fill: "rgba(255,255,255,0.4)",
							fontSize: 10,
							offset: -5,
						}}
					/>
					<YAxis
						domain={[0, 100]}
						axisLine={false}
						tickLine={false}
						tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
						tickFormatter={(v) => `${v}`}
						width={40}
						ticks={[0, 25, 50, 75, 100]}
						label={{
							value: "Format Similarity (0-100)",
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
								<span className="text-white/60 text-xs block mb-1">
									Measures how closely this video matches the channel's most common format
								</span>
								Format Similarity: <span className="text-[#ec4899]">{value}</span>/100
							</span>,
							""
						]}
						separator=""
						cursor={{ stroke: "rgba(236,72,153,0.3)", strokeWidth: 1 }}
					/>
					<ReferenceLine
						y={average}
						stroke="rgba(255,255,255,0.25)"
						strokeDasharray="6 4"
						label={{
							value: `Avg: ${average}`,
							fill: "rgba(255,255,255,0.5)",
							fontSize: 10,
							position: "right",
						}}
					/>
					<Area
						type="monotone"
						dataKey="score"
						stroke="url(#formatLineGradient)"
						strokeWidth={3}
						fill="url(#formatGradient)"
						filter="url(#formatGlow)"
						animationDuration={1500}
						animationEasing="ease-out"
						dot={{
							fill: "#ec4899",
							r: 4,
							strokeWidth: 2,
							stroke: "rgba(236,72,153,0.3)",
						}}
						activeDot={{
							r: 6,
							fill: "#ec4899",
							stroke: "rgba(236,72,153,0.4)",
							strokeWidth: 2,
							filter: "url(#formatGlow)",
						}}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
