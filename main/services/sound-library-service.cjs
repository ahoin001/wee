function createSoundLibraryService({
  process,
  path,
  fsPromises,
  appBasePath,
  savedSoundsPath,
  userSoundsPath,
  soundTypes,
  defaultSounds,
  getMainWindow,
  readJson,
  writeJson,
}) {
  async function ensureDefaultSoundsExist() {
    const isDev = process.env.NODE_ENV === 'development';
    const sourceBasePath = isDev
      ? path.join(appBasePath, 'public', 'sounds')
      : path.join(process.resourcesPath, 'public', 'sounds');

    console.log(`[SOUNDS] Ensuring default sounds exist from: ${sourceBasePath}`);

    for (const soundType of soundTypes) {
      for (const sound of defaultSounds[soundType]) {
        try {
          const sourcePath = path.join(sourceBasePath, sound.filename);
          const targetPath = path.join(userSoundsPath, sound.filename);
          try {
            await fsPromises.access(targetPath);
            console.log(`[SOUNDS] Default sound already exists: ${sound.filename} at ${targetPath}`);
          } catch {
            await fsPromises.copyFile(sourcePath, targetPath);
            console.log(`[SOUNDS] Copied default sound: ${sound.filename} from ${sourcePath} to ${targetPath}`);
          }
        } catch (error) {
          console.error(`[SOUNDS] Failed to copy default sound ${sound.filename}:`, error);
        }
      }
    }
  }

  function getDevServerUrl(filename) {
    const mainWindow = getMainWindow();
    if (mainWindow && mainWindow.webContents) {
      const currentUrl = mainWindow.webContents.getURL();
      if (currentUrl && currentUrl.includes('localhost:')) {
        const portMatch = currentUrl.match(/localhost:(\d+)/);
        if (portMatch) {
          return `http://localhost:${portMatch[1]}/sounds/${filename}`;
        }
      }
    }
    return `http://localhost:5173/sounds/${filename}`;
  }

  async function refreshSoundLibraryUrls() {
    if (process.env.NODE_ENV !== 'development') return;

    try {
      const library = await readJson(savedSoundsPath, null);
      if (!library) return;

      let needsUpdate = false;
      for (const soundType of soundTypes) {
        for (const sound of library[soundType] || []) {
          if (sound.isDefault && sound.url) {
            const filename = path.basename(sound.url);
            const newUrl = getDevServerUrl(filename);
            if (sound.url !== newUrl) {
              console.log(`[SOUNDS] Refreshing URL: ${sound.url} -> ${newUrl}`);
              sound.url = newUrl;
              needsUpdate = true;
            }
          }
        }
      }

      if (needsUpdate) {
        await writeJson(savedSoundsPath, library);
        console.log('[SOUNDS] Refreshed sound library URLs for development');
      }
    } catch (error) {
      console.error('[SOUNDS] Error refreshing sound library URLs:', error);
    }
  }

  function createDefaultLibrary() {
    const library = {};
    for (const soundType of soundTypes) {
      library[soundType] = defaultSounds[soundType].map((sound) => ({
        ...sound,
        url: process.env.NODE_ENV === 'development'
          ? getDevServerUrl(sound.filename)
          : `userdata://sounds/${sound.filename}`,
        enabled: soundType === 'startup' ? false : true,
      }));
    }
    return library;
  }

  async function loadSoundLibrary() {
    try {
      await ensureDefaultSoundsExist();
      const savedLibrary = await readJson(savedSoundsPath, null);

      if (!savedLibrary) {
        const initialLibrary = createDefaultLibrary();
        await writeJson(savedSoundsPath, initialLibrary);
        console.log('[SOUNDS] Created initial sound library with defaults');
        return initialLibrary;
      }

      const mergedLibrary = {};
      for (const soundType of soundTypes) {
        const savedSounds = savedLibrary[soundType] || [];
        const defaults = defaultSounds[soundType] || [];
        mergedLibrary[soundType] = [...savedSounds];

        for (const defaultSound of defaults) {
          const exists = savedSounds.some((s) => s.id === defaultSound.id);
          if (!exists) {
            mergedLibrary[soundType].push({
              ...defaultSound,
              url: process.env.NODE_ENV === 'development'
                ? getDevServerUrl(defaultSound.filename)
                : `userdata://sounds/${defaultSound.filename}`,
              enabled: soundType === 'startup' ? false : true,
            });
          }
        }

        for (const sound of mergedLibrary[soundType]) {
          if (sound.isDefault && sound.enabled === undefined) {
            sound.enabled = soundType === 'startup' ? false : true;
          }
        }
      }

      let needsUpdate = false;
      for (const soundType of soundTypes) {
        for (const sound of mergedLibrary[soundType]) {
          if (sound.isDefault) {
            if (process.env.NODE_ENV !== 'development') {
              const prodUrl = `userdata://sounds/${sound.filename}`;
              if (sound.url !== prodUrl) {
                console.log(`[SOUNDS] Correcting default sound URL for production: ${sound.url} -> ${prodUrl}`);
                sound.url = prodUrl;
                needsUpdate = true;
              }
            } else {
              const devUrl = getDevServerUrl(sound.filename);
              if (sound.url !== devUrl) {
                console.log(`[SOUNDS] Correcting default sound URL for dev: ${sound.url} -> ${devUrl}`);
                sound.url = devUrl;
                needsUpdate = true;
              }
            }
          } else if (sound.filename) {
            const correctUrl = `userdata://sounds/${sound.filename}`;
            if (sound.url !== correctUrl) {
              console.log(`[SOUNDS] Correcting user sound URL: ${sound.url} -> ${correctUrl}`);
              sound.url = correctUrl;
              needsUpdate = true;
            }
          }
        }
      }

      if (needsUpdate) {
        await writeJson(savedSoundsPath, mergedLibrary);
        console.log('[SOUNDS] Updated sound library URLs for all sounds');
      }

      if (savedLibrary.backgroundMusicSettings) {
        mergedLibrary.backgroundMusicSettings = savedLibrary.backgroundMusicSettings;
        console.log('[SOUNDS] Preserved background music settings:', savedLibrary.backgroundMusicSettings);
      } else {
        console.log('[SOUNDS] No background music settings found in saved library');
      }

      if (JSON.stringify(savedLibrary) !== JSON.stringify(mergedLibrary)) {
        await writeJson(savedSoundsPath, mergedLibrary);
        console.log('[SOUNDS] Updated sound library with missing defaults');
      }

      return mergedLibrary;
    } catch (error) {
      console.error('[SOUNDS] Error loading sound library:', error);
      return createDefaultLibrary();
    }
  }

  return {
    ensureDefaultSoundsExist,
    getDevServerUrl,
    refreshSoundLibraryUrls,
    loadSoundLibrary,
  };
}

module.exports = {
  createSoundLibraryService,
};
