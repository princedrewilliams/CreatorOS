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
	period: string;
	consistency: number;
}

interface FormatConsistencyChartProps {
	data: DataPoint[];
}

export function FormatConsistencyChart({ data }: FormatConsistencyChartProps) {
	const average = data.length
		? Math.round(data.reduce((sum, d) => sum + d.consistency, 0) / data.length)
		: 0;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
				<defs>
					{/* Gradient fill */}
					<linearGradient id="consistencyGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
						<stop offset="50%" stopColor="#a855f7" stopOpacity={0.2} />
						<stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
					</linearGradient>
					{/* Line gradient */}
					<linearGradient id="consistencyLineGradient" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="#ec4899" />
						<stop offset="50%" stopColor="#d946ef" />
						<stop offset="100%" stopColor="#a855f7" />
					</linearGradient>
					{/* Glow filter */}
					<filter id="consistencyGlow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="4" result="coloredBlur" />
						<feMerge>
							<feMergeNode in="coloredBlur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
				<XAxis
					dataKey="period"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
				/>
				<YAxis
					domain={[0, 100]}
					axisLine={false}
					tickLine={false}
					tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
					tickFormatter={(v) => `${v}%`}
					width={35}
					ticks={[0, 25, 50, 75, 100]}
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
							Format Consistency: <span className="text-[#ec4899]">{value}%</span>
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
						value: `Avg: ${average}%`,
						fill: "rgba(255,255,255,0.5)",
						fontSize: 10,
						position: "right",
					}}
				/>
				<Area
					type="monotone"
					dataKey="consistency"
					stroke="url(#consistencyLineGradient)"
					strokeWidth={3}
					fill="url(#consistencyGradient)"
					filter="url(#consistencyGlow)"
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
						filter: "url(#consistencyGlow)",
					}}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}
