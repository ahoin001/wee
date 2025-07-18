const { app, BrowserWindow, ipcMain, shell, protocol, dialog } = require('electron');
const path = require('path');
const { execFile, spawn } = require('child_process');
const fs = require('fs/promises');
const fsSync = require('fs');
const url = require('url');
const fsExtra = require('fs-extra');

// --- Data module helpers ---
const dataDir = path.join(app.getPath('userData'), 'data');
const soundsFile = path.join(dataDir, 'sounds.json');
const savedSoundsPath = path.join(dataDir, 'savedSounds.json');
const wallpapersFile = path.join(dataDir, 'wallpapers.json');
const channelsFile = path.join(dataDir, 'channels.json');
const userWallpapersPath = path.join(dataDir, 'wallpapers');
const userSoundsPath = path.join(dataDir, 'sounds');
const settingsFile = path.join(dataDir, 'settings.json');
const userChannelHoverSoundsPath = path.join(dataDir, 'channel-hover-sounds');

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(userWallpapersPath, { recursive: true });
  await fs.mkdir(userSoundsPath, { recursive: true });
  await fs.mkdir(userChannelHoverSoundsPath, { recursive: true });
}

// --- Sounds Data Module ---
const soundsData = {
  async get() {
    await ensureDataDir();
    try { return JSON.parse(await fs.readFile(soundsFile, 'utf-8')); } catch { return { sounds: [], settings: {} }; }
  },
  async set(data) {
    await ensureDataDir();
    await fs.writeFile(soundsFile, JSON.stringify(data, null, 2), 'utf-8');
  },
  async reset() {
    await this.set({ sounds: [], settings: {} });
  }
};

// --- Wallpapers Data Module ---
const wallpapersData = {
  async get() {
    await ensureDataDir();
    try { return JSON.parse(await fs.readFile(wallpapersFile, 'utf-8')); } catch { return { wallpapers: [], settings: {} }; }
  },
  async set(data) {
    await ensureDataDir();
    await fs.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
  },
  async reset() {
    await this.set({ wallpapers: [], settings: {} });
  }
};

// --- Channels Data Module ---
const channelsData = {
  async get() {
    await ensureDataDir();
    try { return JSON.parse(await fs.readFile(channelsFile, 'utf-8')); } catch { return { channels: [] }; }
  },
  async set(data) {
    await ensureDataDir();
    await fs.writeFile(channelsFile, JSON.stringify(data, null, 2), 'utf-8');
  },
  async reset() {
    await this.set({ channels: [] });
  }
};

// --- Settings Data Module ---
const settingsData = {
  async get() {
    await ensureDataDir();
    try { return JSON.parse(await fs.readFile(settingsFile, 'utf-8')); } catch { return {}; }
  },
  async set(data) {
    await ensureDataDir();
    await fs.writeFile(settingsFile, JSON.stringify(data, null, 2), 'utf-8');
  },
};

// --- IPC Handlers ---
ipcMain.handle('sounds:get', async () => await soundsData.get());
ipcMain.handle('sounds:set', async (e, data) => { await soundsData.set(data); return true; });
ipcMain.handle('sounds:reset', async () => { await soundsData.reset(); return true; });

ipcMain.handle('wallpapers:get', async () => await wallpapersData.get());
ipcMain.handle('wallpapers:set', async (e, data) => { await wallpapersData.set(data); return true; });
ipcMain.handle('wallpapers:reset', async () => { await wallpapersData.reset(); return true; });

ipcMain.handle('channels:get', async () => await channelsData.get());
ipcMain.handle('channels:set', async (e, data) => { await channelsData.set(data); return true; });
ipcMain.handle('channels:reset', async () => { await channelsData.reset(); return true; });

ipcMain.handle('settings:get', async () => await settingsData.get());
ipcMain.handle('settings:set', async (e, data) => { await settingsData.set(data); return true; });

// --- Reset All ---
ipcMain.handle('settings:resetAll', async () => {
  await soundsData.reset();
  await wallpapersData.reset();
  // Do NOT reset channels unless explicitly requested
  return true;
});

// --- Persistent Storage IPC Handlers ---

