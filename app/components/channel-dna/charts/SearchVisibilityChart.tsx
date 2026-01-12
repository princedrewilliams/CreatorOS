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

interface SearchVisibilityChartProps {
	data: DataPoint[];
	median: number;
}

export function SearchVisibilityChart({ data, median }: SearchVisibilityChartProps) {
	const aboveMedian = data.filter(d => d.score > median).length;

	return (
		<div className="w-full h-full flex flex-col">
			{/* Chart */}
			<div className="flex-1 min-h-0">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
						{/* SVG Definitions */}
						<defs>
							{/* Area gradient */}
							<linearGradient id="searchGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
								<stop offset="40%" stopColor="#d946ef" stopOpacity={0.25} />
								<stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
							</linearGradient>
							{/* Line gradient */}
							<linearGradient id="searchLineGradient" x1="0" y1="0" x2="1" y2="0">
								<stop offset="0%" stopColor="#ec4899" />
								<stop offset="50%" stopColor="#d946ef" />
								<stop offset="100%" stopColor="#a855f7" />
							</linearGradient>
							{/* Glow filter */}
							<filter id="searchGlow" x="-50%" y="-50%" width="200%" height="200%">
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
						/>
						<YAxis
							domain={[0, 100]}
							axisLine={false}
							tickLine={false}
							tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
							ticks={[0, 25, 50, 75, 100]}
							width={35}
						/>

						{/* Dashed baseline for median */}
						<ReferenceLine
							y={median}
							stroke="rgba(255,255,255,0.25)"
							strokeDasharray="6 4"
							label={{
								value: `Median: ${median}`,
								position: "right",
								fill: "rgba(255,255,255,0.5)",
								fontSize: 10,
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
									Search Visibility: <span className="text-[#ec4899]">{value}</span>/100
								</span>,
								""
							]}
							separator=""
							cursor={{ stroke: "rgba(236,72,153,0.3)", strokeWidth: 1 }}
						/>

						{/* Main area with glow */}
						<Area
							type="monotone"
							dataKey="score"
							stroke="url(#searchLineGradient)"
							strokeWidth={3}
							fill="url(#searchGradient)"
							filter="url(#searchGlow)"
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
								stroke: "#fff",
								strokeWidth: 2,
							}}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			{/* Caption */}
			<div className="mt-2 text-center">
				<p className="text-xs text-white/50">
					<span className="text-white/70 font-medium">{aboveMedian}</span> of the last{" "}
					<span className="text-white/70 font-medium">{data.length}</span> videos exceeded
					the channel's typical search visibility.
				</p>
			</div>
		</div>
	);
}
