class AudioManager {
  constructor() {
    this.audioInstances = new Map(); // Store reusable audio instances
    this.backgroundAudio = null;
    this.maxConcurrentSounds = 3; // Limit concurrent audio playback
    this.activeSounds = new Set();
  }

  // Get or create an audio instance for a URL
  getAudioInstance(url) {
    if (!this.audioInstances.has(url)) {
      const audio = new Audio(url);
      audio.preload = 'none'; // Don't preload to save memory
      
      // Add error handling to prevent memory leaks from failed loads
      audio.addEventListener('error', () => {
        console.warn('Audio failed to load, removing from cache:', url);
        this.audioInstances.delete(url);
      }, { once: true });
      
      this.audioInstances.set(url, audio);
    }
    return this.audioInstances.get(url);
  }

  // Play a sound with proper cleanup and concurrency limits
  async playSound(url, volume = 0.6, options = {}) {
    // Check concurrent sound limit
    if (this.activeSounds.size >= this.maxConcurrentSounds && !options.background) {
      console.log('Too many concurrent sounds, skipping:', url);
      return;
    }

    try {
      const audio = this.getAudioInstance(url);
      
      // Always ensure volume is set correctly (this fixes the volume change bug)
      audio.volume = volume;
      
      // Reset audio state
      audio.currentTime = 0;
      audio.loop = options.loop || false;
      
      // Add to active sounds if not background
      if (!options.background) {
        this.activeSounds.add(audio);
        
        // Remove from active sounds when finished
        const onEnded = () => {
          this.activeSounds.delete(audio);
          audio.removeEventListener('ended', onEnded);
        };
        audio.addEventListener('ended', onEnded);
      }

      await audio.play();
      
      // For non-looping sounds, ensure cleanup
      if (!options.loop && !options.background) {
        setTimeout(() => {
          if (this.activeSounds.has(audio)) {
            this.activeSounds.delete(audio);
          }
        }, 10000); // Fallback cleanup after 10 seconds
      }
      
    } catch (error) {
      console.error('Failed to play audio:', url, error);
    }
  }

  // Update volume for a specific audio instance (for live volume changes)
  updateVolume(url, volume) {
    const audio = this.audioInstances.get(url);
    if (audio) {
      audio.volume = volume;
    }
    
    // Also update background music if it matches
    if (this.backgroundAudio && this.backgroundAudio.src === url) {
      this.backgroundAudio.volume = volume;
    }
  }

  // Clear audio cache to force fresh instances (useful when settings change)
  clearCache() {
    this.audioInstances.forEach((audio, url) => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load();
    });
    this.audioInstances.clear();
  }

  // Update volumes for all cached instances based on sound library
  async updateVolumesFromLibrary() {
    try {
      // Get the current sound library
      const soundsApi = window.api?.sounds;
      if (!soundsApi) return;
      
      const library = await soundsApi.getLibrary();
      if (!library) return;
      
      // Update volumes for all cached instances
      this.audioInstances.forEach((audio, url) => {
        // Find the sound in the library that matches this URL
        for (const category of Object.values(library)) {
          if (Array.isArray(category)) {
            const sound = category.find(s => s.url === url);
            if (sound && sound.volume !== undefined) {
              // Only update volume if the sound is enabled, or if it's currently playing
              if (sound.enabled || !audio.paused) {
                audio.volume = sound.volume;
              }
              break;
            }
          }
        }
      });
      
      // Also update background music volume if it's playing
      if (this.backgroundAudio && !this.backgroundAudio.paused) {
        for (const category of Object.values(library)) {
          if (Array.isArray(category)) {
            const sound = category.find(s => s.url === this.backgroundAudio.src && s.enabled);
            if (sound && sound.volume !== undefined) {
              this.backgroundAudio.volume = sound.volume;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to update volumes from library:', error);
    }
  }

  // Set background music
  async setBackgroundMusic(url, volume = 0.4) {
    // Stop previous background music
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
    }

    if (url) {
      this.backgroundAudio = this.getAudioInstance(url);
      
      // Get the current volume from sound library if available
      try {
        const soundsApi = window.api?.sounds;
        if (soundsApi) {
          const library = await soundsApi.getLibrary();
          if (library?.backgroundMusic) {
            const enabledMusic = library.backgroundMusic.find(s => s.enabled);
            if (enabledMusic && enabledMusic.volume !== undefined) {
              volume = enabledMusic.volume;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get current background music volume:', error);
      }
      
      this.backgroundAudio.volume = volume;
      this.backgroundAudio.loop = true;
      this.backgroundAudio.play().catch(error => {
        console.error('Failed to play background music:', error);
      });
    } else {
      this.backgroundAudio = null;
    }
  }

  // Pause background music
  pauseBackgroundMusic() {
    if (this.backgroundAudio && !this.backgroundAudio.paused) {
      this.backgroundAudio.pause();
    }
  }

  // Resume background music with fade
  async resumeBackgroundMusic(targetVolume = 0.4) {
    if (this.backgroundAudio) {
      const audio = this.backgroundAudio;
      
      // Get the current volume from sound library if available
      try {
        const soundsApi = window.api?.sounds;
        if (soundsApi) {
          const library = await soundsApi.getLibrary();
          if (library?.backgroundMusic) {
            const enabledMusic = library.backgroundMusic.find(s => s.enabled);
            if (enabledMusic && enabledMusic.volume !== undefined) {
              targetVolume = enabledMusic.volume;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get current background music volume:', error);
      }
      
      audio.volume = 0;
      audio.play().catch(() => {});
      
      // Fade in over 1.5 seconds
      let v = 0;
      const fade = setInterval(() => {
        v += targetVolume / 15; // 100ms steps
        if (v < targetVolume) {
          audio.volume = Math.min(v, targetVolume);
        } else {
          audio.volume = targetVolume;
          clearInterval(fade);
        }
      }, 100);
    }
  }

  // Stop all sounds
  stopAllSounds() {
    this.activeSounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.activeSounds.clear();
  }

  // Cleanup all audio instances
  cleanup() {
    this.stopAllSounds();
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
      this.backgroundAudio = null;
    }
    
    // Properly cleanup all audio instances
    this.audioInstances.forEach((audio, url) => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load(); // Force cleanup
    });
    this.audioInstances.clear();
  }

  // Remove specific audio instance to free memory
  removeAudioInstance(url) {
    const audio = this.audioInstances.get(url);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load();
      this.audioInstances.delete(url);
    }
  }

  // Get active sound count
  getActiveSoundCount() {
    return this.activeSounds.size;
  }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager; 