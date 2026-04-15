function registerChannelConfigHandlers({
  ipcMain,
  fsPromises,
  channelConfigsPath,
}) {
  ipcMain.handle('get-channel-configs', async () => {
    try {
      await fsPromises.access(channelConfigsPath);
      const data = await fsPromises.readFile(channelConfigsPath, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch {
      return {};
    }
  });

  ipcMain.handle('save-channel-configs', async (_event, configs) => {
    try {
      await fsPromises.writeFile(channelConfigsPath, JSON.stringify(configs, null, 2));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerChannelConfigHandlers,
};
