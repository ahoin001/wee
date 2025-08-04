// Steam Games Integration Utility
// This file provides functions to detect Steam installation and scan for games
// NO STEAM API REQUIRED - uses local file scanning only

// Common Steam installation paths
const STEAM_PATHS = [
  'C:\\Program Files (x86)\\Steam',
  'C:\\Program Files\\Steam',
  'D:\\Steam',
  'E:\\Steam',
  'F:\\Steam'
];

// Steam CDN URLs for game covers (public, no API key needed)
const STEAM_CDN_URLS = {
  header: (appId) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
  library: (appId) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
  logo: (appId) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/logo.png`
};

/**
 * Detect Steam installation directory by checking common paths
 * @returns {string|null} Path to Steam installation or null if not found
 */
export const detectSteamInstallation = async () => {
  if (!window.api?.detectSteamInstallation) {
    console.warn('Steam detection API not available - using fallback');
    // Fallback: return most common path
    return 'C:\\Program Files (x86)\\Steam';
  }

  try {
    const result = await window.api.detectSteamInstallation();
    return result?.steamPath || null;
  } catch (error) {
    console.error('Failed to detect Steam installation:', error);
    return null;
  }
};

/**
 * Get Steam library folders by parsing libraryfolders.vdf
 * Steam stores library locations in: steamapps/libraryfolders.vdf
 * @param {string} steamPath - Path to Steam installation
 * @returns {string[]} Array of library folder paths
 */
export const getSteamLibraries = async (steamPath) => {
  if (!window.api?.getSteamLibraries) {
    console.warn('Steam libraries API not available - using fallback');
    // Fallback: return default library path
    return [`${steamPath}\\steamapps`];
  }

  try {
    const result = await window.api.getSteamLibraries({ steamPath });
    return result?.libraries || [];
  } catch (error) {
    console.error('Failed to get Steam libraries:', error);
    return [];
  }
};

/**
 * Scan Steam games from library folders
 * Each game has a manifest file: steamapps/appmanifest_[appid].acf
 * @param {string[]} libraryPaths - Array of Steam library paths
 * @returns {Array} Array of game objects
 */
export const scanSteamGames = async (libraryPaths) => {
  if (!window.api?.scanSteamGames) {
    console.warn('Steam games scanning API not available - using mock data');
    return getMockSteamGames();
  }

  try {
    const result = await window.api.scanSteamGames({ libraryPaths });
    return result?.games || [];
  } catch (error) {
    console.error('Failed to scan Steam games:', error);
    return [];
  }
};

/**
 * Get Steam game cover art URL from Steam CDN
 * These URLs are public and don't require API keys
 * @param {string} appId - Steam App ID
 * @param {string} type - Cover type: 'header', 'library', or 'logo'
 * @returns {string} URL to the cover art
 */
export const getSteamGameCover = (appId, type = 'header') => {
  if (!appId) return null;
  
  const urlGenerator = STEAM_CDN_URLS[type];
  return urlGenerator ? urlGenerator(appId) : null;
};

/**
 * Get Steam game launch URL
 * @param {string} appId - Steam App ID
 * @returns {string} Steam launch URL
 */
export const getSteamGameLaunchUrl = (appId) => {
  if (!appId) return null;
  return `steam://rungameid/${appId}`;
};

/**
 * Complete Steam games discovery workflow
 * NO STEAM API REQUIRED - uses local file scanning only
 * @returns {Promise<Array>} Array of Steam games with metadata
 */
export const discoverSteamGames = async () => {
  try {
    console.log('[SteamGames] Starting discovery (no API required)...');
    
    // Step 1: Detect Steam installation
    const steamPath = await detectSteamInstallation();
    if (!steamPath) {
      console.log('[SteamGames] Steam not detected');
      return [];
    }
    console.log('[SteamGames] Steam found at:', steamPath);

    // Step 2: Get library folders
    const libraries = await getSteamLibraries(steamPath);
    if (libraries.length === 0) {
      console.log('[SteamGames] No Steam libraries found');
      return [];
    }
    console.log('[SteamGames] Found libraries:', libraries);

    // Step 3: Scan for games
    const games = await scanSteamGames(libraries);
    
    // Step 4: Enhance games with cover art URLs
    const enhancedGames = games.map(game => ({
      ...game,
      coverUrl: getSteamGameCover(game.appId, 'header'),
      libraryCoverUrl: getSteamGameCover(game.appId, 'library'),
      logoUrl: getSteamGameCover(game.appId, 'logo'),
      launchUrl: getSteamGameLaunchUrl(game.appId)
    }));

    console.log(`[SteamGames] Discovered ${enhancedGames.length} games (no API required)`);
    return enhancedGames;

  } catch (error) {
    console.error('[SteamGames] Discovery failed:', error);
    return [];
  }
};

