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
    
    // Refresh sound library URLs after window is loaded (for development)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        await refreshSoundLibraryUrls();
      }, 1000); // Small delay to ensure window is fully loaded
    }
  });
}

app.whenReady().then(async () => {
  console.log('User data is stored at:', app.getPath('userData'));
  
  // Register protocol for serving user files in BOTH dev and prod
  console.log('[PROTOCOL] Registering userdata:// protocol');
  protocol.registerFileProtocol('userdata', (request, callback) => {
    const url = request.url.substr(11); // Remove 'userdata://'
    const filePath = path.join(userDataPath, url);
    console.log(`[PROTOCOL] userdata://${url} -> ${filePath}`);
    callback({ path: filePath });
  });
  console.log('[PROTOCOL] userdata:// protocol registered successfully');
  
  await ensureUserDirectories();
  
  // Refresh sound library URLs in development mode
  await refreshSoundLibraryUrls();
  
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

// Helper: Force refresh sound library URLs for development
async function refreshSoundLibraryUrls() {
  if (process.env.NODE_ENV !== 'development') return;
  
  try {
    const library = await readJson(savedSoundsPath, null);
    if (!library) return;
    
    let needsUpdate = false;
    for (const soundType of SOUND_TYPES) {
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

// Helper: Get the correct dev server URL for sounds
function getDevServerUrl(filename) {
  // Try to get the actual dev server port from the main window URL
  if (mainWindow && mainWindow.webContents) {
    const url = mainWindow.webContents.getURL();
    if (url && url.includes('localhost:')) {
      const portMatch = url.match(/localhost:(\d+)/);
      if (portMatch) {
        return `http://localhost:${portMatch[1]}/sounds/${filename}`;
      }
    }
  }
  // Fallback to common dev server ports
  return `http://localhost:5173/sounds/${filename}`;
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
            ? getDevServerUrl(sound.filename)
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
              ? getDevServerUrl(defaultSound.filename)
              : `userdata://sounds/${defaultSound.filename}`,
            enabled: true
          });
        }
      }
    }
    
    // Fix URLs for ALL user sounds (dev and prod): always use userdata:// protocol
    let needsUpdate = false;
    for (const soundType of SOUND_TYPES) {
      for (const sound of mergedLibrary[soundType]) {
        if (sound.isDefault && sound.url && process.env.NODE_ENV === 'development' && !sound.url.includes('localhost:')) {
          // Only update default sounds in dev to use dev server URL
          const filename = path.basename(sound.url);
          const oldUrl = sound.url;
          sound.url = getDevServerUrl(filename);
          console.log(`[SOUNDS] Converting dev URL: ${oldUrl} -> ${sound.url}`);
          needsUpdate = true;
        } else if (!sound.isDefault && sound.filename) {
          const correctUrl = `userdata://sounds/${sound.filename}`;
          if (sound.url !== correctUrl) {
            const oldUrl = sound.url;
            sound.url = correctUrl;
            console.log(`[SOUNDS] Converting user sound URL: ${oldUrl} -> ${sound.url}`);
            needsUpdate = true;
          }
        }
      }
    }
    if (needsUpdate) {
      await writeJson(savedSoundsPath, mergedLibrary);
      console.log('[SOUNDS] Updated sound library URLs for all user sounds');
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
          ? getDevServerUrl(sound.filename)
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
    console.log('[SOUNDS] Opening file dialog for sound selection');
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Select Audio File'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const filename = path.basename(filePath);
      
      // Validate file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        console.error(`[SOUNDS] Selected file does not exist: ${filePath}`);
        return { success: false, error: 'Selected file no longer exists. Please try again.' };
      }
      
      // Validate file extension
      const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
      const fileExtension = path.extname(filename).toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        return { 
          success: false, 
          error: `Invalid file type: ${fileExtension}\n\nSupported formats: ${validExtensions.join(', ')}` 
        };
      }
      
      // Check file size (max 10MB)
      let fileSize = null;
      try {
        const stats = await fs.stat(filePath);
        fileSize = stats.size;
        if (stats.size > 10 * 1024 * 1024) {
          return { 
            success: false, 
            error: 'File is too large.\n\nMaximum file size is 10MB. Please select a smaller file.' 
          };
        }
        
        if (stats.size === 0) {
          return { 
            success: false, 
            error: 'File is empty.\n\nPlease select a valid audio file.' 
          };
        }
      } catch (error) {
        console.warn(`[SOUNDS] Could not check file stats: ${error.message}`);
      }
      
      console.log(`[SOUNDS] Successfully selected file: ${filename} (${filePath})`);
      return { 
        success: true, 
        file: { 
          path: filePath, 
          name: filename,
          size: fileSize
        } 
      };
    } else {
      console.log('[SOUNDS] File selection cancelled by user');
      return { success: false, error: 'No file selected' };
    }
  } catch (error) {
    console.error('[SOUNDS] Error selecting file:', error);
    return { 
      success: false, 
      error: `Failed to open file dialog: ${error.message}\n\nPlease try again or restart the application.` 
    };
  }
});

