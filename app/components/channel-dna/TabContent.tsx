"use client";

import { type ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileViewToggle } from "../ui/FrostedTabs";

interface TabContentProps {
	insights: ReactNode;
	chart: ReactNode;
	tabKey: string;
}

const contentVariants = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -8 },
};

export function TabContent({ insights, chart, tabKey }: TabContentProps) {
	const [mobileView, setMobileView] = useState<"insights" | "chart">("insights");

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={tabKey}
				variants={contentVariants}
				initial="initial"
				animate="animate"
				exit="exit"
				transition={{ duration: 0.25, ease: "easeOut" }}
			>
				{/* Mobile view toggle */}
				<div className="lg:hidden">
					<MobileViewToggle activeView={mobileView} onViewChange={setMobileView} />
					<motion.div
						key={mobileView}
						initial={{ opacity: 0, x: mobileView === "insights" ? -10 : 10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2 }}
					>
						{mobileView === "insights" ? insights : chart}
					</motion.div>
				</div>

				{/* Desktop layout - 60/40 split (chart left, breakdown right) */}
				<div className="hidden lg:grid lg:grid-cols-5 gap-6">
					<motion.div
						className="lg:col-span-3"
						initial={{ opacity: 0, x: -15 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3, delay: 0.05 }}
					>
						{chart}
					</motion.div>
					<motion.div
						className="lg:col-span-2"
						initial={{ opacity: 0, x: 15 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
					>
						{insights}
					</motion.div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
