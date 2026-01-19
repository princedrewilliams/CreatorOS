"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	Cell,
	ReferenceLine,
} from "recharts";
import type { EngagementVelocity } from "@/lib/learning-lab/types";

interface EngagementVelocityChartProps {
	data: EngagementVelocity[];
}

export function EngagementVelocityChart({ data }: EngagementVelocityChartProps) {
	// Take top 10 by velocity
	const chartData = data
		.slice(0, 10)
		.map((v, index) => ({
			...v,
			label: `V${index + 1}`,
			shortTitle: v.title.length > 25 ? `${v.title.slice(0, 22)}...` : v.title,
		}));

	const avgVelocity =
		chartData.length > 0
			? chartData.reduce((sum, v) => sum + v.viewsPerHour, 0) / chartData.length
			: 0;

	const formatVelocity = (value: number) => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M/h`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K/h`;
		return `${value}/h`;
	};

	const formatViews = (value: number) => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
		return value.toString();
	};

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart
				data={chartData}
				margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
			>
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
					tickFormatter={formatVelocity}
					width={55}
				/>
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.9)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
					}}
					content={({ active, payload }) => {
						if (!active || !payload?.length) return null;
						const item = payload[0].payload;
						return (
							<div className="space-y-1 p-2">
								<p className="font-medium text-white">{item.shortTitle}</p>
								<p className="text-xs text-emerald-400">
									{formatVelocity(item.viewsPerHour)}
								</p>
								<p className="text-xs text-white/70">
									{formatViews(item.currentViews)} total views
								</p>
								<p className="text-xs text-white/70">
									{item.hoursOld} hours old
								</p>
							</div>
						);
					}}
					cursor={false}
				/>
				<ReferenceLine
					y={avgVelocity}
					stroke="rgba(236, 72, 153, 0.5)"
					strokeDasharray="4 4"
					label={{
						value: "Avg",
						position: "right",
						fill: "rgba(236, 72, 153, 0.8)",
						fontSize: 10,
					}}
				/>
				<Bar dataKey="viewsPerHour" radius={[4, 4, 0, 0]}>
					{chartData.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={
								entry.velocityRank <= 3
									? "#10b981" // Top 3 in emerald
									: entry.viewsPerHour > avgVelocity
									? "#3b82f6" // Above average in blue
									: "#6b7280" // Below average in gray
							}
							fillOpacity={0.8}
						/>
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}
