"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ReferenceLine,
	Cell,
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
	const avgUploads = data.length
		? data.reduce((sum, d) => sum + d.uploads, 0) / data.length
		: 0;

	const maxUploads = Math.max(...data.map(d => d.uploads), 1);

	// Color bars based on performance relative to target
	const getBarColor = (uploads: number) => {
		if (uploads >= targetUploads * 1.5) return "#22c55e"; // Exceeds target significantly
		if (uploads >= targetUploads) return "#ec4899"; // Meets target
		if (uploads >= targetUploads * 0.5) return "#d946ef"; // Close to target
		return "#a855f7"; // Below target
	};

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
				<defs>
					{/* Gradient for bars */}
					<linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
						<stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} />
					</linearGradient>
					{/* Glow effect */}
					<filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="2" result="coloredBlur" />
						<feMerge>
							<feMergeNode in="coloredBlur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>
				<XAxis
					dataKey="week"
					axisLine={false}
					tickLine={false}
					tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
					label={{
						value: "Week",
						position: "bottom",
						fill: "rgba(255,255,255,0.4)",
						fontSize: 10,
						offset: -5,
					}}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
					width={35}
					allowDecimals={false}
					domain={[0, Math.max(maxUploads + 1, targetUploads + 1)]}
				/>
				<Tooltip
					contentStyle={{
						background: "rgba(0,0,0,0.9)",
						border: "1px solid rgba(236,72,153,0.3)",
						borderRadius: "12px",
						fontSize: "12px",
						boxShadow: "0 8px 32px rgba(236,72,153,0.2)",
						backdropFilter: "blur(8px)",
					}}
					labelStyle={{ color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}
					formatter={(value: number) => [
						<span key="value" className="text-white font-medium">
							Uploads: <span className="text-[#ec4899]">{value}</span>
						</span>,
						""
					]}
					separator=""
					cursor={{ fill: "rgba(236,72,153,0.1)" }}
				/>
				{/* Target line */}
				<ReferenceLine
					y={targetUploads}
					stroke="rgba(255,255,255,0.3)"
					strokeDasharray="6 4"
					label={{
						value: `Target: ${targetUploads}/wk`,
						fill: "rgba(255,255,255,0.5)",
						fontSize: 10,
						position: "right",
					}}
				/>
				{/* Average line */}
				{avgUploads > 0 && (
					<ReferenceLine
						y={avgUploads}
						stroke="rgba(236,72,153,0.5)"
						strokeDasharray="3 3"
						label={{
							value: `${avgUploads.toFixed(1)} avg`,
							fill: "rgba(236,72,153,0.7)",
							fontSize: 9,
							position: "insideTopRight",
						}}
					/>
				)}
				<Bar
					dataKey="uploads"
					radius={[6, 6, 0, 0]}
					animationDuration={1200}
					animationEasing="ease-out"
					filter="url(#barGlow)"
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={getBarColor(entry.uploads)}
							fillOpacity={0.9}
							style={{
								transition: "all 0.3s ease",
							}}
						/>
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}
