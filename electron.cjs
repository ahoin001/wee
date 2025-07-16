const { app, BrowserWindow, ipcMain, shell, protocol, dialog } = require('electron');
const path = require('path');
const { execFile, spawn } = require('child_process');
const fs = require('fs/promises');
const url = require('url');

// Paths for persistent storage
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
const channelConfigsPath = path.join(userDataPath, 'channelConfigs.json');
const savedSoundsPath = path.join(userDataPath, 'savedSounds.json');

// User file directories
const userSoundsPath = path.join(userDataPath, 'sounds');
const userWallpapersPath = path.join(userDataPath, 'wallpapers');

let mainWindow = null;
let isCurrentlyFullscreen = true;
let isFrameless = true;

// Ensure user directories exist
async function ensureUserDirectories() {
  try {
    await fs.mkdir(userSoundsPath, { recursive: true });
    await fs.mkdir(userWallpapersPath, { recursive: true });
  } catch (err) {
    console.error('Failed to create user directories:', err);
  }
}

function sendWindowState() {
  if (mainWindow) {
    mainWindow.webContents.send('fullscreen-state', isCurrentlyFullscreen);
    mainWindow.webContents.send('frame-state', !isFrameless);
  }
}

function createWindow({ frame = false, fullscreen = true, bounds = null } = {}) {
  // If bounds are provided, use them; otherwise, use defaults
  const options = {
    width: 1280,
    height: 720,
    frame: frame,
    fullscreen: fullscreen,
    webPreferences: {
      autoHideMenuBar: true, // press alt to show,
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };
  if (bounds) {
    options.x = bounds.x;
    options.y = bounds.y;
    options.width = bounds.width;
    options.height = bounds.height;
  }

  if (mainWindow) {
    mainWindow.destroy();
  }
  mainWindow = new BrowserWindow(options);
  mainWindow.setMenu(null);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  isCurrentlyFullscreen = fullscreen;
  isFrameless = !frame;

  // Send drag-region state to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('update-drag-region', isFrameless && !isCurrentlyFullscreen);
    sendWindowState();
  });
}

app.whenReady().then(async () => {
  console.log('User data is stored at:', app.getPath('userData'));
  
  // Register protocol for serving user files in production
  if (process.env.NODE_ENV !== 'development') {
    console.log('[PROTOCOL] Registering userdata:// protocol for production');
    protocol.registerFileProtocol('userdata', (request, callback) => {
      const url = request.url.substr(11); // Remove 'userdata://'
      const filePath = path.join(userDataPath, url);
      console.log(`[PROTOCOL] userdata://${url} -> ${filePath}`);
      callback({ path: filePath });
    });
    console.log('[PROTOCOL] userdata:// protocol registered successfully');
  } else {
    console.log('[PROTOCOL] Running in development mode, skipping protocol registration');
  }
  
  await ensureUserDirectories();
  createWindow({ frame: false, fullscreen: true });
});

// Log user data paths on startup
console.log('Electron userDataPath:', userDataPath);
console.log('Settings path:', settingsPath);
console.log('Channel configs path:', channelConfigsPath);
console.log('Saved sounds path:', savedSoundsPath);
console.log('User sounds path:', userSoundsPath);
console.log('User wallpapers path:', userWallpapersPath);

// --- Persistent Storage IPC Handlers ---

// Helper: Read JSON file, return defaultValue if not found or error
async function readJson(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    console.log(`[READ] Successfully read file: ${filePath}`);
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`[READ] File not found: ${filePath}`);
    } else if (err.code === 'EACCES') {
      console.error(`[READ] Permission denied: ${filePath}`);
    } else {
      console.error(`[READ] Error reading file ${filePath}:`, err);
    }
    return defaultValue;
  }
}

