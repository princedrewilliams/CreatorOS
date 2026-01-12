"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
	LabelList,
} from "recharts";
import type { PillarBarData } from "@/lib/learning-lab/types";

interface PillarBarChartProps {
	data: PillarBarData[];
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
	return num.toString();
}

export function PillarBarChart({ data }: PillarBarChartProps) {
	// Take top 5 for cleaner display
	const chartData = data.slice(0, 5);

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart
				data={chartData}
				layout="vertical"
				margin={{ top: 10, right: 60, left: 80, bottom: 10 }}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					stroke="rgba(255,255,255,0.05)"
					horizontal={true}
					vertical={false}
				/>
				<XAxis
					type="number"
					stroke="var(--text-muted)"
					fontSize={11}
					tickLine={false}
					axisLine={false}
					tickFormatter={formatNumber}
				/>
				<YAxis
					type="category"
					dataKey="label"
					stroke="var(--text-muted)"
					fontSize={12}
					tickLine={false}
					axisLine={false}
					width={75}
				/>
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.9)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
					}}
					formatter={(value: number) => [
						`${formatNumber(value)} avg views`,
						"Views",
					]}
					labelFormatter={(label: string) => label}
				/>
				<Bar
					dataKey="avgViews"
					radius={[0, 4, 4, 0]}
					maxBarSize={32}
				>
					{chartData.map((entry, index) => (
						<Cell key={`cell-${index}`} fill={entry.color} />
					))}
					<LabelList
						dataKey="avgViews"
						position="right"
						fill="var(--text-secondary)"
						fontSize={11}
						formatter={(value) => typeof value === "number" ? formatNumber(value) : String(value)}
					/>
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}
