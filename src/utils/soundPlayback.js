/**
 * Imperative sound playback — no React mounts.
 * Reads settings from Zustand getState() + soundLibraryCache.
 */

import audioManager, {
  CHANNEL_HOVER_ENTER_DWELL_MS,
  CHANNEL_HOVER_FADE_IN_MS,
  CHANNEL_HOVER_FADE_OUT_MS,
} from './AudioManager';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  findEnabledSound,
  getEnabledBackgroundTracks,
  getSoundLibrarySync,
  hydrateSoundLibrary,
} from './soundLibraryCache';

export {
  CHANNEL_HOVER_ENTER_DWELL_MS,
  CHANNEL_HOVER_FADE_IN_MS,
  CHANNEL_HOVER_FADE_OUT_MS,
};

function getSoundsSettings() {
  return useConsolidatedAppStore.getState().sounds || {};
}

export async function ensureSoundRuntimeReady() {
  await hydrateSoundLibrary();
  return audioManager;
}

/**
 * @returns {Promise<{ played: boolean, reason?: 'disabled' | 'no-track' }>}
 */
export async function playChannelClick() {
  const sounds = getSoundsSettings();
  if (!sounds.channelClickEnabled) {
    return { played: false, reason: 'disabled' };
  }
  await ensureSoundRuntimeReady();
  const enabled = findEnabledSound('channelClick');
  if (!enabled?.url) {
    return { played: false, reason: 'no-track' };
  }
  await audioManager.playSound(enabled.url, enabled.volume ?? sounds.channelClickVolume ?? 0.5);
  return { played: true };
}

/**
 * @param {{ url: string, volume?: number } | null} [customHoverSound]
 * @returns {Promise<{ played: boolean, reason?: 'disabled' | 'no-track' }>}
 */
export async function playChannelHover(customHoverSound = null) {
  const sounds = getSoundsSettings();
  if (!sounds.channelHoverEnabled) {
    return { played: false, reason: 'disabled' };
  }
  await ensureSoundRuntimeReady();

  if (customHoverSound?.url) {
    await audioManager.playHoverSound(
      customHoverSound.url,
      customHoverSound.volume ?? sounds.channelHoverVolume ?? 0.5,
      { fadeInMs: CHANNEL_HOVER_FADE_IN_MS, fadeOutMs: 100 }
    );
    return { played: true };
  }

  const enabled = findEnabledSound('channelHover');
  if (!enabled?.url) {
    return { played: false, reason: 'no-track' };
  }
  await audioManager.playHoverSound(
    enabled.url,
    enabled.volume ?? sounds.channelHoverVolume ?? 0.5,
    { fadeInMs: CHANNEL_HOVER_FADE_IN_MS, fadeOutMs: 100 }
  );
  return { played: true };
}

/** Soft-stop dedicated hover voice only (tile leave). */
export function stopChannelHover({ fadeMs = CHANNEL_HOVER_FADE_OUT_MS } = {}) {
  audioManager.stopHoverSound({ fadeMs });
}

export function stopSfx({ fadeMs = 120 } = {}) {
  audioManager.stopAllSounds({ fadeMs });
}

export async function playSoundEffect(url, volume = 0.5) {
  if (!url) return;
  await ensureSoundRuntimeReady();
  await audioManager.playSound(url, volume);
}

export async function playPreview(url, volume = 0.5, options = {}) {
  if (!url) return;
  await ensureSoundRuntimeReady();
  await audioManager.playPreview(url, volume, options);
}

export function stopPreview() {
  audioManager.stopPreview();
}

/** Adjust exclusive preview volume without restarting playback. */
export function setPreviewVolume(volume) {
  audioManager.setPreviewVolume(volume);
}

export async function startBackgroundMusicFromSettings() {
  const sounds = getSoundsSettings();
  if (!sounds.backgroundMusicEnabled) {
    audioManager.hardStopBackgroundMusic();
    return;
  }
  await ensureSoundRuntimeReady();

  // Stale async: user may have disabled BGM while hydrating
  const latest = getSoundsSettings();
  if (!latest.backgroundMusicEnabled) {
    audioManager.hardStopBackgroundMusic();
    return;
  }

  const enabledMusic = getEnabledBackgroundTracks();
  if (enabledMusic.length === 0) {
    audioManager.hardStopBackgroundMusic();
    return;
  }

  if (latest.backgroundMusicPlaylistMode) {
    const likedMusic = enabledMusic.filter((s) => s.liked);
    if (likedMusic.length > 0) {
      await audioManager.setBackgroundMusicPlaylist(likedMusic, !!latest.backgroundMusicLooping);
    } else {
      const sound = enabledMusic[0];
      await audioManager.setBackgroundMusic(
        sound.url,
        sound.volume ?? 0.5,
        !!latest.backgroundMusicLooping
      );
    }
  } else {
    const sound = enabledMusic[0];
    await audioManager.setBackgroundMusic(
      sound.url,
      sound.volume ?? 0.5,
      !!latest.backgroundMusicLooping
    );
  }

  // Final stale guard after awaits
  if (!getSoundsSettings().backgroundMusicEnabled) {
    audioManager.hardStopBackgroundMusic();
  }
}

/**
 * Soft-pause BGM (keeps position) when the app loses focus.
 */
export function pauseBackgroundMusic() {
  audioManager.pauseBackgroundMusic();
}

/**
 * Resume paused BGM from currentTime when possible; otherwise start from settings.
 */
export async function resumeOrStartBackgroundMusic() {
  const sounds = getSoundsSettings();
  if (!sounds.backgroundMusicEnabled) {
    audioManager.hardStopBackgroundMusic();
    return;
  }
  await ensureSoundRuntimeReady();

  const enabledMusic = getEnabledBackgroundTracks();
  if (enabledMusic.length === 0) {
    audioManager.hardStopBackgroundMusic();
    return;
  }

  let expectedUrl = enabledMusic[0]?.url;
  let resumeVolume = enabledMusic[0]?.volume ?? 0.5;
  if (sounds.backgroundMusicPlaylistMode) {
    const liked = enabledMusic.filter((s) => s.liked);
    const tracks = liked.length > 0 ? liked : enabledMusic;
    const idx = Math.max(0, audioManager.currentPlaylistIndex || 0);
    const track = tracks[Math.min(idx, tracks.length - 1)];
    expectedUrl = track?.url || expectedUrl;
    resumeVolume = track?.volume ?? resumeVolume;
  }

  if (audioManager.canResumeBackgroundMusic(expectedUrl)) {
    const ok = await audioManager.resumeBackgroundMusic(resumeVolume);
    if (ok) return;
  }

  await startBackgroundMusicFromSettings();
}

export function stopBackgroundMusic() {
  audioManager.hardStopBackgroundMusic();
}

export function updateBackgroundMusicLooping(looping) {
  audioManager.updateBackgroundMusicLooping(!!looping);
}

/** Prefer cache; fall back to sync empty until hydrate. */
export function peekLibrary() {
  return getSoundLibrarySync();
}

export { audioManager };
