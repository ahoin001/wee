/** Wait until the element can play through. */
function waitForAudioReady(audio) {
  if (audio.readyState >= 2) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onOk = () => {
      audio.removeEventListener('error', onErr);
      resolve();
    };
    const onErr = () => {
      audio.removeEventListener('canplaythrough', onOk);
      reject(new Error('Audio load error'));
    };
    audio.addEventListener('canplaythrough', onOk, { once: true });
    audio.addEventListener('error', onErr, { once: true });
  });
}

const BGM_DUCK_FACTOR = 0.35;
const DEFAULT_SFX_FADE_MS = 120;

class AudioManager {
  constructor() {
    /** Template Audio elements for cloneNode one-shots (keyed by URL). */
    this.templates = new Map();
    this.backgroundAudio = null;
    this.previewAudio = null;
    this.maxConcurrentSounds = 6;
    /** @type {Set<HTMLAudioElement>} */
    this.activeSounds = new Set();
    this.playlistTracks = null;
    this.currentPlaylistIndex = 0;
    this.playlistLooping = false;
    this._bgmUnduckedVolume = null;
    this._duckCount = 0;
  }

  /** Cache template Audio elements for cloneNode one-shots (keyed by URL). */
  getTemplate(url) {
    if (this.templates.has(url)) {
      return this.templates.get(url);
    }
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.load();
    this.templates.set(url, audio);
    return audio;
  }

  _stealOldestActive() {
    const oldest = this.activeSounds.values().next().value;
    if (!oldest) return;
    try {
      oldest.pause();
      oldest.currentTime = 0;
    } catch {
      /* ignore */
    }
    this.activeSounds.delete(oldest);
    this._releaseDuck();
  }

  _applyDuck() {
    this._duckCount += 1;
    if (this._duckCount !== 1 || !this.backgroundAudio) return;
    const bg = this.backgroundAudio;
    if (this._bgmUnduckedVolume == null) {
      this._bgmUnduckedVolume = bg.volume;
    }
    bg.volume = Math.max(0, this._bgmUnduckedVolume * BGM_DUCK_FACTOR);
  }

  _releaseDuck() {
    if (this._duckCount <= 0) return;
    this._duckCount -= 1;
    if (this._duckCount > 0 || !this.backgroundAudio) return;
    if (this._bgmUnduckedVolume != null) {
      this.backgroundAudio.volume = this._bgmUnduckedVolume;
      this._bgmUnduckedVolume = null;
    }
  }

