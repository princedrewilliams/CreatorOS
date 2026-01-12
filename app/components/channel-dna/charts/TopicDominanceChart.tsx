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
	dominance: number;
}

interface TopicDominanceChartProps {
	data: DataPoint[];
	topicName?: string;
}

export function TopicDominanceChart({ data, topicName = "Primary Topic" }: TopicDominanceChartProps) {
	const avgDominance = data.length
		? data.reduce((sum, d) => sum + d.dominance, 0) / data.length
		: 0;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
				<defs>
					{/* Multi-stop gradient for area */}
					<linearGradient id="topicGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
						<stop offset="40%" stopColor="#d946ef" stopOpacity={0.3} />
						<stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
					</linearGradient>
					{/* Line gradient */}
					<linearGradient id="topicLineGradient" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stopColor="#ec4899" />
						<stop offset="50%" stopColor="#d946ef" />
						<stop offset="100%" stopColor="#a855f7" />
					</linearGradient>
					{/* Glow effect */}
					<filter id="topicGlow" x="-50%" y="-50%" width="200%" height="200%">
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
							{topicName}: <span className="text-[#ec4899]">{value}%</span>
						</span>,
						""
					]}
					separator=""
					cursor={{ stroke: "rgba(236,72,153,0.3)", strokeWidth: 1 }}
				/>
				{/* Focus threshold */}
				<ReferenceLine
					y={50}
					stroke="rgba(255,255,255,0.2)"
					strokeDasharray="6 4"
					label={{
						value: "Focus threshold",
						fill: "rgba(255,255,255,0.4)",
						fontSize: 10,
						position: "right",
					}}
				/>
				{/* Average line */}
				{avgDominance > 0 && (
					<ReferenceLine
						y={avgDominance}
						stroke="rgba(236,72,153,0.5)"
						strokeDasharray="3 3"
						label={{
							value: `Avg: ${avgDominance.toFixed(0)}%`,
							fill: "rgba(236,72,153,0.7)",
							fontSize: 10,
							position: "left",
						}}
					/>
				)}
				<Area
					type="monotone"
					dataKey="dominance"
					stroke="url(#topicLineGradient)"
					strokeWidth={3}
					fill="url(#topicGradient)"
					filter="url(#topicGlow)"
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
	);
}
