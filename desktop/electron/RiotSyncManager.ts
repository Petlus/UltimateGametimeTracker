import { ipcMain } from 'electron';
import { getStore } from './store';
import { saveRiotMatch, saveTftMatch } from './db';

const REGION_TO_ROUTING: Record<string, string> = {
    euw1: 'europe',
    eun1: 'europe',
    na1: 'americas',
    br1: 'americas',
    la1: 'americas',
    la2: 'americas',
    kr: 'asia',
    jp1: 'asia',
    ph2: 'sea',
    sg2: 'sea',
    th2: 'sea',
    tw2: 'sea',
    vn2: 'sea'
};

export class RiotSyncManager {
    static init() {
        ipcMain.handle('riot-sync-now', () => this.syncAll());
        ipcMain.handle('riot-get-puuid', (_, summonerName: string, tagLine: string) => this.resolvePuuid(summonerName, tagLine));

        // Sync every 2 hours
        setInterval(() => this.syncAll(), 1000 * 60 * 60 * 2);
    }

    private static getHeaders() {
        const apiKey = getStore().get('riotApiKey');
        return { "X-Riot-Token": apiKey };
    }

    private static getRouting() {
        const region = getStore().get('riotRegion') || 'euw1';
        return REGION_TO_ROUTING[region] || 'europe';
    }

    static async resolvePuuid(summonerName: string, tagLine: string) {
        const routing = this.getRouting();
        const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(summonerName)}/${encodeURIComponent(tagLine)}`;

        try {
            const resp = await fetch(url, { headers: this.getHeaders() });
            const data = await resp.json();
            if (data.puuid) {
                const store = getStore();
                store.set('riotPuuid', data.puuid);
                store.set('riotSummonerName', summonerName);
                store.set('riotTagLine', tagLine);
                return { success: true, puuid: data.puuid };
            }
            return { success: false, error: data.status?.message || 'Not found' };
        } catch (e) {
            return { success: false, error: String(e) };
        }
    }

    static async syncAll() {
        const puuid = getStore().get('riotPuuid');
        if (!puuid) return { success: false, error: 'No PUUID configured' };

        console.log(`[Riot Sync] Starting sync for ${puuid}...`);
        await this.syncMatches(puuid);
        return { success: true };
    }

    private static async syncMatches(puuid: string) {
        const routing = this.getRouting();
        // Fetch last 20 matches (mix of LoL and TFT depends on the endpoint, usually separate but account v1 matches can be used if they were merged, but actually we should use specific ones)

        // Match IDs for LoL
        await this.fetchAndProcessMatches(puuid, routing, 'lol');
        // Match IDs for TFT
        await this.fetchAndProcessMatches(puuid, routing, 'tft');
    }

    private static async fetchAndProcessMatches(puuid: string, routing: string, type: 'lol' | 'tft') {
        const prefix = type === 'tft' ? 'tft' : 'lol';
        const version = type === 'tft' ? 'v1' : 'v5';
        const url = `https://${routing}.api.riotgames.com/${prefix}/match/${version}/matches/by-puuid/${puuid}/ids?count=20`;

        try {
            const resp = await fetch(url, { headers: this.getHeaders() });
            const matchIds = await resp.json();
            if (!Array.isArray(matchIds)) return;

            for (const id of matchIds) {
                await this.fetchMatchDetail(id, routing, type);
            }
        } catch (e) {
            console.error(`[Riot Sync] Failed to fetch ${type} match IDs:`, e);
        }
    }

    private static async fetchMatchDetail(matchId: string, routing: string, type: 'lol' | 'tft') {
        const prefix = type === 'tft' ? 'tft' : 'lol';
        const version = type === 'tft' ? 'v1' : 'v5';
        const url = `https://${routing}.api.riotgames.com/${prefix}/match/${version}/matches/${matchId}`;

        try {
            const resp = await fetch(url, { headers: this.getHeaders() });
            const data = await resp.json();

            if (!data.info) return;

            const puuid = getStore().get('riotPuuid');
            const participant = data.info.participants.find((p: any) => p.puuid === puuid);
            if (!participant) return;

            if (type === 'lol') {
                saveRiotMatch({
                    id: matchId,
                    championId: participant.championId,
                    championName: participant.championName,
                    queueId: data.info.queueId,
                    timestamp: data.info.gameStartTimestamp || data.info.gameCreation,
                    duration: data.info.gameDuration,
                    win: participant.win
                });
            } else {
                saveTftMatch({
                    id: matchId,
                    placement: participant.placement,
                    traits: participant.traits?.filter((t: any) => t.tier_current > 0).map((t: any) => t.name) || [],
                    units: participant.units?.map((u: any) => u.character_id) || [],
                    queueId: data.info.queueId,
                    timestamp: data.info.game_datetime || data.info.gameStartTimestamp,
                    duration: data.info.game_length || data.info.gameDuration
                });
            }
        } catch (e) {
            console.error(`[Riot Sync] Failed to fetch match detail ${matchId}:`, e);
        }
    }
}
