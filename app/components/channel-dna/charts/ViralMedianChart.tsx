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

	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
				<XAxis
					dataKey="label"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
					tickFormatter={formatViews}
					width={45}
				/>
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.85)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
					}}
					labelStyle={{ color: "var(--text-secondary)" }}
					formatter={(value: number) => [formatViews(value), "Views"]}
				/>
				<ReferenceLine
					y={median}
					stroke="var(--text-muted)"
					strokeDasharray="4 4"
					label={{
						value: `Median: ${formatViews(median)}`,
						fill: "var(--text-muted)",
						fontSize: 10,
						position: "right",
					}}
				/>
				<Line
					type="monotone"
					dataKey="views"
					stroke="var(--accent-primary)"
					strokeWidth={2}
					dot={{ fill: "var(--accent-primary)", r: 3 }}
					activeDot={{ r: 5, fill: "var(--accent-primary)" }}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
