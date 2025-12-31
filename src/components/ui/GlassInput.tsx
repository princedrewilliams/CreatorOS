import React from 'react';
import { BoxIcon } from 'lucide-react';
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: BoxIcon;
  containerClassName?: string;
}
export function GlassInput({
  label,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}: GlassInputProps) {
  return <div className={`space-y-2 group ${containerClassName}`}>
      {label && <label className="block text-sm font-medium tracking-wide text-white/60 ml-1 transition-colors group-focus-within:text-pink-300/80">
          {label}
        </label>}
      <div className="relative">
        {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-5 h-5 text-white/30 transition-colors duration-300 group-focus-within:text-pink-400 group-focus-within:drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]" />
          </div>}
        <input className={`
            w-full bg-white/5 border border-white/10 rounded-xl 
            px-4 py-4 text-white placeholder:text-white/20
            backdrop-blur-xl transition-all duration-300
            focus:outline-none focus:bg-white/10 
            focus:border-pink-500/30 focus:ring-2 focus:ring-pink-500/20
            focus:shadow-[0_0_30px_rgba(236,72,153,0.15)]
            text-lg font-light tracking-wide
            ${Icon ? 'pl-12' : ''}
            ${className}
          `} {...props} />
        {/* Subtle inner glow effect on focus */}
        <div className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-500 opacity-0 group-focus-within:opacity-100 bg-gradient-to-r from-pink-500/5 to-rose-500/5" />
      </div>
    </div>;
}