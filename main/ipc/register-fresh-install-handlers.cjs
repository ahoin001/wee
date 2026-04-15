function registerFreshInstallHandlers({
  ipcMain,
  app,
  path,
  fsPromises,
  fsExtra,
  currentVersion,
  minVersionForFreshStart,
}) {
  ipcMain.handle('get-fresh-install-info', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const versionFile = path.join(userDataPath, 'version.json');

      let installedVersion = '0.0.0';
      let backupLocation = null;

      try {
        const hasVersion = await fsPromises.access(versionFile).then(() => true).catch(() => false);
        if (hasVersion) {
          const versionData = JSON.parse(await fsPromises.readFile(versionFile, 'utf-8'));
          installedVersion = versionData.version || '0.0.0';
        }
      } catch (error) {
        console.log('[FRESH_INSTALL] Could not read version file:', error.message);
      }

      const backupDirs = await fsPromises.readdir(userDataPath);
      const backupDir = backupDirs.find((dir) => dir.startsWith('data_backup_'));
      if (backupDir) {
        backupLocation = path.join(userDataPath, backupDir);
      }

      return {
        currentVersion: installedVersion,
        backupLocation,
        needsFreshInstall: installedVersion < minVersionForFreshStart,
      };
    } catch (error) {
      console.error('[FRESH_INSTALL] Error getting fresh install info:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('trigger-fresh-install', async () => {
    try {
      console.log('[FRESH_INSTALL] Manual fresh install triggered by user');
      const userDataPath = app.getPath('userData');
      const dataDir = path.join(userDataPath, 'data');

      const backupDir = path.join(userDataPath, `data_backup_${Date.now()}`);
      if (await fsPromises.access(dataDir).then(() => true).catch(() => false)) {
        console.log('[FRESH_INSTALL] Backing up current data directory...');
        await fsExtra.move(dataDir, backupDir);
        console.log(`[FRESH_INSTALL] Current data backed up to: ${backupDir}`);
      }

      const filesToRemove = [
        'settings.json',
        'sounds.json',
        'wallpapers.json',
        'channels.json',
        'presets.json',
        'savedSounds.json',
      ];

      for (const file of filesToRemove) {
        const filePath = path.join(userDataPath, file);
        try {
          if (await fsPromises.access(filePath).then(() => true).catch(() => false)) {
            await fsPromises.unlink(filePath);
            console.log(`[FRESH_INSTALL] Removed old file: ${file}`);
          }
        } catch (error) {
          console.log(`[FRESH_INSTALL] Could not remove ${file}: ${error.message}`);
        }
      }

      await fsPromises.mkdir(dataDir, { recursive: true });
      console.log('[FRESH_INSTALL] Created fresh data directory');

      const versionFile = path.join(userDataPath, 'version.json');
      await fsPromises.writeFile(versionFile, JSON.stringify({ version: currentVersion }, null, 2));
      console.log(`[FRESH_INSTALL] Updated version to ${currentVersion}`);
      console.log('[FRESH_INSTALL] Manual fresh install completed successfully!');

      return {
        success: true,
        backupLocation: backupDir,
        message: 'Fresh install completed successfully. Your old data has been backed up.',
      };
    } catch (error) {
      console.error('[FRESH_INSTALL] Error during manual fresh install:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerFreshInstallHandlers,
};
