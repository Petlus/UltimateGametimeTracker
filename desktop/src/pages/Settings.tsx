import { useState, useEffect } from 'react';
import { Gamepad2 as Steam, Trash2, History as HistoryIcon, Plus, Save, Shield } from 'lucide-react';

export function Settings() {
    const [steamIds, setSteamIds] = useState<string[]>([]);
    const [steamApiKey, setSteamApiKey] = useState<string>('');
    const [riotConfig, setRiotConfig] = useState({
        apiKey: '',
        summonerName: '',
        tagLine: '',
        region: 'euw1',
        puuid: ''
    });

    // Load data from backend on mount
    useEffect(() => {
        const loadData = async () => {
            const ids = await window.ipcRenderer.invoke('get-steam-ids');
            const key = await window.ipcRenderer.invoke('get-steam-api-key');
            setSteamIds(ids || []);
            setSteamApiKey(key || '');

            const riot = await window.ipcRenderer.invoke('get-riot-config');
            if (riot) setRiotConfig(riot);
        };
        loadData();
    }, []);

    const [customGames, setCustomGames] = useState([
        { id: '1', name: 'My Indie Game', executable: 'mygame.exe' }
    ]);

    const handleLogin = async () => {
        const id = await window.ipcRenderer.invoke('login-steam');
        if (id && !steamIds.includes(id)) {
            await window.ipcRenderer.invoke('add-steam-id', id);
            setSteamIds([...steamIds, id]);
        }
    };

    const handleRemoveSteamId = async (id: string) => {
        await window.ipcRenderer.invoke('remove-steam-id', id);
        setSteamIds(steamIds.filter(x => x !== id));
    };

    const handleSaveApiKey = async () => {
        await window.ipcRenderer.invoke('set-steam-api-key', steamApiKey);
        alert('API Key saved! Auto-sync will now work on startup.');
    };

    useEffect(() => {
        // Load current WoW Path
        window.ipcRenderer.invoke('get-wow-path').then((path: string) => {
            const el = document.getElementById('current-wow-path');
            const input = document.getElementById('wow-path-input') as HTMLInputElement;
            if (el) el.innerText = path || 'Not Set';
            if (input && path) input.value = path;
        });
    }, []);

    return (
        <div className="max-w-4xl space-y-8">
            <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>

            {/* History Import */}
            <div className="glass p-8 rounded-2xl space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-[var(--accent)]/10 rounded-full text-[var(--accent)]">
                        <HistoryIcon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Import History</h3>
                        <p className="text-gray-400 text-sm">Manually add previous playtimes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input id="manual-game-name" placeholder="Game Name (e.g. League of Legends)" className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[var(--accent)] outline-none" />
                    <div className="flex gap-2">
                        <input id="manual-hours" type="number" placeholder="Hours" className="bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[var(--accent)] outline-none w-32" />
                        <button
                            onClick={async () => {
                                const nameInput = document.getElementById('manual-game-name') as HTMLInputElement;
                                const hoursInput = document.getElementById('manual-hours') as HTMLInputElement;

                                if (nameInput.value && hoursInput.value) {
                                    const hours = parseInt(hoursInput.value);
                                    const seconds = hours * 3600;
                                    await window.ipcRenderer.invoke('add-manual-session', nameInput.value, seconds);
                                    alert(`Added ${hours} hours for ${nameInput.value}`);
                                    nameInput.value = '';
                                    hoursInput.value = '';
                                }
                            }}
                            className="flex-1 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg font-medium transition-all shadow-[var(--neon-glow)]"
                        >
                            Import Time
                        </button>
                    </div>
                </div>
            </div>

            {/* Steam Integration */}
            <div className="glass p-8 rounded-2xl space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-[#171a21] rounded-full text-white">
                        <Steam size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Steam Integration</h3>
                        <p className="text-gray-400 text-sm">Sync your library and playtime</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {/* List Connected Accounts */}
                    {steamIds.map(id => (
                        <div key={id} className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <div className="flex-1">
                                <p className="text-green-400 font-medium">Connected</p>
                                <p className="text-xs text-green-500/60">Steam ID: {id}</p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!steamApiKey) {
                                        alert('Please enter and save your Steam API Key first!');
                                        return;
                                    }
                                    const result = await window.ipcRenderer.invoke('fetch-steam-games', id, steamApiKey);
                                    if (result.success) {
                                        alert(`Synced ${result.count} games from this account!`);
                                    } else {
                                        alert(`Sync failed: ${result.error}`);
                                    }
                                }}
                                className="px-3 py-1.5 bg-[var(--primary)]/20 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Sync Games
                            </button>
                            <button onClick={() => handleRemoveSteamId(id)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {/* Steam API Key Input */}
                    <div className="flex gap-3">
                        <input
                            value={steamApiKey}
                            onChange={(e) => setSteamApiKey(e.target.value)}
                            type="password"
                            placeholder="Steam Web API Key (from steamcommunity.com/dev/apikey)"
                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[var(--primary)] outline-none text-sm"
                        />
                        <button
                            onClick={handleSaveApiKey}
                            className="px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                            <Save size={16} />
                            Save Key
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">
                        Get your API key from <a href="https://steamcommunity.com/dev/apikey" target="_blank" className="text-[var(--primary)] hover:underline">steamcommunity.com/dev/apikey</a>. Games will auto-sync on startup and every 30 minutes.
                    </p>

                    {/* Add Account Button */}
                    <button
                        onClick={handleLogin}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-[#171a21] hover:bg-[#2a475e] text-white rounded-xl font-bold transition-all shadow-lg group border border-white/5 hover:border-white/10"
                    >
                        <Plus size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                        <span className="text-gray-300 group-hover:text-white">Add Steam Account</span>
                    </button>
                </div>
            </div>

            {/* EA & Ubisoft Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* EA Integration */}
                <div className="glass p-8 rounded-2xl space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#ff4747]/10 rounded-full text-[#ff4747]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">EA / Origin</h3>
                            <p className="text-gray-400 text-sm">Sync playtime from EA Desktop</p>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            const success = await window.ipcRenderer.invoke('gog-login-ea');
                            if (success) alert('EA Account connected!');
                        }}
                        className="w-full py-4 bg-[#ff4747]/10 hover:bg-[#ff4747]/20 border border-[#ff4747]/50 text-[#ff4747] rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        Connect EA Account
                    </button>
                </div>

                {/* Ubisoft Integration */}
                <div className="glass p-8 rounded-2xl space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#00ffff]/10 rounded-full text-[#00ffff]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Ubisoft Connect</h3>
                            <p className="text-gray-400 text-sm">Sync playtime via GOG Bridge</p>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            const success = await window.ipcRenderer.invoke('gog-login-ubi');
                            if (success) alert('Ubisoft Account connected!');
                        }}
                        className="w-full py-4 bg-[#00ffff]/10 hover:bg-[#00ffff]/20 border border-[#00ffff]/50 text-[#00ffff] rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        Connect Ubisoft Account
                    </button>
                </div>
            </div>

            {/* Sync Status / Manual Trigger */}
            <div className="glass p-6 rounded-2xl flex items-center justify-between border border-[var(--primary)]/20">
                <div>
                    <h4 className="text-white font-bold">Sync Management</h4>
                    <p className="text-gray-400 text-xs text-wrap max-w-md">GOG Bridge syncs automatically every hour. You can trigger it manually here.</p>
                </div>
                <button
                    onClick={async () => {
                        await window.ipcRenderer.invoke('gog-sync-all');
                        alert('Sync started in background!');
                    }}
                    className="px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-white rounded-lg font-bold transition-all"
                >
                    Sync All Now
                </button>
            </div>

            {/* Riot Games Integration */}
            <div className="glass p-8 rounded-2xl space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-400">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Riot Games (LoL & TFT)</h3>
                        <p className="text-gray-400 text-sm">Sync your match history and champion stats</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Riot Client API Key</label>
                        <input
                            type="password"
                            placeholder="RGAPI-..."
                            value={riotConfig.apiKey}
                            onChange={(e) => setRiotConfig({ ...riotConfig, apiKey: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Region</label>
                        <select
                            value={riotConfig.region}
                            onChange={(e) => setRiotConfig({ ...riotConfig, region: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none text-sm appearance-none"
                        >
                            <option value="euw1">EU West</option>
                            <option value="eun1">EU Nordic & East</option>
                            <option value="na1">North America</option>
                            <option value="kr">Korea</option>
                            <option value="br1">Brazil</option>
                            <option value="jp1">Japan</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Game Name</label>
                        <input
                            placeholder="SummonerName"
                            value={riotConfig.summonerName}
                            onChange={(e) => setRiotConfig({ ...riotConfig, summonerName: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Tagline</label>
                        <input
                            placeholder="#EUW"
                            value={riotConfig.tagLine}
                            onChange={(e) => setRiotConfig({ ...riotConfig, tagLine: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={async () => {
                            await window.ipcRenderer.invoke('set-riot-config', riotConfig);
                            const res = await window.ipcRenderer.invoke('riot-get-puuid', riotConfig.summonerName, riotConfig.tagLine.startsWith('#') ? riotConfig.tagLine.substring(1) : riotConfig.tagLine);
                            if (res.success) {
                                alert('Success! Account linked.');
                                setRiotConfig({ ...riotConfig, puuid: res.puuid });
                            } else {
                                if (res.error?.includes('403')) {
                                    alert('Forbidden (403): Your Riot API Key likely expired. Development keys expire every 24h. Please regenerate it on the Riot Developer Portal.');
                                } else {
                                    alert('Error: ' + res.error);
                                }
                            }
                        }}
                        className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        Verify & Link Account
                    </button>
                    <button
                        onClick={async () => {
                            await window.ipcRenderer.invoke('riot-sync-now');
                            alert('Riot Sync started!');
                        }}
                        disabled={!riotConfig.puuid}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Sync Now
                    </button>
                </div>
                {!riotConfig.puuid && (
                    <p className="text-center text-xs text-yellow-500/80 font-bold bg-yellow-500/5 py-2 rounded-lg border border-yellow-500/10">
                        Please link your account to enable match tracking.
                    </p>
                )}
            </div>

            {/* World of Warcraft Integration */}
            <div className="glass p-8 rounded-2xl space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">World of Warcraft</h3>
                        <p className="text-gray-400 text-sm">Track /played across all characters</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                        To track playtime, we need to install a small bridge addon into your WoW folder (Retail or Classic).
                    </p>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={async () => {
                                const result = await window.ipcRenderer.invoke('install-wow-addon');
                                if (result.success) {
                                    alert('Addon Installed Successfully! \nPlease type /reload in WoW to start tracking.');
                                    window.location.reload();
                                } else if (result.message !== 'Cancelled') {
                                    alert('Error: ' + result.message);
                                }
                            }}
                            className="w-full py-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Auto-Install Addon
                        </button>

                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                id="wow-path-input"
                                placeholder="Manually set path (optional)..."
                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 text-sm"
                                onChange={(e) => window.ipcRenderer.invoke('set-wow-path', e.target.value)}
                            />
                            <button
                                onClick={async () => {
                                    const res = await window.ipcRenderer.invoke('debug-wow-scan');
                                    alert('Scan Results:\n' + res.logs.join('\n'));
                                    window.location.reload();
                                }}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm border border-white/10"
                            >
                                🩺 Debug Scan
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Current Path: <span id="current-wow-path" className="font-mono text-gray-400">Loading...</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Games Manager */}
            <div className="glass p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-6">Custom Games</h3>

                <div className="space-y-4">
                    {customGames.map((game) => (
                        <div key={game.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div>
                                <h4 className="font-bold text-white">{game.name}</h4>
                                <code className="text-sm text-gray-400 bg-black/30 px-2 py-0.5 rounded">{game.executable}</code>
                            </div>
                            <button
                                onClick={() => setCustomGames(customGames.filter(g => g.id !== game.id))}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    <button className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm font-medium">
                        + Add New manually tracked game
                    </button>
                </div>
            </div>
        </div>
    );
}
