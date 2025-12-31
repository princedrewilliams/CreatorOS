import React from 'react';
import { Play, Calendar, Clock, MoreVertical } from 'lucide-react';
export function VideoPreview() {
  return <div className="group relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white/30 bg-gradient-to-br from-purple-400 to-blue-400">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="Creator" className="h-full w-full object-cover opacity-90" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">@CreatorName</h3>
            <span className="text-xs text-white/60">Posted 24h ago</span>
          </div>
        </div>
        <button className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/20 group-hover:shadow-lg transition-all">
        <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80" alt="Video Thumbnail" className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30">
            <Play className="ml-1 h-5 w-5 fill-white text-white" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          12:45
        </div>
      </div>

      {/* Video Info */}
      <div className="mt-4 space-y-2">
        <h2 className="text-lg font-semibold leading-tight text-white">
          How I Built This in 24 Hours
        </h2>
        <p className="text-sm text-white/60 line-clamp-2">
          A deep dive into the process of building a viral product from scratch
          using modern tools and frameworks.
        </p>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Calendar className="h-3.5 w-3.5" />
          <span>Oct 24, 2023</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Clock className="h-3.5 w-3.5" />
          <span>12m 45s</span>
        </div>
      </div>
    </div>;
}