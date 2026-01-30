import { exec } from 'child_process';
import { promisify } from 'util';
import { getCustomGames } from './store';
import { saveSession } from './db';
import { RiotSyncManager } from './RiotSyncManager';

const execAsync = promisify(exec);

// Mapping of Executable Name (lowercase) -> Game Name
const SUPPORTED_GAMES: Record<string, string> = {
    'wow.exe': 'World of Warcraft',
    'leagueclient.exe': 'League of Legends',
    'cs2.exe': 'Counter-Strike 2',
    'valorant.exe': 'Valorant',
    'overwatch.exe': 'Overwatch 2',
    'dota2.exe': 'Dota 2',
    'minecraft.exe': 'Minecraft',
    'javaw.exe': 'Minecraft (Java)',
};

interface ActiveSession {
    gameName: string;
    startTime: Date;
}

export class ProcessWatcher {
    private intervalId: NodeJS.Timeout | null = null;
    private isScanning = false;
    private activeSessions: Map<string, ActiveSession> = new Map();

    constructor(private intervalMs: number = 60000) { }

    start() {
        if (this.intervalId) return;
        console.log('[Watcher] Starting process monitoring...');
        this.checkProcesses();
        this.intervalId = setInterval(() => this.checkProcesses(), this.intervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('[Watcher] Stopped process monitoring.');
    }

    private async checkProcesses() {
        if (this.isScanning) return;
        this.isScanning = true;

        try {
            // Use wmic to get full paths on Windows for accurate matching
            const { stdout } = await execAsync('wmic process get ExecutablePath,Name /FORMAT:CSV');
            const runningProcesses = this.parseProcessList(stdout);
            const detectedGames = this.detectGames(runningProcesses);

            this.handleStateChanges(detectedGames);
        } catch (error) {
            console.error('[Watcher] Error checking processes:', error);
        } finally {
            this.isScanning = false;
        }
    }

    private parseProcessList(output: string): { name: string, path: string }[] {
        const lines = output.split('\r\n');
        const processes: { name: string, path: string }[] = [];

        for (const line of lines) {
            if (!line.trim() || line.startsWith('Node,')) continue;

            const parts = line.split(',');
            if (parts.length >= 3) {
                const fullPath = parts[1].trim();
                const name = parts[2].trim().toLowerCase();
                if (name) {
                    processes.push({ name, path: fullPath.toLowerCase() });
                }
            }
        }
        return processes;
    }

    private detectGames(runningProcesses: { name: string, path: string }[]): string[] {
        const detected = new Set<string>();
        const customGames = getCustomGames();

        for (const proc of runningProcesses) {
            // 1. Check predefined games (by executable name)
            if (SUPPORTED_GAMES[proc.name]) {
                detected.add(SUPPORTED_GAMES[proc.name]);
            }

            // 2. Check custom games (priority on Path, fallback to name)
            for (const custom of customGames) {
                if (!custom.executable) continue; // Skip if no executable for auto-tracking

                const customExec = custom.executable.toLowerCase();
                const customPath = custom.path?.toLowerCase();

                if (customPath && proc.path === customPath) {
                    detected.add(custom.name);
                } else if (!customPath && proc.name === customExec) {
                    detected.add(custom.name);
                }
            }
        }

        return Array.from(detected);
    }

    private handleStateChanges(currentDetectedGames: string[]) {
        const timestamp = new Date();
        const currentSet = new Set(currentDetectedGames);

        // 1. Detect STARTED games
        for (const game of currentDetectedGames) {
            if (!this.activeSessions.has(game)) {
                console.log(`[Watcher] Game Started: ${game}`);
                this.activeSessions.set(game, {
                    gameName: game,
                    startTime: timestamp
                });
            }
        }

        // 2. Detect STOPPED games
        for (const [game, session] of this.activeSessions.entries()) {
            if (!currentSet.has(game)) {
                console.log(`[Watcher] Game Stopped: ${game}`);

                // Calculate duration
                const endTime = timestamp;
                const durationSeconds = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000);

                // Save to DB
                saveSession(
                    session.gameName,
                    session.startTime.toISOString(),
                    endTime.toISOString(),
                    durationSeconds
                );

                if (session.gameName === 'League of Legends') {
                    RiotSyncManager.syncAll().catch(e => console.error('[Watcher] Riot Sync Error:', e));
                }

                this.activeSessions.delete(game);
            }
        }
    }
}

export const processWatcher = new ProcessWatcher(10000); // 10s interval for better precision
