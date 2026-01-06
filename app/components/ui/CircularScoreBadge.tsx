"use client";

interface CircularScoreBadgeProps {
	score: number;
	size?: "sm" | "md" | "lg";
	label?: string;
}

const sizeMap = {
	sm: { container: "w-12 h-12", stroke: 3, fontSize: "text-sm" },
	md: { container: "w-16 h-16", stroke: 4, fontSize: "text-lg" },
	lg: { container: "w-20 h-20", stroke: 5, fontSize: "text-xl" },
};

export function CircularScoreBadge({
	score,
	size = "md",
	label,
}: CircularScoreBadgeProps) {
	const { container, stroke, fontSize } = sizeMap[size];
	const radius = 45;
	const circumference = 2 * Math.PI * radius;
	const progress = (score / 100) * circumference;

	return (
		<div className="flex flex-col items-center gap-1">
			<div className={`${container} relative`}>
				<svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
					{/* Background circle */}
					<circle
						cx="50"
						cy="50"
						r={radius}
						fill="none"
						stroke="rgba(255,255,255,0.06)"
						strokeWidth={stroke}
					/>
					{/* Progress circle */}
					<circle
						cx="50"
						cy="50"
						r={radius}
						fill="none"
						stroke="var(--accent-primary)"
						strokeWidth={stroke}
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={circumference - progress}
						style={{
							filter: "drop-shadow(0 0 6px var(--accent-glow))",
						}}
					/>
				</svg>
				<div className="absolute inset-0 flex items-center justify-center">
					<span className={`${fontSize} font-bold text-white`}>{score}</span>
				</div>
			</div>
			{label && (
				<span className="text-xs text-[var(--text-muted)]">{label}</span>
			)}
		</div>
	);
}
