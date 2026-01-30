import { useState, useEffect, useMemo } from 'react';
import {
    Sword,
    Shield,
    Zap
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import clsx from 'clsx';

export default function League() {
    const [activeTab, setActiveTab] = useState<'overview' | 'lol' | 'tft'>('overview');
    const [riotStats, setRiotStats] = useState<any>(null);
    const [topChamps, setTopChamps] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const stats = await window.ipcRenderer.invoke('get-riot-stats');
            const champs = await window.ipcRenderer.invoke('get-top-champions', 10);
            setRiotStats(stats);
            setTopChamps(champs);
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const platformData = useMemo(() => {
        if (!riotStats) return [];
        return [
            { name: 'League of Legends', value: riotStats.lolSeconds, color: '#06b6d4' },
            { name: 'Teamfight Tactics', value: riotStats.tftSeconds, color: '#f59e0b' }
        ].filter(d => d.value > 0);
    }, [riotStats]);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    if (!riotStats) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <div className="animate-pulse text-gray-400 font-bold uppercase tracking-widest">Loading Riot Data...</div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic uppercase">Riot Games</h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        Live Sync Integrated
                    </p>
                </div>
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                    {['overview', 'lol', 'tft'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={clsx(
                                "px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === tab ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Summary Cards */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                        <StatCard
                            icon={Sword}
                            label="League Playtime"
                            value={formatDuration(riotStats.lolSeconds)}
                            subtext={`${riotStats.lolCount} Matches total`}
                            color="#06b6d4"
                        />
                        <StatCard
                            icon={Zap}
                            label="TFT Playtime"
                            value={formatDuration(riotStats.tftSeconds)}
                            subtext={`${riotStats.tftCount} Matches total`}
                            color="#f59e0b"
                        />
                    </div>

                    {/* Chart Card */}
                    <div className="glass p-6 rounded-2xl relative overflow-hidden group border border-white/10">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Distribution</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={platformData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {platformData.map((entry, index) => (
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
                    </div>
                </div>
            )}

            {activeTab === 'lol' && (
                <div className="space-y-6">
                    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Champion</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Playtime</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {topChamps.map((champ: any) => (
                                    <tr key={champ.name} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="py-4 px-6 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                                                <img
                                                    src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.name}_0.jpg`}
                                                    className="w-full h-full object-cover scale-150"
                                                    alt={champ.name}
                                                />
                                            </div>
                                            <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">{champ.name}</span>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-sm text-gray-300">
                                            {formatDuration(champ.duration)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-cyan-500"
                                                    style={{ width: `${(champ.duration / (topChamps[0]?.duration || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                    className="p-3 rounded-2xl bg-white/5 transition-all duration-300 group-hover:bg-white/10 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    style={{ color: color }}
                >
                    <Icon size={24} />
                </div>
            </div>
            <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">{label}</p>
                <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
                <p className="text-[10px] text-gray-500 font-medium mt-1 truncate">{subtext}</p>
            </div>
        </div>
    );
}
