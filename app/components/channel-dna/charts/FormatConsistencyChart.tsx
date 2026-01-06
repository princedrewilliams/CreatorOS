"use client";

import {
	LineChart,
	Line,
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
			<LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
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
					formatter={(value: number) => [`${value}%`, "Format Consistency"]}
				/>
				<ReferenceLine
					y={average}
					stroke="var(--text-muted)"
					strokeDasharray="4 4"
					label={{
						value: `Avg: ${average}%`,
						fill: "var(--text-muted)",
						fontSize: 10,
						position: "right",
					}}
				/>
				<Line
					type="monotone"
					dataKey="consistency"
					stroke="var(--accent-primary)"
					strokeWidth={2}
					dot={{ fill: "var(--accent-primary)", r: 3 }}
					activeDot={{ r: 5, fill: "var(--accent-primary)" }}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
