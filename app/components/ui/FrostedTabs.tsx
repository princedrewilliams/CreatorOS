"use client";

export interface Tab {
	id: string;
	label: string;
}

interface FrostedTabsProps {
	tabs: Tab[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
}

export function FrostedTabs({ tabs, activeTab, onTabChange }: FrostedTabsProps) {
	return (
		<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
			{tabs.map((tab) => {
				const isActive = tab.id === activeTab;
				return (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`
							px-4 py-2
							rounded-full
							text-sm font-medium
							whitespace-nowrap
							transition-all duration-200
							${
								isActive
									? "bg-[var(--accent-muted)] text-white shadow-[0_0_20px_var(--accent-glow)]"
									: "bg-white/[0.03] text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
							}
						`}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}

interface MobileViewToggleProps {
	activeView: "insights" | "chart";
	onViewChange: (view: "insights" | "chart") => void;
}

export function MobileViewToggle({ activeView, onViewChange }: MobileViewToggleProps) {
	return (
		<div className="lg:hidden flex bg-white/[0.03] rounded-lg p-1 mb-4">
			<button
				onClick={() => onViewChange("insights")}
				className={`
					flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all
					${activeView === "insights"
						? "bg-[var(--accent-muted)] text-white"
						: "text-[var(--text-secondary)]"
					}
				`}
			>
				Insights
			</button>
			<button
				onClick={() => onViewChange("chart")}
				className={`
					flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all
					${activeView === "chart"
						? "bg-[var(--accent-muted)] text-white"
						: "text-[var(--text-secondary)]"
					}
				`}
			>
				Chart
			</button>
		</div>
	);
}
