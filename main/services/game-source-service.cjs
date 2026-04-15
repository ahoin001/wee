function createGameSourceService({ fs, path, vdf, os }) {
  function normalizeSteamEnrichment(recentlyPlayed, ownedGames) {
    const map = new Map();
    (ownedGames || []).forEach((item) => {
      if (!item?.appid) return;
      const appId = String(item.appid);
      map.set(appId, {
        appId,
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
        playtimeForever: 0,
        playtimeRecent: 0,
        lastPlayedAt: 0,
      };
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
        statusReason: 'Steam Web API key is not configured.',
        error: 'Steam Web API key is not configured.',
      };
    }

    try {
      const recentlyPlayedUrl =
        `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${encodeURIComponent(resolvedApiKey)}&steamid=${encodeURIComponent(steamId)}&format=json`;
      const ownedGamesUrl =
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(resolvedApiKey)}&steamid=${encodeURIComponent(steamId)}&format=json&include_appinfo=0&include_played_free_games=1`;

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
      );

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
  async function getInstalledSteamGames() {
    try {
      let steamPath = 'C:/Program Files (x86)/Steam';
      const libraryVdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
      if (!fs.existsSync(libraryVdfPath)) {
        const home = os.homedir();
        const altPaths = [
          path.join(home, 'AppData', 'Local', 'Steam'),
          path.join(home, 'AppData', 'Roaming', 'Steam'),
          path.join('D:/Steam'),
          path.join('E:/Steam'),
        ];
        let found = false;
        for (const alt of altPaths) {
          const altVdf = path.join(alt, 'steamapps', 'libraryfolders.vdf');
          if (fs.existsSync(altVdf)) {
            steamPath = alt;
            found = true;
            break;
          }
        }
        if (!found) {
          console.error('[SteamScan] Could not find Steam installation.');
          return { error: 'Could not find Steam installation.' };
        }
      }
      console.log('[SteamScan] Using Steam path:', steamPath);
      const libraryVdf = fs.readFileSync(path.join(steamPath, 'steamapps', 'libraryfolders.vdf'), 'utf-8');
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

      console.log('[SteamScan] Scanning libraries:', libraryPaths);
      const games = [];
      for (const libPath of libraryPaths) {
        const steamapps = path.join(libPath, 'steamapps');
        if (!fs.existsSync(steamapps)) continue;
        const files = fs.readdirSync(steamapps);
        const manifestFiles = files.filter((file) => file.startsWith('appmanifest_') && file.endsWith('.acf'));
        console.log(`[SteamScan] Found ${manifestFiles.length} manifest files in ${libPath}`);

        for (const file of manifestFiles) {
          try {
            const manifest = vdf.parse(fs.readFileSync(path.join(steamapps, file), 'utf-8'));
            const appState = manifest.AppState;
            const appid = appState.appid;
            const name = appState.name;
            if (appid && name) {
              console.log(`[SteamScan] Game: ${name} (${appid}), StateFlags: "${appState.StateFlags}", SizeOnDisk: ${appState.SizeOnDisk}`);
              const isInstalled = parseInt(appState.SizeOnDisk) > 0;
              if (isInstalled) {
                games.push({
                  appId: appid,
                  name,
                  installed: isInstalled,
                  sizeOnDisk: parseInt(appState.SizeOnDisk) || 0,
                  lastUpdated: parseInt(appState.LastUpdated) || 0,
                  installdir: appState.installdir || '',
                  sizeGB: Math.round(((parseInt(appState.SizeOnDisk) || 0) / (1024 * 1024 * 1024)) * 100) / 100,
                });
              } else {
                console.log(`[SteamScan] Skipping uninstalled game: ${name} (${appid})`);
              }
            }
          } catch (err) {
            console.warn('[SteamScan] Failed to parse', file, err);
          }
        }
      }
      const uniqueGames = games.filter((game, index, self) => {
        const firstIndex = self.findIndex((g) => g.appId === game.appId);
        if (index === firstIndex) {
          console.log(`[SteamScan] Keeping game: ${game.name} (${game.appId}) from library ${game.installdir || 'unknown'}`);
          return true;
        }
        console.log(`[SteamScan] Skipping duplicate: ${game.name} (${game.appId}) from library ${game.installdir || 'unknown'}`);
        return false;
      });

      console.log(`[SteamScan] Found ${games.length} total games, ${uniqueGames.length} unique installed Steam games.`);
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
        try {
          const steamExePath = path.join(steamPath, 'Steam.exe');
          if (fs.existsSync(steamExePath)) {
            return { found: true, steamPath };
          }
        } catch {}
      }

      return { found: false, steamPath: null };
    } catch (error) {
      console.error('[Steam] Error detecting installation:', error);
      return { found: false, steamPath: null };
    }
  }

  async function getSteamLibraries({ steamPath }) {
    try {
      const libraryVdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
      if (!fs.existsSync(libraryVdfPath)) {
        return { libraries: [] };
      }

      const libraryContent = fs.readFileSync(libraryVdfPath, 'utf8');
      const libraryFoldersData = vdf.parse(libraryContent);
      const libraries = [];
      if (libraryFoldersData.libraryfolders) {
        Object.keys(libraryFoldersData.libraryfolders).forEach((key) => {
          const folder = libraryFoldersData.libraryfolders[key];
          if (folder.path) {
            const libraryPath = path.join(folder.path, 'steamapps');
            if (fs.existsSync(libraryPath)) {
              libraries.push(libraryPath);
            }
          }
        });
      }

      console.log(`[Steam] Found ${libraries.length} library folders:`, libraries);
      return { libraries };
    } catch (error) {
      console.error('[Steam] Error parsing library folders:', error);
      return { libraries: [] };
    }
  }

  async function scanSteamGames({ libraryPaths }) {
    const games = [];

    for (const libraryPath of libraryPaths) {
      try {
        const files = fs.readdirSync(libraryPath);
        const manifestFiles = files.filter((file) => file.startsWith('appmanifest_') && file.endsWith('.acf'));

        console.log(`[Steam] Found ${manifestFiles.length} games in ${libraryPath}`);
        for (const manifestFile of manifestFiles) {
          try {
            const manifestPath = path.join(libraryPath, manifestFile);
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            const manifestData = vdf.parse(manifestContent);

            if (manifestData.AppState) {
              const appState = manifestData.AppState;
              const isInstalled = parseInt(appState.SizeOnDisk) > 0;
              if (isInstalled) {
                games.push({
                  appId: appState.appid,
                  name: appState.name,
                  installed: isInstalled,
                  sizeOnDisk: parseInt(appState.SizeOnDisk) || 0,
                  lastUpdated: parseInt(appState.LastUpdated) || 0,
                  installdir: appState.installdir,
                  sizeGB: Math.round(((parseInt(appState.SizeOnDisk) || 0) / (1024 * 1024 * 1024)) * 100) / 100,
                });
              } else {
                console.log(`[SteamScan] Skipping uninstalled game: ${appState.name} (${appState.appid})`);
              }
            }
          } catch (error) {
            console.warn(`[Steam] Error parsing manifest ${manifestFile}:`, error.message);
          }
        }
      } catch (error) {
        console.error(`[Steam] Error scanning library ${libraryPath}:`, error);
      }
    }

    const uniqueGames = games.filter((game, index, self) => {
      const firstIndex = self.findIndex((g) => g.appId === game.appId);
      if (index === firstIndex) {
        console.log(`[Steam] Keeping game: ${game.name} (${game.appId})`);
        return true;
      }
      console.log(`[Steam] Skipping duplicate: ${game.name} (${game.appId})`);
      return false;
    });

    console.log(`[Steam] Total games found: ${games.length}, unique games: ${uniqueGames.length}`);
    return { games: uniqueGames };
  }

  async function getInstalledEpicGames() {
    try {
      const epicManifestsDir = 'C:/ProgramData/Epic/EpicGamesLauncher/Data/Manifests';
      if (!fs.existsSync(epicManifestsDir)) {
        console.error('[EpicScan] Could not find Epic Games manifests directory.');
        return { error: 'Could not find Epic Games manifests directory.' };
      }
      const files = fs.readdirSync(epicManifestsDir).filter((f) => f.endsWith('.item'));
      const games = [];
      for (const file of files) {
        try {
          const manifest = JSON.parse(fs.readFileSync(path.join(epicManifestsDir, file), 'utf-8'));
          const name = manifest.DisplayName;
          const appName = manifest.AppName;
          const image = manifest.DisplayImage || manifest.ImageUrl || null;
          if (name && appName) {
            console.log(`[EpicScan] Found game: ${name} (appName: ${appName})`);
            games.push({ name, appName, image });
          } else {
            console.log('[EpicScan] Skipping game with missing data:', { name, appName });
          }
        } catch (err) {
          console.warn('[EpicScan] Failed to parse', file, err);
        }
      }
      console.log(`[EpicScan] Found ${games.length} installed Epic games.`);
      console.log('[EpicScan] Games data:', games);
      return { games };
    } catch (err) {
      console.error('[EpicScan] Error scanning Epic games:', err);
      return { error: err.message };
    }
  }

  return {
    getInstalledSteamGames,
    getSteamEnrichedGames,
    detectSteamInstallation,
    getSteamLibraries,
    scanSteamGames,
    getInstalledEpicGames,
  };
}

module.exports = {
  createGameSourceService,
};
