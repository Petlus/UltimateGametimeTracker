import { app, BrowserWindow, ipcMain, shell, dialog, nativeImage, Tray, IpcMainInvokeEvent, Menu } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import http from 'node:http'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Window controls
  ipcMain.on('window-minimize', () => win?.minimize());
  ipcMain.on('window-maximize', () => {
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });
  ipcMain.on('window-close', () => win?.hide()); // Just hide instead of quit

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}


let tray: Tray | null = null

function createTray() {
  const icon = nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'logo.png'))
  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => win?.show() },
    { label: 'Quit', click: () => app.quit() },
  ])
  tray.setToolTip('Ultimate Gametime Tracker')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    win?.show()
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // We keep the app running in tray? 
    // Usually yes, but here let's hide instead of quit if tray exists.
    // However, default behavior is quit. Let's keep it simple for now or strictly follow "Runs in background".
    // "Erstelle eine Electron-Anwendung, die im Hintergrund (System Tray) läuft."
    // So we should NOT quit on window close, but hide.
    // But let's stick to explicit Quit action for now to avoid confusion during dev.
    // app.quit() 
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})


import { getCustomGames, addCustomGame, removeCustomGame, getSessions, getWoWCharacters, setWoWPath, getWoWPath, getSteamApiKey, setSteamApiKey, getSteamGames, setSteamGames, SteamGame, getSteamIds, addSteamId, removeSteamId } from './store'
import { getRecentSessions, initDB, getGlobalStats, getMostPlayedGames, addManualSession, getAllGames, getRiotStats, getTopChampions } from './db'
import { startWoWWatcher } from './WoWWatcher';
import { GOGSyncManager } from './GOGSyncManager';
import { RiotSyncManager } from './RiotSyncManager';
import { getStore } from './store';

// ... existing code ...
GOGSyncManager.init();
RiotSyncManager.init();

// Define a minimal interface for the game to avoid 'any'
// Custom Game management consolidated below


// Custom Game handlers consolidated below in the Custom Games Management section
ipcMain.handle('get-play-sessions', () => getSessions())
ipcMain.handle('get-recent-sessions', () => getRecentSessions())
ipcMain.handle('get-global-stats', () => getGlobalStats())
ipcMain.handle('get-most-played', () => getMostPlayedGames())
ipcMain.handle('get-riot-stats', () => getRiotStats())
ipcMain.handle('get-top-champions', (_e, limit) => getTopChampions(limit))

// Riot Config Handlers
ipcMain.handle('get-riot-config', () => {
  const store = getStore();
  return {
    apiKey: store.get('riotApiKey'),
    summonerName: store.get('riotSummonerName'),
    tagLine: store.get('riotTagLine'),
    region: store.get('riotRegion'),
    puuid: store.get('riotPuuid')
  };
});

ipcMain.handle('set-riot-config', (_e, config: any) => {
  const store = getStore();
  if (config.apiKey !== undefined) store.set('riotApiKey', config.apiKey);
  if (config.region !== undefined) store.set('riotRegion', config.region);
  return { success: true };
});

// WoW Handlers
ipcMain.handle('get-wow-characters', () => getWoWCharacters())
ipcMain.handle('get-wow-path', () => getWoWPath())
ipcMain.handle('set-wow-path', (_event, path: string) => {
  setWoWPath(path);
  startWoWWatcher();
})

// Steam Auth Helper


