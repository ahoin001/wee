/** Steam tools/redistributables (not games). Sync with src/utils/steamLibraryFilter.js */
const STEAM_TOOL_APP_IDS = new Set(['228980']);

function createGameSourceService({ fs, path, vdf, os, scanCacheFile = null }) {
  let persistedCacheLoaded = false;
  let persistedScanCache = {
    steamInstalled: null,
    steamScanByPaths: {},
    epicInstalled: null,
  };

  const normalizePath = (p) => String(p || '').replace(/\\/g, '/');
  const normalizeLibraryPaths = (paths) =>
    [...new Set((Array.isArray(paths) ? paths : []).map(normalizePath).filter(Boolean))].sort();

  /** All disk work is async + chunked so IPC replies never queue behind a library scan. */
  const fsp = fs.promises;
  const SCAN_YIELD_EVERY = 12;
  const yieldToEventLoop = () => new Promise((resolve) => setImmediate(resolve));
  const pathExists = (p) => fsp.access(p).then(() => true, () => false);
  const isAppManifest = (file) => file.startsWith('appmanifest_') && file.endsWith('.acf');

  let cacheLoadPromise = null;
  function loadPersistedScanCache() {
    if (persistedCacheLoaded || !scanCacheFile) return Promise.resolve();
    if (!cacheLoadPromise) {
      cacheLoadPromise = (async () => {
        try {
          const parsed = JSON.parse(await fsp.readFile(scanCacheFile, 'utf-8'));
          if (parsed && typeof parsed === 'object') {
            persistedScanCache = {
              steamInstalled: parsed.steamInstalled || null,
              steamScanByPaths: parsed.steamScanByPaths && typeof parsed.steamScanByPaths === 'object'
                ? parsed.steamScanByPaths
                : {},
              epicInstalled: parsed.epicInstalled || null,
            };
          }
        } catch {
          /* ignore missing cache file */
        }
        persistedCacheLoaded = true;
      })();
    }
    return cacheLoadPromise;
  }

  let persistTimer = null;
  function persistScanCache() {
    if (!scanCacheFile) return;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(async () => {
      persistTimer = null;
      try {
        await fsp.mkdir(path.dirname(scanCacheFile), { recursive: true });
        await fsp.writeFile(
          scanCacheFile,
          JSON.stringify({
            version: 1,
            updatedAt: Date.now(),
            steamInstalled: persistedScanCache.steamInstalled,
            steamScanByPaths: persistedScanCache.steamScanByPaths,
            epicInstalled: persistedScanCache.epicInstalled,
          }),
          'utf-8'
        );
      } catch (error) {
        console.warn('[GameSourceCache] Persist failed:', error?.message || error);
      }
    }, 250);
  }

  async function buildManifestSnapshotForPaths(libraryPaths) {
    const normalized = normalizeLibraryPaths(libraryPaths);
    let manifestCount = 0;
    let maxMtimeMs = 0;
    for (const libraryPath of normalized) {
      let files = [];
      try {
        files = await fsp.readdir(libraryPath);
      } catch {
        continue;
      }
      const manifestFiles = files.filter(isAppManifest);
      manifestCount += manifestFiles.length;
      for (let i = 0; i < manifestFiles.length; i += 1) {
        try {
          const stat = await fsp.stat(path.join(libraryPath, manifestFiles[i]));
          if (stat?.mtimeMs && stat.mtimeMs > maxMtimeMs) {
            maxMtimeMs = stat.mtimeMs;
          }
        } catch {
          /* ignore bad manifest stat */
        }
      }
    }
    return {
      count: manifestCount,
      fingerprint: `${normalized.join(';')}|${manifestCount}|${Math.floor(maxMtimeMs)}`,
      normalizedPaths: normalized,
    };
  }

  function normalizeSteamEnrichment(recentlyPlayed, ownedGames) {
    const map = new Map();
    (ownedGames || []).forEach((item) => {
      if (!item?.appid) return;
      const appId = String(item.appid);
      map.set(appId, {
        appId,
        name: typeof item.name === 'string' ? item.name : '',
        playtimeForever: Number(item.playtime_forever || 0),
        playtimeRecent: 0,
        lastPlayedAt: 0,
      });
    });

    (recentlyPlayed || []).forEach((item) => {
      if (!item?.appid) return;
      const appId = String(item.appid);
      const existing = map.get(appId) || {
        appId,
        name: '',
        playtimeForever: 0,
        playtimeRecent: 0,
        lastPlayedAt: 0,
      };
      if (typeof item.name === 'string' && item.name && !existing.name) {
        existing.name = item.name;
      }
      existing.playtimeRecent = Number(item.playtime_2weeks || 0);
      existing.playtimeForever = Math.max(
        Number(existing.playtimeForever || 0),
        Number(item.playtime_forever || 0)
      );
      if (item.rtime_last_played) {
        existing.lastPlayedAt = Number(item.rtime_last_played);
      }
      map.set(appId, existing);
    });

    return Array.from(map.values());
  }

  async function getSteamEnrichedGames({ steamId, apiKey }) {
    if (!steamId) {
      return {
        games: [],
        status: 'error',
        statusCode: 'missing-steam-id',
        statusReason: 'SteamID64 is required for enrichment.',
        error: 'Steam ID is required for enrichment.',
      };
    }
    const resolvedApiKey = apiKey || process.env.STEAM_WEB_API_KEY;
    if (!resolvedApiKey) {
      return {
        games: [],
        status: 'error',
        statusCode: 'missing-api-key',
        statusReason:
          'Steam Web API key is not configured. Paste your key under Settings → API & Widgets → Steam connection (or set STEAM_WEB_API_KEY in .env).',
        error: 'Steam Web API key is not configured.',
      };
    }

    try {
      const recentlyPlayedUrl =
        `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${encodeURIComponent(resolvedApiKey)}&steamid=${encodeURIComponent(steamId)}&format=json`;
      const ownedGamesUrl =
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(resolvedApiKey)}&steamid=${encodeURIComponent(steamId)}&format=json&include_appinfo=1&include_played_free_games=1`;

      const [recentResponse, ownedResponse] = await Promise.all([
        fetch(recentlyPlayedUrl),
        fetch(ownedGamesUrl),
      ]);

      if (!recentResponse.ok || !ownedResponse.ok) {
        const isUnauthorized = recentResponse.status === 401 || ownedResponse.status === 401;
        const isRateLimit = recentResponse.status === 429 || ownedResponse.status === 429;
        const isPrivate = recentResponse.status === 403 || ownedResponse.status === 403;

        let statusCode = 'api-error';
        let statusReason = 'Steam API request failed.';
        if (isUnauthorized) {
          statusCode = 'invalid-api-key';
          statusReason = 'Steam API key appears invalid.';
        } else if (isRateLimit) {
          statusCode = 'rate-limited';
          statusReason = 'Steam API rate limit reached. Try again shortly.';
        } else if (isPrivate) {
          statusCode = 'private-profile';
          statusReason = 'Profile appears private or inaccessible.';
        }

        return {
          games: [],
          status: 'error',
          statusCode,
          statusReason,
          error: statusReason,
        };
      }

      const recentPayload = recentResponse.ok ? await recentResponse.json() : {};
      const ownedPayload = ownedResponse.ok ? await ownedResponse.json() : {};
      const games = normalizeSteamEnrichment(
        recentPayload?.response?.games || [],
        ownedPayload?.response?.games || []
      ).filter((g) => !STEAM_TOOL_APP_IDS.has(String(g.appId)));

      if (!games.length) {
        return {
          games: [],
          source: 'steam-web-api',
          fetchedAt: Date.now(),
          status: 'error',
          statusCode: 'private-or-empty',
          statusReason: 'No enrichment data returned (profile may be private).',
          error: 'No enrichment data returned.',
        };
      }

      return {
        games,
        source: 'steam-web-api',
        fetchedAt: Date.now(),
        status: 'ready',
        statusCode: 'ok',
        statusReason: 'Steam enrichment synced.',
      };
    } catch (error) {
      return {
        games: [],
        status: 'error',
        statusCode: 'network-error',
        statusReason: 'Network error while fetching Steam enrichment.',
        error: error?.message || 'Failed to fetch Steam enrichment data.',
      };
    }
  }

  /**
   * Full Steam friends list (GetFriendList + GetPlayerSummaries).
   * Online (in-game first) sorted ahead of offline. Requires a public friend list.
   */
  async function getSteamFriendsPlaying({ steamId, apiKey }) {
    if (!steamId) {
      return {
        friends: [],
        status: 'error',
        statusCode: 'missing-steam-id',
        statusReason: 'SteamID64 is required for friends.',
        error: 'Steam ID is required for friends.',
      };
    }
    const resolvedApiKey = apiKey || process.env.STEAM_WEB_API_KEY;
    if (!resolvedApiKey) {
      return {
        friends: [],
        status: 'error',
        statusCode: 'missing-api-key',
        statusReason:
          'Steam Web API key is not configured. Paste your key under Settings → API & Widgets → Steam connection.',
        error: 'Steam Web API key is not configured.',
      };
    }

    try {
      const friendListUrl =
        `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${encodeURIComponent(resolvedApiKey)}&steamid=${encodeURIComponent(steamId)}&relationship=friend`;
      const friendRes = await fetch(friendListUrl);
      if (!friendRes.ok) {
        const isPrivate = friendRes.status === 401 || friendRes.status === 403;
        return {
          friends: [],
          status: 'error',
          statusCode: isPrivate ? 'private-friends' : 'api-error',
          statusReason: isPrivate
            ? 'Your Steam friends list is private. Open Steam → Profile → Edit Profile → Privacy Settings, set Friends List to Public, then tap this widget to retry.'
            : 'Steam friend list request failed. Check your API key in Settings → API & Widgets.',
          error: isPrivate
            ? 'Friends list is private on Steam.'
            : 'Steam friend list request failed.',
        };
      }

      const friendJson = await friendRes.json();
      const friendIds = (friendJson?.friendslist?.friends || [])
        .map((f) => String(f?.steamid || ''))
        .filter(Boolean);
      if (friendIds.length === 0) {
        return {
          friends: [],
          status: 'ok',
          statusCode: 'ok',
          statusReason: 'No Steam friends found.',
          fetchedAt: Date.now(),
        };
      }

      const chunks = [];
      for (let i = 0; i < friendIds.length; i += 100) {
        chunks.push(friendIds.slice(i, i + 100));
      }

      const players = [];
      for (const chunk of chunks) {
        const summariesUrl =
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(resolvedApiKey)}&steamids=${encodeURIComponent(chunk.join(','))}`;
        const summaryRes = await fetch(summariesUrl);
        if (!summaryRes.ok) continue;
        const summaryJson = await summaryRes.json();
        const batch = summaryJson?.response?.players;
        if (Array.isArray(batch)) players.push(...batch);
      }

      const nameCmp = (a, b) =>
        (a.personaName || '').localeCompare(b.personaName || '', undefined, {
          sensitivity: 'base',
        });

      const friends = players
        .map((p) => {
          const gameId = p.gameid ? String(p.gameid) : '';
          const gameName = typeof p.gameextrainfo === 'string' ? p.gameextrainfo : '';
          const personaState = Number(p.personastate || 0);
          const inGame = Boolean(gameId || gameName);
          // Treat anyone with a game session as online even if state is briefly 0.
          const online = inGame || personaState >= 1;
          return {
            steamId: String(p.steamid || ''),
            personaName: typeof p.personaname === 'string' ? p.personaname : 'Friend',
            avatarUrl:
              typeof p.avatarfull === 'string'
                ? p.avatarfull
                : p.avatarmedium || p.avatar || '',
            profileUrl: typeof p.profileurl === 'string' ? p.profileurl : '',
            gameId,
            gameName,
            personaState,
            online,
            inGame,
          };
        })
        .filter((f) => f.steamId)
        .sort((a, b) => {
          // Online first; within online, in-game first; then name.
          if (a.online !== b.online) return a.online ? -1 : 1;
          if (a.inGame !== b.inGame) return a.inGame ? -1 : 1;
          return nameCmp(a, b);
        });

      const onlineCount = friends.filter((f) => f.online).length;
      return {
        friends,
        status: 'ok',
        statusCode: 'ok',
        statusReason: friends.length
          ? `${friends.length} friend${friends.length === 1 ? '' : 's'} (${onlineCount} online).`
          : 'No Steam friends found.',
        fetchedAt: Date.now(),
      };
    } catch (error) {
      return {
        friends: [],
        status: 'error',
        statusCode: 'network-error',
        statusReason: 'Network error while fetching Steam friends.',
        error: error?.message || 'Failed to fetch Steam friends.',
      };
    }
  }

  /** Parse Steam appmanifest files in chunks (yielding to the event loop). */
  async function readInstalledManifests(steamappsDir, onAppState) {
    let files = [];
    try {
      files = (await fsp.readdir(steamappsDir)).filter(isAppManifest);
    } catch {
      return;
    }
    for (let i = 0; i < files.length; i += 1) {
      if (i > 0 && i % SCAN_YIELD_EVERY === 0) await yieldToEventLoop();
      try {
        const manifest = vdf.parse(await fsp.readFile(path.join(steamappsDir, files[i]), 'utf-8'));
        if (manifest?.AppState) onAppState(manifest.AppState);
      } catch (err) {
        console.warn('[SteamScan] Failed to parse', files[i], err?.message || err);
      }
    }
  }

  function toSteamGameRow(appState) {
    const appid = appState.appid;
    const name = appState.name;
    if (!appid || !name || STEAM_TOOL_APP_IDS.has(String(appid))) return null;
    const sizeOnDisk = parseInt(appState.SizeOnDisk) || 0;
    if (sizeOnDisk <= 0) return null;
    return {
      appId: appid,
      name,
      installed: true,
      sizeOnDisk,
      lastUpdated: parseInt(appState.LastUpdated) || 0,
      installdir: appState.installdir || '',
      sizeGB: Math.round((sizeOnDisk / (1024 * 1024 * 1024)) * 100) / 100,
    };
  }

  function dedupeByAppId(games) {
    const seen = new Set();
    return games.filter((game) => {
      const key = String(game.appId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function getInstalledSteamGames() {
    try {
      await loadPersistedScanCache();
      const steamPath = await resolveSteamRootPath();
      if (!steamPath) {
        console.error('[SteamScan] Could not find Steam installation.');
        return { error: 'Could not find Steam installation.' };
      }
      const libraryVdf = await fsp.readFile(path.join(steamPath, 'steamapps', 'libraryfolders.vdf'), 'utf-8');
      const libraries = vdf.parse(libraryVdf).libraryfolders;
      const libraryPaths = [];
      for (const key in libraries) {
        if (libraries[key] && libraries[key].path) {
          libraryPaths.push(libraries[key].path.replace(/\\/g, '/'));
        } else if (!isNaN(key) && typeof libraries[key] === 'string') {
          libraryPaths.push(libraries[key].replace(/\\/g, '/'));
        }
      }
      if (!libraryPaths.includes(steamPath)) {
        libraryPaths.push(steamPath);
      }
      const quickSnapshot = await buildManifestSnapshotForPaths(
        libraryPaths.map((lp) => path.join(lp, 'steamapps'))
      );
      const cachedSteam = persistedScanCache.steamInstalled;
      if (
        cachedSteam &&
        Array.isArray(cachedSteam.games) &&
        quickSnapshot.count === Number(cachedSteam.count || 0) &&
        quickSnapshot.fingerprint === cachedSteam.fingerprint
      ) {
        return { games: cachedSteam.games };
      }

      const games = [];
      for (const libPath of libraryPaths) {
        await readInstalledManifests(path.join(libPath, 'steamapps'), (appState) => {
          const row = toSteamGameRow(appState);
          if (row) games.push(row);
        });
      }
      const uniqueGames = dedupeByAppId(games);
      console.log(`[SteamScan] ${uniqueGames.length} unique installed Steam games (${games.length} manifests).`);
      persistedScanCache.steamInstalled = {
        count: quickSnapshot.count,
        fingerprint: quickSnapshot.fingerprint,
        games: uniqueGames,
        updatedAt: Date.now(),
      };
      persistScanCache();
      return { games: uniqueGames };
    } catch (err) {
      console.error('[SteamScan] Error scanning Steam games:', err);
      return { error: err.message };
    }
  }

  async function detectSteamInstallation() {
    try {
      const steamPaths = [
        'C:\\Program Files (x86)\\Steam',
        'C:\\Program Files\\Steam',
        'D:\\Steam',
        'E:\\Steam',
        'F:\\Steam',
      ];

      for (const steamPath of steamPaths) {
        if (await pathExists(path.join(steamPath, 'Steam.exe'))) {
          return { found: true, steamPath };
        }
      }

      return { found: false, steamPath: null };
    } catch (error) {
      console.error('[Steam] Error detecting installation:', error);
      return { found: false, steamPath: null };
    }
  }

  /** Same discovery as getInstalledSteamGames — root folder containing steamapps/libraryfolders.vdf */
  let steamRootPromise = null;
  function resolveSteamRootPath() {
    if (!steamRootPromise) {
      steamRootPromise = (async () => {
        const home = os.homedir();
        const candidates = [
          'C:/Program Files (x86)/Steam',
          path.join(home, 'AppData', 'Local', 'Steam'),
          path.join(home, 'AppData', 'Roaming', 'Steam'),
          path.join('D:/Steam'),
          path.join('E:/Steam'),
        ];
        for (const root of candidates) {
          if (await pathExists(path.join(root, 'steamapps', 'libraryfolders.vdf'))) {
            return root.replace(/\\/g, '/');
          }
        }
        return null;
      })().then((root) => {
        // Do not memoize a miss: Steam may be installed while Wee is running.
        if (!root) steamRootPromise = null;
        return root;
      });
    }
    return steamRootPromise;
  }

  async function findUserdataFolderForSteamUser(steamRoot, steamId64) {
    const userdataRoot = path.join(steamRoot, 'userdata');
    let entries = [];
    try {
      entries = await fsp.readdir(userdataRoot, { withFileTypes: true });
    } catch {
      return null;
    }
    const dirs = entries
      .filter((d) => d.isDirectory() && /^\d+$/.test(d.name))
      .map((d) => d.name);
    const sid = String(steamId64);
    for (const dir of dirs) {
      const lc = path.join(userdataRoot, dir, 'config', 'localconfig.vdf');
      try {
        const head = (await fsp.readFile(lc, 'utf8')).slice(0, 500000);
        if (head.includes(`"${sid}"`) || head.includes(sid)) {
          return dir;
        }
      } catch (_) {
        /* missing localconfig */
      }
    }
    try {
      const fallback = String(BigInt(sid) & 0xffffffffn);
      if (dirs.includes(fallback)) return fallback;
    } catch (_) {}
    return dirs[0] || null;
  }

  function deepFindAppsObject(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 28) return null;
    if (obj.apps && typeof obj.apps === 'object' && !Array.isArray(obj.apps)) {
      const keys = Object.keys(obj.apps);
      if (keys.some((k) => /^\d+$/.test(String(k)))) return obj.apps;
    }
    const values = Object.values(obj);
    for (let i = 0; i < values.length; i += 1) {
      const v = values[i];
      if (v && typeof v === 'object') {
        const found = deepFindAppsObject(v, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  function parseSteamClientTags(raw) {
    if (raw === undefined || raw === null) return [];
    const s = String(raw).trim();
    if (!s || s === '0') return [];
    if (/^\d+$/.test(s)) return [];
    return s.split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
  }

  function tagLooksFavorite(t) {
    const x = String(t).toLowerCase();
    return x === 'favorite' || x === 'favorites' || x.includes('favorite');
  }

  /**
   * Reads userdata/sharedconfig (VDF) for per-app tags and Steam "favorite" markers.
   * Best-effort — Steam changes on-disk layout between client versions.
   */
  async function getSteamClientLibraryMetadata({ steamId }) {
    const sid = String(steamId || '').trim();
    if (!sid) {
      return { ok: false, error: 'missing-steam-id', favoritesAppIds: [], appIdToTags: {} };
    }
    const steamRoot = await resolveSteamRootPath();
    if (!steamRoot) {
      return { ok: false, error: 'steam-not-found', favoritesAppIds: [], appIdToTags: {} };
    }
    const folder = await findUserdataFolderForSteamUser(steamRoot, sid);
    if (!folder) {
      return { ok: false, error: 'userdata-not-found', favoritesAppIds: [], appIdToTags: {} };
    }
    const sharedPath = path.join(steamRoot, 'userdata', folder, '7', 'remote', 'sharedconfig.vdf');
    let sharedRaw;
    try {
      sharedRaw = await fsp.readFile(sharedPath, 'utf8');
    } catch {
      return {
        ok: false,
        error: 'sharedconfig-missing',
        favoritesAppIds: [],
        appIdToTags: {},
        userdataFolder: folder,
      };
    }
    await yieldToEventLoop();
    let parsed;
    try {
      parsed = vdf.parse(sharedRaw);
    } catch (e) {
      console.warn('[SteamClient] sharedconfig parse failed:', e.message);
      return {
        ok: false,
        error: 'sharedconfig-parse',
        favoritesAppIds: [],
        appIdToTags: {},
        userdataFolder: folder,
      };
    }
    const apps = deepFindAppsObject(parsed);
    if (!apps) {
      return {
        ok: true,
        favoritesAppIds: [],
        appIdToTags: {},
        userdataFolder: folder,
        warning: 'no-apps-tree',
      };
    }
    const favoritesAppIds = [];
    const appIdToTags = {};
    const favSeen = new Set();

    Object.keys(apps).forEach((appKey) => {
      if (!/^\d+$/.test(appKey)) return;
      if (STEAM_TOOL_APP_IDS.has(appKey)) return;
      const node = apps[appKey];
      if (!node || typeof node !== 'object') return;
      let tags = parseSteamClientTags(node.tags);
      if (String(node.Favorite || node.favorite || '') === '1') {
        if (!favSeen.has(appKey)) {
          favSeen.add(appKey);
          favoritesAppIds.push(appKey);
        }
      }
      const favoriteViaTag = tags.some(tagLooksFavorite);
      if (favoriteViaTag) {
        if (!favSeen.has(appKey)) {
          favSeen.add(appKey);
          favoritesAppIds.push(appKey);
        }
        tags = tags.filter((t) => !tagLooksFavorite(t));
      }
      const rest = tags.filter((t) => !tagLooksFavorite(t));
      if (rest.length) appIdToTags[appKey] = rest;
    });

    return {
      ok: true,
      favoritesAppIds,
      appIdToTags,
      userdataFolder: folder,
    };
  }

  async function getSteamLibraries({ steamPath }) {
    try {
      const libraryVdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
      let libraryContent;
      try {
        libraryContent = await fsp.readFile(libraryVdfPath, 'utf8');
      } catch {
        return { libraries: [] };
      }
      const libraryFoldersData = vdf.parse(libraryContent);
      const libraries = [];
      const folders = libraryFoldersData.libraryfolders || {};
      for (const key of Object.keys(folders)) {
        const folder = folders[key];
        if (!folder?.path) continue;
        const libraryPath = path.join(folder.path, 'steamapps');
        if (await pathExists(libraryPath)) libraries.push(libraryPath);
      }
      return { libraries };
    } catch (error) {
      console.error('[Steam] Error parsing library folders:', error);
      return { libraries: [] };
    }
  }

  async function scanSteamGames({ libraryPaths }) {
    await loadPersistedScanCache();
    const quickSnapshot = await buildManifestSnapshotForPaths(libraryPaths);
    const cacheKey = quickSnapshot.normalizedPaths.join('|');
    const cachedByPaths = persistedScanCache.steamScanByPaths?.[cacheKey];
    if (
      cachedByPaths &&
      Array.isArray(cachedByPaths.games) &&
      quickSnapshot.count === Number(cachedByPaths.count || 0) &&
      quickSnapshot.fingerprint === cachedByPaths.fingerprint
    ) {
      return { games: cachedByPaths.games };
    }

    const games = [];
    for (const libraryPath of Array.isArray(libraryPaths) ? libraryPaths : []) {
      await readInstalledManifests(libraryPath, (appState) => {
        const row = toSteamGameRow(appState);
        if (row) games.push(row);
      });
    }
    const uniqueGames = dedupeByAppId(games);
    console.log(`[Steam] ${uniqueGames.length} unique games (${games.length} manifests).`);
    persistedScanCache.steamScanByPaths[cacheKey] = {
      count: quickSnapshot.count,
      fingerprint: quickSnapshot.fingerprint,
      games: uniqueGames,
      updatedAt: Date.now(),
    };
    persistScanCache();
    return { games: uniqueGames };
  }

  async function getInstalledEpicGames() {
    try {
      await loadPersistedScanCache();
      const epicManifestsDir = 'C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests';
      let files;
      try {
        files = (await fsp.readdir(epicManifestsDir)).filter((f) => f.endsWith('.item'));
      } catch {
        return { error: 'Could not find Epic Games manifests directory.' };
      }
      let maxMtimeMs = 0;
      for (const file of files) {
        try {
          const stat = await fsp.stat(path.join(epicManifestsDir, file));
          if (stat?.mtimeMs && stat.mtimeMs > maxMtimeMs) {
            maxMtimeMs = stat.mtimeMs;
          }
        } catch {
          /* ignore */
        }
      }
      const quickSnapshot = {
        count: files.length,
        fingerprint: `${files.length}|${Math.floor(maxMtimeMs)}`,
      };
      const cachedEpic = persistedScanCache.epicInstalled;
      if (
        cachedEpic &&
        Array.isArray(cachedEpic.games) &&
        quickSnapshot.count === Number(cachedEpic.count || 0) &&
        quickSnapshot.fingerprint === cachedEpic.fingerprint
      ) {
        return { games: cachedEpic.games };
      }
      const games = [];
      for (let i = 0; i < files.length; i += 1) {
        if (i > 0 && i % SCAN_YIELD_EVERY === 0) await yieldToEventLoop();
        try {
          const manifest = JSON.parse(await fsp.readFile(path.join(epicManifestsDir, files[i]), 'utf-8'));
          const name = manifest.DisplayName;
          const appName = manifest.AppName;
          const image = manifest.DisplayImage || manifest.ImageUrl || null;
          if (name && appName) games.push({ name, appName, image });
        } catch (err) {
          console.warn('[EpicScan] Failed to parse', files[i], err?.message || err);
        }
      }
      console.log(`[EpicScan] Found ${games.length} installed Epic games.`);
      persistedScanCache.epicInstalled = {
        count: quickSnapshot.count,
        fingerprint: quickSnapshot.fingerprint,
        games,
        updatedAt: Date.now(),
      };
      persistScanCache();
      return { games };
    } catch (err) {
      console.error('[EpicScan] Error scanning Epic games:', err);
      return { error: err.message };
    }
  }

  /** Short in-memory memo so repeat IPC (widgets + prefetch) skips even the fingerprint walk. */
  const RESULT_MEMO_TTL_MS = 60 * 1000;
  const resultMemo = { steam: null, epic: null };
  const peekMemo = (key) => {
    const entry = resultMemo[key];
    return entry && Date.now() - entry.at < RESULT_MEMO_TTL_MS ? entry.value : null;
  };
  const withMemo = (key, fn) => async (...args) => {
    const result = await fn(...args);
    if (result && !result.error) resultMemo[key] = { at: Date.now(), value: result };
    return result;
  };

  const scanMemoKey = (libraryPaths) => `scan:${normalizeLibraryPaths(libraryPaths).join('|')}`;

  return {
    scanSteamGames: async ({ libraryPaths }) => {
      const key = scanMemoKey(libraryPaths);
      const result = await scanSteamGames({ libraryPaths });
      if (result && !result.error) resultMemo[key] = { at: Date.now(), value: result };
      return result;
    },
    peekScanSteamGames: ({ libraryPaths }) => peekMemo(scanMemoKey(libraryPaths)),
    getInstalledSteamGames: withMemo('steam', getInstalledSteamGames),
    peekInstalledSteamGames: () => peekMemo('steam'),
    getInstalledEpicGames: withMemo('epic', getInstalledEpicGames),
    peekInstalledEpicGames: () => peekMemo('epic'),
    getSteamEnrichedGames,
    getSteamFriendsPlaying,
    getSteamClientLibraryMetadata,
    detectSteamInstallation,
    getSteamLibraries,
  };
}

module.exports = {
  createGameSourceService,
};
