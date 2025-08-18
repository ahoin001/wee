import { useCallback, useState, useEffect } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';

/**
 * Custom hook for managing the sound library
 * Handles sound file operations, library state, and Electron integration
 */
export const useSoundLibrary = () => {
  const { actions } = useConsolidatedAppStore();
  const [soundLibrary, setSoundLibrary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sound categories
  const SOUND_CATEGORIES = [
    { key: 'backgroundMusic', label: 'Background Music' },
    { key: 'channelClick', label: 'Channel Click Sound' },
    { key: 'channelHover', label: 'Channel Hover Sound' },
  ];

  // Load sound library from backend
  const loadSoundLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useSoundLibrary] Loading sound library...');
      
      if (window.api?.sounds?.getLibrary) {
        const library = await window.api.sounds.getLibrary();
        console.log('[useSoundLibrary] Loaded library:', library);
        console.log('[useSoundLibrary] Library keys:', Object.keys(library || {}));
        
        if (library) {
          // Log details for each category
          Object.keys(library).forEach(category => {
            if (Array.isArray(library[category])) {
              console.log(`[useSoundLibrary] ${category}: ${library[category].length} sounds`);
              library[category].forEach(sound => {
                console.log(`[useSoundLibrary]   - ${sound.name} (enabled: ${sound.enabled}, volume: ${sound.volume})`);
              });
            }
          });
        }
        
        setSoundLibrary(library || {});
      } else {
        console.warn('[useSoundLibrary] Sounds API not available');
        setSoundLibrary({});
      }
    } catch (err) {
      console.error('[useSoundLibrary] Failed to load sound library:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load library on mount
  useEffect(() => {
    loadSoundLibrary();
  }, [loadSoundLibrary]);

  // Add a new sound to the library
  const addSound = useCallback(async (soundType, file, name) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useSoundLibrary] Adding sound:', { soundType, name, file });
      
      if (!window.api?.sounds?.add) {
        throw new Error('Sounds API not available');
      }
      
      console.log('[useSoundLibrary] Calling sounds API add...');
      const result = await window.api.sounds.add({ soundType, file, name });
      console.log('[useSoundLibrary] Add result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add sound');
      }
      
      console.log('[useSoundLibrary] Sound added successfully:', result);
      
      // Reload the library to get the updated state
      console.log('[useSoundLibrary] Reloading library after add...');
      await loadSoundLibrary();
      console.log('[useSoundLibrary] Library reloaded after add');
      
      return result;
    } catch (err) {
      console.error('[useSoundLibrary] Failed to add sound:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSoundLibrary]);

  // Remove a sound from the library
  const removeSound = useCallback(async (soundType, soundId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useSoundLibrary] Removing sound:', { soundType, soundId });
      
      if (!window.api?.sounds?.remove) {
        throw new Error('Sounds API not available');
      }
      
      const result = await window.api.sounds.remove({ soundType, soundId });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove sound');
      }
      
      console.log('[useSoundLibrary] Sound removed successfully:', result);
      
      // Reload the library to get the updated state
      await loadSoundLibrary();
      
      return result;
    } catch (err) {
      console.error('[useSoundLibrary] Failed to remove sound:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSoundLibrary]);

  // Update a sound in the library
  const updateSound = useCallback(async (soundType, soundId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useSoundLibrary] Updating sound:', { soundType, soundId, updates });
      
      if (!window.api?.sounds?.update) {
        throw new Error('Sounds API not available');
      }
      
      const result = await window.api.sounds.update({ soundType, soundId, updates });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update sound');
      }
      
      console.log('[useSoundLibrary] Sound updated successfully:', result);
      
      // Reload the library to get the updated state
      await loadSoundLibrary();
      
      return result;
    } catch (err) {
      console.error('[useSoundLibrary] Failed to update sound:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSoundLibrary]);

  // Toggle like status for a sound
  const toggleLike = useCallback(async (soundId) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useSoundLibrary] Toggling like for sound:', soundId);
      
      if (!window.api?.sounds?.toggleLike) {
        throw new Error('Sounds API not available');
      }
      
      const result = await window.api.sounds.toggleLike({ soundId });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle like');
      }
      
      console.log('[useSoundLibrary] Like toggled successfully:', result);
      
      // Reload the library to get the updated state
      await loadSoundLibrary();
      
      return result;
    } catch (err) {
      console.error('[useSoundLibrary] Failed to toggle like:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSoundLibrary]);

  // Select a sound file using the file picker
  const selectSoundFile = useCallback(async () => {
    try {
      console.log('[useSoundLibrary] Opening file picker...');
      
      if (!window.api?.sounds?.selectFile) {
        throw new Error('Sounds API not available');
      }
      
      const result = await window.api.sounds.selectFile();
      
      if (!result.success) {
        throw new Error(result.error || 'File selection cancelled');
      }
      
      console.log('[useSoundLibrary] File selected:', result);
      return result;
    } catch (err) {
      console.error('[useSoundLibrary] Failed to select file:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Get sounds by category
  const getSoundsByCategory = useCallback((category) => {
    return soundLibrary[category] || [];
  }, [soundLibrary]);

  // Get enabled sounds by category
  const getEnabledSoundsByCategory = useCallback((category) => {
    const sounds = soundLibrary[category] || [];
    return sounds.filter(sound => sound.enabled);
  }, [soundLibrary]);

  // Get liked sounds by category
  const getLikedSoundsByCategory = useCallback((category) => {
    const sounds = soundLibrary[category] || [];
    return sounds.filter(sound => sound.liked);
  }, [soundLibrary]);

  // Get a specific sound by ID
  const getSoundById = useCallback((soundId) => {
    for (const category of SOUND_CATEGORIES) {
      const sounds = soundLibrary[category.key] || [];
      const sound = sounds.find(s => s.id === soundId);
      if (sound) return sound;
    }
    return null;
  }, [soundLibrary]);

  // Check if a sound is enabled
  const isSoundEnabled = useCallback((soundId) => {
    const sound = getSoundById(soundId);
    return sound ? sound.enabled : false;
  }, [getSoundById]);

  // Check if a sound is liked
  const isSoundLiked = useCallback((soundId) => {
    const sound = getSoundById(soundId);
    return sound ? sound.liked : false;
  }, [getSoundById]);

  // Get the first enabled sound for a category
  const getFirstEnabledSound = useCallback((category) => {
    const enabledSounds = getEnabledSoundsByCategory(category);
    return enabledSounds.length > 0 ? enabledSounds[0] : null;
  }, [getEnabledSoundsByCategory]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    soundLibrary,
    loading,
    error,
    
    // Categories
    SOUND_CATEGORIES,
    
    // Actions
    loadSoundLibrary,
    addSound,
    removeSound,
    updateSound,
    toggleLike,
    selectSoundFile,
    clearError,
    
    // Getters
    getSoundsByCategory,
    getEnabledSoundsByCategory,
    getLikedSoundsByCategory,
    getSoundById,
    isSoundEnabled,
    isSoundLiked,
    getFirstEnabledSound,
  };
};

export default useSoundLibrary;
