const { runExclusive } = require('../services/scan-serialization.cjs');

function registerSystemCommandHandlers({
  ipcMain,
  exec,
}) {
  function isLikelyStoreAppId(appId) {
    if (!appId || typeof appId !== 'string') return false;
    const normalized = appId.trim();
    if (!normalized.includes('!')) return false;
    // Package-backed AUMID is usually "PackageFamily!AppId"; keep this broad to avoid false negatives.
    if (!/^[^\s!]+![^\s!]+$/.test(normalized)) return false;
    // Desktop aliases often leak here but are not store identifiers.
    if (/\.exe/i.test(normalized)) return false;
    if (normalized.includes('\\') || normalized.includes('/')) return false;
    return true;
  }

  ipcMain.handle('uwp:list-apps', async () => {
    return runExclusive(
      () =>
        new Promise((resolve) => {
          exec(
            'powershell -Command "Get-StartApps | Select-Object Name, AppID | ConvertTo-Json"',
            { encoding: 'utf8', maxBuffer: 1024 * 1024 },
            (err, stdout) => {
              if (err) return resolve([]);
              try {
                const data = JSON.parse(stdout);
                const apps = Array.isArray(data) ? data : [data];
                resolve(
                  apps
                    .map((app) => ({ name: app.Name, appId: app.AppID }))
                    .filter((app) => app.name && isLikelyStoreAppId(app.appId))
                );
              } catch {
                resolve([]);
              }
            }
          );
        })
    );
  });

  ipcMain.handle('uwp:launch', async (_event, appId) => {
    return new Promise((resolve) => {
      if (!appId) return resolve({ success: false, error: 'No AppID provided' });
      exec(`start shell:AppsFolder\\${appId}`, (err) => {
        if (err) return resolve({ success: false, error: err.message });
        resolve({ success: true });
      });
    });
  });

  ipcMain.handle('execute-command', async (_event, command) => {
    return new Promise((resolve) => {
      if (!command) return resolve({ success: false, error: 'No command provided' });
      exec(`cmd /c ${command}`, (err, stdout, stderr) => {
        if (err) {
          console.error('Error executing command:', err);
          return resolve({ success: false, error: err.message });
        }
        console.log('Command executed successfully:', command);
        resolve({ success: true, stdout, stderr });
      });
    });
  });
}

module.exports = {
  registerSystemCommandHandlers,
};