// Helper: Read JSON file, return defaultValue if not found or error
async function readJson(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    if (!data.trim()) {
      console.warn(`[READ] File is empty: ${filePath}`);
      return {};
    }
    try {
    return JSON.parse(data);
    } catch (parseErr) {
      console.warn(`[READ] File is invalid JSON: ${filePath}`);
      return {};
    }
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

// Helper: Write JSON file atomically
async function writeJson(filePath, data) {
  const tempPath = filePath + '.tmp';
  try {
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
    console.log(`[WRITE] Atomically wrote file: ${filePath}`);
    return true;
  } catch (err) {
    if (err.code === 'EACCES') {
      console.error(`[WRITE] Permission denied: ${filePath}`);
    } else {
      console.error(`[WRITE] Error writing file ${filePath}:`, err);
    }
    // Clean up temp file if exists
    try { await fs.unlink(tempPath); } catch {}
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
          enabled: soundType === 'startup' ? false : true
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
            enabled: soundType === 'startup' ? false : true
          });
        }
      }
      
      // Ensure default sounds are enabled by default (if they don't have enabled property)
      for (const sound of mergedLibrary[soundType]) {
        if (sound.isDefault && sound.enabled === undefined) {
          sound.enabled = soundType === 'startup' ? false : true;
        }
      }
    }
    
    // --- FIX: Always correct default sound URLs in production ---
    let needsUpdate = false;
    for (const soundType of SOUND_TYPES) {
      for (const sound of mergedLibrary[soundType]) {
        if (sound.isDefault) {
          if (process.env.NODE_ENV !== 'development') {
            // In production, always use userdata:// URL
            const prodUrl = `userdata://sounds/${sound.filename}`;
            if (sound.url !== prodUrl) {
              console.log(`[SOUNDS] Correcting default sound URL for production: ${sound.url} -> ${prodUrl}`);
              sound.url = prodUrl;
              needsUpdate = true;
            }
          } else {
            // In dev, always use dev server URL
            const devUrl = getDevServerUrl(sound.filename);
            if (sound.url !== devUrl) {
              console.log(`[SOUNDS] Correcting default sound URL for dev: ${sound.url} -> ${devUrl}`);
              sound.url = devUrl;
              needsUpdate = true;
            }
          }
        } else if (sound.filename) {
          // User sounds: always use userdata:// protocol
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
        enabled: soundType === 'startup' ? false : true
      }));
    }
    return fallbackLibrary;
  }
}

// --- Default Settings Helper ---
function getDefaultSettings() {
  return {
    isDarkMode: false,
    useCustomCursor: true,
    barType: 'flat',
    glassWiiRibbon: true,
    wallpaper: null,
    wallpaperOpacity: 1,
    savedWallpapers: [],
    likedWallpapers: [],
    cycleWallpapers: false,
    cycleInterval: 30,
    cycleAnimation: 'fade',
    sounds: {
      // Will be set up by the sound library loader
    },
  };
}

function getDefaultChannels() {
  // 12 empty channels
  const channels = {};
  for (let i = 0; i < 12; i++) {
    channels[`channel-${i}`] = {};
  }
  return channels;
}

// --- Default Settings Helper ---
function getDefaultSettings() {
  return {
    isDarkMode: false,
    useCustomCursor: true,
    barType: 'flat',
    glassWiiRibbon: true,
    wallpaper: null,
    wallpaperOpacity: 1,
    savedWallpapers: [],
    likedWallpapers: [],
    cycleWallpapers: false,
    cycleInterval: 30,
    cycleAnimation: 'fade',
    sounds: {
      // Will be set up by the sound library loader
    },
  };
}

ipcMain.handle('get-settings', async () => {
  return await readJson(settingsFile, null);
});

