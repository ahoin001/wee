import { useCallback, useEffect, useRef, useState } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';

/**
 * Custom hook for managing sounds with consolidated store integration
 * Provides a clean interface for sound operations and state management
 */
export const useSoundManager = () => {
  const { sounds, actions } = useConsolidatedAppStore();
  const { setSoundsState } = actions;
  const audioManagerRef = useRef(null);
  const backgroundMusicRef = useRef(null);
  const currentBackgroundMusicRef = useRef(null);
  const [audioManagerReady, setAudioManagerReady] = useState(false);

  // Debug logging
  console.log('[useSoundManager] Current sounds state:', sounds);

  // Initialize AudioManager
  useEffect(() => {
    const initAudioManager = async () => {
      try {
        const AudioManager = await import('./AudioManager');
        audioManagerRef.current = AudioManager.default;
        setAudioManagerReady(true);
        console.log('[useSoundManager] AudioManager initialized');
      } catch (error) {
        console.warn('Failed to load AudioManager:', error);
      }
    };
    initAudioManager();
  }, []);

  // Save sound settings to backend
  const saveSoundSettings = useCallback(async () => {
    try {
      console.log('[useSoundManager] Saving sound settings:', sounds);
      
      // Save to unified data API
      if (window.api?.data?.set) {
        const currentData = await window.api.data.get();
        const updatedData = {
          ...currentData,
          sounds: sounds
        };
        await window.api.data.set(updatedData);
        console.log('[useSoundManager] Saved to unified data API');
      }
      
      // Also save to legacy sounds API for backward compatibility
      if (window.api?.sounds?.set) {
        await window.api.sounds.set({ sounds: sounds });
        console.log('[useSoundManager] Saved to legacy sounds API');
      }
      
      console.log('[useSoundManager] Sound settings saved successfully');
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }, [sounds]);

  // Play channel click sound
  const playChannelClickSound = useCallback(async () => {
    if (!sounds.channelClickEnabled || !audioManagerRef.current) return;
    
    try {
      // Get the enabled click sound from the sound library
      if (window.api?.sounds?.getLibrary) {
        const library = await window.api.sounds.getLibrary();
        const enabledClickSound = library?.channelClick?.find(s => s.enabled);
        
        if (enabledClickSound) {
          await audioManagerRef.current.playSound(
            enabledClickSound.url, 
            enabledClickSound.volume ?? sounds.channelClickVolume
          );
        }
      }
    } catch (error) {
      console.warn('Failed to play channel click sound:', error);
    }
  }, [sounds.channelClickEnabled, sounds.channelClickVolume]);

  // Play channel hover sound
  const playChannelHoverSound = useCallback(async (customHoverSound = null) => {
    if (!sounds.channelHoverEnabled || !audioManagerRef.current) return;
    
    try {
      // If custom hover sound is provided, use it
      if (customHoverSound && customHoverSound.url) {
        await audioManagerRef.current.playSound(
          customHoverSound.url,
          customHoverSound.volume ?? sounds.channelHoverVolume
        );
        return;
      }
      
      // Otherwise, use the global hover sound
      if (window.api?.sounds?.getLibrary) {
        const library = await window.api.sounds.getLibrary();
        const enabledHoverSound = library?.channelHover?.find(s => s.enabled);
        
        if (enabledHoverSound) {
          await audioManagerRef.current.playSound(
            enabledHoverSound.url,
            enabledHoverSound.volume ?? sounds.channelHoverVolume
          );
        }
      }
    } catch (error) {
      console.warn('Failed to play channel hover sound:', error);
    }
  }, [sounds.channelHoverEnabled, sounds.channelHoverVolume]);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.stopAllSounds();
    }
  }, []);

  // Background music management
  const startBackgroundMusic = useCallback(async () => {
    if (!sounds.backgroundMusicEnabled || !audioManagerRef.current) {
      console.log('[useSoundManager] Background music not started - enabled:', sounds.backgroundMusicEnabled, 'audioManager:', !!audioManagerRef.current);
      return;
    }
    
    try {
      console.log('[useSoundManager] Starting background music...');
      console.log('[useSoundManager] Current sound settings:', sounds);
      
      // Get enabled background music from sound library
      if (window.api?.sounds?.getLibrary) {
        const library = await window.api.sounds.getLibrary();
        console.log('[useSoundManager] Loaded sound library:', library);
        
        const backgroundMusic = library?.backgroundMusic || [];
        const enabledMusic = backgroundMusic.filter(s => s.enabled);
        
        console.log('[useSoundManager] Found enabled background music:', enabledMusic.length);
        console.log('[useSoundManager] All background music:', backgroundMusic);
        console.log('[useSoundManager] Enabled background music:', enabledMusic);
        
        if (enabledMusic.length > 0) {
          if (sounds.backgroundMusicPlaylistMode) {
            // Playlist mode - play liked sounds in order
            const likedMusic = enabledMusic.filter(s => s.liked);
            console.log('[useSoundManager] Playlist mode - liked music:', likedMusic.length);
            console.log('[useSoundManager] Liked music details:', likedMusic);
            
            if (likedMusic.length > 0) {
              console.log('[useSoundManager] Starting playlist mode...');
              await audioManagerRef.current.setBackgroundMusicPlaylist(
                likedMusic, 
                sounds.backgroundMusicLooping
              );
              console.log('[useSoundManager] Playlist mode started successfully');
            } else {
              console.log('[useSoundManager] No liked music found for playlist mode');
              audioManagerRef.current.pauseBackgroundMusic();
            }
          } else {
            // Single track mode - play first enabled sound
            const sound = enabledMusic[0];
            console.log('[useSoundManager] Single track mode - playing:', sound.name);
            console.log('[useSoundManager] Sound details:', sound);
            
            await audioManagerRef.current.setBackgroundMusic(
              sound.url, 
              sound.volume ?? 0.5, 
              sounds.backgroundMusicLooping
            );
            console.log('[useSoundManager] Single track mode started successfully');
          }
        } else {
          console.log('[useSoundManager] No enabled background music found');
          audioManagerRef.current.pauseBackgroundMusic();
        }
      } else {
        console.warn('[useSoundManager] Sounds API not available');
      }
    } catch (error) {
      console.error('[useSoundManager] Failed to start background music:', error);
    }
  }, [sounds.backgroundMusicEnabled, sounds.backgroundMusicLooping, sounds.backgroundMusicPlaylistMode]);

  const stopBackgroundMusic = useCallback(() => {
    if (audioManagerRef.current) {
      console.log('[useSoundManager] Stopping background music');
      audioManagerRef.current.pauseBackgroundMusic();
    }
  }, []);

  // Toggle background music
  const toggleBackgroundMusic = useCallback(async (enabled) => {
    console.log('[useSoundManager] toggleBackgroundMusic called with:', enabled);
    
    const newSettings = {
      ...sounds,
      backgroundMusicEnabled: enabled
    };
    
    setSoundsState(newSettings);
    
    // Save immediately
    try {
      await saveSoundSettings();
      console.log('[useSoundManager] Background music settings saved successfully');
    } catch (error) {
      console.error('[useSoundManager] Failed to save background music settings:', error);
    }
    
    // Start or stop background music
    if (enabled) {
      console.log('[useSoundManager] Background music enabled, starting playback...');
      await startBackgroundMusic();
    } else {
      console.log('[useSoundManager] Background music disabled, stopping playback...');
      stopBackgroundMusic();
    }
  }, [sounds, setSoundsState, saveSoundSettings, startBackgroundMusic, stopBackgroundMusic]);

  // Toggle background music looping
  const toggleBackgroundMusicLooping = useCallback(async (looping) => {
    console.log('[useSoundManager] toggleBackgroundMusicLooping called with:', looping);
    
    const newSettings = {
      ...sounds,
      backgroundMusicLooping: looping
    };
    
    setSoundsState(newSettings);
    
    // Save immediately
    try {
      await saveSoundSettings();
      console.log('[useSoundManager] Looping settings saved successfully');
    } catch (error) {
      console.error('[useSoundManager] Failed to save looping settings:', error);
    }
    
    // Update current background music if playing
    if (sounds.backgroundMusicEnabled && audioManagerRef.current) {
      audioManagerRef.current.updateBackgroundMusicLooping(looping);
    }
  }, [sounds, setSoundsState, saveSoundSettings]);

  // Toggle playlist mode
  const togglePlaylistMode = useCallback(async (playlistMode) => {
    console.log('[useSoundManager] togglePlaylistMode called with:', playlistMode);
    
    const newSettings = {
      ...sounds,
      backgroundMusicPlaylistMode: playlistMode
    };
    
    setSoundsState(newSettings);
    
    // Save immediately
    try {
      await saveSoundSettings();
      console.log('[useSoundManager] Playlist mode settings saved successfully');
    } catch (error) {
      console.error('[useSoundManager] Failed to save playlist mode settings:', error);
    }
    
    // Restart background music with new mode if enabled
    if (sounds.backgroundMusicEnabled) {
      console.log('[useSoundManager] Restarting background music with new playlist mode...');
      await startBackgroundMusic();
    }
  }, [sounds, setSoundsState, saveSoundSettings, startBackgroundMusic]);

  // Update channel click sound settings
  const updateChannelClickSound = useCallback(async (enabled, volume = 0.5) => {
    console.log('[useSoundManager] updateChannelClickSound called with:', { enabled, volume });
    
    const newSettings = {
      ...sounds,
      channelClickEnabled: enabled,
      channelClickVolume: volume
    };
    
    setSoundsState(newSettings);
    
    // Save immediately
    try {
      await saveSoundSettings();
      console.log('[useSoundManager] Channel click settings saved successfully');
    } catch (error) {
      console.error('[useSoundManager] Failed to save channel click settings:', error);
    }
  }, [sounds, setSoundsState, saveSoundSettings]);

  // Update channel hover sound settings
  const updateChannelHoverSound = useCallback(async (enabled, volume = 0.5) => {
    console.log('[useSoundManager] updateChannelHoverSound called with:', { enabled, volume });
    
    const newSettings = {
      ...sounds,
      channelHoverEnabled: enabled,
      channelHoverVolume: volume
    };
    
    setSoundsState(newSettings);
    
    // Save immediately
    try {
      await saveSoundSettings();
      console.log('[useSoundManager] Channel hover settings saved successfully');
    } catch (error) {
      console.error('[useSoundManager] Failed to save channel hover settings:', error);
    }
  }, [sounds, setSoundsState, saveSoundSettings]);

  // Manually update background music (useful when sound library changes)
  const updateBackgroundMusic = useCallback(async () => {
    if (sounds.backgroundMusicEnabled && audioManagerRef.current) {
      console.log('[useSoundManager] Manually updating background music...');
      await startBackgroundMusic();
    }
  }, [sounds.backgroundMusicEnabled, startBackgroundMusic]);

  // Play a sound effect (utility function)
  const playSoundEffect = useCallback(async (soundUrl, volume = 0.5) => {
    if (!audioManagerRef.current) return;
    
    try {
      await audioManagerRef.current.playSound(soundUrl, volume);
    } catch (error) {
      console.warn('Failed to play sound effect:', error);
    }
  }, []);

  // Get current sound settings
  const getSoundSettings = useCallback(() => {
    return sounds;
  }, [sounds]);

  // Initialize background music when app becomes focused
  useEffect(() => {
    const handleWindowFocus = () => {
      if (sounds.backgroundMusicEnabled && audioManagerRef.current) {
        console.log('[useSoundManager] Window focused, starting background music...');
        startBackgroundMusic();
      }
    };

    const handleWindowBlur = () => {
      // Optionally stop background music when window loses focus
      // Uncomment the next line if you want this behavior
      // stopBackgroundMusic();
    };

    // Add event listeners
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      stopBackgroundMusic();
    };
  }, [sounds.backgroundMusicEnabled, startBackgroundMusic, stopBackgroundMusic]);

  // Handle AudioManager initialization - but don't auto-start background music
  useEffect(() => {
    if (audioManagerReady) {
      console.log('[useSoundManager] AudioManager ready');
    }
  }, [audioManagerReady]);

  return {
    // State
    soundSettings: sounds,
    
    // Actions
    playChannelClickSound,
    playChannelHoverSound,
    stopAllSounds,
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleBackgroundMusic,
    toggleBackgroundMusicLooping,
    togglePlaylistMode,
    updateChannelClickSound,
    updateChannelHoverSound,
    updateBackgroundMusic,
    playSoundEffect,
    getSoundSettings,
    saveSoundSettings,
    
    // AudioManager reference
    audioManager: audioManagerRef.current
  };
};

export default useSoundManager;
