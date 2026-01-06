"use client";

import { type ReactNode } from "react";

interface FrostedCardProps {
	children: ReactNode;
	className?: string;
	padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
	none: "",
	sm: "p-4",
	md: "p-5",
	lg: "p-6",
};

export function FrostedCard({
	children,
	className = "",
	padding = "md",
}: FrostedCardProps) {
	return (
		<div
			className={`
				bg-[var(--frosted-bg)]
				backdrop-blur-[var(--frosted-blur)]
				border border-[var(--frosted-border)]
				rounded-2xl
				${paddingMap[padding]}
				${className}
			`}
		>
			{children}
		</div>
	);
}