// Helper: Write JSON file
async function writeJson(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[WRITE] Successfully wrote file: ${filePath}`);
    return true;
  } catch (err) {
    if (err.code === 'EACCES') {
      console.error(`[WRITE] Permission denied: ${filePath}`);
    } else {
      console.error(`[WRITE] Error writing file ${filePath}:`, err);
    }
    return false;
  }
}

// Helper: Copy file to user directory and return new path
async function copyFileToUserDirectory(sourcePath, targetDirectory, filename) {
  try {
    const targetPath = path.join(targetDirectory, filename);
    await fs.copyFile(sourcePath, targetPath);
    console.log(`[COPY] Copied file to: ${targetPath}`);
    return targetPath;
  } catch (err) {
    console.error(`[COPY] Failed to copy file:`, err);
    throw err;
  }
}

// Sound Management System
const SOUND_TYPES = ['channelClick', 'channelHover', 'backgroundMusic', 'startup'];

// Default sound definitions
const DEFAULT_SOUNDS = {
  channelClick: [
    {
      id: 'default-channelClick-1',
      name: 'Wii Click 1',
      filename: 'wii-click-1.mp3',
      volume: 0.5,
      isDefault: true
    }
  ],
  channelHover: [
    {
      id: 'default-channelHover-1', 
      name: 'Wii Hover 1',
      filename: 'wii-hover-1.mp3',
      volume: 0.3,
      isDefault: true
    }
  ],
  backgroundMusic: [
    {
      id: 'default-backgroundMusic-1',
      name: 'Wii Menu Music',
      filename: 'wii-menu-music.mp3', 
      volume: 0.4,
      isDefault: true
    }
  ],
  startup: [
    {
      id: 'default-startup-1',
      name: 'Wii Startup 1',
      filename: 'wii-startup-1.mp3',
      volume: 0.6,
      isDefault: true
    }
  ]
};

// Helper: Copy default sounds to user directory
async function ensureDefaultSoundsExist() {
  const isDev = process.env.NODE_ENV === 'development';
  let sourceBasePath;
  
  if (isDev) {
    sourceBasePath = path.join(__dirname, 'public', 'sounds');
  } else {
    sourceBasePath = path.join(process.resourcesPath, 'public', 'sounds');
  }
  
  console.log(`[SOUNDS] Ensuring default sounds exist from: ${sourceBasePath}`);
  
  for (const soundType of SOUND_TYPES) {
    for (const sound of DEFAULT_SOUNDS[soundType]) {
      try {
        const sourcePath = path.join(sourceBasePath, sound.filename);
        const targetPath = path.join(userSoundsPath, sound.filename);
        
        // Check if file already exists
        try {
          await fs.access(targetPath);
          console.log(`[SOUNDS] Default sound already exists: ${sound.filename} at ${targetPath}`);
        } catch {
          // Copy file to user directory
          await fs.copyFile(sourcePath, targetPath);
          console.log(`[SOUNDS] Copied default sound: ${sound.filename} from ${sourcePath} to ${targetPath}`);
        }
      } catch (error) {
        console.error(`[SOUNDS] Failed to copy default sound ${sound.filename}:`, error);
      }
    }
  }
}

// Helper: Load sound library (defaults + user sounds)
async function loadSoundLibrary() {
  try {
    // Ensure default sounds exist
    await ensureDefaultSoundsExist();
    
    // Load saved sound library
    const savedLibrary = await readJson(savedSoundsPath, null);
    
    if (!savedLibrary) {
      // Create initial library with defaults
      const initialLibrary = {};
      
      for (const soundType of SOUND_TYPES) {
        initialLibrary[soundType] = DEFAULT_SOUNDS[soundType].map(sound => ({
          ...sound,
          url: process.env.NODE_ENV === 'development' 
            ? `/sounds/${sound.filename}` 
            : `userdata://sounds/${sound.filename}`,
          enabled: true
        }));
      }
      
      // Save initial library
      await writeJson(savedSoundsPath, initialLibrary);
      console.log('[SOUNDS] Created initial sound library with defaults');
      return initialLibrary;
    }
    
    // Merge with defaults to ensure all default sounds exist
    const mergedLibrary = {};
    
    for (const soundType of SOUND_TYPES) {
      const savedSounds = savedLibrary[soundType] || [];
      const defaultSounds = DEFAULT_SOUNDS[soundType] || [];
      
      // Start with saved sounds
      mergedLibrary[soundType] = [...savedSounds];
      
      // Add any missing default sounds
      for (const defaultSound of defaultSounds) {
        const exists = savedSounds.some(s => s.id === defaultSound.id);
        if (!exists) {
          mergedLibrary[soundType].push({
            ...defaultSound,
            url: process.env.NODE_ENV === 'development' 
              ? `/sounds/${defaultSound.filename}` 
              : `userdata://sounds/${defaultSound.filename}`,
            enabled: true
          });
        }
      }
    }
    
    // Fix URLs for production (convert file paths to userdata:// protocol)
    if (process.env.NODE_ENV !== 'development') {
      let needsUpdate = false;
      for (const soundType of SOUND_TYPES) {
        for (const sound of mergedLibrary[soundType]) {
          // Check for both file paths and old /sounds/ URLs
          if (sound.url && (sound.url.startsWith(userSoundsPath) || sound.url.startsWith('/sounds/'))) {
            const filename = path.basename(sound.url);
            const oldUrl = sound.url;
            sound.url = `userdata://sounds/${filename}`;
            console.log(`[SOUNDS] Converting URL: ${oldUrl} -> ${sound.url}`);
            needsUpdate = true;
          }
        }
      }
      if (needsUpdate) {
        await writeJson(savedSoundsPath, mergedLibrary);
        console.log('[SOUNDS] Updated sound library URLs for production');
      }
    }
    
    // Save merged library if it changed
    if (JSON.stringify(savedLibrary) !== JSON.stringify(mergedLibrary)) {
      await writeJson(savedSoundsPath, mergedLibrary);
      console.log('[SOUNDS] Updated sound library with missing defaults');
    }
    
    return mergedLibrary;
  } catch (error) {
    console.error('[SOUNDS] Error loading sound library:', error);
    // Return defaults as fallback
    const fallbackLibrary = {};
    for (const soundType of SOUND_TYPES) {
      fallbackLibrary[soundType] = DEFAULT_SOUNDS[soundType].map(sound => ({
        ...sound,
                    url: process.env.NODE_ENV === 'development' 
              ? `/sounds/${sound.filename}` 
              : `userdata://sounds/${sound.filename}`,
        enabled: true
      }));
    }
    return fallbackLibrary;
  }
}

