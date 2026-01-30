export { };

declare global {
    interface Window {
        ipcRenderer: {
            on(channel: string, listener: (event: any, ...args: any[]) => void): void;
            off(channel: string, ...args: any[]): void;
            send(channel: string, ...args: any[]): void;
            invoke(channel: 'get-recent-sessions', limit?: number): Promise<any[]>;
            invoke(channel: 'get-global-stats'): Promise<{ totalSeconds: number, totalSessions: number }>;
            invoke(channel: 'get-most-played', limit?: number): Promise<any[]>;
            invoke(channel: 'add-manual-session', gameName: string, durationSeconds: number): Promise<void>;
            invoke(channel: 'login-steam'): Promise<string | null>;
            invoke(channel: string, ...args: any[]): Promise<any>;
        };
    }
}
