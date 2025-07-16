import { useState, useEffect, useRef } from 'react';
import Channel from './components/Channel';
import HomeButton from './components/HomeButton';
import SettingsButton from './components/SettingsButton';
import NotificationsButton from './components/NotificationsButton';
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

  // Create 12 empty channels for user configuration
  const channels = Array.from({ length: 12 }, (_, index) => ({
    id: `channel-${index}`,
    empty: true
  }));

  // Load sound settings and play startup sound
  useEffect(() => {
    async function loadSettings() {
      let settings = await api.getSettings();
      if (!settings) {
        // fallback to localStorage for migration (optional)
        const legacy = localStorage.getItem('wiiDesktopSoundSettings');
        if (legacy) {
          try {
            settings = JSON.parse(legacy);
            await api.saveSettings(settings);
          } catch {}
        }
      }
      if (settings) {
        setSoundSettings(settings);
        // Play startup sound if enabled and configured
        if (settings.startup?.enabled && settings.startup?.file?.url) {
          const startupAudio = new Audio(settings.startup.file.url);
          startupAudio.volume = settings.startup.volume || 0.6;
          startupAudio.play().catch(error => {
            console.log('Startup sound playback failed:', error);
          });
        }
        // Setup background music if enabled
        if (settings.backgroundMusic?.enabled && settings.backgroundMusic?.file?.url) {
          setupBackgroundMusic(settings.backgroundMusic);
        }
      }
    }
    loadSettings();
  }, []);

  // Setup background music
  const setupBackgroundMusic = (backgroundMusicSettings) => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current = null;
    }

    if (backgroundMusicSettings?.enabled) {
      if (backgroundMusicSettings.loopMode === 'single' && backgroundMusicSettings.file?.url) {
        // Single song loop mode
        const audio = new Audio(backgroundMusicSettings.file.url);
        audio.volume = backgroundMusicSettings.volume || 0.4;
        audio.loop = true;
        
        // Start playing background music
        audio.play().catch(error => {
          console.log('Background music playback failed:', error);
        });

        backgroundAudioRef.current = audio;
        setBackgroundAudio(audio);
      } else if (backgroundMusicSettings.loopMode === 'playlist' && backgroundMusicSettings.playlist?.length > 0) {
        // Playlist mode
        setupPlaylistMode(backgroundMusicSettings);
      }
    }
  };

  // Setup playlist mode
  const setupPlaylistMode = (backgroundMusicSettings) => {
    const playlist = backgroundMusicSettings.playlist;
    let currentIndex = 0;

    const playNextSong = () => {
      if (playlist.length === 0) return;

      const song = playlist[currentIndex];
      const audio = new Audio(song.url);
      audio.volume = backgroundMusicSettings.volume || 0.4;
      
      audio.addEventListener('ended', () => {
        // Move to next song when current song ends
        currentIndex = (currentIndex + 1) % playlist.length;
        playNextSong();
      });

      audio.addEventListener('error', (error) => {
        console.log('Playlist song playback failed:', error);
        // Skip to next song on error
        currentIndex = (currentIndex + 1) % playlist.length;
        playNextSong();
      });

      // Start playing
      audio.play().catch(error => {
        console.log('Playlist song playback failed:', error);
        // Skip to next song on error
        currentIndex = (currentIndex + 1) % playlist.length;
        playNextSong();
      });

      backgroundAudioRef.current = audio;
      setBackgroundAudio(audio);
    };

    // Start playing the first song
    playNextSong();
  };

  // Update background music when sound settings change
  useEffect(() => {
    if (soundSettings?.backgroundMusic) {
      if (soundSettings.backgroundMusic.enabled && soundSettings.backgroundMusic.file?.url) {
        setupBackgroundMusic(soundSettings.backgroundMusic);
      } else {
        // Stop background music if disabled
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.pause();
          backgroundAudioRef.current = null;
          setBackgroundAudio(null);
        }
      }
    }
    // Persist sound settings
    if (soundSettings) {
      api.saveSettings(soundSettings);
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
      if (!configs) {
        // fallback to localStorage for migration (optional)
        const legacy = localStorage.getItem('wiiDesktopChannelConfigs');
        if (legacy) {
          try {
            configs = JSON.parse(legacy);
            await api.saveChannelConfigs(configs);
          } catch {}
        }
      }
      if (configs) {
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
    }
    loadChannelConfigs();
  }, []);

  // Persist channel configs whenever they change
  useEffect(() => {
    if (channelConfigs) {
      api.saveChannelConfigs(channelConfigs);
    }
  }, [channelConfigs]);

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

  return (
    <div className="app-container">
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
              onMediaChange={handleMediaChange}
              onAppPathChange={handleAppPathChange}
              onChannelSave={handleChannelSave}
            />
          );
        })}
      </div>
      <div className="ui-bar">
        <HomeButton />
        <SettingsButton 
          onClick={handleSettingsClick} 
          isActive={isEditMode} 
          onToggleDarkMode={handleToggleDarkMode}
          onToggleCursor={handleToggleCursor}
          useCustomCursor={useCustomCursor}
          onSettingsChange={setSoundSettings}
        />
        <NotificationsButton />
      </div>
    </div>
  );
}

export default App;