  fadeOutAndStop(audio, fadeMs = DEFAULT_SFX_FADE_MS) {
    if (!audio) return;
    const startVol = audio.volume;
    if (fadeMs <= 0 || startVol <= 0) {
      audio.pause();
      audio.currentTime = 0;
      this.activeSounds.delete(audio);
      this._releaseDuck();
      return;
    }
    const steps = Math.max(4, Math.round(fadeMs / 25));
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(id);
        audio.pause();
        audio.currentTime = 0;
        this.activeSounds.delete(audio);
        this._releaseDuck();
      }
    }, fadeMs / steps);
  }

  _claimMediaSession(title = 'Wee') {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaSession) return;
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: 'Wee',
        album: 'Desktop Launcher',
      });
      navigator.mediaSession.playbackState = 'playing';
    } catch {
      /* mediaSession optional */
    }
  }

  async playSound(url, volume = 0.7, loop = false) {
    if (!url) return;

    while (this.activeSounds.size >= this.maxConcurrentSounds) {
      this._stealOldestActive();
    }

    try {
      const template = this.getTemplate(url);
      await waitForAudioReady(template);

      const audio = /** @type {HTMLAudioElement} */ (template.cloneNode(true));
      audio.volume = volume;
      audio.loop = loop;
      audio.currentTime = 0;

      this._applyDuck();
      this.activeSounds.add(audio);

      const cleanup = () => {
        this.activeSounds.delete(audio);
        this._releaseDuck();
      };
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });

      await audio.play();
      this._claimMediaSession('Sound');
    } catch (error) {
      console.error('Error playing sound:', error);
      this._releaseDuck();
    }
  }

  updateVolume(url, volume) {
    const template = this.templates.get(url);
    if (template) template.volume = volume;

    if (this.backgroundAudio && this._urlsMatch(this.backgroundAudio.src, url)) {
      this.backgroundAudio.volume = volume;
      if (this._duckCount > 0) {
        this._bgmUnduckedVolume = volume;
        this.backgroundAudio.volume = Math.max(0, volume * BGM_DUCK_FACTOR);
      }
    }
  }

  _urlsMatch(a, b) {
    if (!a || !b) return false;
    try {
      return decodeURIComponent(a).endsWith(b) || a.includes(b) || b.includes(a);
    } catch {
      return a === b;
    }
  }

  updateBackgroundMusicLooping(loop) {
    if (!this.backgroundAudio) return;
    this.backgroundAudio.loop = loop;
    if (this.backgroundAudio.onEnded) {
      this.backgroundAudio.removeEventListener('ended', this.backgroundAudio.onEnded);
      this.backgroundAudio.onEnded = null;
    }
    if (!loop) {
      const onEnded = () => {
        this.backgroundAudio = null;
      };
      this.backgroundAudio.addEventListener('ended', onEnded);
      this.backgroundAudio.onEnded = onEnded;
    }
  }

  clearCache() {
    this.templates.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load();
    });
    this.templates.clear();
  }

  async setBackgroundMusicPlaylist(tracks, loop = true) {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
    }
    this._duckCount = 0;
    this._bgmUnduckedVolume = null;

    if (tracks && tracks.length > 0) {
      this.playlistTracks = tracks;
      this.currentPlaylistIndex = 0;
      this.playlistLooping = loop;
      await this.playNextPlaylistTrack();
    } else {
      this.backgroundAudio = null;
      this.playlistTracks = null;
    }
  }

  async playNextPlaylistTrack() {
    if (!this.playlistTracks || this.currentPlaylistIndex >= this.playlistTracks.length) {
      if (this.playlistLooping) {
        this.currentPlaylistIndex = 0;
        await this.playNextPlaylistTrack();
      } else {
        this.backgroundAudio = null;
        this.playlistTracks = null;
      }
      return;
    }

    const track = this.playlistTracks[this.currentPlaylistIndex];
    // Dedicated BGM element (not shared with one-shot templates)
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = track.url;
    audio.volume = track.volume ?? 0.4;
    audio.loop = false;
    this.backgroundAudio = audio;

    const onEnded = () => {
      this.currentPlaylistIndex++;
      audio.removeEventListener('ended', onEnded);
      this.playNextPlaylistTrack();
    };
    audio.addEventListener('ended', onEnded);

    try {
      await waitForAudioReady(audio);
      await audio.play();
      this._claimMediaSession(track.name || 'Background music');
    } catch (error) {
      console.error('Failed to play playlist track:', error);
      this.currentPlaylistIndex++;
      await this.playNextPlaylistTrack();
    }
  }

  async setBackgroundMusic(url, volume = 0.4, loop = true) {
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
    }
    this._duckCount = 0;
    this._bgmUnduckedVolume = null;
    this.playlistTracks = null;

    if (!url) {
      this.backgroundAudio = null;
      return;
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.volume = volume;
    audio.loop = loop;
    this.backgroundAudio = audio;

    if (!loop) {
      const onEnded = () => {
        if (this.backgroundAudio === audio) this.backgroundAudio = null;
      };
      audio.addEventListener('ended', onEnded);
      audio.onEnded = onEnded;
    }

    try {
      await waitForAudioReady(audio);
      await audio.play();
      this._claimMediaSession('Background music');
    } catch (error) {
      console.error('[AudioManager] Failed to play background music:', error);
    }
  }

  pauseBackgroundMusic() {
    if (this.backgroundAudio && !this.backgroundAudio.paused) {
      this.backgroundAudio.pause();
    }
  }

  async playPreview(url, volume = 0.5) {
    if (!url) return;
    this.stopPreview();
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.loop = false;
      audio.volume = volume;
      await waitForAudioReady(audio);
      await audio.play();
      this.previewAudio = audio;
      audio.addEventListener(
        'ended',
        () => {
          if (this.previewAudio === audio) this.previewAudio = null;
        },
        { once: true }
      );
    } catch (error) {
      console.error('[AudioManager] Failed to play preview:', error);
    }
  }

  stopPreview() {
    if (!this.previewAudio) return;
    this.previewAudio.pause();
    this.previewAudio.currentTime = 0;
    this.previewAudio = null;
  }

  async resumeBackgroundMusic(targetVolume = 0.4) {
    if (!this.backgroundAudio) return;
    const audio = this.backgroundAudio;
    audio.volume = 0;
    try {
      await waitForAudioReady(audio);
      await audio.play();
    } catch {
      return;
    }
    let v = 0;
    const fade = setInterval(() => {
      v += targetVolume / 15;
      if (v < targetVolume) {
        audio.volume = Math.min(v, targetVolume);
      } else {
        audio.volume = targetVolume;
        clearInterval(fade);
      }
    }, 100);
  }

  stopAllSounds({ fadeMs = 0 } = {}) {
    const snapshot = [...this.activeSounds];
    snapshot.forEach((audio) => {
      if (fadeMs > 0) {
        this.fadeOutAndStop(audio, fadeMs);
      } else {
        audio.pause();
        audio.currentTime = 0;
        this.activeSounds.delete(audio);
        this._releaseDuck();
      }
    });
    if (fadeMs <= 0) {
      this.activeSounds.clear();
      this._duckCount = 0;
      if (this.backgroundAudio && this._bgmUnduckedVolume != null) {
        this.backgroundAudio.volume = this._bgmUnduckedVolume;
        this._bgmUnduckedVolume = null;
      }
    }
  }

  cleanup() {
    this.stopAllSounds();
    this.stopPreview();
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
      this.backgroundAudio.currentTime = 0;
      this.backgroundAudio = null;
    }
    this.playlistTracks = null;
    this.currentPlaylistIndex = 0;
    this.playlistLooping = false;
    this._duckCount = 0;
    this._bgmUnduckedVolume = null;
    this.clearCache();
  }

  removeAudioInstance(url) {
    const audio = this.templates.get(url);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      audio.load();
      this.templates.delete(url);
    }
  }

  getActiveSoundCount() {
    return this.activeSounds.size;
  }
}

const audioManager = new AudioManager();

export default audioManager;
