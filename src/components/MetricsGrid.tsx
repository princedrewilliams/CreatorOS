import { Eye, Heart, Share2, MessageCircle, TrendingUp } from 'lucide-react';
const metrics = [{
  label: 'Total Views',
  value: '2.4M',
  trend: '+12.5%',
  icon: Eye,
  color: 'from-blue-400 to-cyan-300'
}, {
  label: 'Likes',
  value: '180K',
  trend: '+8.2%',
  icon: Heart,
  color: 'from-pink-500 to-rose-400'
}, {
  label: 'Shares',
  value: '45K',
  trend: '+15.3%',
  icon: Share2,
  color: 'from-purple-400 to-indigo-400'
}, {
  label: 'Comments',
  value: '12K',
  trend: '+5.7%',
  icon: MessageCircle,
  color: 'from-amber-300 to-orange-400'
}];
export function MetricsGrid() {
  return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(metric => <div key={metric.label} className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15">
          <div className="flex items-start justify-between">
            <div className={`rounded-xl bg-gradient-to-br ${metric.color} p-3 shadow-lg opacity-90`}>
              <metric.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-green-300 backdrop-blur-sm border border-white/10">
              <TrendingUp className="h-3 w-3" />
              {metric.trend}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-3xl font-bold text-white tracking-tight">
              {metric.value}
            </h3>
            <p className="text-sm font-medium text-white/60">{metric.label}</p>
          </div>

          {/* Decorative background glow */}
          <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${metric.color} opacity-20 blur-2xl transition-opacity group-hover:opacity-30`} />
        </div>)}
    </div>;
}