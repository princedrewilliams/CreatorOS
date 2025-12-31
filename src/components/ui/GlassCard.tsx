import React, { useState, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
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
  shimmer = true
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  // Mouse tracking for glow effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  // Smooth spring animation for the glow
  const springConfig = {
    damping: 20,
    stiffness: 300,
    mass: 0.5
  };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  function handleMouseMove({
    currentTarget,
    clientX,
    clientY
  }: React.MouseEvent) {
    const {
      left,
      top
    } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }
  const glowBackground = useMotionTemplate`
    radial-gradient(
      600px circle at ${springX}px ${springY}px,
      rgba(255, 255, 255, 0.1),
      transparent 40%
    )
  `;
  return <motion.div ref={ref} initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    type: 'spring',
    stiffness: 300,
    damping: 30,
    delay: delay
  }} onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} whileHover={hoverEffect ? {
    scale: 1.01,
    boxShadow: '0 20px 40px -10px rgba(120, 50, 255, 0.2)'
  } : undefined} className={cn('relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl group', className)}>
      {/* Dynamic Cursor Glow */}
      <motion.div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{
      background: glowBackground
    }} />

      {/* Animated Border Gradient */}
      <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-50 pointer-events-none" />

      {/* Shimmer Effect */}
      {shimmer && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-0 pointer-events-none" />}

      {/* Glossy reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30 pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>;
}