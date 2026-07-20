/** Wait until the element has enough data to start (`canplay`). */
function waitForAudioReady(audio, { timeoutMs = 12000 } = {}) {
  if (audio.readyState >= 2) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      audio.removeEventListener('canplay', onOk);
      audio.removeEventListener('canplaythrough', onOk);
      audio.removeEventListener('error', onErr);
      if (timer != null) window.clearTimeout(timer);
    };
    const onOk = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const onErr = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Audio load error'));
    };
    const timer = window.setTimeout(() => {
      if (settled) return;
      // Prefer starting with what we have over hanging forever on large files.
      if (audio.readyState >= 2) {
        onOk();
        return;
      }
      settled = true;
      cleanup();
      reject(new Error('Audio load timed out'));
    }, timeoutMs);
    audio.addEventListener('canplay', onOk, { once: true });
    audio.addEventListener('canplaythrough', onOk, { once: true });
    audio.addEventListener('error', onErr, { once: true });
  });
}

const BGM_DUCK_FACTOR = 0.35;
const DEFAULT_SFX_FADE_MS = 120;
/** Channel hover voice — soft edges for skim / leave. */
export const CHANNEL_HOVER_FADE_IN_MS = 80;
export const CHANNEL_HOVER_FADE_OUT_MS = 160;
export const CHANNEL_HOVER_ENTER_DWELL_MS = 60;

class AudioManager {
  constructor() {
    /** Template Audio elements for cloneNode one-shots (keyed by URL). */
    this.templates = new Map();
    /** Single reusable BGM element — never orphan parallel Audio() instances. */
    this.backgroundAudio = null;
    this.previewAudio = null;
    /** Single channel-hover voice — not stacked in activeSounds. */
    this.hoverAudio = null;
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
    /** Bumped on every hover start/stop so stale async play() calls abort. */
    this._hoverGeneration = 0;
    /** True while exclusive preview is ducking BGM. */
    this._previewDuckActive = false;
    /** True while hover voice is ducking BGM. */
    this._hoverDuckActive = false;
    /** Optional auto-stop timer for long preview clips. */
    this._previewStopTimer = null;
    /** @type {ReturnType<typeof setInterval> | null} */
    this._hoverFadeTimer = null;
    /** @type {((this: HTMLAudioElement, ev: Event) => void) | null} */
    this._bgmEndedHandler = null;
    /** Last BGM target volume for resume-from-pause fades. */
    this._bgmResumeVolume = 0.5;
  }

