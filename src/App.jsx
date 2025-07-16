import { useState, useEffect, useRef } from 'react';
import Channel from './components/Channel';
import HomeButton from './components/HomeButton';
import SettingsButton from './components/SettingsButton';
import NotificationsButton from './components/NotificationsButton';
import FlatBar from './components/FlatBar';
import WiiBar from './components/WiiBar';
import './App.css';

// Guard for window.api to prevent errors in browser
const api = window.api || {
  getSettings: async () => null,
  saveSettings: async () => {},
  getChannelConfigs: async () => null,
  saveChannelConfigs: async () => {},
  getSavedSounds: async () => null,
  saveSavedSounds: async () => {},
  launchApp: () => {},
};

function WiiCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = (e) => {
      if (e.target.closest('.channel, .circular-button, .context-menu-item')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  return (
    <div 
      className={`wii-cursor ${isHovering ? 'hover' : ''}`}
      style={{ 
        left: position.x, 
        top: position.y 
      }}
    />
  );
}

function App() {
  const [mediaMap, setMediaMap] = useState({});
  const [appPathMap, setAppPathMap] = useState({});
  const [channelConfigs, setChannelConfigs] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [useCustomCursor, setUseCustomCursor] = useState(true);
  const [soundSettings, setSoundSettings] = useState(null);
  const [backgroundAudio, setBackgroundAudio] = useState(null);
  const backgroundAudioRef = useRef(null);
  const [showDragRegion, setShowDragRegion] = useState(false);
  const [barType, setBarType] = useState('flat');
  const [wallpaper, setWallpaper] = useState(null);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(1);
  const [savedWallpapers, setSavedWallpapers] = useState([]);
  const [likedWallpapers, setLikedWallpapers] = useState([]);
  const [cycleWallpapers, setCycleWallpapers] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(30);
  const [cycleAnimation, setCycleAnimation] = useState('fade');
  const [wallpaperIndex, setWallpaperIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false); // track modal open
  const cycleTimeoutRef = useRef();
  // Track previous wallpaper for fade animation
  const [prevWallpaper, setPrevWallpaper] = useState(null);

  const [channels, setChannels] = useState([]);

  // On mount, load channels from storage or create default
  useEffect(() => {
    async function loadChannels() {
      let configs = await api.getChannelConfigs();
      
      // Create a fixed grid of 12 channels
      const gridChannels = [];
      const existingIds = new Set();
      
      // First, create all 12 channel positions with default IDs
      for (let i = 0; i < 12; i++) {
        const defaultId = `channel-${i}`;
        gridChannels.push({ id: defaultId, empty: true });
        existingIds.add(defaultId);
      }
      
      // Then, load saved channels and place them in their correct positions
      if (configs && Object.keys(configs).length > 0) {
        Object.entries(configs).forEach(([channelId, config]) => {
          // Extract position from channel ID (e.g., "channel-5" -> position 5)
          const positionMatch = channelId.match(/^channel-(\d+)$/);
          if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            if (position >= 0 && position < 12) {
              // Place the saved channel in its correct position
              gridChannels[position] = {
                id: channelId,
                ...config,
                empty: !(config.media || config.path)
              };
            }
          }
        });
      }
      
      setChannels(gridChannels);
    }
    loadChannels();
  }, []);

  // Load sound settings and play startup sound
  useEffect(() => {
    async function loadSettings() {
      let settings = await api.getSettings();
      let soundLibrary = await api.getSoundLibrary();
      let updated = false;
      
      // Extract sound settings from the new structure
      const soundSettings = settings?.sounds || {};
      
      // Initialize sound settings with enabled default sounds if not set
      for (const soundType of ['startup', 'backgroundMusic', 'channelClick', 'channelHover']) {
        if (!soundSettings[soundType]) {
          const defaultSound = soundLibrary[soundType]?.find(s => s.isDefault && s.enabled);
          if (defaultSound) {
            soundSettings[soundType] = {
              soundId: defaultSound.id,
              enabled: true,
              volume: defaultSound.volume || 0.5
            };
            updated = true;
          }
        }
      }
      
      if (updated) {
        settings = settings || {};
        settings.sounds = soundSettings;
        await api.saveSettings(settings);
      }
      
      if (soundSettings) {
        setSoundSettings(soundSettings);
        
        // Play startup sound if enabled and configured
        let playedStartup = false;
        if (soundSettings.startup?.enabled && soundSettings.startup?.soundId) {
          const startupSound = soundLibrary.startup?.find(s => s.id === soundSettings.startup.soundId);
          if (startupSound && startupSound.enabled) {
            playedStartup = true;
            const startupAudio = new Audio(startupSound.url);
            startupAudio.volume = soundSettings.startup.volume || startupSound.volume || 0.6;
            startupAudio.play().catch(error => {
              console.log('Startup sound playback failed:', error);
              // If playback fails, start background music immediately
              if (soundSettings.backgroundMusic?.enabled && soundSettings.backgroundMusic?.soundId) {
                setupBackgroundMusic(soundSettings.backgroundMusic, soundLibrary);
              }
            });
            startupAudio.addEventListener('ended', () => {
              if (soundSettings.backgroundMusic?.enabled && soundSettings.backgroundMusic?.soundId) {
                setupBackgroundMusic(soundSettings.backgroundMusic, soundLibrary);
              }
            });
          }
        }
        
        // If no startup sound, start background music immediately
        if (!playedStartup && soundSettings.backgroundMusic?.enabled && soundSettings.backgroundMusic?.soundId) {
          setupBackgroundMusic(soundSettings.backgroundMusic, soundLibrary);
        }
      }
    }
    loadSettings();
  }, []);

  // Persist sound settings whenever they change
  useEffect(() => {
    if (soundSettings) {
      // Save sound settings as part of the main settings object
      api.saveSettings({ sounds: soundSettings });
    }
  }, [soundSettings]);

  // Setup background music
  const setupBackgroundMusic = async (backgroundMusicSettings, soundLibrary) => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current = null;
    }

    if (backgroundMusicSettings?.enabled && backgroundMusicSettings?.soundId) {
      const musicSound = soundLibrary?.backgroundMusic?.find(s => s.id === backgroundMusicSettings.soundId);
      if (musicSound && musicSound.enabled) {
        const audio = new Audio(musicSound.url);
        audio.volume = backgroundMusicSettings.volume || musicSound.volume || 0.4;
        audio.loop = true;
        
        // Start playing background music
        audio.play().catch(error => {
          console.log('Background music playback failed:', error);
        });

        backgroundAudioRef.current = audio;
        setBackgroundAudio(audio);
      }
    }
  };

  // Update background music when sound settings change
  useEffect(() => {
    if (soundSettings?.backgroundMusic) {
      if (soundSettings.backgroundMusic.enabled && soundSettings.backgroundMusic.soundId) {
        // Load sound library to get the current sound
        api.getSoundLibrary().then(soundLibrary => {
          setupBackgroundMusic(soundSettings.backgroundMusic, soundLibrary);
        });
      } else {
        // Stop background music if disabled
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.pause();
          backgroundAudioRef.current = null;
          setBackgroundAudio(null);
        }
      }
    }
  }, [soundSettings?.backgroundMusic, soundSettings]);

  // Cleanup background audio on unmount
  useEffect(() => {
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
    };
  }, []);

  // Load channel configurations from persistent storage
  useEffect(() => {
    async function loadChannelConfigs() {
      let configs = await api.getChannelConfigs();
      if (!configs) configs = {};
      setChannelConfigs(configs);
      // Update mediaMap and appPathMap from saved configs
      const newMediaMap = {};
      const newAppPathMap = {};
      Object.entries(configs).forEach(([channelId, config]) => {
        if (config.media) newMediaMap[channelId] = config.media;
        if (config.path) newAppPathMap[channelId] = config.path;
      });
      setMediaMap(newMediaMap);
      setAppPathMap(newAppPathMap);
    }
    loadChannelConfigs();
  }, []);

  // Note: Channel configs are saved directly in handleChannelSave, not here
  // to avoid overwriting data on app startup

  // Load settings (including barType) from persistent storage
  useEffect(() => {
    async function loadSettings() {
      let settings = await api.getSettings();
      if (settings) {
        setIsDarkMode(settings.isDarkMode ?? false);
        setUseCustomCursor(settings.useCustomCursor ?? true);
        setBarType(settings.barType ?? 'flat');
        setWallpaper(settings.wallpaper || null);
        setWallpaperOpacity(settings.wallpaperOpacity ?? 1);
        setSavedWallpapers(settings.savedWallpapers || []);
        setLikedWallpapers(settings.likedWallpapers || []);
        setCycleWallpapers(settings.cycleWallpapers ?? false);
        setCycleInterval(settings.cycleInterval ?? 30);
        setCycleAnimation(settings.cycleAnimation || 'fade');
      }
    }
    loadSettings();
  }, []);
  // Persist barType and other settings when changed
  useEffect(() => {
    api.saveSettings({
      isDarkMode,
      useCustomCursor,
      barType,
      wallpaper,
      wallpaperOpacity,
      savedWallpapers,
      likedWallpapers,
      cycleWallpapers,
      cycleInterval,
      cycleAnimation,
    });
  }, [isDarkMode, useCustomCursor, barType, wallpaper, wallpaperOpacity, savedWallpapers, likedWallpapers, cycleWallpapers, cycleInterval, cycleAnimation]);

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Apply cursor mode
  useEffect(() => {
    if (useCustomCursor) {
      document.body.classList.add('custom-cursor');
    } else {
      document.body.classList.remove('custom-cursor');
    }
  }, [useCustomCursor]);

  useEffect(() => {
    if (window.api && window.api.onUpdateDragRegion) {
      window.api.onUpdateDragRegion((shouldShow) => {
        setShowDragRegion(shouldShow);
      });
    } else if (window.require) {
      // Fallback for Electron context
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('update-drag-region', (event, shouldShow) => {
        setShowDragRegion(shouldShow);
      });
    }
  }, []);

  const handleMediaChange = (id, file) => {
    const url = URL.createObjectURL(file);
    setMediaMap((prev) => ({
      ...prev,
      [id]: { url, type: file.type },
    }));
  };

  const handleAppPathChange = (id, path) => {
    setAppPathMap((prev) => ({
      ...prev,
      [id]: path,
    }));
  };

  const handleChannelSave = (channelId, channelData) => {
    // If channelData is null, clear the channel completely
    if (channelData === null) {
      setChannelConfigs(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        // Save the updated configs
        api.saveChannelConfigs(updated);
        return updated;
      });
      // Clear media and path maps for this channel
      setMediaMap(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        return updated;
      });
      setAppPathMap(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        return updated;
      });
      return;
    }
    // Update channel configurations
    setChannelConfigs(prev => {
      const updated = {
        ...prev,
        [channelId]: channelData
      };
      // Save the updated configs
      api.saveChannelConfigs(updated);
      return updated;
    });
    // Update media and path maps
    if (channelData.media) {
      setMediaMap(prev => ({
        ...prev,
        [channelId]: channelData.media
      }));
    }
    if (channelData.path) {
      setAppPathMap(prev => ({
        ...prev,
        [channelId]: channelData.path
      }));
    }
  };

  const handleSettingsClick = () => {
    setIsEditMode(!isEditMode);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleToggleCursor = () => {
    setUseCustomCursor(!useCustomCursor);
  };

  const handleBarTypeChange = (type) => {
    setBarType(type);
  };

  // Handler for settings changes from WallpaperModal
  const handleSettingsChange = (newSettings) => {
    if (newSettings.wallpaper !== undefined) setWallpaper(newSettings.wallpaper);
    if (newSettings.wallpaperOpacity !== undefined) setWallpaperOpacity(newSettings.wallpaperOpacity);
    if (newSettings.savedWallpapers !== undefined) setSavedWallpapers(newSettings.savedWallpapers);
    if (newSettings.likedWallpapers !== undefined) setLikedWallpapers(newSettings.likedWallpapers);
    if (newSettings.cycleWallpapers !== undefined) setCycleWallpapers(newSettings.cycleWallpapers);
    if (newSettings.cycleInterval !== undefined) setCycleInterval(newSettings.cycleInterval);
    if (newSettings.cycleAnimation !== undefined) setCycleAnimation(newSettings.cycleAnimation);
    if (newSettings.sounds) setSoundSettings(newSettings.sounds);
  };

  // Pass settings to SettingsButton via window.settings for now (could use context for better solution)
  window.settings = {
    wallpaper,
    wallpaperOpacity,
    savedWallpapers,
    likedWallpapers,
    cycleWallpapers,
    cycleInterval,
    cycleAnimation,
  };

  // Compute the list of wallpapers to cycle through
  const cycleList = savedWallpapers.filter(w => likedWallpapers.includes(w.url));
  // Improved cycling logic: use a single timer for fade+interval, always use latest cycleInterval
  useEffect(() => {
    if (!cycleWallpapers || cycleList.length < 2 || showWallpaperModal) {
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      setPrevWallpaper(null);
      return;
    }
    let idx = cycleList.findIndex(w => w.url === (wallpaper?.url));
    if (idx === -1) idx = 0;
    setWallpaperIndex(idx);
    cycleTimeoutRef.current && clearTimeout(cycleTimeoutRef.current);
    // Show fade for fade animation
    const doCycle = () => {
      if (cycleAnimation === 'fade') setPrevWallpaper(wallpaper);
      setAnimating(true);
      setTimeout(() => {
        setAnimating(false);
        setWallpaperIndex(prev => (prev + 1) % cycleList.length);
        setWallpaper(cycleList[(idx + 1) % cycleList.length]);
        if (cycleAnimation === 'fade') setTimeout(() => setPrevWallpaper(null), 800);
        // Wait for fade, then wait for interval before next cycle
        cycleTimeoutRef.current = setTimeout(doCycle, Math.max(2, cycleInterval) * 1000);
      }, cycleAnimation === 'fade' ? 800 : cycleAnimation === 'carousel' ? 600 : 0);
    };
    // Start the first cycle after the interval
    cycleTimeoutRef.current = setTimeout(doCycle, Math.max(2, cycleInterval) * 1000);
    return () => cycleTimeoutRef.current && clearTimeout(cycleTimeoutRef.current);
  }, [cycleWallpapers, cycleList, cycleAnimation, wallpaper, showWallpaperModal, likedWallpapers, cycleInterval]);
  // When wallpaperIndex changes, update wallpaper
  useEffect(() => {
    if (cycleWallpapers && cycleList.length > 1) {
      setWallpaper(cycleList[wallpaperIndex % cycleList.length]);
    }
  }, [wallpaperIndex, cycleWallpapers, cycleList]);

  return (
    <div className="app-container">
      {/* Wallpaper background layer with fade crossfade */}
      {cycleAnimation === 'fade' && prevWallpaper && animating ? (
        <div className="wallpaper-fade-stack">
          <div
            className="wallpaper-bg fade animating"
            style={{
              background: `url('${prevWallpaper.url}') center center / cover no-repeat`,
              opacity: wallpaperOpacity,
            }}
          />
          <div
            className="wallpaper-bg fade"
            style={{
              background: `url('${wallpaper.url}') center center / cover no-repeat`,
              opacity: wallpaperOpacity,
            }}
          />
        </div>
      ) : (
        wallpaper && wallpaper.url && (
          <div
            className={`wallpaper-bg${animating ? ' animating' : ''} ${cycleAnimation}`}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 0,
              pointerEvents: 'none',
              background: `url('${wallpaper.url}') center center / cover no-repeat`,
              opacity: wallpaperOpacity,
              transition: cycleAnimation === 'fade' ? 'opacity 0.8s' : cycleAnimation === 'carousel' ? 'none' : 'none',
              transform: animating && cycleAnimation === 'carousel' ? 'none' : 'none',
            }}
          />
        )
      )}
      {cycleAnimation === 'carousel' && animating && prevWallpaper && wallpaper ? (
        <div className="wallpaper-carousel-stack" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '200vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'row',
          zIndex: 0,
          pointerEvents: 'none',
          transform: animating ? 'translateX(0)' : 'translateX(-100vw)',
          transition: 'transform 0.6s cubic-bezier(.4,1.3,.5,1)',
        }}>
          <div className="wallpaper-bg carousel" style={{
            width: '100vw',
            height: '100vh',
            background: `url('${prevWallpaper.url}') center center / cover no-repeat`,
            opacity: wallpaperOpacity,
            margin: 0,
            padding: 0,
            border: 'none',
          }} />
          <div className="wallpaper-bg carousel" style={{
            width: '100vw',
            height: '100vh',
            background: `url('${wallpaper.url}') center center / cover no-repeat`,
            opacity: wallpaperOpacity,
            margin: 0,
            padding: 0,
            border: 'none',
          }} />
        </div>
      ) : null}
      {showDragRegion && (
        <div style={{ width: '100%', height: 32, WebkitAppRegion: 'drag', position: 'fixed', top: 0, left: 0, zIndex: 10000 }} />
      )}
      {useCustomCursor && <WiiCursor />}
      <div className="channels-grid">
        {channels.map((channel) => {
          const config = channelConfigs[channel.id];
          const isConfigured = config && (config.media || config.path);
          return (
            <Channel
              key={channel.id}
              {...channel}
              empty={!isConfigured}
              media={mediaMap[channel.id]}
              path={appPathMap[channel.id]}
              type={config?.type}
              title={config?.title}
              hoverSound={config?.hoverSound}
              onMediaChange={handleMediaChange}
              onAppPathChange={handleAppPathChange}
              onChannelSave={handleChannelSave}
            />
          );
        })}
      </div>
      {barType === 'flat' ? (
        <FlatBar
          onSettingsClick={handleSettingsClick}
          isEditMode={isEditMode}
          onToggleDarkMode={handleToggleDarkMode}
          onToggleCursor={handleToggleCursor}
          useCustomCursor={useCustomCursor}
          onSettingsChange={handleSettingsChange}
          barType={barType}
          onBarTypeChange={handleBarTypeChange}
        />
      ) : (
        <WiiBar
          onSettingsClick={handleSettingsClick}
          barType={barType}
          onBarTypeChange={handleBarTypeChange}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </div>
  );
}

export default App;
