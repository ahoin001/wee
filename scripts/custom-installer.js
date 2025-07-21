const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const os = require('os');

// Custom installer window
let installerWindow = null;
let installProgress = 0;
let installStep = 0;

const INSTALL_STEPS = [
  {
    title: "Welcome to WeeDesktopLauncher! 🎮",
    description: "Transform your Windows desktop into a nostalgic Wii experience!",
    features: [
      "🎨 Beautiful Wii-style interface",
      "🎵 Customizable sounds and music", 
      "🖼️ Easy wallpaper customization",
      "🚀 Quick app launching",
      "⚙️ Full customization options"
    ],
    animation: "welcome"
  },
  {
    title: "Installation Options 📁",
    description: "Choose where you'd like shortcuts to be created:",
    options: [
      { id: 'desktop', label: 'Desktop Shortcut', default: true },
      { id: 'startmenu', label: 'Start Menu', default: true },
      { id: 'taskbar', label: 'Pin to Taskbar', default: false },
      { id: 'autostart', label: 'Start with Windows', default: false }
    ],
    animation: "options"
  },
  {
    title: "Installation Progress ⚡",
    description: "Setting up your Wii-style desktop experience...",
    animation: "progress"
  },
  {
    title: "Installation Complete! 🎉",
    description: "WeeDesktopLauncher has been successfully installed!",
    animation: "complete"
  }
];

function createInstallerWindow() {
  installerWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../public/icons/icon.ico')
  });

  // Load the installer HTML
  installerWindow.loadFile(path.join(__dirname, 'installer.html'));

  installerWindow.once('ready-to-show', () => {
    installerWindow.show();
  });

  installerWindow.on('closed', () => {
    installerWindow = null;
  });
}

// IPC handlers for installer communication
ipcMain.handle('installer:get-step', () => {
  return INSTALL_STEPS[installStep];
});

ipcMain.handle('installer:next-step', async (event, options) => {
  if (installStep === 1) {
    // Save user options
    await saveInstallOptions(options);
  }
  
  installStep++;
  
  if (installStep >= INSTALL_STEPS.length) {
    // Installation complete
    await finalizeInstallation();
    return { complete: true };
  }
  
  return { step: installStep, data: INSTALL_STEPS[installStep] };
});

ipcMain.handle('installer:start-install', async () => {
  installStep = 2; // Move to progress step
  await performInstallation();
  return { success: true };
});

ipcMain.handle('installer:get-progress', () => {
  return { progress: installProgress, step: installStep };
});

async function saveInstallOptions(options) {
  const userDataPath = app.getPath('userData');
  const configPath = path.join(userDataPath, 'installer-config.json');
  
  await fs.writeJson(configPath, {
    shortcuts: options,
    installDate: new Date().toISOString(),
    version: app.getVersion()
  });
}

async function performInstallation() {
  const steps = [
    { name: 'Preparing files...', duration: 1000 },
    { name: 'Creating shortcuts...', duration: 1500 },
    { name: 'Setting up auto-start...', duration: 800 },
    { name: 'Finalizing installation...', duration: 1200 }
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    installProgress = (i / steps.length) * 100;
    
    // Update progress in installer window
    if (installerWindow) {
      installerWindow.webContents.send('installer:progress-update', {
        progress: installProgress,
        message: step.name
      });
    }
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, step.duration));
  }
  
  installProgress = 100;
  installStep = 3; // Move to completion step
}

async function finalizeInstallation() {
  try {
    // Create shortcuts based on user preferences
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'installer-config.json');
    
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      
      if (config.shortcuts.desktop) {
        await createDesktopShortcut();
      }
      
      if (config.shortcuts.startmenu) {
        await createStartMenuShortcut();
      }
      
      if (config.shortcuts.taskbar) {
        await pinToTaskbar();
      }
      
      if (config.shortcuts.autostart) {
        await setupAutoStart();
      }
    }
    
    // Clean up installer config
    await fs.remove(configPath);
    
  } catch (error) {
    console.error('Error finalizing installation:', error);
  }
}

async function createDesktopShortcut() {
  try {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const shortcutPath = path.join(desktopPath, 'WeeDesktopLauncher.lnk');
    const exePath = app.getPath('exe');
    
    const { exec } = require('child_process');
    const command = `powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${shortcutPath}'); $Shortcut.TargetPath = '${exePath}'; $Shortcut.Save()"`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    console.error('Error creating desktop shortcut:', error);
  }
}

async function createStartMenuShortcut() {
  try {
    const startMenuPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const shortcutPath = path.join(startMenuPath, 'WeeDesktopLauncher.lnk');
    const exePath = app.getPath('exe');
    
    const { exec } = require('child_process');
    const command = `powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${shortcutPath}'); $Shortcut.TargetPath = '${exePath}'; $Shortcut.Save()"`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    console.error('Error creating start menu shortcut:', error);
  }
}

async function pinToTaskbar() {
  try {
    const exePath = app.getPath('exe');
    const { exec } = require('child_process');
    const command = `powershell -Command "& { $shell = New-Object -ComObject Shell.Application; $shell.NameSpace('shell:::{4234d49b-0245-4df3-b780-3893943456e1}').Items() | Where-Object {$_.Path -eq '${exePath}'} | ForEach-Object {$_.InvokeVerb('taskbarpin')}"}`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (error) {
    console.error('Error pinning to taskbar:', error);
  }
}

async function setupAutoStart() {
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe')
    });
  } catch (error) {
    console.error('Error setting up auto-start:', error);
  }
}

// Export the installer functions
module.exports = {
  createInstallerWindow,
  startInstaller: () => {
    if (!installerWindow) {
      createInstallerWindow();
    }
  }
}; 