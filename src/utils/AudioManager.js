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
      
      // Reset audio state
      audio.currentTime = 0;
      audio.volume = volume;
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

  // Set background music
  setBackgroundMusic(url, volume = 0.4) {
    // Stop previous background music
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
    }

    if (url) {
      this.backgroundAudio = this.getAudioInstance(url);
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
  resumeBackgroundMusic(targetVolume = 0.4) {
    if (this.backgroundAudio) {
      const audio = this.backgroundAudio;
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