import Link from 'next/link';
import { Home, BarChart3, Settings, Gamepad2, PlusCircle } from 'lucide-react';

const navItems = [
    { icon: Home, label: 'Overview', href: '/' },
    { icon: BarChart3, label: 'Stats', href: '/stats' },
    { icon: Gamepad2, label: 'Games', href: '/games' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    return (
        <aside className="w-64 h-screen glass border-r border-[var(--card-border)] flex flex-col p-4 fixed left-0 top-0">
            <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-[var(--neon-glow)]">
                    <Gamepad2 size={18} className="text-white" />
                </div>
                <h1 className="font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    GameTime
                </h1>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-[var(--card-hover)] transition-all duration-200 group"
                    >
                        <item.icon size={20} className="group-hover:text-[var(--primary)] transition-colors" />
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-[var(--card-border)]">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/50 hover:bg-[var(--primary)] hover:text-white transition-all duration-300 shadow-[var(--neon-glow)]">
                    <PlusCircle size={18} />
                    <span>Add Game</span>
                </button>
            </div>
        </aside>
    );
}
