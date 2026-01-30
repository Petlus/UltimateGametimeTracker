import { useState, useEffect } from 'react';
import { Download, RefreshCw, Users, Clock } from 'lucide-react';

interface WoWCharacter {
    name: string;
    realm: string;
    totalTime: number;
    class?: string;
    level?: number;
    version?: string;
}

export function WoW() {
    const [characters, setCharacters] = useState<WoWCharacter[]>([]);
    const [wowPath, setWowPath] = useState<string>('');
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const chars = await window.ipcRenderer.invoke('get-wow-characters');
            const path = await window.ipcRenderer.invoke('get-wow-path');
            setCharacters(chars || []);
            setWowPath(path || '');
        };
        fetchData();

        // Listen for updates
        const listener = () => fetchData();
        window.ipcRenderer.on('wow-data-updated', listener);
        return () => {
            window.ipcRenderer.off('wow-data-updated', listener);
        };
    }, []);

    const formatDuration = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h ${minutes}m`;
    };

    const totalPlaytime = characters.reduce((acc, c) => acc + c.totalTime, 0);

    const handleInstallAddon = async () => {
        setInstalling(true);
        const result = await window.ipcRenderer.invoke('install-wow-addon');
        setInstalling(false);
        if (result.success) {
            alert(`Addon installed successfully!\n\n${result.message}`);
            // Refresh path
            const path = await window.ipcRenderer.invoke('get-wow-path');
            setWowPath(path || '');
        } else {
            alert(`Installation failed: ${result.message}`);
        }
    };

    // Group characters by version
    const charsByVersion = characters.reduce((acc, char) => {
        const version = char.version || 'Unknown';
        if (!acc[version]) acc[version] = [];
        acc[version].push(char);
        return acc;
    }, {} as Record<string, WoWCharacter[]>);

    return (
        <div className="size-full overflow-y-auto pb-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-[#f8b700] to-[#ff6b00] shadow-lg shadow-orange-500/20">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                            <path d="M2 12h20" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">World of Warcraft</h2>
                        <p className="text-gray-400">Track /played across all your characters</p>
                    </div>
                </div>

                <button
                    onClick={handleInstallAddon}
                    disabled={installing}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#f8b700] to-[#ff6b00] hover:from-[#ffcc00] hover:to-[#ff8800] text-black font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50"
                >
                    {installing ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                    {installing ? 'Installing...' : 'Install Addon'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users size={20} className="text-[var(--primary)]" />
                        <span className="text-gray-400">Characters</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{characters.length}</div>
                </div>
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock size={20} className="text-[var(--accent)]" />
                        <span className="text-gray-400">Total Playtime</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{formatDuration(totalPlaytime)}</div>
                </div>
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span className="text-gray-400">Addon Status</span>
                    </div>
                    <div className="text-lg font-bold text-white">
                        {wowPath ? (
                            <span className="text-green-400">Installed</span>
                        ) : (
                            <span className="text-yellow-400">Not Installed</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Characters by Version */}
            {Object.keys(charsByVersion).length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">🐺</div>
                    <h3 className="text-xl font-bold text-white mb-2">No Characters Found</h3>
                    <p className="text-gray-400 mb-6">Install the addon and log into WoW to sync your /played time</p>
                    <button
                        onClick={handleInstallAddon}
                        disabled={installing}
                        className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white font-bold rounded-xl transition-all"
                    >
                        Install Addon Now
                    </button>
                </div>
            ) : (
                Object.entries(charsByVersion).map(([version, chars]) => {
                    const versionTotal = chars.reduce((acc, c) => acc + c.totalTime, 0);
                    return (
                        <div key={version} className="mb-8">
                            <h3 className="text-lg font-bold text-[#f8b700] mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#f8b700]" />
                                {version}
                                <span className="text-white font-mono">— {formatDuration(versionTotal)}</span>
                                <span className="text-gray-500 font-normal text-sm">({chars.length} characters)</span>
                            </h3>
                            <div className="glass rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-gray-400 text-sm uppercase tracking-wider bg-white/5">
                                            <th className="py-3 pl-6">Character</th>
                                            <th className="py-3">Realm</th>
                                            <th className="py-3">Class</th>
                                            <th className="py-3">Level</th>
                                            <th className="py-3 text-right pr-6">Playtime</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {chars.sort((a, b) => b.totalTime - a.totalTime).map((char) => (
                                            <tr key={`${char.name}-${char.realm}`} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 pl-6 font-bold text-white">{char.name}</td>
                                                <td className="py-3 text-gray-400">{char.realm}</td>
                                                <td className="py-3 text-gray-400">{char.class || '-'}</td>
                                                <td className="py-3 text-gray-400">{char.level || '-'}</td>
                                                <td className="py-3 text-right pr-6">
                                                    <span className="font-mono font-bold text-[#f8b700]">
                                                        {formatDuration(char.totalTime)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