/**
 * Mock Steam games data for development/testing
 * Simulates real Steam game data structure
 * @returns {Array} Array of mock Steam games
 */
export const getMockSteamGames = () => {
  const mockGames = [
    {
      appId: '730',
      name: 'Counter-Strike 2',
      installed: true,
      sizeOnDisk: 45000000000, // 45 GB
      lastUpdated: Date.now() - 86400000, // 1 day ago
      installdir: 'Counter-Strike Global Offensive',
      coverUrl: getSteamGameCover('730', 'header'),
      launchUrl: getSteamGameLaunchUrl('730')
    },
    {
      appId: '252950',
      name: 'Rocket League',
      installed: true,
      sizeOnDisk: 25000000000, // 25 GB
      lastUpdated: Date.now() - 172800000, // 2 days ago
      installdir: 'rocketleague',
      coverUrl: getSteamGameCover('252950', 'header'),
      launchUrl: getSteamGameLaunchUrl('252950')
    },
    {
      appId: '570',
      name: 'Dota 2',
      installed: true,
      sizeOnDisk: 35000000000, // 35 GB
      lastUpdated: Date.now() - 3600000, // 1 hour ago
      installdir: 'dota 2 beta',
      coverUrl: getSteamGameCover('570', 'header'),
      launchUrl: getSteamGameLaunchUrl('570')
    },
    {
      appId: '271590',
      name: 'Grand Theft Auto V',
      installed: false,
      sizeOnDisk: 0,
      lastUpdated: 0,
      installdir: 'Grand Theft Auto V',
      coverUrl: getSteamGameCover('271590', 'header'),
      launchUrl: getSteamGameLaunchUrl('271590')
    },
    {
      appId: '1172470',
      name: 'Apex Legends',
      installed: true,
      sizeOnDisk: 40000000000, // 40 GB
      lastUpdated: Date.now() - 7200000, // 2 hours ago
      installdir: 'r5apex',
      coverUrl: getSteamGameCover('1172470', 'header'),
      launchUrl: getSteamGameLaunchUrl('1172470')
    },
    {
      appId: '1091500',
      name: 'Cyberpunk 2077',
      installed: true,
      sizeOnDisk: 65000000000, // 65 GB
      lastUpdated: Date.now() - 43200000, // 12 hours ago
      installdir: 'Cyberpunk 2077',
      coverUrl: getSteamGameCover('1091500', 'header'),
      launchUrl: getSteamGameLaunchUrl('1091500')
    }
  ];

  return mockGames;
};

/**
 * Example of what the Electron API would look like for Steam scanning
 * This would be implemented in electron.cjs
 */
export const STEAM_API_EXAMPLE = {
  // Detect Steam installation
  detectSteamInstallation: async () => {
    // Check common Steam paths
    // Return first found path
  },
  
  // Parse libraryfolders.vdf
  getSteamLibraries: async ({ steamPath }) => {
    // Read steamapps/libraryfolders.vdf
    // Parse VDF format
    // Return array of library paths
  },
  
  // Scan appmanifest files
  scanSteamGames: async ({ libraryPaths }) => {
    // For each library path:
    // - Scan steamapps/appmanifest_*.acf files
    // - Parse each manifest file
    // - Extract game data
    // Return array of game objects
  }
};

export default {
  detectSteamInstallation,
  getSteamLibraries,
  scanSteamGames,
  getSteamGameCover,
  getSteamGameLaunchUrl,
  discoverSteamGames,
  getMockSteamGames,
  STEAM_API_EXAMPLE
}; 