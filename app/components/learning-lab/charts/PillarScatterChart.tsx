"use client";

import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ZAxis,
	Legend,
	Cell,
} from "recharts";
import type { ContentPillar, PillarScatterPoint } from "@/lib/learning-lab/types";
import { PILLAR_COLORS } from "@/lib/learning-lab/types";

interface PillarScatterChartProps {
	data: PillarScatterPoint[];
	growthDriver?: ContentPillar;
}

export function PillarScatterChart({ data, growthDriver }: PillarScatterChartProps) {
	const formatViews = (value: number) => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
		return value.toString();
	};

	// Get unique pillars for legend
	const uniquePillars = [...new Set(data.map((d) => d.pillar))];

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
				<XAxis
					dataKey="engagementRate"
					name="Engagement Rate"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
					tickFormatter={(v) => `${v}%`}
					domain={[0, "auto"]}
					label={{
						value: "Engagement Rate (%)",
						position: "bottom",
						fill: "var(--text-muted)",
						fontSize: 10,
						offset: 0,
					}}
				/>
				<YAxis
					dataKey="views"
					name="Views"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
					tickFormatter={formatViews}
					width={50}
				/>
				<ZAxis range={[50, 150]} />
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.9)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
						padding: "8px 12px",
					}}
					content={({ active, payload }) => {
						if (!active || !payload?.length) return null;
						const item = payload[0].payload as PillarScatterPoint;
						return (
							<div className="space-y-1">
								<p className="font-medium text-white">{item.title}</p>
								<p className="text-xs" style={{ color: item.color }}>
									{item.pillar}
								</p>
								<p className="text-xs text-white/70">
									{formatViews(item.views)} views
								</p>
								<p className="text-xs text-white/70">
									{item.engagementRate}% engagement
								</p>
							</div>
						);
					}}
				/>
				<Legend
					wrapperStyle={{ paddingTop: "10px" }}
					content={() => (
						<div className="flex flex-wrap justify-center gap-2 text-xs">
							{uniquePillars.map((pillar) => (
								<div key={pillar} className="flex items-center gap-1">
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: PILLAR_COLORS[pillar] }}
									/>
									<span
										className={pillar === growthDriver ? "font-bold" : ""}
										style={{ color: "var(--text-muted)" }}
									>
										{pillar}
										{pillar === growthDriver && " ★"}
									</span>
								</div>
							))}
						</div>
					)}
				/>
				<Scatter data={data} fillOpacity={0.8}>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={entry.color}
							stroke={entry.pillar === growthDriver ? "#fff" : "transparent"}
							strokeWidth={entry.pillar === growthDriver ? 2 : 0}
						/>
					))}
				</Scatter>
			</ScatterChart>
		</ResponsiveContainer>
	);
}
