import { Minus, Square, X } from 'lucide-react';

export function TitleBar() {
    const handleMinimize = () => window.ipcRenderer.minimize();
    const handleMaximize = () => window.ipcRenderer.maximize();
    const handleClose = () => window.ipcRenderer.close();

    return (
        <div className="titlebar h-10 bg-[var(--background)] border-b border-white/5 flex items-center justify-between px-4 select-none fixed top-0 left-0 right-0 z-[100]">
            {/* Draggable area */}
            <div className="flex-1 flex items-center gap-3 h-full drag-region">
                <img src="/logo.png" alt="Logo" className="w-5 h-5" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ultimate Gametime Tracker</span>
            </div>

            {/* Window controls */}
            <div className="flex items-center no-drag h-full">
                <button
                    onClick={handleMinimize}
                    className="h-full px-4 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    title="Minimize"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={handleMaximize}
                    className="h-full px-4 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    title="Maximize"
                >
                    <Square size={14} />
                </button>
                <button
                    onClick={handleClose}
                    className="h-full px-4 text-gray-400 hover:bg-red-500/80 hover:text-white transition-colors"
                    title="Close"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
