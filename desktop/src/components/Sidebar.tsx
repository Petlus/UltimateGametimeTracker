import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Settings, Gamepad2, PlusCircle, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddGameModal } from './AddGameModal';
import clsx from 'clsx';

const baseNavItems = [
    { icon: Home, label: 'Overview', path: '/' },
    { icon: BarChart3, label: 'Stats', path: '/stats' },
    { icon: Gamepad2, label: 'Games', path: '/games' },
];

// WoW Icon Component
const WoWIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
    </svg>
);

export function Sidebar() {
    const [hasWoW, setHasWoW] = useState(false);
    const [hasLeague, setHasLeague] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if WoW is detected (either has characters or has path set)
        const checkWoW = async () => {
            const chars = await window.ipcRenderer.invoke('get-wow-characters');
            const path = await window.ipcRenderer.invoke('get-wow-path');
            setHasWoW((chars && chars.length > 0) || !!path);
        };

        const checkLeague = async () => {
            const stats = await window.ipcRenderer.invoke('get-riot-stats');
            setHasLeague(stats && (stats.lolCount > 0 || stats.tftCount > 0));
        };

        checkWoW();
        checkLeague();

        // Re-check when data updates
        const wowListener = () => checkWoW();
        const riotListener = () => checkLeague();
        window.ipcRenderer.on('wow-data-updated', wowListener);
        window.ipcRenderer.on('riot-data-updated', riotListener);
        return () => {
            window.ipcRenderer.off('wow-data-updated', wowListener);
            window.ipcRenderer.off('riot-data-updated', riotListener);
        };
    }, []);

    return (
        <aside className="w-64 h-screen glass border-r border-[var(--card-border)] flex flex-col p-4 fixed left-0 top-0 z-50">
            <div className="flex items-center gap-3 px-2 mb-12 mt-14 no-drag">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 shadow-[var(--neon-glow)] rounded-lg" />
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight text-white tracking-tight">ULTIMATE</span>
                    <span className="text-xs font-medium text-[var(--primary)] tracking-[0.2em] -mt-1 uppercase">Tracker</span>
                </div>
            </div>

            <nav className="flex-1 space-y-3">
                {baseNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                            isActive
                                ? "bg-[var(--card-hover)] text-white shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                                : "text-gray-400 hover:text-white hover:bg-[var(--card-hover)]"
                        )}
                    >
                        <item.icon size={20} className="group-hover:text-[var(--primary)] transition-colors" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}

                {/* WoW Link - Only shown when detected */}
                {hasWoW && (
                    <NavLink
                        to="/wow"
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                            isActive
                                ? "bg-gradient-to-r from-[#f8b700]/20 to-[#ff6b00]/20 text-[#f8b700] shadow-[0_0_10px_rgba(248,183,0,0.2)]"
                                : "text-gray-400 hover:text-[#f8b700] hover:bg-[var(--card-hover)]"
                        )}
                    >
                        <WoWIcon size={20} />
                        <span className="font-medium">World of Warcraft</span>
                    </NavLink>
                )}

                {hasLeague && (
                    <NavLink
                        to="/league"
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                            isActive
                                ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                : "text-gray-400 hover:text-cyan-400 hover:bg-[var(--card-hover)]"
                        )}
                    >
                        <Shield size={20} className="group-hover:text-cyan-500 transition-colors" />
                        <span className="font-medium">League of Legends</span>
                    </NavLink>
                )}

                {/* Settings at the end */}
                <NavLink
                    to="/settings"
                    className={({ isActive }) => clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                        isActive
                            ? "bg-[var(--card-hover)] text-white shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                            : "text-gray-400 hover:text-white hover:bg-[var(--card-hover)]"
                    )}
                >
                    <Settings size={20} className="group-hover:text-[var(--primary)] transition-colors" />
                    <span className="font-medium">Settings</span>
                </NavLink>
            </nav>

            <div className="mt-auto pt-4 border-t border-[var(--card-border)]">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/50 hover:bg-[var(--primary)] hover:text-white transition-all duration-300 shadow-[var(--neon-glow)] active:scale-95"
                >
                    <PlusCircle size={18} />
                    <span>Add Game</span>
                </button>
            </div>

            <AddGameModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    navigate('/games');
                }}
            />
        </aside>
    );
}
