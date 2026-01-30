import { useState, useEffect, useMemo } from 'react';
import {
    Clock,
    Calendar,
    PieChart as PieChartIcon,
    Flame
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import clsx from 'clsx';

interface Session {
    id: number | string;
    gameName: string;
    startTime: string;
    duration: number;
    isManual: boolean;
}

interface WoWCharacter {
    name: string;
    realm: string;
    class: string;
    level: number;
    totalTime: number;
    version?: string;
}

export function Stats() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [wowChars, setWowChars] = useState<WoWCharacter[]>([]);
    const [gamesLibrary, setGamesLibrary] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'platforms' | 'wow'>('overview');

    useEffect(() => {
        const fetchData = async () => {
            const [recent, lib, chars] = await Promise.all([
                window.ipcRenderer.invoke('get-recent-sessions', 1000),
                window.ipcRenderer.invoke('get-games-library'),
                window.ipcRenderer.invoke('get-wow-characters')
            ]);
            setSessions(recent);
            setGamesLibrary(lib);
            setWowChars(chars);
        };
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    // Aggregations
    const stats = useMemo(() => {
        const totalSeconds = gamesLibrary.reduce((acc, g) => acc + (g.totalSeconds || 0), 0);
        const avgSession = sessions.length > 0
            ? sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length
            : 0;

        // Busiest Day
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts: Record<string, number> = {};
        sessions.forEach(s => {
            const d = new Date(s.startTime).getDay();
            dayCounts[days[d]] = (dayCounts[days[d]] || 0) + s.duration;
        });
        const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        // Platform Distribution
        const platformData = [
            { name: 'WoW', value: wowChars.reduce((acc, c) => acc + c.totalTime, 0), color: '#f8b700' },
            { name: 'Steam', value: (window as any).steamGames?.reduce((acc: any, g: any) => acc + (g.playtimeMinutes * 60), 0) || 0, color: '#1b2838' },
            // Simplified for now, we'd need better platform tags for the rest
            { name: 'Others', value: totalSeconds - (wowChars.reduce((acc, c) => acc + c.totalTime, 0)), color: 'var(--primary)' }
        ].filter(p => p.value > 0);

        // Hourly distribution
        const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, count: 0 }));
        sessions.forEach(s => {
            const h = new Date(s.startTime).getHours();
            hours[h].count += s.duration / 3600;
        });

        return {
            totalSeconds,
            avgSession,
            busiestDay,
            platformData,
            hourlyData: hours
        };
    }, [sessions, wowChars, gamesLibrary]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="size-full pb-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Advanced Analytics</h2>
                    <p className="text-gray-400 font-medium">Deep dive into your gaming behavior</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {(['overview', 'platforms', 'wow'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                                activeTab === tab
                                    ? "bg-[var(--primary)] text-white shadow-lg"
                                    : "text-gray-500 hover:text-white"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={Clock}
                            label="Total Journey"
                            value={formatDuration(stats.totalSeconds)}
                            subtext="Across all platforms"
                            color="var(--primary)"
                        />
                        <StatCard
                            icon={Activity}
                            label="Avg. Session"
                            value={formatDuration(stats.avgSession)}
                            subtext="Per sitting"
                            color="var(--secondary)"
                        />
                        <StatCard
                            icon={Calendar}
                            label="Busiest Day"
                            value={stats.busiestDay}
                            subtext="Most playtime recorded"
                            color="var(--accent)"
                        />
                        <StatCard
                            icon={Flame}
                            label="Current Streak"
                            value="5 Days"
                            subtext="Keep it up!"
                            color="#ff6b00"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 glass p-6 rounded-2xl">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                <Activity size={16} className="text-[var(--primary)]" />
                                24h Activity Distribution
                            </h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.hourlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#0f0f13', border: '1px solid #1f2937', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass p-6 rounded-2xl">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                                <PieChartIcon size={16} className="text-[var(--secondary)]" />
                                Platform Split
                            </h3>
                            <div className="h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.platformData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats.platformData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f0f13', border: '1px solid #1f2937', borderRadius: '8px' }}
                                            formatter={(value: any) => formatDuration(Number(value))}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {stats.platformData.map(p => (
                                    <div key={p.name} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                            <span className="text-gray-400 font-bold">{p.name}</span>
                                        </div>
                                        <span className="text-white font-black">{formatDuration(p.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'wow' && (
                <div className="glass rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                <th className="py-5 pl-8">Character</th>
                                <th className="py-5">Class</th>
                                <th className="py-5">Level</th>
                                <th className="py-5">Realm</th>
                                <th className="py-5 text-right pr-8">Time Played</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {wowChars.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-500">
                                        No WoW characters detected yet. Ensure your WoW folder is set in Settings.
                                    </td>
                                </tr>
                            ) : (
                                wowChars.sort((a, b) => b.totalTime - a.totalTime).map(char => (
                                    <tr key={`${char.name}-${char.realm}`} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-5 pl-8">
                                            <div className="font-black text-lg text-white group-hover:text-[var(--primary)] transition-colors">
                                                {char.name}
                                            </div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                                {char.version || 'Retail'}
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                                                `class-${char.class.toLowerCase().replace(' ', '')}`
                                            )}>
                                                {char.class}
                                            </span>
                                        </td>
                                        <td className="py-5">
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-[var(--accent)]">
                                                {char.level}
                                            </div>
                                        </td>
                                        <td className="py-5 text-gray-400 font-medium">
                                            {char.realm}
                                        </td>
                                        <td className="py-5 text-right pr-8">
                                            <span className="font-mono font-black text-white bg-white/5 px-2 py-1 rounded-lg">
                                                {formatDuration(char.totalTime)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, subtext, color }: any) {
    return (
        <div className="glass glass-hover p-6 rounded-2xl relative overflow-hidden group">
            <div
                className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-all duration-500 blur-xl group-hover:blur-2xl"
                style={{ backgroundColor: color }}
            />
            <div className="flex justify-between items-start mb-6">
                <div
                    className="p-3 rounded-2xl bg-white/5 transition-all duration-300 group-hover:bg-white/10"
                    style={{ color: color }}
                >
                    <Icon size={24} />
                </div>
            </div>
            <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">{label}</p>
                <h4 className="text-2xl font-black text-white tracking-tighter">{value}</h4>
                <p className="text-[10px] text-gray-500 font-medium mt-1">{subtext}</p>
            </div>
        </div>
    );
}

const Activity = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);
