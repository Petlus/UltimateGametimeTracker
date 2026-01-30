import fs from 'fs';
import path from 'path';
import { BrowserWindow } from 'electron';
import { updateWoWCharacters, WoWCharacter, getWoWPath, getWoWCharacters } from './store';

let watcher: fs.FSWatcher | null = null;
let debounceTimer: NodeJS.Timeout | null = null;

const COMMON_PATHS = [
    'C:\\Program Files (x86)\\World of Warcraft',
    'C:\\Program Files\\World of Warcraft',
    'C:\\World of Warcraft',
    'D:\\World of Warcraft'
];

export function startWoWWatcher() {
    let wowPath = getWoWPath();

    if (!wowPath) {
        for (const p of COMMON_PATHS) {
            if (fs.existsSync(p)) {
                console.log(`[WoW] Auto-discovered WoW path: ${p}`);
                wowPath = p;
                break;
            }
        }
    }

    if (!wowPath || !fs.existsSync(wowPath)) {
        console.log('[WoW] Path not configured. Please set it in Settings to enable tracking.');
        return;
    }

    console.log(`[WoW] Starting watcher on: ${wowPath}`);

    try {
        if (watcher) watcher.close();

        watcher = fs.watch(wowPath, { recursive: true }, (_eventType, filename) => {
            if (filename && (filename.endsWith('UltimateGametimeTracker.lua') || filename.endsWith('PlaytimeTracker.lua'))) {
                // Debounce
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const fullPath = path.join(wowPath, filename);
                    console.log(`[WoW] Detected change in: ${filename}`);
                    parseLuaFile(fullPath);
                }, 1000);
            }
        });
    } catch (e) {
        console.error('[WoW] Failed to start watcher:', e);
    }

    // Initial scan
    scanForLuaFiles(wowPath);
}

function scanForLuaFiles(dir: string) {
    try {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const res = path.resolve(dir, file.name);
            if (file.isDirectory()) {
                // Determine if we should scan this directory
                if (file.name === 'WTF' || file.name === 'Account' || file.name === 'SavedVariables' || res.includes('WTF')) {
                    scanForLuaFiles(res);
                } else if (res.endsWith('_retail_') || res.endsWith('_classic_') || res.endsWith('_classic_era_') || res.endsWith('_anniversary_') || res.endsWith('_ptr_')) {
                    scanForLuaFiles(res);
                }
            } else if (file.name === 'UltimateGametimeTracker.lua' || file.name === 'PlaytimeTracker.lua') {
                parseLuaFile(res);
            }
        }
    } catch (e) {
        // ignore access errors
    }
}

function parseLuaFile(filePath: string) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log(`[WoW] Parsing file: ${filePath}`);

        // Determine Version from Path
        let version = 'Retail'; // Default
        if (filePath.includes('_retail_')) version = 'Retail';
        else if (filePath.includes('_classic_era_')) version = 'Classic Era';
        else if (filePath.includes('_anniversary_')) version = 'Anniversary Edition';
        else if (filePath.includes('_classic_')) version = 'Mists of Pandaria Classic';
        else if (filePath.includes('_ptr_')) version = 'PTR';

        // Regex to match the UGTT_Data table items
        const regex = /\["(.*?)"\]\s*=\s*\{([^}]*)\}/g;
        let match;
        const characters: WoWCharacter[] = [];

        while ((match = regex.exec(content)) !== null) {
            const id = match[1];
            const dataBlock = match[2];

            // Extract fields from the data block (UGTT Format)
            const totalSecondsMatch = dataBlock.match(/\["totalSeconds"\]\s*=\s*(\d+)/);
            const levelMatch = dataBlock.match(/\["level"\]\s*=\s*(\d+)/);
            const classMatch = dataBlock.match(/\["class"\]\s*=\s*"(.*?)"/);
            const nameMatch = dataBlock.match(/\["name"\]\s*=\s*"(.*?)"/);
            const realmMatch = dataBlock.match(/\["realm"\]\s*=\s*"(.*?)"/);

            // Legacy / Fallback Matches
            const totalTimeLegacy = dataBlock.match(/\["totalTime"\]\s*=\s*(\d+)/);

            const totalTime = totalSecondsMatch ? parseInt(totalSecondsMatch[1]) : (totalTimeLegacy ? parseInt(totalTimeLegacy[1]) : 0);

            if (totalTime > 0) {
                // Try to parse name/realm from ID if not in fields
                let name = nameMatch ? nameMatch[1] : id.split('-')[0];
                let realm = realmMatch ? realmMatch[1] : (id.includes('-') ? id.split('-')[1] : 'Unknown');

                // Clean quotes if present
                name = name.replace(/"/g, '');
                realm = realm.replace(/"/g, '');

                characters.push({
                    id: id,
                    name: name,
                    realm: realm,
                    class: classMatch ? classMatch[1] : 'Unknown',
                    level: levelMatch ? parseInt(levelMatch[1]) : 0,
                    totalTime: totalTime,
                    lastUpdated: Date.now(),
                    version: version
                });
            }
        }

        if (characters.length > 0) {
            console.log(`[WoW SUCCESS] Parsed ${characters.length} characters from ${path.basename(filePath)}`);
            updateWoWCharacters(characters);

            // Send event to renderer for "Toast" notification if possible
            const wins = BrowserWindow.getAllWindows();
            if (wins.length > 0) {
                wins[0].webContents.send('wow-data-updated', characters.length);
            }
        } else {
            console.log(`[WoW] No valid characters found in ${filePath}`);
        }

    } catch (e) {
        console.error('[WoW] Error parsing Lua file:', e);
    }
}

// Debug helper
export function debugScanWoW(): { logs: string[], count: number } {
    const logs: string[] = [];
    let count = 0;

    const wowPath = getWoWPath();
    logs.push(`Configured Path: ${wowPath}`);

    if (!wowPath || !fs.existsSync(wowPath)) {
        logs.push('Path invalid or does not exist.');
        return { logs, count };
    }

    function scan(dir: string, depth = 0) {
        if (depth > 6) return; // Prevent deep recursion
        try {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            for (const file of files) {
                const res = path.resolve(dir, file.name);
                if (file.isDirectory()) {
                    if (['WTF', 'Account', 'SavedVariables'].includes(file.name) || res.includes('WTF')) {
                        scan(res, depth + 1);
                    } else if (res.endsWith('_retail_') || res.endsWith('_classic_') || res.endsWith('_classic_era_') || res.endsWith('_ptr_')) {
                        logs.push(`Found Version Folder: ${res}`);
                        scan(res, depth + 1);
                    }
                } else if (file.name === 'UltimateGametimeTracker.lua' || file.name === 'PlaytimeTracker.lua') {
                    logs.push(`Found Lua File: ${res}`);
                    parseLuaFile(res);
                    logs.push(`Parsed ${res} (Check Dashboard)`);
                }
            }
        } catch (e: any) {
            // logs.push(`Error accessing ${dir}: ${e.message}`);
        }
    }

    try {
        scan(wowPath);
    } catch (e: any) {
        logs.push(`Scan failed: ${e.message}`);
    }

    // Since parseLuaFile updates the store directly, we just fetch the store state
    const finalChars = getWoWCharacters();
    if (finalChars) {
        count = finalChars.length;
        logs.push(`Total Characters in Store: ${count}`);
    }

    return { logs, count };
}
