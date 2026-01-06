"use client";

import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

interface DataPoint {
	date: string;
	score: number;
}

interface TopicUsageChartProps {
	data: DataPoint[];
}

export function TopicUsageChart({ data }: TopicUsageChartProps) {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
				<XAxis
					dataKey="date"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
				/>
				<YAxis
					domain={[0, 100]}
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
					ticks={[0, 25, 50, 75, 100]}
					width={30}
				/>
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.85)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
					}}
					labelStyle={{ color: "var(--text-secondary)" }}
					formatter={(value: number) => [`${value}%`, "Topic Consistency"]}
				/>
				<Line
					type="monotone"
					dataKey="score"
					stroke="var(--accent-primary)"
					strokeWidth={2}
					dot={{ fill: "var(--accent-primary)", r: 3 }}
					activeDot={{ r: 5, fill: "var(--accent-primary)" }}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
