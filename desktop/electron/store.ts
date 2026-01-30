import Store from 'electron-store';
import { randomUUID } from 'crypto';

interface CustomGame {
    id: string;
    name: string;
    executable: string; // "mygame.exe"
    path?: string;      // Full path if needed
    type: 'Launcher' | 'Standalone';
}

export interface PlaySession {
    id: string;
    gameName: string;
    startTime: string;
    durationSeconds: number;
    lastUpdated: string;
}

export interface WoWCharacter {
    id: string; // name-realm
    name: string;
    realm: string;
    class: string;
    level: number;
    totalTime: number; // seconds
    lastUpdated: number; // timestamp
    version?: string; // "Retail", "Classic", etc.
}

interface SteamGame {
    appid: number;
    name: string;
    playtimeMinutes: number;
    imgIconUrl?: string;
}

interface StoreSchema {
    customGames: CustomGame[];
    playSessions: PlaySession[];
    wowPath: string;
    wowCharacters: WoWCharacter[];
    steamApiKey: string;
    steamGames: SteamGame[];
    steamIds: string[];
    riotApiKey: string;
    riotPuuid: string;
    riotSummonerName: string;
    riotTagLine: string;
    riotRegion: 'euw1' | 'eun1' | 'na1' | 'kr' | 'br1' | 'la1' | 'la2' | 'jp1' | 'oc1' | 'tr1' | 'ru' | 'ph2' | 'sg2' | 'th2' | 'tw2' | 'vn2' | string;
    gog_ea_cookies?: any;
    gog_ubi_creds?: any;
    [key: string]: any; // Allow dynamic synced_time_* keys
}

const defaults: StoreSchema = {
    customGames: [],
    playSessions: [],
    wowPath: '',
    wowCharacters: [],
    steamApiKey: '',
    steamGames: [],
    steamIds: [],
    riotApiKey: '',
    riotPuuid: '',
    riotSummonerName: '',
    riotTagLine: '',
    riotRegion: 'euw1'
};

let internalStore: Store<StoreSchema> | null = null;

export function getStore() {
    if (!internalStore) {
        internalStore = new Store<StoreSchema>({ defaults });

        // Migration: Rename old version labels and deduplicate
        migrateWoWVersionLabels();
    }
    return internalStore;
}

// Migration function to update old version labels
function migrateWoWVersionLabels() {
    if (!internalStore) return;

    const chars = internalStore.get('wowCharacters', []);
    if (chars.length === 0) return;

    // Map old labels to new ones
    const labelMigrations: Record<string, string> = {
        'Cataclysm Classic': 'Mists of Pandaria Classic',
        'Cata Classic': 'Mists of Pandaria Classic',
        'Cataclysm': 'Mists of Pandaria Classic'
    };

    // Update labels
    const updatedChars = chars.map(char => {
        const newVersion = labelMigrations[char.version || ''] || char.version;
        return { ...char, version: newVersion };
    });

    // Deduplicate by name+realm+version (keep highest playtime)
    const charMap = new Map<string, WoWCharacter>();
    for (const char of updatedChars) {
        const key = `${char.name}-${char.realm}-${char.version || 'unknown'}`;
        const existing = charMap.get(key);
        if (!existing || char.totalTime > existing.totalTime) {
            charMap.set(key, char);
        }
    }

    const final = Array.from(charMap.values());

    if (final.length !== chars.length) {
        console.log(`[Store Migration] Migrated ${chars.length} → ${final.length} WoW characters (updated labels & deduped)`);
        internalStore.set('wowCharacters', final);
    }
}

export const getCustomGames = () => getStore().get('customGames', []);

export const addCustomGame = (game: CustomGame) => {
    const games = getCustomGames();
    if (!games.find(g => g.executable.toLowerCase() === game.executable.toLowerCase())) {
        getStore().set('customGames', [...games, game]);
    }
};

export const removeCustomGame = (id: string) => {
    const games = getCustomGames();
    getStore().set('customGames', games.filter(g => g.id !== id));
};

export const getSessions = () => getStore().get('playSessions', []);

export const logGameSession = (gameName: string, intervalSeconds: number) => {
    const sessions = getSessions();
    const now = new Date();

    // Find the most recent session for this game
    let lastSessionIndex = -1;
    for (let i = sessions.length - 1; i >= 0; i--) {
        if (sessions[i].gameName === gameName) {
            lastSessionIndex = i;
            break;
        }
    }

    let updated = false;
    if (lastSessionIndex !== -1) {
        const lastSession = sessions[lastSessionIndex];
        const lastUpdate = new Date(lastSession.lastUpdated);
        const diffSeconds = (now.getTime() - lastUpdate.getTime()) / 1000;

        // If the session was updated reasonably recently (within 2x interval), extend it
        if (diffSeconds < (intervalSeconds * 2.5)) {
            sessions[lastSessionIndex].durationSeconds += intervalSeconds;
            sessions[lastSessionIndex].lastUpdated = now.toISOString();
            updated = true;
        }
    }

    if (!updated) {
        sessions.push({
            id: randomUUID(),
            gameName,
            startTime: now.toISOString(),
            durationSeconds: intervalSeconds,
            lastUpdated: now.toISOString()
        });
    }

    getStore().set('playSessions', sessions);
};



export const getWoWPath = () => getStore().get('wowPath', '');
export const setWoWPath = (path: string) => getStore().set('wowPath', path);

export const getWoWCharacters = () => getStore().get('wowCharacters', []);
export const updateWoWCharacters = (newChars: WoWCharacter[]) => {
    // Merge instead of overwrite - use name+realm+version as unique key
    const existing = getWoWCharacters();
    const charMap = new Map<string, WoWCharacter>();

    // Add existing characters to map
    for (const char of existing) {
        const key = `${char.name}-${char.realm}-${char.version || 'unknown'}`;
        charMap.set(key, char);
    }

    // Merge new characters (update if exists, add if new)
    for (const char of newChars) {
        const key = `${char.name}-${char.realm}-${char.version || 'unknown'}`;
        const ex = charMap.get(key);
        // Keep the higher playtime value
        if (!ex || char.totalTime > ex.totalTime) {
            charMap.set(key, char);
        }
    }

    const merged = Array.from(charMap.values());
    console.log(`[WoW Store] Merged ${newChars.length} new chars with ${existing.length} existing = ${merged.length} total`);
    getStore().set('wowCharacters', merged);
};

export const getSteamApiKey = () => getStore().get('steamApiKey', '');
export const setSteamApiKey = (key: string) => getStore().set('steamApiKey', key);
export const getSteamGames = () => getStore().get('steamGames', []);
export const setSteamGames = (games: SteamGame[]) => getStore().set('steamGames', games);
export type { SteamGame };

export const getSteamIds = () => getStore().get('steamIds', []);
export const addSteamId = (id: string) => {
    const ids = getSteamIds();
    if (!ids.includes(id)) {
        getStore().set('steamIds', [...ids, id]);
    }
};
export const removeSteamId = (id: string) => {
    const ids = getSteamIds();
    getStore().set('steamIds', ids.filter(x => x !== id));
};

export default getStore;
