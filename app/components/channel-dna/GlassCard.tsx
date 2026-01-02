"use client";

import { useState, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface GlassCardProps {
	children: React.ReactNode;
	className?: string;
	hoverEffect?: boolean;
	delay?: number;
	shimmer?: boolean;
}

export function GlassCard({
	children,
	className,
	hoverEffect = false,
	delay = 0,
	shimmer = true,
}: GlassCardProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [_isHovered, setIsHovered] = useState(false);
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);
	const springConfig = {
		damping: 20,
		stiffness: 300,
		mass: 0.5,
	};
	const springX = useSpring(mouseX, springConfig);
	const springY = useSpring(mouseY, springConfig);

	function handleMouseMove({
		currentTarget,
		clientX,
		clientY,
	}: React.MouseEvent) {
		const { left, top } = currentTarget.getBoundingClientRect();
		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
	}

	const glowBackground = useMotionTemplate`
    radial-gradient(
      600px circle at ${springX}px ${springY}px,
      rgba(236, 72, 153, 0.15),
      transparent 40%
    )
  `;

	return (
		<motion.div
			ref={ref}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
				delay: delay,
			}}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			whileHover={
				hoverEffect
					? {
							scale: 1.01,
							boxShadow: "0 20px 40px -10px rgba(236, 72, 153, 0.3)",
						}
					: undefined
			}
			className={cn(
				"relative overflow-hidden rounded-3xl bg-pink-950/20 backdrop-blur-xl shadow-xl group",
				className
			)}
		>
			{/* Glow only on hover for floating effect */}
			<motion.div
				className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-30"
				style={{ background: glowBackground }}
			/>
			{shimmer && (
				<div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-pink-500/10 to-transparent z-0 pointer-events-none" />
			)}
			<div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-30 pointer-events-none z-0" />
			<div className="relative z-10">{children}</div>
		</motion.div>
	);
}

