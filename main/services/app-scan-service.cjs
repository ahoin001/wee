const { runExclusive } = require('./scan-serialization.cjs');

function createAppScanService({
  fs,
  fsPromises,
  path,
  os,
  nativeImage,
  wsQuery,
  scanCacheFile = null,
  cacheTtlMs = 24 * 60 * 60 * 1000,
}) {
  let appsCache = null;
  let appsCacheTime = 0;
  let persistedCacheLoaded = false;
  let persistedScanSnapshot = null;

  async function loadPersistedScanSnapshot() {
    if (persistedCacheLoaded || !scanCacheFile) return;
    persistedCacheLoaded = true;
    try {
      const raw = await fsPromises.readFile(scanCacheFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
        // v2+ includes browser probes + Desktop shortcut dirs — ignore older snapshots.
        if (Number(parsed.version) < 2) {
          persistedScanSnapshot = null;
          return;
        }
        persistedScanSnapshot = {
          items: parsed.items,
          count: Number(parsed.count) || 0,
          fingerprint: typeof parsed.fingerprint === 'string' ? parsed.fingerprint : null,
          updatedAt: Number(parsed.updatedAt) || 0,
        };
      }
    } catch {
      persistedScanSnapshot = null;
    }
  }

  async function persistScanSnapshot(items, snapshot) {
    if (!scanCacheFile) return;
    try {
      await fsPromises.mkdir(path.dirname(scanCacheFile), { recursive: true });
      const payload = {
        version: 2,
        items: Array.isArray(items) ? items : [],
        count: Number(snapshot?.count) || 0,
        fingerprint: typeof snapshot?.fingerprint === 'string' ? snapshot.fingerprint : null,
        updatedAt: Date.now(),
      };
      await fsPromises.writeFile(scanCacheFile, JSON.stringify(payload, null, 2), 'utf-8');
      persistedScanSnapshot = payload;
    } catch (error) {
      console.warn('[apps:scan-cache] Failed to persist scan snapshot:', error?.message || error);
    }
  }

  async function buildInstalledAppsQuickSnapshot(startMenuDirs) {
    let lnkCount = 0;
    let maxLnkMtimeMs = 0;
    let directoryCount = 0;

    async function walk(dir) {
      let entries = [];
      try {
        entries = await fsPromises.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          directoryCount += 1;
          await walk(fullPath);
          continue;
        }
        if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.lnk')) {
          continue;
        }
        lnkCount += 1;
        try {
          const stat = await fsPromises.stat(fullPath);
          if (stat?.mtimeMs && stat.mtimeMs > maxLnkMtimeMs) {
            maxLnkMtimeMs = stat.mtimeMs;
          }
        } catch {
          /* ignore stat failures */
        }
      }
    }

    for (const dir of startMenuDirs) {
      await walk(dir);
    }

    return {
      count: lnkCount,
      fingerprint: `${lnkCount}|${directoryCount}|${Math.floor(maxLnkMtimeMs)}`,
    };
  }

  function getShortcutScanDirs() {
    const home = os.homedir();
    return [
      path.join(home, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
      path.join('C:', 'ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
      // Desktop shortcuts are common for browsers (Chrome often lands here without Start Menu entry).
      path.join(home, 'Desktop'),
      path.join('C:', 'Users', 'Public', 'Desktop'),
    ];
  }

  const yieldToEventLoop = () => new Promise((resolve) => setImmediate(resolve));
  const pathExists = (p) =>
    p ? fsPromises.access(p).then(() => true, () => false) : Promise.resolve(false);

  /** `nativeImage.createFromPath` is synchronous — yield after each extraction. */
  async function iconFromExe(exePath) {
    let dataUrl = null;
    try {
      const iconImg = nativeImage.createFromPath(exePath);
      if (!iconImg.isEmpty()) dataUrl = iconImg.toDataURL();
    } catch {
      /* ignore icon extraction failures */
    }
    await yieldToEventLoop();
    return dataUrl;
  }

  async function pushAppIfMissing(results, seenPaths, app) {
    const normalizedPath = String(app.path || '').trim().toLowerCase();
    if (!normalizedPath || seenPaths.has(normalizedPath)) return false;
    if (!(await pathExists(app.path))) return false;
    seenPaths.add(normalizedPath);
    results.push({
      name: app.name,
      path: app.path,
      args: app.args || '',
      icon: app.icon || (await iconFromExe(app.path)),
      lnk: app.lnk || null,
    });
    return true;
  }

  /** Direct exe probes for apps that frequently lack Start Menu shortcuts. */
  async function probeCommonBrowserPaths(results, seenPaths) {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    const browsers = [
      {
        name: 'Google Chrome',
        paths: [
          path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        ],
      },
      {
        name: 'Microsoft Edge',
        paths: [
          path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        ],
      },
      {
        name: 'Mozilla Firefox',
        paths: [
          path.join(programFiles, 'Mozilla Firefox', 'firefox.exe'),
          path.join(programFilesX86, 'Mozilla Firefox', 'firefox.exe'),
        ],
      },
    ];

    for (const browser of browsers) {
      for (const exePath of browser.paths) {
        if (await pushAppIfMissing(results, seenPaths, { name: browser.name, path: exePath })) {
          break;
        }
      }
    }
  }

  async function scanInstalledApps() {
    const shortcutDirs = getShortcutScanDirs();
    const results = [];
    const seenPaths = new Set();
    let lnkProcessed = 0;
    const yieldIfNeeded = async () => {
      lnkProcessed += 1;
      if (lnkProcessed % 8 === 0) {
        await yieldToEventLoop();
      }
    };

    const systemApps = [
      { name: 'File Explorer', path: 'C:\\Windows\\explorer.exe', args: '', icon: null, lnk: null },
      { name: 'Notepad', path: 'C:\\Windows\\System32\\notepad.exe', args: '', icon: null, lnk: null },
      { name: 'Calculator', path: 'C:\\Windows\\System32\\calc.exe', args: '', icon: null, lnk: null },
      { name: 'Paint', path: 'C:\\Windows\\System32\\mspaint.exe', args: '', icon: null, lnk: null },
      { name: 'Command Prompt', path: 'C:\\Windows\\System32\\cmd.exe', args: '', icon: null, lnk: null },
      { name: 'Windows PowerShell', path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', args: '', icon: null, lnk: null },
    ];

    for (const app of systemApps) {
      await pushAppIfMissing(results, seenPaths, app);
    }

    // Discord: prefer Update.exe --processStart (stable across versioned app-* folders).
    const discordBasePath = path.join(os.homedir(), 'AppData', 'Local', 'Discord');
    if (await pathExists(discordBasePath)) {
      try {
        const discordDirs = await fsPromises.readdir(discordBasePath);
        const appDirs = discordDirs.filter((dir) => dir.startsWith('app-')).sort().reverse();
        const discordUpdatePath = path.join(discordBasePath, 'Update.exe');
        if (await pathExists(discordUpdatePath)) {
          let iconDataUrl = null;
          for (const appDir of appDirs) {
            const discordExePath = path.join(discordBasePath, appDir, 'Discord.exe');
            if (await pathExists(discordExePath)) {
              iconDataUrl = await iconFromExe(discordExePath);
              break;
            }
          }
          await pushAppIfMissing(results, seenPaths, {
            name: 'Discord',
            path: discordUpdatePath,
            args: '--processStart Discord.exe',
            icon: iconDataUrl,
            lnk: null,
          });
        }
      } catch (err) {
        console.log(`[scanInstalledApps] Error scanning Discord directory: ${err.message}`);
      }
    }

    await probeCommonBrowserPaths(results, seenPaths);

    async function scanDir(dir) {
      try {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            // Desktop: only top-level .lnk files (avoid deep user folders).
            if (path.basename(dir).toLowerCase() === 'desktop') continue;
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.lnk')) {
            await yieldIfNeeded();
            try {
              const shortcut = await wsQuery(fullPath);
              const targetExists = Boolean(shortcut?.target) && (await pathExists(shortcut.target));
              if (targetExists) {
                const appName = path.basename(entry.name, '.lnk');
                const targetPath = shortcut.target.toLowerCase();
                const targetBase = path.basename(shortcut.target).toLowerCase();
                const isDiscordUpdate = targetPath.includes('discord') && targetBase === 'update.exe';
                const isUpdater = !isDiscordUpdate && (
                  targetBase === 'update.exe' ||
                  targetBase === 'updater.exe' ||
                  targetBase === 'installer.exe' ||
                  targetBase === 'uninstall.exe' ||
                  targetBase === 'launcher.exe' ||
                  targetBase === 'helper.exe'
                );

                const normalizedTarget = String(shortcut.target).trim().toLowerCase();
                if (!isUpdater && !seenPaths.has(normalizedTarget)) {
                  // Icon extraction only for shortcuts we keep (not duplicates / updaters).
                  let iconDataUrl = null;
                  if (shortcut.icon) {
                    const iconPath = String(shortcut.icon).split(',')[0];
                    if (await pathExists(iconPath)) iconDataUrl = await iconFromExe(iconPath);
                  }
                  await pushAppIfMissing(results, seenPaths, {
                    name: appName,
                    path: shortcut.target,
                    args: shortcut.args || '',
                    icon: iconDataUrl,
                    lnk: fullPath,
                  });
                }
              }
            } catch {}
          }
        }
      } catch {}
    }

    for (const dir of shortcutDirs) {
      await scanDir(dir);
    }

    console.log(`[scanInstalledApps] Found ${results.length} apps after path deduplication`);
    const snapshot = await buildInstalledAppsQuickSnapshot(shortcutDirs);
    return {
      apps: results,
      snapshot,
    };
  }

  /** Synchronous cache hit (no IO) — lets IPC bypass the scan queue. */
  function peekInstalledApps() {
    if (appsCache && Date.now() - appsCacheTime < cacheTtlMs) return appsCache;
    return null;
  }

  let backgroundRefresh = null;
  function scheduleBackgroundRescan() {
    if (backgroundRefresh) return;
    backgroundRefresh = runExclusive(() => rescanInstalledApps())
      .catch((error) => {
        console.warn('[apps:getInstalled] Background rescan failed:', error?.message || error);
      })
      .finally(() => {
        backgroundRefresh = null;
      });
  }

  async function getInstalledApps() {
    const now = Date.now();
    if (appsCache && (now - appsCacheTime < cacheTtlMs)) {
      return appsCache;
    }
    await loadPersistedScanSnapshot();
    const shortcutDirs = getShortcutScanDirs();

    if (persistedScanSnapshot?.items?.length) {
      try {
        const quickSnapshot = await buildInstalledAppsQuickSnapshot(shortcutDirs);
        appsCache = persistedScanSnapshot.items;
        appsCacheTime = now;
        const fresh =
          quickSnapshot.count === persistedScanSnapshot.count &&
          quickSnapshot.fingerprint === persistedScanSnapshot.fingerprint;
        // Stale-while-revalidate: answer from the snapshot now, rescan in the serialized queue.
        if (!fresh) scheduleBackgroundRescan();
        return appsCache;
      } catch (error) {
        console.warn('[apps:getInstalled] Quick snapshot check failed, falling back to full scan:', error?.message || error);
      }
    }

    const result = await scanInstalledApps();
    const deduped = Array.isArray(result?.apps) ? result.apps : [];
    appsCache = deduped;
    appsCacheTime = now;
    await persistScanSnapshot(deduped, result?.snapshot);
    return deduped;
  }

  async function rescanInstalledApps() {
    const result = await scanInstalledApps();
    const deduped = Array.isArray(result?.apps) ? result.apps : [];
    appsCache = deduped;
    appsCacheTime = Date.now();
    await persistScanSnapshot(deduped, result?.snapshot);
    return deduped;
  }

  return {
    peekInstalledApps,
    getInstalledApps,
    rescanInstalledApps,
  };
}

module.exports = {
  createAppScanService,
};
