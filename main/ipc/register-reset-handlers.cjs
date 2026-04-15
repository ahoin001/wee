function registerResetHandlers({
  ipcMain,
  unifiedData,
  wallpapersData,
  fsPromises,
  path,
  userSoundsPath,
  userWallpapersPath,
  soundTypes,
  defaultSounds,
  getDevServerUrl,
  writeJson,
  savedSoundsPath,
  channelConfigsPath,
  getDefaultChannels,
}) {
  ipcMain.handle('settings:resetAll', async () => {
    const data = await unifiedData.get();
    const defaultSoundsSettings = {
      backgroundMusicEnabled: true,
      backgroundMusicLooping: true,
      backgroundMusicPlaylistMode: false,
      channelClickEnabled: true,
      channelClickVolume: 0.5,
      channelHoverEnabled: true,
      channelHoverVolume: 0.5,
      startupEnabled: true,
      startupVolume: 0.5,
    };
    await unifiedData.set({
      ...data,
      settings: {
        ...data.settings,
        sounds: defaultSoundsSettings,
      },
    });
    await wallpapersData.reset();
    return true;
  });

  ipcMain.handle('reset-to-default', async () => {
    try {
      const deleteFilesInDir = async (dir) => {
        try {
          const files = await fsPromises.readdir(dir);
          for (const file of files) {
            await fsPromises.unlink(path.join(dir, file));
          }
        } catch {}
      };
      await deleteFilesInDir(userSoundsPath);
      await deleteFilesInDir(userWallpapersPath);

      const initialSoundLibrary = {};
      for (const soundType of soundTypes) {
        initialSoundLibrary[soundType] = defaultSounds[soundType].map((sound) => ({
          ...sound,
          url: process.env.NODE_ENV === 'development'
            ? getDevServerUrl(sound.filename)
            : `userdata://sounds/${sound.filename}`,
          enabled: true,
        }));
      }
      await writeJson(savedSoundsPath, initialSoundLibrary);

      const currentUnifiedData = await unifiedData.get();
      const preservedIcons = Array.isArray(currentUnifiedData?.content?.icons)
        ? currentUnifiedData.content.icons
        : [];
      await unifiedData.set({
        settings: {},
        content: {
          channels: [],
          wallpapers: {
            saved: [],
            liked: [],
            active: null,
          },
          sounds: {
            backgroundMusic: [],
            channelClick: [],
            channelHover: [],
            startup: [],
          },
          presets: [],
          icons: preservedIcons,
        },
      });

      await writeJson(channelConfigsPath, getDefaultChannels());
      return { success: true };
    } catch (error) {
      console.error('[RESET] Failed to reset to default:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerResetHandlers,
};
