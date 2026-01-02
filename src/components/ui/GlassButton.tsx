import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}
export function GlassButton({
  children,
  isLoading,
  variant = 'primary',
  className = '',
  ...props
}: GlassButtonProps) {
  const baseStyles = 'relative py-3.5 px-8 rounded-xl font-medium tracking-wide transition-all duration-300 flex items-center justify-center overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed';
  const variants = {
    primary: `
      bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600
      background-size-200
      hover:bg-[position:100%_0]
      text-white shadow-[0_0_20px_rgba(236,72,153,0.3)]
      hover:shadow-[0_0_35px_rgba(236,72,153,0.5)]
      hover:-translate-y-0.5 active:translate-y-0
      border border-white/10
    `,
    secondary: `
      bg-white/5 hover:bg-white/10 
      text-white/90 hover:text-white
      border border-white/10 hover:border-white/20
      backdrop-blur-md
      hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]
    `,
    ghost: `
      bg-transparent hover:bg-white/5
      text-white/60 hover:text-white
      border border-transparent
    `
  };
  return <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {/* Shimmer effect overlay for primary buttons */}
      {variant === 'primary' && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />}

      <span className="relative z-20 flex items-center gap-2">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </span>
    </button>;
}