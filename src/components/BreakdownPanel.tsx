import React from 'react';
import { Users, Globe } from 'lucide-react';
const demographics = [{
  label: '18-24',
  value: 35
}, {
  label: '25-34',
  value: 40
}, {
  label: '35-44',
  value: 18
}, {
  label: '45+',
  value: 7
}];
const traffic = [{
  label: 'YouTube',
  value: 45,
  color: 'bg-red-500'
}, {
  label: 'TikTok',
  value: 30,
  color: 'bg-pink-500'
}, {
  label: 'Instagram',
  value: 18,
  color: 'bg-purple-500'
}, {
  label: 'Direct',
  value: 7,
  color: 'bg-blue-500'
}];
export function BreakdownPanel() {
  return <div className="flex h-full flex-col gap-6">
      {/* Demographics Card */}
      <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-white/10 p-2">
            <Users className="h-5 w-5 text-purple-300" />
          </div>
          <h3 className="text-lg font-semibold text-white">Demographics</h3>
        </div>

        <div className="space-y-4">
          {demographics.map(item => <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{item.label}</span>
                <span className="font-medium text-white">{item.value}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500" style={{
              width: `${item.value}%`
            }} />
              </div>
            </div>)}
        </div>
      </div>

      {/* Traffic Sources Card */}
      <div className="flex-1 rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-white/10 p-2">
            <Globe className="h-5 w-5 text-blue-300" />
          </div>
          <h3 className="text-lg font-semibold text-white">Traffic Sources</h3>
        </div>

        <div className="space-y-4">
          {traffic.map(item => <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{item.label}</span>
                <span className="font-medium text-white">{item.value}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${item.color} opacity-90`} style={{
              width: `${item.value}%`
            }} />
              </div>
            </div>)}
        </div>
      </div>
    </div>;
}