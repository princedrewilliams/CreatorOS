import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { GlassInput } from './ui/GlassInput';
import { GlassButton } from './ui/GlassButton';
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => setIsLoading(false), 2000);
  };
  return <div className="w-full max-w-md relative z-10">
      {/* Glass Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_0_40px_rgba(8,8,8,0.5)] p-8 md:p-10">
        {/* Decorative top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-light text-white tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Welcome Back
          </h1>
          <p className="text-white/50 font-light text-sm tracking-wide">
            Enter your credentials to access your space
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <GlassInput label="Email Address" type="email" placeholder="name@example.com" icon={Mail} required />

          <div className="space-y-2">
            <GlassInput label="Password" type="password" placeholder="••••••••" icon={Lock} required />
            <div className="flex justify-end">
              <a href="#" className="text-xs text-white/40 hover:text-purple-300 transition-colors duration-300 hover:underline decoration-purple-500/30 underline-offset-4">
                Forgot password?
              </a>
            </div>
          </div>

          <div className="pt-4">
            <GlassButton type="submit" isLoading={isLoading}>
              Sign In{' '}
              <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
            </GlassButton>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-white/40 font-light">
            Don't have an account?{' '}
            <a href="#" className="text-white/80 hover:text-white font-medium hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300">
              Create one now
            </a>
          </p>
        </div>

        {/* Subtle bottom glow */}
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>;
}