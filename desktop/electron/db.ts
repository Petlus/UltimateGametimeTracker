import Store from 'electron-store';

interface Session {
    id: number;
    gameName: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    duration: number;  // seconds
    isManual: boolean;
}

interface RiotMatch {
    id: string;
    championId: number;
    championName: string;
    queueId: number;
    timestamp: number;
    duration: number;
    win: boolean;
}

interface TftMatch {
    id: string;
    placement: number;
    traits: string[];
    units: string[];
    queueId: number;
    timestamp: number;
    duration: number;
}

interface DataSchema {
    sessions: Session[];
    riotMatches: RiotMatch[];
    tftMatches: TftMatch[];
}

let store: Store<DataSchema> | null = null;

// Lazy init helper
function getStore() {
    if (!store) {
        console.log('[DB] Initializing Store...');
        store = new Store<DataSchema>({
            name: 'gametime-data',
            defaults: {
                sessions: [],
                riotMatches: [],
                tftMatches: []
            }
        });
    }
    return store;
}

export function initDB() {
    return getStore();
}

export function saveSession(gameName: string, startTime: string, endTime: string, duration: number, isManual: boolean = false) {
    const s = getStore();
    const sessions = s.get('sessions');
    const newSession: Session = {
        id: Date.now(), // Simple unique ID
        gameName,
        startTime,
        endTime,
        duration,
        isManual
    };
    s.set('sessions', [newSession, ...sessions]);
}

export function addManualSession(gameName: string, durationSeconds: number) {
    const now = new Date();
    const start = new Date(now.getTime() - (durationSeconds * 1000));
    saveSession(gameName, start.toISOString(), now.toISOString(), durationSeconds, true);
}

export function getRecentSessions(limit: number = 50) {
    return getStore().get('sessions').slice(0, limit);
}

export function getGlobalStats() {
    const sessions = getStore().get('sessions') || [];
    const totalSeconds = sessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    return {
        totalSeconds,
        totalSessions: sessions.length
    };
}

export function getMostPlayedGames(limit: number = 5) {
    const sessions = getStore().get('sessions') || [];
    const gameMap = new Map<string, number>();

    for (const s of sessions) {
        const current = gameMap.get(s.gameName) || 0;
        gameMap.set(s.gameName, current + (s.duration || 0));
    }

    const sorted = Array.from(gameMap.entries())
        .map(([gameName, totalSeconds]) => ({ gameName, totalSeconds }))
        .sort((a, b) => b.totalSeconds - a.totalSeconds)
        .slice(0, limit);

    return sorted;
}

export function getAllGames() {
    const sessions = getStore().get('sessions') || [];
    const gameMap = new Map<string, number>();

    for (const s of sessions) {
        const current = gameMap.get(s.gameName) || 0;
        gameMap.set(s.gameName, current + (s.duration || 0));
    }

    const sorted = Array.from(gameMap.entries())
        .map(([gameName, totalSeconds]) => ({ gameName, totalSeconds }))
        .sort((a, b) => b.totalSeconds - a.totalSeconds);

    return sorted;
}

export function saveRiotMatch(match: RiotMatch) {
    const s = getStore();
    const matches = s.get('riotMatches') || [];
    if (!matches.find(m => m.id === match.id)) {
        s.set('riotMatches', [match, ...matches]);
    }
}

export function saveTftMatch(match: TftMatch) {
    const s = getStore();
    const matches = s.get('tftMatches') || [];
    if (!matches.find(m => m.id === match.id)) {
        s.set('tftMatches', [match, ...matches]);
    }
}

export function getTopChampions(limit: number = 5) {
    const matches = getStore().get('riotMatches') || [];
    const champMap = new Map<string, number>();

    for (const m of matches) {
        const current = champMap.get(m.championName) || 0;
        champMap.set(m.championName, current + m.duration);
    }

    return Array.from(champMap.entries())
        .map(([name, duration]) => ({ name, duration }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, limit);
}

export function getRiotStats() {
    const lolMatches = getStore().get('riotMatches') || [];
    const tftMatches = getStore().get('tftMatches') || [];

    const lolSeconds = lolMatches.reduce((acc, m) => acc + m.duration, 0);
    const tftSeconds = tftMatches.reduce((acc, m) => acc + m.duration, 0);

    return {
        lolSeconds,
        tftSeconds,
        lolCount: lolMatches.length,
        tftCount: tftMatches.length
    };
}
