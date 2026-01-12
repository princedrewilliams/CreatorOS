"use client";

import { motion } from "framer-motion";

export interface Tab {
	id: string;
	label: string;
}

export const LEARNING_LAB_TABS: Tab[] = [
	{ id: "pillars", label: "Content Pillars" },
	{ id: "packaging", label: "Packaging & SEO" },
	{ id: "community", label: "Community Intel" },
];

interface LearningLabTabsProps {
	activeTab: string;
	onTabChange: (tabId: string) => void;
}

export function LearningLabTabs({ activeTab, onTabChange }: LearningLabTabsProps) {
	return (
		<div className="flex gap-1 p-1 bg-[var(--frosted-bg)] backdrop-blur-[var(--frosted-blur)] border border-[var(--frosted-border)] rounded-xl">
			{LEARNING_LAB_TABS.map((tab) => {
				const isActive = tab.id === activeTab;
				return (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`
							relative px-4 py-2 text-sm font-medium rounded-lg
							transition-colors duration-200
							${isActive
								? "text-white"
								: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
							}
						`}
					>
						{isActive && (
							<motion.div
								layoutId="learningLabActiveTab"
								className="absolute inset-0 bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 rounded-lg"
								transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
							/>
						)}
						<span className="relative z-10">{tab.label}</span>
					</button>
				);
			})}
		</div>
	);
}