ipcMain.handle('get-settings', async () => {
  return await readJson(settingsPath, null);
});

ipcMain.handle('save-settings', async (event, settings) => {
  return await writeJson(settingsPath, settings);
});

ipcMain.handle('get-channel-configs', async () => {
  try {
    await fs.access(channelConfigsPath);
    const data = await fs.readFile(channelConfigsPath, 'utf-8');
    console.log(`[READ] Successfully read file: ${channelConfigsPath}`);
    const parsed = JSON.parse(data);
    // Return empty object if file is empty or contains invalid data
    if (!parsed || typeof parsed !== 'object') {
      console.warn(`[READ] Channel configs file is empty or invalid, returning empty object`);
      return {};
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`[READ] Channel configs file not found: ${channelConfigsPath}`);
    } else if (error.code === 'EACCES') {
      console.error(`[READ] Permission denied: ${channelConfigsPath}`);
    } else {
      console.error(`[READ] Error reading channel configs:`, error);
    }
    // Don't create default file if it doesn't exist - let the app handle empty state
    return {};
  }
});

ipcMain.handle('save-channel-configs', async (event, configs) => {
  try {
    await fs.writeFile(channelConfigsPath, JSON.stringify(configs, null, 2));
    console.log(`[WRITE] Successfully wrote file: ${channelConfigsPath}`);
    return { success: true };
  } catch (error) {
    if (error.code === 'EACCES') {
      console.error(`[WRITE] Permission denied: ${channelConfigsPath}`);
    } else {
      console.error('Failed to save channel configs:', error);
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-sound-library', async () => {
  try {
    const library = await loadSoundLibrary();
    console.log('[SOUNDS] Loaded sound library:', Object.keys(library).map(k => `${k}: ${library[k].length} sounds`));
    return library;
  } catch (error) {
    console.error('[SOUNDS] Error getting sound library:', error);
    return {};
  }
});

ipcMain.handle('save-sound-library', async (event, library) => {
  try {
    await writeJson(savedSoundsPath, library);
    console.log('[SOUNDS] Saved sound library');
    return { success: true };
  } catch (error) {
    console.error('[SOUNDS] Error saving sound library:', error);
    return { success: false, error: error.message };
  }
});

// Legacy handler for backward compatibility
ipcMain.handle('get-saved-sounds', async () => {
  return await loadSoundLibrary();
});

ipcMain.handle('save-saved-sounds', async (event, sounds) => {
  return await writeJson(savedSoundsPath, sounds);
});

// File dialog handler for sound selection
ipcMain.handle('select-sound-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const filename = path.basename(filePath);
      return { success: true, file: { path: filePath, name: filename } };
    } else {
      return { success: false, error: 'No file selected' };
    }
  } catch (error) {
    console.error('[SOUNDS] Error selecting file:', error);
    return { success: false, error: error.message };
  }
});

