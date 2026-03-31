"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import type { HookType } from "@/lib/learning-lab/types";

interface HookData {
	hook: HookType;
	count: number;
	avgViews?: number;
}

interface HookAnalysisChartProps {
	data: HookData[];
}

const HOOK_COLORS: Record<HookType, string> = {
	Curiosity: "#8b5cf6",
	"Negativity Bias": "#ef4444",
	"List/Number": "#10b981",
	"How-To": "#3b82f6",
	Question: "#f59e0b",
	Urgency: "#f97316",
	"Social Proof": "#6366f1",
	Controversy: "#ec4899",
	"Personal Story": "#14b8a6",
	"None Detected": "#6b7280",
};

export function HookAnalysisChart({ data }: HookAnalysisChartProps) {
	// Sort by count descending and take top 8
	const sortedData = [...data]
		.filter((d) => d.hook !== "None Detected")
		.sort((a, b) => b.count - a.count)
		.slice(0, 8);

	const formatViews = (value: number) => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
		return value.toString();
	};

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart
				data={sortedData}
				layout="vertical"
				margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
			>
				<XAxis
					type="number"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#ffffff", fontSize: 11 }}
				/>
				<YAxis
					type="category"
					dataKey="hook"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "#ffffff", fontSize: 11 }}
					width={75}
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
						const item = payload[0].payload as HookData;
						return (
							<div className="space-y-1 p-2">
								<p className="font-medium text-white">{item.hook}</p>
								<p className="text-xs text-white/70">
									Used {item.count} time{item.count !== 1 ? "s" : ""}
								</p>
								{item.avgViews !== undefined && (
									<p className="text-xs text-white/70">
										Avg views: {formatViews(item.avgViews)}
									</p>
								)}
							</div>
						);
					}}
					cursor={false}
				/>
				<Bar dataKey="count" radius={[0, 4, 4, 0]}>
					{sortedData.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={HOOK_COLORS[entry.hook] || "#6b7280"}
							fillOpacity={0.8}
						/>
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}
