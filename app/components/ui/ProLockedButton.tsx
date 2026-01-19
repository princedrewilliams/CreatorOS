"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Lock, Crown } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { UpgradeModal } from "./UpgradeModal";

interface ProLockedButtonProps {
	href?: string;
	onClick?: () => void;
	feature: string;
	icon?: ReactNode;
	className?: string;
	children: ReactNode;
}

export function ProLockedButton({
	href,
	onClick,
	feature,
	icon,
	className = "",
	children,
}: ProLockedButtonProps) {
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const isPro = useAppStore((state) => state.isPro);

	const handleClick = (e: React.MouseEvent) => {
		if (!isPro) {
			e.preventDefault();
			setShowUpgradeModal(true);
			return;
		}

		if (onClick) {
			onClick();
		}
	};

	const baseClasses = `relative flex items-center gap-2 ${className}`;

	const content = (
		<>
			{icon}
			<span>{children}</span>
			{!isPro && (
				<span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-semibold uppercase tracking-wide">
					<Crown className="w-3 h-3" />
					Pro
				</span>
			)}
		</>
	);

	return (
		<>
			{href && isPro ? (
				<Link href={href} className={baseClasses} onClick={handleClick}>
					{content}
				</Link>
			) : (
				<button
					type="button"
					className={baseClasses}
					onClick={handleClick}
				>
					{content}
					{!isPro && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
							<Lock className="w-4 h-4 text-white/60" />
						</div>
					)}
				</button>
			)}

			<UpgradeModal
				isOpen={showUpgradeModal}
				onClose={() => setShowUpgradeModal(false)}
				feature={feature}
			/>
		</>
	);
}
