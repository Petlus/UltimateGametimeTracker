'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Clock, Trophy, Flame, Activity } from 'lucide-react';

const mockDailyData = [
  { name: 'Mon', hours: 2.5 },
  { name: 'Tue', hours: 4.1 },
  { name: 'Wed', hours: 1.2 },
  { name: 'Thu', hours: 5.5 },
  { name: 'Fri', hours: 3.8 },
  { name: 'Sat', hours: 8.2 },
  { name: 'Sun', hours: 6.5 },
];

const mockGameDist = [
  { name: 'WoW', value: 450 },
  { name: 'LoL', value: 320 },
  { name: 'CS2', value: 180 },
  { name: 'TFT', value: 90 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Dashboard
          </h2>
          <p className="text-gray-400 mt-1">Welcome back, Gamer</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-[var(--accent)]">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            Watcher Active
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Clock}
          label="Total Playtime"
          value="1,248h"
          subtext="+12h this week"
          color="var(--primary)"
        />
        <StatCard
          icon={Trophy}
          label="Top Game"
          value="WoW"
          subtext="450h recorded"
          color="var(--secondary)"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value="5 Days"
          subtext="Keep it up!"
          color="#f59e0b"
        />
        <StatCard
          icon={Activity}
          label="Avg. Session"
          value="2.4h"
          subtext="-10% vs last week"
          color="var(--accent)"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-[var(--primary)]" />
            Weekly Activity
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDailyData}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#525252"
                  tick={{ fill: '#a3a3a3' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#525252"
                  tick={{ fill: '#a3a3a3' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--primary)"
                  fillOpacity={1}
                  fill="url(#colorHours)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Games List/Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-6">Top Games</h3>
          <div className="space-y-4">
            {mockGameDist.map((game, i) => (
              <div key={game.name} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-lg group-hover:bg-[var(--primary)]/20 transition-colors">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium group-hover:text-[var(--primary)] transition-colors">{game.name}</span>
                    <span className="text-gray-400 text-sm">{game.value}h</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:shadow-[0_0_10px_var(--primary)]"
                      style={{
                        width: `${(game.value / 450) * 100}%`,
                        backgroundColor: i === 0 ? 'var(--primary)' : i === 1 ? 'var(--secondary)' : 'var(--accent)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: any) {
  return (
    <div className="glass glass-hover p-6 rounded-2xl relative overflow-hidden group">
      <div
        className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-xl"
        style={{ backgroundColor: color }}
      />
      <div className="flex justify-between items-start mb-4">
        <div
          className="p-3 rounded-xl bg-white/5 text-white group-hover:scale-110 transition-transform duration-300"
          style={{ color: color }}
        >
          <Icon size={24} />
        </div>
        <span className={`text-xs px-2 py-1 rounded-full bg-white/5 ${subtext.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
          {subtext.includes('+') ? '↑' : '↓'} {subtext.split(' ')[0]}
        </span>
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
        <h4 className="text-3xl font-bold text-white tracking-tight">{value}</h4>
      </div>
    </div>
  );
}
