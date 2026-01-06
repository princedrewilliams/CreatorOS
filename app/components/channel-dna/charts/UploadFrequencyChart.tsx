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
	week: string;
	uploads: number;
}

interface UploadFrequencyChartProps {
	data: DataPoint[];
}

export function UploadFrequencyChart({ data }: UploadFrequencyChartProps) {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
				<XAxis
					dataKey="week"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
					width={25}
					allowDecimals={false}
				/>
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.85)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
					}}
					labelStyle={{ color: "var(--text-secondary)" }}
					formatter={(value: number) => [value, "Uploads"]}
				/>
				<Line
					type="monotone"
					dataKey="uploads"
					stroke="var(--accent-primary)"
					strokeWidth={2}
					dot={{ fill: "var(--accent-primary)", r: 4 }}
					activeDot={{ r: 6, fill: "var(--accent-primary)" }}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
