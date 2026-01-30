import { BrowserWindow, session, ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStore } from './store';
import { addManualSession } from './db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, '..');
const PYTHON_PATH = path.join(APP_ROOT, 'python_bridge', 'Scripts', 'python.exe');
const BRIDGE_SCRIPT = path.join(APP_ROOT, 'python_bridge', 'bridge.py');

export class GOGSyncManager {
    static init() {
        ipcMain.handle('gog-login-ea', () => this.loginEA());
        ipcMain.handle('gog-login-ubi', () => this.loginUbisoft());
        ipcMain.handle('gog-sync-all', () => this.syncAll());
        ipcMain.handle('gog-get-status', () => {
            const store = getStore();
            return {
                ea: !!store.get('gog_ea_cookies'),
                ubi: !!store.get('gog_ubi_creds')
            };
        });

        // Start periodic sync every hour
        setInterval(() => {
            this.syncAll().catch(err => console.error('Periodic GOG Sync failed:', err));
        }, 1000 * 60 * 60);
    }

    private static async loginEA(): Promise<boolean> {
        return new Promise((resolve) => {
            const win = new BrowserWindow({
                width: 500,
                height: 750,
                title: 'Login to EA',
                autoHideMenuBar: true
            });

            const startUri = "https://accounts.ea.com/connect/auth?response_type=code&client_id=ORIGIN_SPA_ID&display=originXWeb/login&locale=en_US&release_type=prod&redirect_uri=https://www.origin.com/views/login.html";
            const endUriRegex = /^https:\/\/www\.origin\.com\/views\/login\.html.*/;

            win.loadURL(startUri);

            win.webContents.on('will-navigate', async (_event: any, url: string) => {
                if (endUriRegex.test(url)) {
                    const cookies = await session.defaultSession.cookies.get({ domain: '.origin.com' });
                    const cookieMap: Record<string, string> = {};
                    cookies.forEach((c: any) => cookieMap[c.name] = c.value);

                    if (Object.keys(cookieMap).length > 0) {
                        getStore().set('gog_ea_cookies', cookieMap);
                        win.close();
                        resolve(true);
                    }
                }
            });

            win.on('closed', () => resolve(false));
        });
    }

    private static async loginUbisoft(): Promise<boolean> {
        return new Promise((resolve) => {
            const win = new BrowserWindow({
                width: 460,
                height: 690,
                title: 'Login to Ubisoft',
                autoHideMenuBar: true
            });

            const CLUB_APPID = "b8fde481-327d-4031-85ce-7c10a202a700";
            const CLUB_GENOME_ID = "fbd6791c-a6c6-4206-a75e-77234080b87b";
            const startUri = `https://connect.ubisoft.com/login?appId=${CLUB_APPID}&genomeId=${CLUB_GENOME_ID}&lang=en-US&nextUrl=https:%2F%2Fconnect.ubisoft.com%2Fready`;

            win.loadURL(startUri);

            const checkInterval = setInterval(async () => {
                if (win.isDestroyed()) {
                    clearInterval(checkInterval);
                    return;
                }
                const url = win.webContents.getURL();
                if (url.includes('connect.ubisoft.com/ready') || url.includes('connect.ubisoft.com/change_domain')) {
                    const data = await win.webContents.executeJavaScript(`
                        [localStorage.getItem("PRODloginData"), localStorage.getItem("PRODrememberMe"), localStorage.getItem("PRODlastProfile")]
                    `);

                    if (data[0] && data[1]) {
                        getStore().set('gog_ubi_creds', data);
                        clearInterval(checkInterval);
                        win.close();
                        resolve(true);
                    }
                }
            }, 1000);

            win.on('closed', () => {
                clearInterval(checkInterval);
                resolve(false);
            });
        });
    }

    private static async syncAll() {
        const store = getStore();
        const eaCookies = store.get('gog_ea_cookies');
        const ubiCreds = store.get('gog_ubi_creds');

        if (eaCookies) await this.runSync('ea', eaCookies);
        if (ubiCreds) await this.runSync('ubi', ubiCreds);
    }

    private static async runSync(platform: 'ea' | 'ubi', data: any) {
        return new Promise((resolve, reject) => {
            const child = spawn(PYTHON_PATH, [
                BRIDGE_SCRIPT,
                '--platform', platform,
                '--action', 'sync',
                '--data', JSON.stringify(data)
            ]);

            let output = '';
            child.stdout.on('data', (d) => output += d.toString());
            child.stderr.on('data', (d) => console.error(`Python Error (${platform}):`, d.toString()));

            child.on('close', (code) => {
                if (code === 0) {
                    try {
                        const res = JSON.parse(output);
                        if (res.success) {
                            this.processSyncResult(res.data);
                            resolve(res.data);
                        } else {
                            reject(res.data);
                        }
                    } catch (e) {
                        reject('Failed to parse python output');
                    }
                } else {
                    reject(`Process exited with code ${code}`);
                }
            });
        });
    }

    private static processSyncResult(data: any) {
        if (!data.games) return;

        for (const game of data.games) {
            // Convert playtime to seconds and add as manual session if higher than current?
            // Actually, we should check if we already have this time.
            // For now, let's just use addManualSession which handles "Total" by overwriting/adding-sessions.
            // WAIT: if we sync every 30 mins, we don't want to keep adding the same total time.
            // We should store "last_synced_time" and only add the difference.

            const store = getStore();
            const syncedKey = `synced_time_${game.id}`;
            const lastSyncedMins = store.get(syncedKey) || 0;
            const currentMins = game.playtime_mins;

            if (currentMins > lastSyncedMins) {
                const diffSeconds = (currentMins - lastSyncedMins) * 60;
                addManualSession(game.name, diffSeconds);
                store.set(syncedKey, currentMins);
            }
        }
    }
}
