import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
const data = [{
  time: '00:00',
  value: 2400
}, {
  time: '02:00',
  value: 1398
}, {
  time: '04:00',
  value: 980
}, {
  time: '06:00',
  value: 3908
}, {
  time: '08:00',
  value: 4800
}, {
  time: '10:00',
  value: 6800
}, {
  time: '12:00',
  value: 9800
}, {
  time: '14:00',
  value: 11500
}, {
  time: '16:00',
  value: 14800
}, {
  time: '18:00',
  value: 12800
}, {
  time: '20:00',
  value: 8800
}, {
  time: '22:00',
  value: 5400
}, {
  time: '23:59',
  value: 3200
}];
const CustomTooltip = ({
  active,
  payload,
  label
}: any) => {
  if (active && payload && payload.length) {
    return <div className="rounded-xl border border-white/20 bg-black/60 p-3 shadow-xl backdrop-blur-md">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-sm font-bold text-purple-300">
          {payload[0].value.toLocaleString()} views
        </p>
      </div>;
  }
  return null;
};
export function EngagementChart() {
  return <div className="h-full min-h-[350px] w-full rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Engagement Over Time
          </h3>
          <p className="text-sm text-white/60">24-hour performance metrics</p>
        </div>
        <select className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500/50">
          <option value="24h" className="bg-gray-900">
            Last 24 Hours
          </option>
          <option value="7d" className="bg-gray-900">
            Last 7 Days
          </option>
          <option value="30d" className="bg-gray-900">
            Last 30 Days
          </option>
        </select>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{
          top: 10,
          right: 10,
          left: -20,
          bottom: 0
        }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" tick={{
            fill: 'rgba(255,255,255,0.5)',
            fontSize: 12
          }} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.5)" tick={{
            fill: 'rgba(255,255,255,0.5)',
            fontSize: 12
          }} tickLine={false} axisLine={false} tickFormatter={value => `${value / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#c084fc" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>;
}