ipcMain.handle('save-settings', async (event, settings) => {
  return await writeJson(settingsFile, settings);
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
      enabled: false,
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

// IPC handler to copy wallpaper to user directory
ipcMain.handle('copy-wallpaper-to-user-directory', async (event, { filePath, filename }) => {
  try {
    if (!fsSync.existsSync(userWallpapersPath)) {
      fsSync.mkdirSync(userWallpapersPath, { recursive: true });
    }
    const destPath = path.join(userWallpapersPath, filename);
    await fs.copyFile(filePath, destPath);
    return { success: true, url: `userdata://wallpapers/${filename}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// File dialog handler for wallpaper selection
ipcMain.handle('select-wallpaper-file', async () => {
  try {
    console.log('[WALLPAPER] Opening file dialog for wallpaper selection');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Images & Videos', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'mp4', 'webm', 'mov', 'avi', 'mkv'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Select Wallpaper Image or Video'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const filename = path.basename(filePath);
      // Validate file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        console.error(`[WALLPAPER] Selected file does not exist: ${filePath}`);
        return { success: false, error: 'Selected file no longer exists. Please try again.' };
      }
      // Validate file extension
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.mp4', '.webm', '.mov', '.avi', '.mkv'];
      const fileExtension = path.extname(filename).toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        return {
          success: false,
          error: `Invalid file type: ${fileExtension}\n\nSupported formats: ${validExtensions.join(', ')}`
        };
      }
      // Check file size (max 20MB)
      let fileSize = null;
      try {
        const stats = await fs.stat(filePath);
        fileSize = stats.size;
        if (stats.size > 20 * 1024 * 1024) {
          return {
            success: false,
            error: 'File is too large.\n\nMaximum file size is 20MB. Please select a smaller file.'
          };
        }
        if (stats.size === 0) {
          return {
            success: false,
            error: 'File is empty.\n\nPlease select a valid image or video file.'
          };
        }
      } catch (error) {
        console.warn(`[WALLPAPER] Could not check file stats: ${error.message}`);
      }
      console.log(`[WALLPAPER] Successfully selected file: ${filename} (${filePath})`);
      return {
        success: true,
        file: {
          path: filePath,
          name: filename,
          size: fileSize
        }
      };
    } else {
      console.log('[WALLPAPER] File selection cancelled by user');
      return { success: false, error: 'No file selected' };
    }
  } catch (error) {
    console.error('[WALLPAPER] Error selecting file:', error);
    return {
      success: false,
      error: `Failed to open file dialog: ${error.message}\n\nPlease try again or restart the application.`
    };
  }
});

// --- Wallpaper IPC Handlers ---
// Add a new wallpaper (copy file, update metadata)
ipcMain.handle('wallpapers:add', async (event, { filePath, filename }) => {
  try {
    await ensureDataDir();
    if (!fsSync.existsSync(userWallpapersPath)) {
      fsSync.mkdirSync(userWallpapersPath, { recursive: true });
    }
    // Generate unique filename if needed
    let base = path.basename(filename, path.extname(filename));
    let ext = path.extname(filename);
    let uniqueName = base + ext;
    let counter = 1;
    while (fsSync.existsSync(path.join(userWallpapersPath, uniqueName))) {
      uniqueName = `${base}_${counter}${ext}`;
      counter++;
    }
    const destPath = path.join(userWallpapersPath, uniqueName);
    await fsExtra.copy(filePath, destPath);
    // Update wallpapers.json
    let data;
    try { data = JSON.parse(await fs.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
    if (!data.savedWallpapers) data.savedWallpapers = [];
    const url = `userdata://wallpapers/${uniqueName}`;
    const newWallpaper = { url, name: filename, type: ext.replace('.', ''), added: Date.now() };
    data.savedWallpapers.push(newWallpaper);
    data.wallpaper = newWallpaper;
    await fs.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
    emitWallpapersUpdated();
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete a wallpaper (remove file, update metadata)
ipcMain.handle('wallpapers:delete', async (event, { url }) => {
  try {
    if (!url || !url.startsWith('userdata://wallpapers/')) return { success: false, error: 'Invalid wallpaper URL' };
    const filename = url.replace('userdata://wallpapers/', '');
    const filePath = path.join(userWallpapersPath, filename);
    await fsExtra.remove(filePath);
    // Update wallpapers.json
    let data;
    try { data = JSON.parse(await fs.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
    data.savedWallpapers = (data.savedWallpapers || []).filter(w => w.url !== url);
    data.likedWallpapers = (data.likedWallpapers || []).filter(u => u !== url);
    if (data.wallpaper && data.wallpaper.url === url) data.wallpaper = null;
    await fs.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
    emitWallpapersUpdated();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set active wallpaper
ipcMain.handle('wallpapers:setActive', async (event, { url }) => {
  try {
    let data;
    try { data = JSON.parse(await fs.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
    const found = (data.savedWallpapers || []).find(w => w.url === url);
    if (!found) return { success: false, error: 'Wallpaper not found' };
    data.wallpaper = found;
    await fs.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
    emitWallpapersUpdated();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Toggle like/unlike wallpaper
ipcMain.handle('wallpapers:toggleLike', async (event, { url }) => {
  try {
    let data;
    try { data = JSON.parse(await fs.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
    if (!data.likedWallpapers) data.likedWallpapers = [];
    let liked;
    if (data.likedWallpapers.includes(url)) {
      data.likedWallpapers = data.likedWallpapers.filter(u => u !== url);
      liked = false;
    } else {
      data.likedWallpapers.push(url);
      liked = true;
    }
    await fs.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
    emitWallpapersUpdated();
    return { success: true, liked, likedWallpapers: data.likedWallpapers };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set cycling settings
ipcMain.handle('wallpapers:setCyclingSettings', async (event, settings) => {
  try {
    let data;
    try { data = JSON.parse(await fs.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
    data.cyclingSettings = {
      enabled: !!settings.enabled,
      interval: Math.max(2, Math.min(600, Number(settings.interval) || 30)),
      animation: settings.animation || 'fade',
    };
    await fs.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
    emitWallpapersUpdated();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Emit wallpapers:updated to all renderer processes
function emitWallpapersUpdated() {
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('wallpapers:updated');
  });
}

// --- IPC: Reset to Default ---
ipcMain.handle('reset-to-default', async () => {
  try {
    // Remove all user sounds and wallpapers
    const deleteFilesInDir = async (dir) => {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          await fs.unlink(path.join(dir, file));
        }
      } catch {}
    };
    await deleteFilesInDir(userSoundsPath);
    await deleteFilesInDir(userWallpapersPath);

    // Reset sound library to defaults
    const initialSoundLibrary = {};
    for (const soundType of SOUND_TYPES) {
      initialSoundLibrary[soundType] = DEFAULT_SOUNDS[soundType].map(sound => ({
        ...sound,
        url: process.env.NODE_ENV === 'development'
          ? getDevServerUrl(sound.filename)
          : `userdata://sounds/${sound.filename}`,
        enabled: true
      }));
    }
    await writeJson(savedSoundsPath, initialSoundLibrary);

    // Reset settings
    const defaultSettings = getDefaultSettings();
    // Set up default sound settings (enable first default sound for each type)
    for (const soundType of SOUND_TYPES) {
      const defaultSound = initialSoundLibrary[soundType][0];
      defaultSettings.sounds[soundType] = {
        soundId: defaultSound.id,
        enabled: soundType === 'startup' ? false : true, // Startup sound disabled by default
        volume: defaultSound.volume || 0.5
      };
    }
    await writeJson(settingsFile, defaultSettings);

    // Reset channels
    await writeJson(channelConfigsPath, getDefaultChannels());

    return { success: true };
  } catch (error) {
    console.error('[RESET] Failed to reset to default:', error);
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
      // Parse the path to extract executable and arguments
      let executablePath = appPath;
      let args = [];
      
      // Check if the path contains arguments (space followed by dash or other characters)
      const spaceIndex = appPath.indexOf(' ');
      if (spaceIndex !== -1) {
        executablePath = appPath.substring(0, spaceIndex);
        const argsString = appPath.substring(spaceIndex + 1);
        // Parse arguments (simple space-based splitting, can be improved)
        args = argsString.split(' ').filter(arg => arg.trim());
      }

      console.log(`Parsed executable: ${executablePath}, args: ${JSON.stringify(args)}`);

      if (asAdmin) {
        // Launch as admin using PowerShell
        const argsString = args.length > 0 ? ` -ArgumentList "${args.join('", "')}"` : '';
        const command = `Start-Process -FilePath "${executablePath.replace(/"/g, '\"')}"${argsString} -Verb RunAs`;
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
        const child = spawn(executablePath, args, {
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

// --- Electron Main Window Creation ---
let mainWindow;
let isCurrentlyFullscreen = false;
let isFrameless = true; // Start borderless by default

function sendWindowState() {
  if (mainWindow) {
    mainWindow.webContents.send('fullscreen-state', mainWindow.isFullScreen());
    mainWindow.webContents.send('frame-state', isFrameless);
  }
}

function createWindow(opts = {}) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: true,
    frame: opts.frame === undefined ? !isFrameless : opts.frame, // borderless by default
    fullscreen: opts.fullscreen || false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // Commented out to prevent auto-opening console in dev
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('enter-full-screen', () => {
    isCurrentlyFullscreen = true;
    sendWindowState();
  });
  mainWindow.on('leave-full-screen', () => {
    isCurrentlyFullscreen = false;
    sendWindowState();
  });
  sendWindowState();
}

app.whenReady().then(async () => {
  // Ensure default sounds exist in production
  await ensureDefaultSoundsExist();
  // Register userdata:// protocol for wallpapers, sounds, and channel hover sounds
  protocol.registerFileProtocol('userdata', (request, callback) => {
    const url = request.url.replace('userdata://', '');
    let filePath;
    if (url.startsWith('wallpapers/')) {
      filePath = path.join(userWallpapersPath, url.replace(/^wallpapers[\\\/]/, ''));
    } else if (url.startsWith('sounds/')) {
      filePath = path.join(userSoundsPath, url.replace(/^sounds[\\\/]/, ''));
    } else if (url.startsWith('channel-hover-sounds/')) {
      filePath = path.join(userChannelHoverSoundsPath, url.replace(/^channel-hover-sounds[\\\/]/, ''));
    } else {
      // Block access to other paths
      return callback({ error: -6 }); // net::ERR_FILE_NOT_FOUND
    }
    callback({ path: filePath });
  });
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- Window Management IPC Handlers ---
ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.on('toggle-fullscreen', () => {
  if (!mainWindow) return;
  if (mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false);
    isCurrentlyFullscreen = false;
  } else {
    mainWindow.setFullScreen(true);
    isCurrentlyFullscreen = true;
  }
  sendWindowState();
});
ipcMain.on('toggle-frame', () => {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const wasFullScreen = mainWindow.isFullScreen();
  isFrameless = !isFrameless;
  // Only recreate if needed
  createWindow({
    frame: !isFrameless,
    fullscreen: wasFullScreen,
    bounds,
  });
  // sendWindowState will be called after load
});
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('open-pip-window', (event, urlToOpen) => {
  const pipWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    alwaysOnTop: false,
    resizable: true,
    movable: true,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  pipWindow.loadURL(urlToOpen);
  pipWindow.setMenuBarVisibility(false);
});

ipcMain.on('open-external-url', (event, urlToOpen) => {
  shell.openExternal(urlToOpen);
});

ipcMain.handle('wallpaper:selectFile', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Select Wallpaper Image'
    });
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const filename = path.basename(filePath);
      // Validate file exists
      try { await fs.access(filePath); } catch { return { success: false, error: 'Selected file no longer exists. Please try again.' }; }
      // Validate file extension
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const fileExtension = path.extname(filename).toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        return { success: false, error: `Invalid file type: ${fileExtension}\n\nSupported formats: ${validExtensions.join(', ')}` };
      }
      // Check file size (max 20MB)
      let fileSize = null;
      try {
        const stats = await fs.stat(filePath);
        fileSize = stats.size;
        if (stats.size > 20 * 1024 * 1024) {
          return { success: false, error: 'File is too large.\n\nMaximum file size is 20MB. Please select a smaller file.' };
        }
        if (stats.size === 0) {
          return { success: false, error: 'File is empty.\n\nPlease select a valid image file.' };
        }
      } catch {}
      return { success: true, file: { path: filePath, name: filename, size: fileSize } };
    } else {
      return { success: false, error: 'No file selected' };
    }
  } catch (error) {
    return { success: false, error: `Failed to open file dialog: ${error.message}` };
  }
});

ipcMain.handle('channels:copyHoverSound', async (event, { filePath, filename }) => {
  try {
    await ensureDataDir();
    if (!fsSync.existsSync(userChannelHoverSoundsPath)) {
      fsSync.mkdirSync(userChannelHoverSoundsPath, { recursive: true });
    }
    // Generate unique filename if needed
    let base = path.basename(filename, path.extname(filename));
    let ext = path.extname(filename);
    let uniqueName = base + ext;
    let counter = 1;
    while (fsSync.existsSync(path.join(userChannelHoverSoundsPath, uniqueName))) {
      uniqueName = `${base}_${counter}${ext}`;
      counter++;
    }
    const destPath = path.join(userChannelHoverSoundsPath, uniqueName);
    await fsExtra.copy(filePath, destPath);
    const url = `userdata://channel-hover-sounds/${uniqueName}`;
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resolve-userdata-url', (event, url) => {
  if (typeof url !== 'string') return url;
  if (url.startsWith('userdata://')) {
    const rel = url.replace('userdata://', '');
    let filePath;
    if (rel.startsWith('sounds/')) {
      filePath = path.join(userSoundsPath, rel.replace(/^sounds[\\\/]/, ''));
    } else if (rel.startsWith('channel-hover-sounds/')) {
      filePath = path.join(userChannelHoverSoundsPath, rel.replace(/^channel-hover-sounds[\\\/]/, ''));
    } else if (rel.startsWith('wallpapers/')) {
      filePath = path.join(userWallpapersPath, rel.replace(/^wallpapers[\\\/]/, ''));
    }
    if (filePath) {
      return 'file://' + filePath;
    }
  }
  return url;
});
