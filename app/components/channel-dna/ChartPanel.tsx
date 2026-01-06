"use client";

import { type ReactNode } from "react";

interface ChartPanelProps {
	title: string;
	description?: string;
	children: ReactNode;
}

export function ChartPanel({ title, description, children }: ChartPanelProps) {
	return (
		<div className="bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-2xl p-5">
			<div className="mb-4">
				<h3 className="text-base font-semibold text-white">{title}</h3>
				{description && (
					<p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
				)}
			</div>
			<div className="h-64">{children}</div>
		</div>
	);
}