  _clearPreviewStopTimer() {
    if (this._previewStopTimer == null) return;
    window.clearTimeout(this._previewStopTimer);
    this._previewStopTimer = null;
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

  _releaseHoverDuck() {
    if (!this._hoverDuckActive) return;
    this._hoverDuckActive = false;
    this._releaseDuck();
  }

  _clearHoverFadeTimer() {
    if (this._hoverFadeTimer == null) return;
    clearInterval(this._hoverFadeTimer);
    this._hoverFadeTimer = null;
  }

  _disposeHoverAudio(audio) {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
    if (this.hoverAudio === audio) this.hoverAudio = null;
  }

  /**
   * @param {HTMLAudioElement} audio
   * @param {number} fromVol
   * @param {number} toVol
   * @param {number} fadeMs
   * @param {number} generation
   * @returns {Promise<void>}
   */
  _fadeHoverVolume(audio, fromVol, toVol, fadeMs, generation) {
    this._clearHoverFadeTimer();
    if (!audio || fadeMs <= 0) {
      if (audio) audio.volume = Math.max(0, Math.min(1, toVol));
      return Promise.resolve();
    }
    const steps = Math.max(4, Math.round(fadeMs / 25));
    let step = 0;
    return new Promise((resolve) => {
      this._hoverFadeTimer = setInterval(() => {
        if (generation !== this._hoverGeneration || this.hoverAudio !== audio) {
          this._clearHoverFadeTimer();
          resolve();
          return;
        }
        step += 1;
        const t = step / steps;
        audio.volume = Math.max(0, Math.min(1, fromVol + (toVol - fromVol) * t));
        if (step >= steps) {
          this._clearHoverFadeTimer();
          resolve();
        }
      }, fadeMs / steps);
    });
  }

  /**
   * Soft-stop the dedicated hover voice only.
   * @param {{ fadeMs?: number }} [options]
   */
  stopHoverSound({ fadeMs = CHANNEL_HOVER_FADE_OUT_MS } = {}) {
    this._hoverGeneration += 1;
    const generation = this._hoverGeneration;
    void this._stopHoverInternal({ fadeMs, generation });
  }

  /**
   * @param {{ fadeMs?: number, generation: number }} options
   */
  async _stopHoverInternal({ fadeMs = CHANNEL_HOVER_FADE_OUT_MS, generation }) {
    this._clearHoverFadeTimer();
    const audio = this.hoverAudio;
    if (!audio) {
      this._releaseHoverDuck();
      return;
    }
    const startVol = audio.volume;
    if (fadeMs <= 0 || startVol <= 0) {
      this._disposeHoverAudio(audio);
      this._releaseHoverDuck();
      return;
    }
    await this._fadeHoverVolume(audio, startVol, 0, fadeMs, generation);
    if (generation !== this._hoverGeneration) return;
    this._disposeHoverAudio(audio);
    this._releaseHoverDuck();
  }

  /**
   * Single-voice channel hover with fade-in; cancels stale plays via generation.
   * @param {string} url
   * @param {number} [volume]
   * @param {{ fadeInMs?: number, fadeOutMs?: number }} [options]
   */
  async playHoverSound(url, volume = 0.5, options = {}) {
    if (!url) return;
    const fadeInMs = Number.isFinite(options?.fadeInMs)
      ? Math.max(0, options.fadeInMs)
      : CHANNEL_HOVER_FADE_IN_MS;
    const fadeOutMs = Number.isFinite(options?.fadeOutMs)
      ? Math.max(0, options.fadeOutMs)
      : Math.min(100, CHANNEL_HOVER_FADE_OUT_MS);
    const targetVol = Math.max(0, Math.min(1, Number(volume) || 0));

    this._hoverGeneration += 1;
    const generation = this._hoverGeneration;

    if (this.hoverAudio) {
      await this._stopHoverInternal({ fadeMs: fadeOutMs, generation });
    }
    if (generation !== this._hoverGeneration) return;

    let audio = null;
    try {
      const template = this.getTemplate(url);
      await waitForAudioReady(template);
      if (generation !== this._hoverGeneration) return;

      audio = /** @type {HTMLAudioElement} */ (template.cloneNode(true));
      audio.loop = false;
      audio.currentTime = 0;
      audio.volume = fadeInMs > 0 ? 0 : targetVol;

      this._applyDuck();
      this._hoverDuckActive = true;
      this.hoverAudio = audio;

      const cleanup = () => {
        if (this.hoverAudio === audio) {
          this.hoverAudio = null;
          this._releaseHoverDuck();
        }
      };
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });

      await audio.play();
      if (generation !== this._hoverGeneration) {
        this._disposeHoverAudio(audio);
        this._releaseHoverDuck();
        return;
      }

      if (fadeInMs > 0) {
        await this._fadeHoverVolume(audio, 0, targetVol, fadeInMs, generation);
      }
      this._claimMediaSession('Hover sound');
    } catch (error) {
      console.error('[AudioManager] Failed to play hover sound:', error);
      if (audio) this._disposeHoverAudio(audio);
      this._releaseHoverDuck();
    }
  }

  /**
   * True when BGM is loaded, paused, and can continue from currentTime (focus return).
   * @param {string} [expectedUrl]
   */
  canResumeBackgroundMusic(expectedUrl) {
    const audio = this.backgroundAudio;
    if (!audio?.src || !audio.paused) return false;
    if (expectedUrl && !this._urlsMatch(audio.src, expectedUrl)) return false;
    return Number.isFinite(audio.currentTime) && audio.currentTime >= 0;
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

  /** Soft pause for temporary inactivity — keeps src + currentTime for resume. */
  pauseBackgroundMusic() {
    const audio = this.backgroundAudio;
    if (!audio?.src) return;
    if (this._bgmUnduckedVolume != null) {
      this._bgmResumeVolume = this._bgmUnduckedVolume;
    } else if (audio.volume > 0) {
      this._bgmResumeVolume = audio.volume;
    }
    if (!audio.paused) {
      audio.pause();
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
    this._bgmResumeVolume = audio.volume;
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
    this._bgmResumeVolume = volume;

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
   * @param {{
   *   onEnded?: () => void,
   *   maxDurationSec?: number,
   *   startSec?: number,
   *   endSec?: number,
   * }} [options] — onEnded when playback finishes naturally or hits max/end (not on stopPreview)
   */
  async playPreview(url, volume = 0.5, options = {}) {
    if (!url) return;
    this.stopPreview();
    const onEnded = typeof options?.onEnded === 'function' ? options.onEnded : null;
    const generation = this._previewGeneration;
    const startSec = Number(options?.startSec);
    const endSec = Number(options?.endSec);
    const maxDurationSec = Number(options?.maxDurationSec);
    const finishNatural = () => {
      this._clearPreviewStopTimer();
      if (this.previewAudio) {
        this._disposeAudioElement(this.previewAudio);
        this.previewAudio = null;
      }
      this._releasePreviewDuck();
      if (generation === this._previewGeneration) {
        onEnded?.();
      }
    };
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
      if (Number.isFinite(startSec) && startSec > 0) {
        try {
          audio.currentTime = startSec;
        } catch {
          /* ignore seek failures */
        }
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

      let limitSec = null;
      if (Number.isFinite(endSec) && endSec > (Number.isFinite(startSec) ? startSec : 0)) {
        const from = Number.isFinite(startSec) ? startSec : 0;
        limitSec = Math.max(0.05, endSec - from);
      } else if (Number.isFinite(maxDurationSec) && maxDurationSec > 0) {
        limitSec = maxDurationSec;
      }
      if (limitSec != null) {
        this._clearPreviewStopTimer();
        this._previewStopTimer = window.setTimeout(() => {
          if (generation !== this._previewGeneration) return;
          finishNatural();
        }, limitSec * 1000);
      }

      audio.addEventListener(
        'ended',
        () => {
          this._clearPreviewStopTimer();
          if (this.previewAudio === audio) this.previewAudio = null;
          this._releasePreviewDuck();
          if (generation === this._previewGeneration) {
            onEnded?.();
          }
        },
        { once: true }
      );
    } catch (error) {
      this._clearPreviewStopTimer();
      this._releasePreviewDuck();
      console.error('[AudioManager] Failed to play preview:', error);
      throw error;
    }
  }

  stopPreview() {
    this._previewGeneration += 1;
    this._clearPreviewStopTimer();
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
    if (!audio?.src) return false;
    const generation = this._bgmGeneration;
    const goal = Math.max(
      0,
      Math.min(1, Number(targetVolume) || this._bgmResumeVolume || 0.4)
    );
    this._bgmResumeVolume = goal;
    audio.volume = 0;
    try {
      await waitForAudioReady(audio);
      if (generation !== this._bgmGeneration) return false;
      await audio.play();
      if (generation !== this._bgmGeneration) {
        audio.pause();
        return false;
      }
    } catch {
      return false;
    }
    let v = 0;
    const fade = setInterval(() => {
      if (generation !== this._bgmGeneration) {
        clearInterval(fade);
        return;
      }
      v += goal / 15;
      if (v < goal) {
        audio.volume = Math.min(v, goal);
      } else {
        audio.volume = goal;
        clearInterval(fade);
      }
    }, 100);
    this._claimMediaSession('Background music');
    return true;
  }

  stopAllSounds({ fadeMs = 0 } = {}) {
    this.stopHoverSound({ fadeMs });
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
      this._hoverDuckActive = false;
      if (this.backgroundAudio && this._bgmUnduckedVolume != null) {
        this.backgroundAudio.volume = this._bgmUnduckedVolume;
        this._bgmUnduckedVolume = null;
      }
    }
  }

  cleanup() {
    this.stopAllSounds();
    this.stopPreview();
    this.stopHoverSound({ fadeMs: 0 });
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