// Steam Auth Helper (Browser Based)
async function handleSteamLogin(): Promise<string | null> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', 'http://localhost:3000');

      // Check if this is the return URL
      if (url.searchParams.has('openid.identity')) {
        const identity = url.searchParams.get('openid.identity') || '';
        const match = identity.match(/https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/);

        if (match && match[1]) {
          const steamId = match[1];

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <style>
                body {
                  background-color: #0f0f13;
                  color: #e0e0e0;
                  font-family: sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                }
                .card {
                  background: rgba(30,30,35,0.6);
                  padding: 40px;
                  border-radius: 16px;
                  border: 1px solid rgba(255,255,255,0.1);
                  text-align: center;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }
                h1 { color: #8b5cf6; margin-bottom: 10px; }
              </style>
              <body>
                <div class="card">
                  <h1>✅ Login Successful</h1>
                  <p>You connected Steam ID: <b style="color: #ec4899">${steamId}</b></p>
                  <p>You can close this tab now.</p>
                </div>
                <script>
                  // Attempt to close automatically
                  window.opener = null;
                  window.open("","_self");
                  window.close();
                </script>
              </body>
            </html>
          `);

          resolve(steamId);
        } else {
          res.writeHead(400);
          res.end('Failed to parse Steam ID');
          resolve(null);
        }
      } else {
        // Fallback
        res.writeHead(404);
        res.end('Not Found');
      }

      // Cleanup
      server.close();
      if (win) win.focus();
    });

    server.listen(3000, () => {
      const steamOpenIdUrl = 'https://steamcommunity.com/openid/login' +
        '?openid.ns=http://specs.openid.net/auth/2.0' +
        '&openid.mode=checkid_setup' +
        '&openid.return_to=http://localhost:3000/auth/steam/return' +
        '&openid.realm=http://localhost:3000' +
        '&openid.identity=http://specs.openid.net/auth/2.0/identifier_select' +
        '&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select';

      shell.openExternal(steamOpenIdUrl);
    });

    // Timeout safety
    setTimeout(() => {
      if (server.listening) {
        server.close();
        resolve(null);
      }
    }, 120000); // 2 min timeout
  });
}

ipcMain.handle('login-steam', async () => handleSteamLogin())
ipcMain.handle('add-manual-session', (_event: IpcMainInvokeEvent, gameName: string, durationSeconds: number) => addManualSession(gameName, durationSeconds))

// Games Library: Merge Session Stats with WoW Addon Data + Steam API Data
ipcMain.handle('get-games-library', () => {
  // Start with session-based games
  const games = getAllGames();
  const gameMap = new Map<string, number>();
  for (const g of games) gameMap.set(g.gameName, g.totalSeconds);

  // Add WoW Addon Time
  const wowChars = getWoWCharacters();
  const wowTotalSeconds = wowChars.reduce((acc: number, c: any) => acc + (c.totalTime || 0), 0);
  if (wowTotalSeconds > 0) {
    const existing = gameMap.get('World of Warcraft') || 0;
    gameMap.set('World of Warcraft', Math.max(existing, wowTotalSeconds));
  }

  // Add Steam Games (Convert minutes to seconds)
  const steamGames = getSteamGames();
  for (const sg of steamGames) {
    const steamSeconds = sg.playtimeMinutes * 60;
    const existing = gameMap.get(sg.name) || 0;
    // Take the higher value (could have tracked same game locally too)
    gameMap.set(sg.name, Math.max(existing, steamSeconds));
  }

  // Convert back to array, filter, and sort
  const result = Array.from(gameMap.entries())
    .map(([gameName, totalSeconds]) => ({ gameName, totalSeconds }))
    .filter(g => g.totalSeconds >= 600 && g.gameName !== 'Steam' && g.gameName !== 'EA Apps') // Filter out short games and launchers
    .sort((a, b) => b.totalSeconds - a.totalSeconds);

  return result;
});

// Custom Games Management
ipcMain.handle('get-custom-games', () => getCustomGames());

ipcMain.handle('add-custom-game', (_: IpcMainInvokeEvent, game: any) => {
  addCustomGame(game);
  return { success: true };
});

ipcMain.handle('remove-custom-game', (_: IpcMainInvokeEvent, id: string) => {
  removeCustomGame(id);
  return { success: true };
});

ipcMain.handle('pick-game-executable', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Executables', extensions: ['exe'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    title: 'Select Game Executable'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const fullPath = result.filePaths[0].toLowerCase(); // Normalize
    const executable = path.basename(fullPath);
    const defaultName = path.basename(fullPath, path.extname(fullPath));

    return {
      success: true,
      executable,
      path: fullPath,
      defaultName
    };
  }
  return { success: false };
});

// Steam API Key Management
ipcMain.handle('get-steam-api-key', () => getSteamApiKey());
ipcMain.handle('set-steam-api-key', (_: IpcMainInvokeEvent, key: string) => {
  setSteamApiKey(key);
  return { success: true };
});
ipcMain.handle('get-steam-games', () => getSteamGames());

// Helper to perform full sync of all accounts to prevent inflation
async function performFullSteamSync() {
  const apiKey = getSteamApiKey();
  const steamIds = getSteamIds();

  if (!apiKey || steamIds.length === 0) return { success: false, error: 'No API key or IDs' };

  console.log(`[Steam Sync] Performing full sync for ${steamIds.length} accounts...`);
  const aggregatedGames = new Map<number, SteamGame>();

  for (const steamId of steamIds) {
    try {
      const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.response && data.response.games) {
        for (const g of data.response.games) {
          const existing = aggregatedGames.get(g.appid);
          if (existing) {
            existing.playtimeMinutes += (g.playtime_forever || 0);
          } else {
            aggregatedGames.set(g.appid, {
              appid: g.appid,
              name: g.name,
              playtimeMinutes: g.playtime_forever || 0,
              imgIconUrl: g.img_icon_url
            });
          }
        }
      }
    } catch (e) {
      console.error(`[Steam Sync] Failed for ${steamId}:`, e);
    }
  }

  const final = Array.from(aggregatedGames.values());
  setSteamGames(final);
  return { success: true, count: final.length };
}

// Fetch Steam Games from Web API (Always performs full sync for all IDs to keep total consistent)
ipcMain.handle('fetch-steam-games', async () => {
  return performFullSteamSync();
});

// Steam ID Management (Backend Storage)
ipcMain.handle('get-steam-ids', () => getSteamIds());
ipcMain.handle('add-steam-id', (_: IpcMainInvokeEvent, id: string) => {
  addSteamId(id);
  return { success: true };
});
ipcMain.handle('remove-steam-id', (_: IpcMainInvokeEvent, id: string) => {
  removeSteamId(id);
  return { success: true };
});

// Auto-Sync Steam Games (runs on startup and periodically)
async function autoSyncSteamGames() {
  await performFullSteamSync();
}

// Run auto-sync on app ready (after a short delay), then every 30 minutes
app.whenReady().then(() => {
  setTimeout(autoSyncSteamGames, 5000); // 5 seconds after startup
  setInterval(autoSyncSteamGames, 30 * 60 * 1000); // Every 30 minutes
});



ipcMain.handle('install-wow-addon', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select your World of Warcraft folder (Root or Version)'
  });

  if (result.canceled || result.filePaths.length === 0) return { success: false, message: 'Cancelled' };

  let selectedPath = result.filePaths[0];
  const versionsToInstall: string[] = [];

  // Check if user selected a version folder directly (e.g. _retail_)
  if (selectedPath.endsWith('_retail_') || selectedPath.endsWith('_classic_') || selectedPath.endsWith('_classic_era_') || selectedPath.endsWith('_ptr_') || selectedPath.endsWith('_anniversary_')) {
    versionsToInstall.push(selectedPath);
  } else {
    // User likely selected the Root folder (e.g. "World of Warcraft")
    // Check for subfolders
    const potentialFolders = ['_retail_', '_classic_', '_classic_era_', '_ptr_', '_anniversary_'];
    let foundAny = false;

    for (const folder of potentialFolders) {
      const versionPath = path.join(selectedPath, folder);
      if (fs.existsSync(versionPath)) {
        versionsToInstall.push(versionPath);
        foundAny = true;
      }
    }

    // Fallback: If no subfolders found, try installing to root if it looks like a version folder
    if (!foundAny && fs.existsSync(path.join(selectedPath, 'Interface'))) {
      versionsToInstall.push(selectedPath);
    }
  }

  if (versionsToInstall.length === 0) {
    return { success: false, message: 'Could not find any WoW version folders (_retail_, _classic_, etc.) in ' + selectedPath };
  }

  // Improved Lua Content
  const luaContent = `
UGTT_Data = UGTT_Data or {}

-- Create Main Frame for UI (Hidden by default)
local mainFrame = CreateFrame("Frame", "UGTT_MainFrame", UIParent, "BackdropTemplate")
mainFrame:SetSize(200, 250)
mainFrame:SetPoint("CENTER", 0, 0)
mainFrame:SetBackdrop({
    bgFile = "Interface\\\\DialogFrame\\\\UI-DialogBox-Background",
    edgeFile = "Interface\\\\DialogFrame\\\\UI-DialogBox-Border",
    tile = true, tileSize = 32, edgeSize = 32,
    insets = { left = 11, right = 12, top = 12, bottom = 11 }
})
mainFrame:SetMovable(true)
mainFrame:EnableMouse(true)
mainFrame:RegisterForDrag("LeftButton")
mainFrame:SetScript("OnDragStart", mainFrame.StartMoving)
mainFrame:SetScript("OnDragStop", mainFrame.StopMovingOrSizing)
mainFrame:Hide()

-- Title
local title = mainFrame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
title:SetPoint("TOP", 0, -15)
title:SetText("UGT Tracker")

-- Character List Text
local listText = mainFrame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
listText:SetPoint("TOPLEFT", 20, -40)
listText:SetPoint("BOTTOMRIGHT", -20, 50)
listText:SetJustifyH("LEFT")
listText:SetJustifyV("TOP")
listText:SetText("No characters tracked yet.")

local function UpdateList()
    local text = ""
    local count = 0
    for k, v in pairs(UGTT_Data) do
        local days = floor(v.totalSeconds / 86400)
        local hours = floor((v.totalSeconds % 86400) / 3600)
        text = text .. v.name .. ": " .. days .. "d " .. hours .. "h\\n"
        count = count + 1
    end
    if count == 0 then
        listText:SetText("No characters tracked yet.\\nLog into them to track.")
    else
        listText:SetText(text)
    end
end

-- Slash Command Handler
SLASH_UGTT1 = "/ugtt"
SlashCmdList["UGTT"] = function()
    if mainFrame:IsShown() then
        mainFrame:Hide()
    else
        UpdateList()
        mainFrame:Show()
    end
end

-- Events
local eventFrame = CreateFrame("Frame")
eventFrame:RegisterEvent("TIME_PLAYED_MSG")
eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("PLAYER_LOGIN")

local requested = false

eventFrame:SetScript("OnEvent", function(self, event, ...)
    if event == "PLAYER_LOGIN" then
        DEFAULT_CHAT_FRAME:AddMessage("|cFF00FF00[UGT]|r Addon Loaded. Type /ugtt to show tracker.", 1, 1, 1)
        UpdateList()
    elseif event == "PLAYER_ENTERING_WORLD" then
        if not requested then
            RequestTimePlayed()
            requested = true
        end
    elseif event == "TIME_PLAYED_MSG" then
        local totalTime, levelTime = ...
        local charName = UnitName("player")
        local realmName = GetRealmName()
        local charKey = charName .. "-" .. realmName

        UGTT_Data[charKey] = {
            totalSeconds = totalTime,
            level = UnitLevel("player"),
            class = select(2, UnitClass("player")),
            realm = realmName,
            name = charName,
            lastUpdate = time()
        }
        print("|cFF00FF00[UGT]|r Data Updated for " .. charName)
        UpdateList()
    end
end)

-- Sync Button (inside frame)
local btn = CreateFrame("Button", "UGTT_SyncBtn", mainFrame, "UIPanelButtonTemplate")
btn:SetSize(160, 30)
btn:SetPoint("BOTTOM", 0, 15)
btn:SetText("Sync / Reload UI")
btn:SetScript("OnClick", function()
    RequestTimePlayed()
    print("|cFF00FF00[UGT]|r Requesting data... Reloading UI in 1s...")
    C_Timer.After(1, function() ReloadUI() end)
end)
`;

  let installCount = 0;

  for (const versionPath of versionsToInstall) {
    try {
      const addonPath = path.join(versionPath, 'Interface', 'AddOns', 'UltimateGametimeTracker');

      if (!fs.existsSync(addonPath)) {
        fs.mkdirSync(addonPath, { recursive: true });
      }

      // Determine Interface Version
      let interfaceVersion = '110100'; // Default Retail (TWW latest)

      if (versionPath.includes('_classic_era_')) {
        interfaceVersion = '11506'; // Classic Era
      } else if (versionPath.includes('_classic_')) {
        interfaceVersion = '50401'; // Mists of Pandaria Classic
      } else if (versionPath.includes('_ptr_') || versionPath.includes('_beta_') || versionPath.includes('12.0.0')) {
        interfaceVersion = '120000'; // Midnight / 12.0.x PTR
      }

      const tocContent = `## Interface: ${interfaceVersion}
## Title: Ultimate Gametime Tracker Bridge
## Notes: Logs played time for all characters.
## Author: UGT
## Version: 1.2
## SavedVariables: UGTT_Data

core.lua`;

      fs.writeFileSync(path.join(addonPath, 'core.lua'), luaContent);
      fs.writeFileSync(path.join(addonPath, 'UltimateGametimeTracker.toc'), tocContent);

      console.log(`[Main] Installed addon to: ${addonPath} (Interface: ${interfaceVersion})`);
      installCount++;
    } catch (e) {
      console.error(`[Main] Failed to install to ${versionPath}`, e);
    }
  }

  if (installCount > 0) {
    // Safe bet: Set the path to what the user selected. The watcher handles finding files.
    setWoWPath(selectedPath);
    startWoWWatcher();

    return { success: true, path: selectedPath };
  } else {
    return { success: false, message: 'Failed to write files.' };
  }
});

import { debugScanWoW } from './WoWWatcher';
ipcMain.handle('debug-wow-scan', () => {
  return debugScanWoW();
});

app.whenReady().then(() => {
  try {
    console.log('[Main] Initializing Database...');
    initDB();
  } catch (e) {
    console.error('[Main] Failed to initialize database:', e);
  }

  createTray();
  createWindow();

  // Start the background process watcher
  import('./ProcessWatcher').then(({ processWatcher }) => {
    processWatcher.start();
  });

  // Start WoW Watcher
  startWoWWatcher();
})

