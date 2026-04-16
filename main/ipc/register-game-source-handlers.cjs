function registerGameSourceHandlers({
  ipcMain,
  gameSourceService,
  dialog,
}) {
  ipcMain.handle('steam:getInstalledGames', async () => {
    return await gameSourceService.getInstalledSteamGames();
  });

  ipcMain.handle('detectSteamInstallation', async () => {
    return await gameSourceService.detectSteamInstallation();
  });

  ipcMain.handle('getSteamLibraries', async (_event, { steamPath }) => {
    return await gameSourceService.getSteamLibraries({ steamPath });
  });

  ipcMain.handle('scanSteamGames', async (_event, { libraryPaths }) => {
    return await gameSourceService.scanSteamGames({ libraryPaths });
  });

  ipcMain.handle('steam:getEnrichedGames', async (_event, { steamId, apiKey } = {}) => {
    return await gameSourceService.getSteamEnrichedGames({ steamId, apiKey });
  });

  ipcMain.handle('steam:getClientLibraryMetadata', async (_event, { steamId } = {}) => {
    return await gameSourceService.getSteamClientLibraryMetadata({ steamId });
  });

  ipcMain.handle('epic:getInstalledGames', async () => {
    return await gameSourceService.getInstalledEpicGames();
  });

  ipcMain.handle('steam:pickLibraryFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select your Steam library folder',
      properties: ['openDirectory'],
      message: 'Pick the folder containing your steamapps/libraryfolders.vdf file.',
    });
    if (result.canceled || !result.filePaths || !result.filePaths[0]) {
      return { canceled: true };
    }
    return { path: result.filePaths[0] };
  });
}

module.exports = {
  registerGameSourceHandlers,
};
