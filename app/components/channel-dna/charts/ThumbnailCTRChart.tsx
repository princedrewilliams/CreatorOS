"use client";

import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ZAxis,
} from "recharts";

interface DataPoint {
	title: string;
	ctrProxy: number;
	views: number;
}

interface ThumbnailCTRChartProps {
	data: DataPoint[];
}

export function ThumbnailCTRChart({ data }: ThumbnailCTRChartProps) {
	const formatViews = (value: number) => {
		if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
		return value.toString();
	};

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
				<XAxis
					dataKey="ctrProxy"
					name="Engagement Rate"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "var(--text-muted)", fontSize: 11 }}
					tickFormatter={(v) => `${v}%`}
					domain={[0, "auto"]}
					label={{
						value: "Engagement Rate",
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
					width={45}
				/>
				<ZAxis range={[40, 120]} />
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.85)",
						border: "1px solid rgba(255,255,255,0.1)",
						borderRadius: "8px",
						fontSize: "12px",
					}}
					formatter={(value: number, name: string) => {
						if (name === "Views") return [formatViews(value), name];
						return [`${value}%`, "Engagement"];
					}}
					labelFormatter={(_, payload) => {
						const item = payload?.[0]?.payload;
						return item?.title || "";
					}}
				/>
				<Scatter
					data={data}
					fill="var(--accent-primary)"
					fillOpacity={0.7}
				/>
			</ScatterChart>
		</ResponsiveContainer>
	);
}
