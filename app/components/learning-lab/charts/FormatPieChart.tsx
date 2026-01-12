"use client";

import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";
import type { FormatPieSlice } from "@/lib/learning-lab/types";

interface FormatPieChartProps {
	data: FormatPieSlice[];
}

const COLORS = {
	Shorts: "#a855f7",
	"Long-form": "#3b82f6",
};

export function FormatPieChart({ data }: FormatPieChartProps) {

	return (
		<ResponsiveContainer width="100%" height="100%">
			<PieChart>
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					outerRadius={80}
					innerRadius={40}
					paddingAngle={2}
					label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
					labelLine={{ stroke: "var(--text-muted)", strokeWidth: 1 }}
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={COLORS[entry.name as keyof typeof COLORS] || "#6b7280"}
							stroke="transparent"
						/>
					))}
				</Pie>
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.9)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
					}}
					formatter={(value: number, name: string) => [
						`${value} videos (${data.find((d) => d.name === name)?.percentage || 0}%)`,
						name,
					]}
				/>
				<Legend
					wrapperStyle={{ paddingTop: "10px" }}
					content={() => (
						<div className="flex justify-center gap-6 text-xs">
							{data.map((entry) => (
								<div key={entry.name} className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{
											backgroundColor:
												COLORS[entry.name as keyof typeof COLORS] || "#6b7280",
										}}
									/>
									<span style={{ color: "var(--text-muted)" }}>
										{entry.name}: {entry.value} ({entry.percentage}%)
									</span>
								</div>
							))}
						</div>
					)}
				/>
			</PieChart>
		</ResponsiveContainer>
	);
}
