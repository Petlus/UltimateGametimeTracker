
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Clock, Activity, History, Gamepad2, Trophy } from 'lucide-react';

// Types for our data
interface Session {
    id: number;
    gameName: string;
    startTime: string;
    endTime: string;
    duration: number;
    isManual: number;
}

export function Dashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [totalPlaytime, setTotalPlaytime] = useState<number>(0);
    const [topGames, setTopGames] = useState<{ gameName: string, totalSeconds: number }[]>([]);
    const [weeklyData, setWeeklyData] = useState<{ name: string, hours: number }[]>([]);
    const [gamesCount, setGamesCount] = useState<number>(0);
    const [sessionsThisWeek, setSessionsThisWeek] = useState<number>(0);

    useEffect(() => {
        // Fetch sessions on mount
        const fetchSessions = async () => {
            const recent = await window.ipcRenderer.invoke('get-recent-sessions', 50);
            const gamesLibrary = await window.ipcRenderer.invoke('get-games-library');

            setSessions(recent);
            setTopGames(gamesLibrary.slice(0, 5));
            setGamesCount(gamesLibrary.length);

            // Sum total playtime
            const total = gamesLibrary.reduce((acc: number, g: any) => acc + (g.totalSeconds || 0), 0);
            setTotalPlaytime(total);

            // Calculate weekly data from sessions
            const now = new Date();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const weekData: Record<string, number> = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                weekData[dayNames[d.getDay()]] = 0;
            }
            let weekSessions = 0;
            for (const session of recent) {
                const sessionDate = new Date(session.startTime);
                const daysAgo = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysAgo < 7) {
                    weekData[dayNames[sessionDate.getDay()]] += session.duration / 3600;
                    weekSessions++;
                }
            }
            setSessionsThisWeek(weekSessions);
            const orderedData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                orderedData.push({ name: dayNames[d.getDay()], hours: Math.round(weekData[dayNames[d.getDay()]] * 10) / 10 });
            }
            setWeeklyData(orderedData);
        };

        fetchSessions();

        // Listen for WoW data updates
        const listener = (_event: any, count: number) => {
            fetchSessions(); // Refresh data
            // Simple toast - we can make this better later
            const toast = document.createElement('div');
            toast.className = 'fixed bottom-4 right-4 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300';
            toast.innerHTML = `<div class="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Received data for ${count} WoW Characters!
            </div>`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        };

        window.ipcRenderer.on('wow-data-updated', listener);

        // Optional: Listen for updates if we added an event listener in main
        //For now, just fetch once. Or set an interval.
        const interval = setInterval(fetchSessions, 30000);
        return () => {
            clearInterval(interval);
            window.ipcRenderer.off('wow-data-updated', listener);
        };
    }, []);

    // Format duration helper
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="size-full overflow-y-auto pb-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Clock}
                    label="Total Playtime"
                    value={`${Math.floor(totalPlaytime / 3600).toLocaleString()}h`}
                    subtext="Across all games"
                    color="var(--primary)"
                    trend={12}
                />
                <StatCard
                    icon={Gamepad2}
                    label="Games Tracked"
                    value={gamesCount.toString()}
                    subtext="In your library"
                    color="var(--secondary)"
                    trend={2}
                />
                <StatCard
                    icon={Activity}
                    label="Sessions This Week"
                    value={sessionsThisWeek.toString()}
                    subtext="Last 7 days"
                    color="var(--accent)"
                    trend={sessionsThisWeek > 0 ? 5 : 0}
                />
                <StatCard
                    icon={Trophy}
                    label="Top Game"
                    value={topGames[0]?.gameName?.slice(0, 15) || 'N/A'}
                    subtext={topGames[0] ? formatDuration(topGames[0].totalSeconds) : 'Play some games!'}
                    color="#f8b700"
                    trend={topGames[0] ? 8 : 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Daily Activity Chart - Keep Mock for now or implement aggregation later */}
                <div className="lg:col-span-2 glass rounded-2xl p-6 relative overflow-hidden group">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-[var(--primary)]" />
                        Weekly Activity
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyData}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#525252" tick={{ fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#525252" tick={{ fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 15, 19, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                    }}
                                    itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hours"
                                    stroke="var(--primary)"
                                    fillOpacity={1}
                                    fill="url(#colorHours)"
                                    strokeWidth={4}
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass rounded-2xl p-6">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Trophy size={20} className="text-[#f8b700]" />
                        Top Games
                    </h3>
                    <div className="space-y-4">
                        {topGames.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No games tracked yet</p>
                        ) : (
                            topGames.map((game, idx) => (
                                <div key={game.gameName} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${idx === 0 ? 'bg-[#f8b700] text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white truncate">{game.gameName}</div>
                                        <div className="text-xs text-gray-400">{formatDuration(game.totalSeconds)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Sessions Table */}
            <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <History size={20} className="text-[var(--secondary)]" />
                    Recent Sessions
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-400 text-sm">
                                <th className="pb-3 pl-2">Game</th>
                                <th className="pb-3">Date</th>
                                <th className="pb-3">Duration</th>
                                <th className="pb-3">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">
                                        No sessions recorded yet. Play a game!
                                    </td>
                                </tr>
                            ) : (
                                sessions.slice(0, 10).map((session) => (
                                    <tr key={session.id} className="hover:bg-white/[0.03] transition-all group border-b border-transparent hover:border-white/5">
                                        <td className="py-4 pl-4 font-bold text-white group-hover:text-[var(--primary)] transition-colors">
                                            {session.gameName}
                                        </td>
                                        <td className="py-4 text-gray-400 font-medium">
                                            {new Date(session.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            <span className="ml-2 text-[10px] text-gray-600 font-bold uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded leading-none">
                                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-gray-200 font-mono font-bold text-sm bg-white/5 px-2 py-1 rounded-lg">
                                                {formatDuration(session.duration)}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4">
                                            <span className={clsx(
                                                "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                                                session.isManual
                                                    ? 'bg-yellow-500/5 text-yellow-500/80 border-yellow-500/20'
                                                    : 'bg-[var(--accent)]/5 text-[var(--accent)]/80 border-[var(--accent)]/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                            )}>
                                                {session.isManual ? 'Manual' : 'System'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, subtext, color, trend }: any) {
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
                {trend && (
                    <span className={clsx(
                        "text-[10px] font-black tracking-tighter px-2 py-1 rounded-lg bg-white/5 border border-white/10",
                        trend > 0 ? "text-green-400 border-green-400/20" : "text-gray-400 border-gray-400/20"
                    )}>
                        {trend > 0 ? `+${trend}%` : trend === 0 ? 'NEUTRAL' : `${trend}%`}
                    </span>
                )}
            </div>
            <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">{label}</p>
                <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
                <p className="text-[10px] text-gray-500 font-medium mt-1 truncate">{subtext}</p>
            </div>
        </div>
    );
}
