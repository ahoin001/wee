function createAppScanService({
  fs,
  fsPromises,
  path,
  os,
  nativeImage,
  wsQuery,
  cacheTtlMs = 24 * 60 * 60 * 1000,
}) {
  let appsCache = null;
  let appsCacheTime = 0;

  async function scanInstalledApps() {
    console.log('[scanInstalledApps] Starting app scan...');
    const startMenuDirs = [
      path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
      path.join('C:', 'ProgramData', 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    ];
    console.log('[scanInstalledApps] Scanning directories:', startMenuDirs);
    const results = [];
    let lnkProcessed = 0;
    const yieldIfNeeded = async () => {
      lnkProcessed += 1;
      if (lnkProcessed % 48 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
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

    const commonApps = [
      {
        name: 'Discord',
        paths: [
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9013\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9012\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9011\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9010\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9009\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9008\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9007\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9006\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9005\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9004\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9003\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9002\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9001\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\app-1.0.9000\\Discord.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Discord\\Discord.exe',
        ],
        args: '',
        icon: null,
        lnk: null,
      },
    ];

    for (const app of systemApps) {
      if (fs.existsSync(app.path)) {
        try {
          const iconImg = nativeImage.createFromPath(app.path);
          if (!iconImg.isEmpty()) app.icon = iconImg.toDataURL();
        } catch {}
        console.log(`[scanInstalledApps] Adding system app: ${app.name} -> ${app.path}`);
        results.push(app);
      } else {
        console.log(`[scanInstalledApps] System app not found: ${app.name} -> ${app.path}`);
      }
    }

    for (const app of commonApps) {
      if (app.name === 'Discord') {
        const discordBasePath = path.join(os.homedir(), 'AppData', 'Local', 'Discord');
        if (fs.existsSync(discordBasePath)) {
          try {
            const discordDirs = await fsPromises.readdir(discordBasePath);
            const appDirs = discordDirs.filter((dir) => dir.startsWith('app-')).sort().reverse();
            const discordUpdatePath = path.join(discordBasePath, 'Update.exe');
            if (fs.existsSync(discordUpdatePath)) {
              try {
                let iconDataUrl = null;
                for (const appDir of appDirs) {
                  const discordExePath = path.join(discordBasePath, appDir, 'Discord.exe');
                  if (fs.existsSync(discordExePath)) {
                    try {
                      const iconImg = nativeImage.createFromPath(discordExePath);
                      if (!iconImg.isEmpty()) iconDataUrl = iconImg.toDataURL();
                    } catch {}
                    break;
                  }
                }
                console.log(`[scanInstalledApps] Adding Discord: ${app.name} -> ${discordUpdatePath} --processStart Discord.exe`);
                results.push({
                  name: app.name,
                  path: discordUpdatePath,
                  args: '--processStart Discord.exe',
                  icon: iconDataUrl,
                  lnk: null,
                });
                break;
              } catch (err) {
                console.log(`[scanInstalledApps] Error processing Discord: ${err.message}`);
              }
            }
          } catch (err) {
            console.log(`[scanInstalledApps] Error scanning Discord directory: ${err.message}`);
          }
        }
      } else {
        for (const appPath of app.paths) {
          const resolvedPath = appPath.replace('%USERNAME%', os.userInfo().username);
          if (fs.existsSync(resolvedPath)) {
            try {
              const iconImg = nativeImage.createFromPath(resolvedPath);
              if (!iconImg.isEmpty()) app.icon = iconImg.toDataURL();
            } catch {}
            console.log(`[scanInstalledApps] Adding common app: ${app.name} -> ${resolvedPath}`);
            results.push({
              name: app.name,
              path: resolvedPath,
              args: app.args || '',
              icon: app.icon,
              lnk: null,
            });
            break;
          }
        }
      }
    }

    async function scanDir(dir) {
      try {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.lnk')) {
            await yieldIfNeeded();
            try {
              const shortcut = await wsQuery(fullPath);
              let iconDataUrl = null;
              if (shortcut && shortcut.icon) {
                try {
                  let iconPath = shortcut.icon;
                  if (iconPath.includes(',')) iconPath = iconPath.split(',')[0];
                  if (fs.existsSync(iconPath)) {
                    const iconImg = nativeImage.createFromPath(iconPath);
                    if (!iconImg.isEmpty()) iconDataUrl = iconImg.toDataURL();
                  }
                } catch {}
              }
              if (!iconDataUrl && shortcut && shortcut.target && fs.existsSync(shortcut.target)) {
                try {
                  const iconImg = nativeImage.createFromPath(shortcut.target);
                  if (!iconImg.isEmpty()) iconDataUrl = iconImg.toDataURL();
                } catch {}
              }

              if (shortcut && shortcut.target && fs.existsSync(shortcut.target)) {
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

                if (!isUpdater) {
                  console.log(`[scanInstalledApps] Adding shortcut: ${appName} -> ${shortcut.target}`);
                  results.push({
                    name: appName,
                    path: shortcut.target,
                    args: shortcut.args || '',
                    icon: iconDataUrl,
                    lnk: fullPath,
                  });
                } else {
                  console.log(`[scanInstalledApps] Skipping updater: ${appName} -> ${shortcut.target}`);
                }
              } else if (shortcut && shortcut.target) {
                console.log(`[scanInstalledApps] Shortcut target not found: ${path.basename(entry.name, '.lnk')} -> ${shortcut.target}`);
              }
            } catch {}
          }
        }
      } catch {}
    }

    for (const dir of startMenuDirs) {
      await scanDir(dir);
    }

    console.log(`[scanInstalledApps] Found ${results.length} apps before deduplication`);
    const seen = new Set();
    const deduped = results.filter((app) => {
      const key = `${app.name}|${app.path}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    console.log(`[scanInstalledApps] Returning ${deduped.length} apps after deduplication`);
    return deduped;
  }

  async function getInstalledApps() {
    console.log('[apps:getInstalled] Called');
    const now = Date.now();
    if (appsCache && (now - appsCacheTime < cacheTtlMs)) {
      console.log('[apps:getInstalled] Using cached apps:', appsCache.length);
      return appsCache;
    }
    console.log('[apps:getInstalled] Cache miss, scanning apps...');
    const deduped = await scanInstalledApps();
    appsCache = deduped;
    appsCacheTime = now;
    console.log('[apps:getInstalled] Returning apps:', deduped.length);
    return deduped;
  }

  async function rescanInstalledApps() {
    console.log('[apps:rescanInstalled] Called - forcing fresh scan');
    const deduped = await scanInstalledApps();
    appsCache = deduped;
    appsCacheTime = Date.now();
    console.log('[apps:rescanInstalled] Returning apps:', deduped.length);
    return deduped;
  }

  return {
    getInstalledApps,
    rescanInstalledApps,
  };
}

module.exports = {
  createAppScanService,
};
