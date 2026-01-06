"use client";

import { type ReactNode, useState } from "react";
import { MobileViewToggle } from "../ui/FrostedTabs";

interface TabContentProps {
	insights: ReactNode;
	chart: ReactNode;
}

export function TabContent({ insights, chart }: TabContentProps) {
	const [mobileView, setMobileView] = useState<"insights" | "chart">("insights");

	return (
		<>
			{/* Mobile view toggle */}
			<div className="lg:hidden">
				<MobileViewToggle activeView={mobileView} onViewChange={setMobileView} />
				{mobileView === "insights" ? insights : chart}
			</div>

			{/* Desktop layout - 40/60 split */}
			<div className="hidden lg:grid lg:grid-cols-5 gap-6">
				<div className="lg:col-span-2">{insights}</div>
				<div className="lg:col-span-3">{chart}</div>
			</div>
		</>
	);
}
