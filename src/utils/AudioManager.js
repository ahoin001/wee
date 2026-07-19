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
    /** Single reusable BGM element — never orphan parallel Audio() instances. */
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
    /** Bumped on every BGM start/stop so stale async play() calls abort. */
    this._bgmGeneration = 0;
    /** Bumped on every preview start/stop so ended callbacks stay scoped to the active preview. */
    this._previewGeneration = 0;
    /** True while exclusive preview is ducking BGM. */
    this._previewDuckActive = false;
    /** @type {((this: HTMLAudioElement, ev: Event) => void) | null} */
    this._bgmEndedHandler = null;
  }

  _disposeAudioElement(audio) {
    if (!audio) return;
    try {
      audio.pause();
      audio.removeAttribute('src');
      audio.src = '';
      audio.load();
    } catch {
      /* ignore */
    }
  }

  _releasePreviewDuck() {
    if (!this._previewDuckActive) return;
    this._previewDuckActive = false;
    this._releaseDuck();
  }

  _ensureBackgroundAudio() {
    if (this.backgroundAudio) return this.backgroundAudio;
    const audio = new Audio();
    audio.preload = 'auto';
    this.backgroundAudio = audio;
    return audio;
  }

  _detachBgmEndedHandler() {
    const audio = this.backgroundAudio;
    if (!audio || !this._bgmEndedHandler) {
      this._bgmEndedHandler = null;
      return;
    }
    try {
      audio.removeEventListener('ended', this._bgmEndedHandler);
    } catch {
      /* ignore */
    }
    this._bgmEndedHandler = null;
    if (audio.onEnded) {
      try {
        audio.removeEventListener('ended', audio.onEnded);
      } catch {
        /* ignore */
      }
      audio.onEnded = null;
    }
  }

  /**
   * Hard stop: silence BGM, clear playlist callbacks, invalidate in-flight starts.
   * Call when disabled / disallowed — not soft pause.
   */
  hardStopBackgroundMusic() {
    this._bgmGeneration += 1;
    this._detachBgmEndedHandler();
    this.playlistTracks = null;
    this.currentPlaylistIndex = 0;
    this.playlistLooping = false;
    this._duckCount = 0;
    this._bgmUnduckedVolume = null;

    const audio = this.backgroundAudio;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = false;
      audio.removeAttribute('src');
      audio.src = '';
      audio.load();
    } catch {
      /* ignore */
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaSession) {
        navigator.mediaSession.playbackState = 'none';
      }
    } catch {
      /* ignore */
    }
  }

  /** Soft pause for temporary inactivity — keeps src so lifecycle can resume via start. */
  pauseBackgroundMusic() {
    if (this.backgroundAudio && !this.backgroundAudio.paused) {
      this.backgroundAudio.pause();
    }
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

    let audio = null;
    let ducked = false;
    try {
      const template = this.getTemplate(url);
      await waitForAudioReady(template);

      audio = /** @type {HTMLAudioElement} */ (template.cloneNode(true));
      audio.volume = volume;
      audio.loop = loop;
      audio.currentTime = 0;

      this._applyDuck();
      ducked = true;
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
      if (audio) this.activeSounds.delete(audio);
      if (ducked) this._releaseDuck();
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
    const audio = this.backgroundAudio;
    if (!audio || !audio.src) return;
    // Single-track mode only — playlist always advances via ended handler
    if (this.playlistTracks?.length) return;
    this._detachBgmEndedHandler();
    audio.loop = !!loop;
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
    this._bgmGeneration += 1;
    const generation = this._bgmGeneration;
    this._detachBgmEndedHandler();
    this._duckCount = 0;
    this._bgmUnduckedVolume = null;

    const audio = this._ensureBackgroundAudio();
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }

    if (!tracks?.length) {
      this.hardStopBackgroundMusic();
      return;
    }

    this.playlistTracks = tracks;
    this.currentPlaylistIndex = 0;
    this.playlistLooping = loop;
    await this.playNextPlaylistTrack(generation);
  }

  async playNextPlaylistTrack(generation = this._bgmGeneration) {
    if (generation !== this._bgmGeneration) return;

    if (!this.playlistTracks || this.currentPlaylistIndex >= this.playlistTracks.length) {
      if (this.playlistLooping && this.playlistTracks?.length) {
        this.currentPlaylistIndex = 0;
        await this.playNextPlaylistTrack(generation);
      } else {
        this.hardStopBackgroundMusic();
      }
      return;
    }

    const track = this.playlistTracks[this.currentPlaylistIndex];
    const audio = this._ensureBackgroundAudio();
    this._detachBgmEndedHandler();

    audio.loop = false;
    audio.volume = track.volume ?? 0.4;
    if (this._duckCount > 0) {
      this._bgmUnduckedVolume = audio.volume;
      audio.volume = Math.max(0, audio.volume * BGM_DUCK_FACTOR);
    }

    try {
      audio.pause();
      audio.src = track.url;
      audio.load();
    } catch {
      /* ignore */
    }

    const onEnded = () => {
      if (generation !== this._bgmGeneration) return;
      this._detachBgmEndedHandler();
      this.currentPlaylistIndex += 1;
      void this.playNextPlaylistTrack(generation);
    };
    this._bgmEndedHandler = onEnded;
    audio.addEventListener('ended', onEnded);

    try {
      await waitForAudioReady(audio);
      if (generation !== this._bgmGeneration) return;
      await audio.play();
      if (generation !== this._bgmGeneration) {
        audio.pause();
        return;
      }
      this._claimMediaSession(track.name || 'Background music');
    } catch (error) {
      if (generation !== this._bgmGeneration) return;
      console.error('Failed to play playlist track:', error);
      this.currentPlaylistIndex += 1;
      await this.playNextPlaylistTrack(generation);
    }
  }

  async setBackgroundMusic(url, volume = 0.4, loop = true) {
    this._bgmGeneration += 1;
    const generation = this._bgmGeneration;
    this._detachBgmEndedHandler();
    this._duckCount = 0;
    this._bgmUnduckedVolume = null;
    this.playlistTracks = null;
    this.currentPlaylistIndex = 0;
    this.playlistLooping = false;

    if (!url) {
      this.hardStopBackgroundMusic();
      return;
    }

    const audio = this._ensureBackgroundAudio();
    audio.volume = volume;
    audio.loop = !!loop;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = url;
      audio.load();
    } catch {
      /* ignore */
    }

    try {
      await waitForAudioReady(audio);
      if (generation !== this._bgmGeneration) return;
      await audio.play();
      if (generation !== this._bgmGeneration) {
        audio.pause();
        return;
      }
      this._claimMediaSession('Background music');
    } catch (error) {
      if (generation !== this._bgmGeneration) return;
      console.error('[AudioManager] Failed to play background music:', error);
    }
  }

  /**
   * Exclusive preview slot (Test / Preview buttons).
   * @param {string} url
   * @param {number} [volume]
   * @param {{ onEnded?: () => void }} [options] — called when playback finishes naturally (not on stopPreview)
   */
  async playPreview(url, volume = 0.5, options = {}) {
    if (!url) return;
    this.stopPreview();
    const onEnded = typeof options?.onEnded === 'function' ? options.onEnded : null;
    const generation = ++this._previewGeneration;
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.loop = false;
      audio.volume = Math.max(0, Math.min(1, Number(volume) || 0));
      await waitForAudioReady(audio);
      if (generation !== this._previewGeneration) {
        this._disposeAudioElement(audio);
        return;
      }
      this._applyDuck();
      this._previewDuckActive = true;
      await audio.play();
      if (generation !== this._previewGeneration) {
        this._disposeAudioElement(audio);
        this._releasePreviewDuck();
        return;
      }
      this.previewAudio = audio;
      audio.addEventListener(
        'ended',
        () => {
          if (this.previewAudio === audio) this.previewAudio = null;
          this._releasePreviewDuck();
          // Only notify if this preview was not superseded by stop/replace.
          if (generation === this._previewGeneration) {
            onEnded?.();
          }
        },
        { once: true }
      );
    } catch (error) {
      this._releasePreviewDuck();
      console.error('[AudioManager] Failed to play preview:', error);
      throw error;
    }
  }

  stopPreview() {
    this._previewGeneration += 1;
    this._releasePreviewDuck();
    if (!this.previewAudio) return;
    this._disposeAudioElement(this.previewAudio);
    this.previewAudio = null;
  }

  setPreviewVolume(volume) {
    if (!this.previewAudio) return;
    this.previewAudio.volume = Math.max(0, Math.min(1, Number(volume) || 0));
  }

  async resumeBackgroundMusic(targetVolume = 0.4) {
    const audio = this.backgroundAudio;
    if (!audio?.src) return;
    const generation = this._bgmGeneration;
    audio.volume = 0;
    try {
      await waitForAudioReady(audio);
      if (generation !== this._bgmGeneration) return;
      await audio.play();
      if (generation !== this._bgmGeneration) {
        audio.pause();
        return;
      }
    } catch {
      return;
    }
    let v = 0;
    const fade = setInterval(() => {
      if (generation !== this._bgmGeneration) {
        clearInterval(fade);
        return;
      }
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
    this.hardStopBackgroundMusic();
    this.backgroundAudio = null;
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
