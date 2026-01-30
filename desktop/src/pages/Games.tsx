import { useState, useEffect } from 'react';
import { Gamepad2, Clock, Plus, Trash2 } from 'lucide-react';

interface GameStat {
    gameName: string;
    totalSeconds: number;
}

interface CustomGame {
    id: string;
    name: string;
    executable: string;
    path: string;
}

export function Games() {
    const [games, setGames] = useState<GameStat[]>([]);
    const [customGames, setCustomGames] = useState<CustomGame[]>([]);

    const fetchData = async () => {
        try {
            const [libraryData, customData] = await Promise.all([
                window.ipcRenderer.invoke('get-games-library'),
                window.ipcRenderer.invoke('get-custom-games')
            ]);
            setGames(libraryData);
            setCustomGames(customData);
        } catch (e) {
            console.error('Failed to fetch stats', e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handlePickGame = async () => {
        const result = await window.ipcRenderer.invoke('pick-game-executable');
        if (result.success) {
            fetchData();
        }
    };

    const handleRemoveCustom = async (id: string) => {
        await window.ipcRenderer.invoke('remove-custom-game', id);
        fetchData();
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="size-full pb-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-purple-800 shadow-lg shadow-purple-500/20">
                        <Gamepad2 size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">Games Library</h2>
                        <p className="text-gray-400">Your entire collection sorted by playtime</p>
                    </div>
                </div>
                <button
                    onClick={handlePickGame}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-purple-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Add Custom Game
                </button>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] bg-white/[0.02] border-b border-white/5">
                            <th className="py-5 pl-6 w-24">Rank</th>
                            <th className="py-5">Game Title</th>
                            <th className="py-5 text-right pr-10">Total Playtime</th>
                            <th className="py-5 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {games.map((game, index) => {
                            const customGame = customGames.find(cg => cg.name === game.gameName);
                            return (
                                <tr key={game.gameName} className="hover:bg-white/5 transition-colors group">
                                    <td className="py-5 pl-6">
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 shadow-lg text-white font-black text-sm tracking-tighter group-hover:bg-[var(--primary)] group-hover:border-[var(--primary)] transition-all duration-300">
                                            #{index + 1}
                                        </div>
                                    </td>
                                    <td className="py-5">
                                        <div className="font-black text-xl text-white group-hover:text-[var(--primary)] transition-all duration-300 tracking-tight">
                                            {game.gameName}
                                        </div>
                                        {game.gameName === 'World of Warcraft' ? (
                                            <div className="text-[10px] font-bold text-[var(--accent)] mt-1 flex items-center gap-1.5 uppercase tracking-widest opacity-80">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--accent)]" />
                                                Synced via Addon
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.1em] font-black opacity-60">
                                                {customGame
                                                    ? (customGame.executable ? 'Custom Tracked' : 'Manual Entry')
                                                    : 'Auto-Detected'
                                                }
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-5 pr-6 text-right">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[var(--primary)]/50 group-hover:bg-[var(--primary)]/5 transition-all duration-300">
                                            <Clock size={14} className="text-gray-400 group-hover:text-[var(--primary)] transition-colors" />
                                            <span className="font-black text-sm text-white tracking-tight">
                                                {formatDuration(game.totalSeconds)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 pr-6 text-right">
                                        {customGame && (
                                            <button
                                                onClick={() => handleRemoveCustom(customGame.id)}
                                                className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                title="Stop Tracking / Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {games.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-gray-500">
                                    No games tracked yet. Start playing!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
