function registerInstallerHandlers({
  ipcMain,
  installerWindow,
  createShortcuts,
}) {
  const steps = [
    {
      title: 'Welcome to WeeDesktopLauncher! 🎮',
      description: 'Transform your Windows desktop into a nostalgic Wii experience!',
      features: [
        '🎨 Beautiful Wii-style interface',
        '🎵 Customizable sounds and music',
        '🖼️ Easy wallpaper customization',
        '🚀 Quick app launching',
        '⚙️ Full customization options',
      ],
      animation: 'welcome',
    },
    {
      title: 'Installation Options 📁',
      description: "Choose where you'd like shortcuts to be created:",
      options: [
        { id: 'desktop', label: 'Desktop Shortcut', default: true },
        { id: 'startmenu', label: 'Start Menu', default: true },
        { id: 'taskbar', label: 'Pin to Taskbar', default: false },
        { id: 'autostart', label: 'Start with Windows', default: false },
      ],
      animation: 'options',
    },
    {
      title: 'Installation Progress ⚡',
      description: 'Setting up your Wii-style desktop experience...',
      animation: 'progress',
    },
    {
      title: 'Installation Complete! 🎉',
      description: 'WeeDesktopLauncher has been successfully installed!',
      animation: 'complete',
    },
  ];

  ipcMain.handle('installer:get-step', () => steps[0]);

  ipcMain.handle('installer:next-step', async (_event, options) => {
    if (options) {
      await createShortcuts(options);
    }
    return { complete: true };
  });

  ipcMain.handle('installer:start-install', async () => ({ success: true }));

  const onLaunchAfterInstall = () => {
    installerWindow.close();
  };
  ipcMain.on('launch-app-after-install', onLaunchAfterInstall);

  return () => {
    ipcMain.removeHandler('installer:get-step');
    ipcMain.removeHandler('installer:next-step');
    ipcMain.removeHandler('installer:start-install');
    ipcMain.removeListener('launch-app-after-install', onLaunchAfterInstall);
  };
}

module.exports = {
  registerInstallerHandlers,
};
