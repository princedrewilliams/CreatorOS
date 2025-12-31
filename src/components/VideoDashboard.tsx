import React, { useEffect, useState, Component } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Search, Sparkles, Zap, TrendingUp, Image, Hash, Fingerprint } from 'lucide-react';
import { ChannelProfile } from './ChannelProfile';
import { ObservedPatterns } from './ObservedPatterns';
import { ViralScoreChart } from './ViralScoreChart';
const tabs = [{
  id: 'viral',
  label: 'Viral Score',
  badge: 'FREE',
  icon: Zap
}, {
  id: 'search',
  label: 'Search & Discovery',
  icon: Search
}, {
  id: 'upload',
  label: 'Upload Consistency',
  icon: TrendingUp
}, {
  id: 'thumb',
  label: 'Thumbnail Performance',
  icon: Image
}, {
  id: 'topics',
  label: 'Winning Topics',
  icon: Hash
}, {
  id: 'identity',
  label: 'Channel Identity',
  icon: Fingerprint
}];
// Floating Particle Component
const Particle = ({
  delay
}: {
  delay: number;
}) => <motion.div initial={{
  y: 0,
  opacity: 0
}} animate={{
  y: -100,
  opacity: [0, 0.5, 0],
  scale: [0, 1, 0]
}} transition={{
  duration: Math.random() * 5 + 5,
  repeat: Infinity,
  delay: delay,
  ease: 'linear'
}} className="absolute w-1 h-1 rounded-full bg-white/20" style={{
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`
}} />;
export function VideoDashboard() {
  const [activeTab, setActiveTab] = useState('viral');
  const {
    scrollY
  } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const headerY = useTransform(scrollY, [0, 100], [-20, 0]);
  return <div className="min-h-screen w-full bg-[#0a0a0f] text-white font-sans selection:bg-pink-500/30 overflow-x-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div animate={{
        scale: [1, 1.1, 1],
        opacity: [0.2, 0.3, 0.2]
      }} transition={{
        duration: 10,
        repeat: Infinity,
        ease: 'easeInOut'
      }} className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[120px]" />
        <motion.div animate={{
        scale: [1, 1.2, 1],
        opacity: [0.2, 0.3, 0.2]
      }} transition={{
        duration: 15,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2
      }} className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-pink-900/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-blue-900/10 blur-[100px]" />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => <Particle key={i} delay={i * 0.5} />)}
      </div>

      {/* Sticky Header Background */}
      <motion.div style={{
      opacity: headerOpacity,
      y: headerY
    }} className="fixed top-0 left-0 right-0 h-20 bg-[#0a0a0f]/80 backdrop-blur-xl z-40 border-b border-white/5" />

      <div className="relative z-10 mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 sticky top-0 z-50 py-2">
          <motion.button whileHover={{
          scale: 1.05,
          x: -5
        }} whileTap={{
          scale: 0.95
        }} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          <div className="relative">
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white animate-gradient-x bg-[length:200%_auto]">
              Channel Analyzer
            </h1>
            <motion.div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" initial={{
            scaleX: 0
          }} animate={{
            scaleX: 1
          }} transition={{
            delay: 0.5,
            duration: 1
          }} />
          </div>

          <motion.button whileHover={{
          scale: 1.05,
          boxShadow: '0 0 20px rgba(255,255,255,0.1)'
        }} whileTap={{
          scale: 0.95
        }} className="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md text-sm font-medium flex items-center gap-2 group">
            <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            Analyze Another Channel
          </motion.button>
        </header>

        {/* Navigation Tabs */}
        <nav className="mb-8 overflow-x-auto pb-2 scrollbar-hide perspective-1000">
          <div className="flex items-center gap-2 min-w-max px-1">
            {tabs.map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 group">
                  {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/80 to-pink-600/80 shadow-[0_0_20px_rgba(236,72,153,0.4)]" transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30
              }} />}
                  <span className={`relative z-10 flex items-center gap-2 ${activeTab === tab.id ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                    <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                    {tab.label}
                    {tab.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${activeTab === tab.id ? 'bg-white/20 border-white/20' : 'bg-white/10 border-white/10'}`}>
                        {tab.badge}
                      </span>}
                  </span>
                </button>;
          })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Top Section: Channel Profile & Metrics */}
          <ChannelProfile />

          {/* Bottom Section: Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[450px]">
            <ObservedPatterns />
            <ViralScoreChart />
          </div>
        </div>
      </div>
    </div>;
}