// Sound management IPC handlers
ipcMain.handle('add-sound', async (event, { soundType, file, name }) => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `user-${soundType}-${timestamp}${extension}`;
    
    // Copy file to user sounds directory
    const targetPath = await copyFileToUserDirectory(file.path, userSoundsPath, filename);
    
    // Generate unique ID
    const soundId = `user-${soundType}-${timestamp}`;
    
    // Create sound object
    const newSound = {
      id: soundId,
      name: name || file.name.replace(extension, ''),
      filename: filename,
      url: process.env.NODE_ENV === 'development' 
        ? targetPath 
        : `userdata://sounds/${filename}`,
      volume: 0.5,
      enabled: true,
      isDefault: false
    };
    
    // Load current library and add new sound
    const library = await loadSoundLibrary();
    if (!library[soundType]) {
      library[soundType] = [];
    }
    library[soundType].push(newSound);
    
    // Save updated library
    await writeJson(savedSoundsPath, library);
    console.log(`[SOUNDS] Added new sound: ${name} to ${soundType}`);
    
    return { success: true, sound: newSound };
  } catch (error) {
    console.error('[SOUNDS] Error adding sound:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-sound', async (event, { soundType, soundId }) => {
  try {
    const library = await loadSoundLibrary();
    
    if (!library[soundType]) {
      return { success: false, error: 'Sound type not found' };
    }
    
    const soundIndex = library[soundType].findIndex(s => s.id === soundId);
    if (soundIndex === -1) {
      return { success: false, error: 'Sound not found' };
    }
    
    const sound = library[soundType][soundIndex];
    
    // Don't allow removal of default sounds
    if (sound.isDefault) {
      return { success: false, error: 'Cannot remove default sounds' };
    }
    
    // Remove from library
    library[soundType].splice(soundIndex, 1);
    
    // Try to delete the file
    try {
      const filePath = path.join(userSoundsPath, sound.filename);
      await fs.unlink(filePath);
      console.log(`[SOUNDS] Deleted sound file: ${sound.filename}`);
    } catch (fileError) {
      console.warn(`[SOUNDS] Could not delete sound file: ${sound.filename}`, fileError);
    }
    
    // Save updated library
    await writeJson(savedSoundsPath, library);
    console.log(`[SOUNDS] Removed sound: ${sound.name} from ${soundType}`);
    
    return { success: true };
  } catch (error) {
    console.error('[SOUNDS] Error removing sound:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-sound', async (event, { soundType, soundId, updates }) => {
  try {
    const library = await loadSoundLibrary();
    
    if (!library[soundType]) {
      return { success: false, error: 'Sound type not found' };
    }
    
    const soundIndex = library[soundType].findIndex(s => s.id === soundId);
    if (soundIndex === -1) {
      return { success: false, error: 'Sound not found' };
    }
    
    const sound = library[soundType][soundIndex];
    
    // Don't allow certain updates to default sounds
    if (sound.isDefault) {
      const allowedUpdates = ['enabled', 'volume'];
      const invalidUpdates = Object.keys(updates).filter(key => !allowedUpdates.includes(key));
      if (invalidUpdates.length > 0) {
        return { success: false, error: `Cannot modify ${invalidUpdates.join(', ')} for default sounds` };
      }
    }
    
    // Apply updates
    Object.assign(library[soundType][soundIndex], updates);
    
    // Save updated library
    await writeJson(savedSoundsPath, library);
    console.log(`[SOUNDS] Updated sound: ${sound.name} in ${soundType}`);
    
    return { success: true, sound: library[soundType][soundIndex] };
  } catch (error) {
    console.error('[SOUNDS] Error updating sound:', error);
    return { success: false, error: error.message };
  }
});

// Legacy file management handlers
ipcMain.handle('copy-sound-file', async (event, { sourcePath, filename }) => {
  try {
    const targetPath = await copyFileToUserDirectory(sourcePath, userSoundsPath, filename);
    return { success: true, path: targetPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-wallpaper-file', async (event, { sourcePath, filename }) => {
  try {
    const targetPath = await copyFileToUserDirectory(sourcePath, userWallpapersPath, filename);
    return { success: true, path: targetPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-user-files', async () => {
  try {
    const [soundFiles, wallpaperFiles] = await Promise.all([
      fs.readdir(userSoundsPath).catch(() => []),
      fs.readdir(userWallpapersPath).catch(() => [])
    ]);
    
    return {
      sounds: soundFiles.map(file => path.join(userSoundsPath, file)),
      wallpapers: wallpaperFiles.map(file => path.join(userWallpapersPath, file))
    };
  } catch (error) {
    console.error('Error reading user files:', error);
    return { sounds: [], wallpapers: [] };
  }
});

// Debug handler to check sound file availability
ipcMain.handle('debug-sounds', async () => {
  const isDev = process.env.NODE_ENV === 'development';
  const debugInfo = {
    isDev,
    userSoundsPath,
    userSoundsFiles: [],
    extraResourcePath: null,
    extraResourceFiles: [],
    defaultSounds: null,
    soundLibrary: null,
    protocolRegistered: false
  };
  
  try {
    // Check user sounds directory
    debugInfo.userSoundsFiles = await fs.readdir(userSoundsPath).catch(() => []);
    
    // Check extraResource path in production
    if (!isDev) {
      const extraResourcePath = path.join(process.resourcesPath, 'public', 'sounds');
      debugInfo.extraResourcePath = extraResourcePath;
      debugInfo.extraResourceFiles = await fs.readdir(extraResourcePath).catch(() => []);
    }
    
    // Get current sound library with URLs
    debugInfo.soundLibrary = await loadSoundLibrary();
    
    // Check if protocol is registered
    debugInfo.protocolRegistered = !isDev;
    
    console.log('[DEBUG] Sound debug info:', debugInfo);
    return debugInfo;
  } catch (error) {
    console.error('[DEBUG] Error getting sound debug info:', error);
    return { error: error.message, ...debugInfo };
  }
});

// --- App Launching Logic ---
ipcMain.on('launch-app', (event, { type, path: appPath, asAdmin }) => {
  console.log(`Launching app: type=${type}, path=${appPath}, asAdmin=${asAdmin}`);

  if (type === 'url') {
    shell.openExternal(appPath).catch(err => {
      console.error('Failed to open URL:', err);
    });
  } else if (type === 'exe') {
    try {
      if (asAdmin) {
        // Launch as admin using PowerShell
        const command = `Start-Process -FilePath \"${appPath.replace(/"/g, '\"')}\" -Verb RunAs`;
        const child = spawn('powershell', ['-Command', command], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        child.on('error', (err) => {
          console.error('Failed to launch executable as admin:', err);
        });
        child.on('spawn', () => {
          console.log('Executable launched as admin successfully');
          child.unref();
        });
      } else {
        // Normal launch
        const child = spawn(appPath, [], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        child.on('error', (err) => {
          console.error('Failed to launch executable:', err);
        });
        child.on('spawn', () => {
          console.log('Executable launched successfully');
          child.unref();
        });
      }
    } catch (err) {
      console.error('Failed to launch executable:', err);
    }
  } else {
    shell.openPath(appPath).catch(err => {
      console.error('Failed to open path:', err);
    });
  }
});

// IPC handler for toggling fullscreen/windowed mode
ipcMain.on('toggle-fullscreen', () => {
  if (!mainWindow) return;
  if (isCurrentlyFullscreen) {
    mainWindow.setFullScreen(false);
    mainWindow.setSize(1920, 1080);
    mainWindow.center();
    isCurrentlyFullscreen = false;
  } else {
    mainWindow.setFullScreen(true);
    isCurrentlyFullscreen = true;
  }
  // Update drag region
  mainWindow.webContents.send('update-drag-region', isFrameless && !isCurrentlyFullscreen);
  sendWindowState();
});

// IPC handler for toggling window frame
ipcMain.on('toggle-frame', () => {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const wasFullScreen = mainWindow.isFullScreen();
  // Only recreate if needed
  createWindow({
    frame: isFrameless, // toggle
    fullscreen: wasFullScreen,
    bounds,
  });
  // sendWindowState will be called after load
});

// IPC handler for minimizing window
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

// IPC handler for closing window
ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
