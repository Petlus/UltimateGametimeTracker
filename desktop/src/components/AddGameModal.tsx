import { useState } from 'react';
import { X, Gamepad2, Clock, CheckCircle2, FileSearch } from 'lucide-react';

interface AddGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddGameModal({ isOpen, onClose, onSuccess }: AddGameModalProps) {
    const [name, setName] = useState('');
    const [hours, setHours] = useState('0');
    const [minutes, setMinutes] = useState('0');
    const [executableInfo, setExecutableInfo] = useState<{ path: string; executable: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handlePickFile = async () => {
        const result = await window.ipcRenderer.invoke('pick-game-executable');
        if (result.success) {
            setExecutableInfo({ path: result.path, executable: result.executable });
            if (!name) setName(result.defaultName);
        }
    };

    const handleSave = async () => {
        if (!name) return;
        setIsSaving(true);
        try {
            const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;

            // 1. Add as custom game
            await window.ipcRenderer.invoke('add-custom-game', {
                id: crypto.randomUUID(),
                name,
                executable: executableInfo?.executable || '',
                path: executableInfo?.path || ''
            });

            // 2. Add initial session if time > 0
            if (totalSeconds > 0) {
                await window.ipcRenderer.invoke('add-manual-session', name, totalSeconds);
            }

            onSuccess();
            handleClose();
        } catch (e) {
            console.error('Failed to save game', e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setName('');
        setHours('0');
        setMinutes('0');
        setExecutableInfo(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

            <div className="relative w-full max-w-md glass rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[var(--primary)] shadow-lg shadow-purple-500/20">
                            <Gamepad2 size={20} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Add New Game</h3>
                    </div>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Game Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Game Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Elden Ring"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                        />
                    </div>

                    {/* Previous Playtime */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                            <Clock size={14} />
                            Existing Playtime
                        </label>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                                />
                                <span className="text-[10px] text-gray-500 mt-1 block uppercase tracking-wider pl-1">Hours</span>
                            </div>
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                                />
                                <span className="text-[10px] text-gray-500 mt-1 block uppercase tracking-wider pl-1">Minutes</span>
                            </div>
                        </div>
                    </div>

                    {/* Executable Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Tracking Source</label>
                        {executableInfo ? (
                            <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={18} className="text-green-500" />
                                    <div>
                                        <div className="text-white text-sm font-medium">Executable Selected</div>
                                        <div className="text-xs text-gray-500 font-mono">{executableInfo.executable}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handlePickFile}
                                    className="text-xs text-[var(--primary)] hover:underline"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handlePickFile}
                                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/10 hover:border-[var(--primary)]/50 hover:bg-white/5 transition-all text-gray-400 hover:text-[var(--primary)]"
                            >
                                <FileSearch size={20} />
                                <span>Select .exe File</span>
                            </button>
                        )}
                        <p className="text-[10px] text-gray-500 mt-2 px-1">
                            Tracking will start automatically whenever this file is running.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name || isSaving}
                        className="flex-1 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSaving ? 'Saving...' : executableInfo ? 'Track Game' : 'Add Game'}
                    </button>
                </div>
            </div>
        </div>
    );
}