// Sound management IPC handlers
ipcMain.handle('add-sound', async (event, { soundType, file, name }) => {
  try {
    console.log(`[SOUNDS] Adding sound: ${name} (${file.name}) to ${soundType}`);
    
    // Validate sound type
    if (!SOUND_TYPES.includes(soundType)) {
      return { success: false, error: `Invalid sound type: ${soundType}. Valid types: ${SOUND_TYPES.join(', ')}` };
    }
    
    // Validate file object
    if (!file || !file.path || !file.name) {
      return { success: false, error: 'Invalid file object provided' };
    }
    
    // Check if source file exists
    try {
      await fs.access(file.path);
    } catch (error) {
      return { success: false, error: `Source file not found: ${file.path}` };
    }
    
    // Validate file extension
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      return { success: false, error: `Invalid file type: ${fileExtension}. Supported formats: ${validExtensions.join(', ')}` };
    }
    
    // Check file size (max 10MB)
    try {
      const stats = await fs.stat(file.path);
      if (stats.size > 10 * 1024 * 1024) {
        return { success: false, error: 'File is too large. Maximum size is 10MB.' };
      }
    } catch (error) {
      console.warn(`[SOUNDS] Could not check file size: ${error.message}`);
    }
    
    // Validate name
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Sound name cannot be empty' };
    }
    
    if (name.length > 50) {
      return { success: false, error: 'Sound name is too long. Maximum length is 50 characters.' };
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `user-${soundType}-${timestamp}${fileExtension}`;
    
    // Ensure user sounds directory exists
    try {
      await fs.mkdir(userSoundsPath, { recursive: true });
    } catch (error) {
      console.error(`[SOUNDS] Failed to create user sounds directory: ${error.message}`);
      return { success: false, error: 'Failed to create sounds directory. Please check permissions.' };
    }
    
    // Copy file to user sounds directory
    let targetPath;
    try {
      targetPath = await copyFileToUserDirectory(file.path, userSoundsPath, filename);
    } catch (error) {
      console.error(`[SOUNDS] Failed to copy file: ${error.message}`);
      return { success: false, error: `Failed to copy file: ${error.message}` };
    }
    
    // Generate unique ID
    const soundId = `user-${soundType}-${timestamp}`;
    
    // Create sound object
    const newSound = {
      id: soundId,
      name: name.trim(),
      filename: filename,
      url: `userdata://sounds/${filename}`,
      volume: 0.5,
      enabled: true,
      isDefault: false
    };
    
    // Load current library and add new sound
    let library;
    try {
      library = await loadSoundLibrary();
    } catch (error) {
      console.error(`[SOUNDS] Failed to load sound library: ${error.message}`);
      return { success: false, error: 'Failed to load sound library. Please try again.' };
    }
    
    if (!library[soundType]) {
      library[soundType] = [];
    }
    
    // Check for duplicate names in the same sound type
    const existingSound = library[soundType].find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingSound) {
      return { success: false, error: `A sound with the name "${name}" already exists in ${SOUND_TYPES.find(t => t === soundType)}` };
    }
    
    library[soundType].push(newSound);
    
    // Save updated library
    try {
      await writeJson(savedSoundsPath, library);
      console.log(`[SOUNDS] Successfully added new sound: ${name} to ${soundType}`);
      return { success: true, sound: newSound };
    } catch (error) {
      console.error(`[SOUNDS] Failed to save sound library: ${error.message}`);
      // Try to clean up the copied file
      try {
        await fs.unlink(targetPath);
      } catch (cleanupError) {
        console.warn(`[SOUNDS] Could not clean up file after save failure: ${cleanupError.message}`);
      }
      return { success: false, error: 'Failed to save sound library. Please try again.' };
    }
  } catch (error) {
    console.error('[SOUNDS] Error adding sound:', error);
    return { success: false, error: `Unexpected error: ${error.message}` };
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
    protocolRegistered: false,
    devServerUrl: null
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
    debugInfo.protocolRegistered = true; // Always true now
    
    // Get dev server URL if in development
    if (isDev && mainWindow) {
      const url = mainWindow.webContents.getURL();
      debugInfo.devServerUrl = url;
    }
    
    console.log('[DEBUG] Sound debug info:', debugInfo);
    return debugInfo;
  } catch (error) {
    console.error('[DEBUG] Error getting sound debug info:', error);
    return { error: error.message, ...debugInfo };
  }
});

// Debug handler to manually refresh sound URLs
ipcMain.handle('refresh-sound-urls', async () => {
  try {
    await refreshSoundLibraryUrls();
    const library = await loadSoundLibrary();
    return { success: true, library };
  } catch (error) {
    console.error('[DEBUG] Error refreshing sound URLs:', error);
    return { success: false, error: error.message };
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
