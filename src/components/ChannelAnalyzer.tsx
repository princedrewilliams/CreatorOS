import React, { useState } from 'react';
import { Link2, ArrowRight, Sparkles } from 'lucide-react';
import { GlassInput } from './ui/GlassInput';
import { GlassButton } from './ui/GlassButton';
export function ChannelAnalyzer() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsLoading(true);
    // Simulate analysis delay
    setTimeout(() => setIsLoading(false), 2000);
  };
  return <div className="w-full max-w-4xl mx-auto relative z-10 flex flex-col items-center">
      {/* Badge */}
      <div className="mb-8 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(236,72,153,0.15)]">
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span className="text-xs font-medium tracking-wider text-pink-100/90 uppercase">
            Introducing Channel DNA Analyzer
          </span>
        </div>
      </div>

      {/* Hero Text */}
      <div className="text-center mb-12 space-y-6 max-w-3xl animate-fade-in-up delay-100">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
          Reverse-Engineer What Makes <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 animate-gradient-x">
            YouTube Channels Win
          </span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
          Analyze posting patterns, titles, thumbnails, and content strategy —
          instantly.
        </p>
      </div>

      {/* Input Card */}
      <div className="w-full max-w-3xl animate-fade-in-up delay-200">
        <div className="relative group">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600/30 via-rose-600/30 to-pink-600/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/60 backdrop-blur-2xl p-2 md:p-3 shadow-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Link2 className="w-5 h-5 text-white/30" />
                </div>
                <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste your YouTube URL here... (e.g., youtube.com/@channelname)" className="w-full h-14 pl-12 pr-4 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-base md:text-lg font-light tracking-wide rounded-xl transition-colors focus:bg-white/5" />
              </div>

              <GlassButton type="submit" isLoading={isLoading} className="md:w-auto w-full h-14 md:px-8 text-base shadow-none hover:shadow-lg">
                Start Analyzing
                <ArrowRight className="w-4 h-4 ml-1" />
              </GlassButton>
            </form>

            <div className="px-4 py-2 flex justify-center md:justify-start">
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                Example: youtube.com/@channelname
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Footer */}
      <div className="mt-24 animate-fade-in-up delay-300">
        <span className="text-2xl font-bold tracking-tight text-white/90 font-display">
          CreatorOS
        </span>
      </div>
    </div>;
}