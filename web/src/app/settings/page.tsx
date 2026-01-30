'use client';

import { useState } from 'react';
import { Save, Gamepad2 as Steam, Trash2 } from 'lucide-react';

export default function SettingsPage() {
    const [steamId, setSteamId] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [customGames, setCustomGames] = useState([
        { id: '1', name: 'My Indie Game', executable: 'mygame.exe' }
    ]);

    const handleSave = () => {
        // TODO: Server Action to save Steam ID
        console.log('Saving Steam ID:', steamId);
    };

    return (
        <div className="max-w-4xl space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>

            {/* Steam Integration */}
            <div className="glass p-8 rounded-2xl space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-900/30 rounded-full text-blue-400">
                        <Steam size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Steam Integration</h3>
                        <p className="text-gray-400 text-sm">Sync your library and playtime</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Steam ID 64</label>
                        <input
                            type="text"
                            value={steamId}
                            onChange={(e) => setSteamId(e.target.value)}
                            placeholder="76561198..."
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Web API Key (Optional)</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="****************"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg font-medium transition-all shadow-[var(--neon-glow)]"
                    >
                        <Save size={18} />
                        Save Configuration
                    </button>
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
