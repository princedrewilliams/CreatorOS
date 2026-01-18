"use client";

import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ReferenceLine,
} from "recharts";

interface DataPoint {
	label: string;
	score: number;
}

interface ThemeConsistencyChartProps {
	data: DataPoint[];
	average: number;
}

export function ThemeConsistencyChart({ data, average }: ThemeConsistencyChartProps) {
	return (
		<div className="w-full h-full">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
					<defs>
						{/* Gradient fill */}
						<linearGradient id="themeGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
							<stop offset="50%" stopColor="#a855f7" stopOpacity={0.25} />
							<stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
						</linearGradient>
						{/* Line gradient */}
						<linearGradient id="themeLineGradient" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#8b5cf6" />
							<stop offset="50%" stopColor="#a855f7" />
							<stop offset="100%" stopColor="#c084fc" />
						</linearGradient>
						{/* Glow filter */}
						<filter id="themeGlow" x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="4" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>
					<XAxis
						dataKey="label"
						axisLine={false}
						tickLine={false}
						tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
						label={{
							value: "Uploads (Old → New)",
							position: "bottom",
							fill: "rgba(255,255,255,0.4)",
							fontSize: 10,
							offset: -5,
						}}
					/>
					<YAxis
						domain={[0, 100]}
						axisLine={false}
						tickLine={false}
						tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
						tickFormatter={(v) => `${v}`}
						width={40}
						ticks={[0, 25, 50, 75, 100]}
						label={{
							value: "Theme Overlap (0-100)",
							angle: -90,
							position: "insideLeft",
							fill: "rgba(255,255,255,0.4)",
							fontSize: 10,
							dx: -5,
						}}
					/>
					<Tooltip
						contentStyle={{
							background: "rgba(0,0,0,0.9)",
							border: "1px solid rgba(139,92,246,0.3)",
							borderRadius: "12px",
							fontSize: "12px",
							boxShadow: "0 8px 32px rgba(139,92,246,0.2)",
							backdropFilter: "blur(8px)",
						}}
						labelStyle={{ color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}
						formatter={(value: number) => [
							<span key="value" className="text-white font-medium">
								<span className="text-white/60 text-xs block mb-1">
									Measures how similar this video's topic is to your most common themes
								</span>
								Theme Overlap: <span className="text-[#8b5cf6]">{value}</span>/100
							</span>,
							""
						]}
						separator=""
						cursor={{ stroke: "rgba(139,92,246,0.3)", strokeWidth: 1 }}
					/>
					<ReferenceLine
						y={average}
						stroke="rgba(255,255,255,0.25)"
						strokeDasharray="6 4"
						label={{
							value: `Channel Average: ${average}`,
							fill: "rgba(255,255,255,0.5)",
							fontSize: 10,
							position: "right",
						}}
					/>
					<Area
						type="monotone"
						dataKey="score"
						stroke="url(#themeLineGradient)"
						strokeWidth={3}
						fill="url(#themeGradient)"
						filter="url(#themeGlow)"
						animationDuration={1500}
						animationEasing="ease-out"
						dot={{
							fill: "#8b5cf6",
							r: 4,
							strokeWidth: 2,
							stroke: "rgba(139,92,246,0.3)",
						}}
						activeDot={{
							r: 6,
							fill: "#8b5cf6",
							stroke: "rgba(139,92,246,0.4)",
							strokeWidth: 2,
							filter: "url(#themeGlow)",
						}}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
