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
	week: string;
	uploads: number;
}

interface UploadFrequencyChartProps {
	data: DataPoint[];
	targetUploads?: number;
}

export function UploadFrequencyChart({ data, targetUploads = 1 }: UploadFrequencyChartProps) {
	// Calculate average uploads per week
	const avgUploads = data.length
		? data.reduce((sum, d) => sum + d.uploads, 0) / data.length
		: 0;

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
				{/* Target line - weekly target */}
				<ReferenceLine
					y={targetUploads}
					stroke="var(--text-muted)"
					strokeDasharray="4 4"
					label={{
						value: `Target: ${targetUploads}/wk`,
						fill: "var(--text-muted)",
						fontSize: 10,
						position: "right",
					}}
				/>
				{/* Average line */}
				{avgUploads > 0 && (
					<ReferenceLine
						y={avgUploads}
						stroke="rgba(236, 72, 153, 0.5)"
						strokeDasharray="2 2"
						label={{
							value: `Avg: ${avgUploads.toFixed(1)}`,
							fill: "rgba(236, 72, 153, 0.8)",
							fontSize: 10,
							position: "left",
						}}
					/>
				)}
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
