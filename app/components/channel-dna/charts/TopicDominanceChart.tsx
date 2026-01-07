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
	// Calculate average dominance
	const avgDominance = data.length
		? data.reduce((sum, d) => sum + d.dominance, 0) / data.length
		: 0;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
				<defs>
					<linearGradient id="topicGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
						<stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
					</linearGradient>
				</defs>
				<XAxis
					dataKey="period"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
				/>
				<YAxis
					domain={[0, 100]}
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
					tickFormatter={(v) => `${v}%`}
					width={35}
				/>
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.85)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
					}}
					labelStyle={{ color: "var(--text-secondary)" }}
					formatter={(value: number) => [`${value}%`, topicName]}
				/>
				{/* Focus threshold - 50% means focused channel */}
				<ReferenceLine
					y={50}
					stroke="var(--text-muted)"
					strokeDasharray="4 4"
					label={{
						value: "Focus threshold",
						fill: "var(--text-muted)",
						fontSize: 10,
						position: "right",
					}}
				/>
				{/* Average dominance line */}
				{avgDominance > 0 && (
					<ReferenceLine
						y={avgDominance}
						stroke="rgba(236, 72, 153, 0.6)"
						strokeDasharray="2 2"
						label={{
							value: `Avg: ${avgDominance.toFixed(0)}%`,
							fill: "rgba(236, 72, 153, 0.8)",
							fontSize: 10,
							position: "left",
						}}
					/>
				)}
				<Area
					type="monotone"
					dataKey="dominance"
					stroke="var(--accent-primary)"
					strokeWidth={2}
					fill="url(#topicGradient)"
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}
