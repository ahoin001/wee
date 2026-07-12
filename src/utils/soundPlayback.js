/**
 * Imperative sound playback — no React mounts.
 * Reads settings from Zustand getState() + soundLibraryCache.
 */

import audioManager from './AudioManager';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  findEnabledSound,
  getEnabledBackgroundTracks,
  getSoundLibrarySync,
  hydrateSoundLibrary,
} from './soundLibraryCache';

function getSoundsSettings() {
  return useConsolidatedAppStore.getState().sounds || {};
}

export async function ensureSoundRuntimeReady() {
  await hydrateSoundLibrary();
  return audioManager;
}

export async function playChannelClick() {
  const sounds = getSoundsSettings();
  if (!sounds.channelClickEnabled) return;
  await ensureSoundRuntimeReady();
  const enabled = findEnabledSound('channelClick');
  if (!enabled?.url) return;
  await audioManager.playSound(enabled.url, enabled.volume ?? sounds.channelClickVolume ?? 0.5);
}

export async function playChannelHover(customHoverSound = null) {
  const sounds = getSoundsSettings();
  if (!sounds.channelHoverEnabled) return;
  await ensureSoundRuntimeReady();

  if (customHoverSound?.url) {
    await audioManager.playSound(
      customHoverSound.url,
      customHoverSound.volume ?? sounds.channelHoverVolume ?? 0.5
    );
    return;
  }

  const enabled = findEnabledSound('channelHover');
  if (!enabled?.url) return;
  await audioManager.playSound(enabled.url, enabled.volume ?? sounds.channelHoverVolume ?? 0.5);
}

export function stopSfx({ fadeMs = 120 } = {}) {
  audioManager.stopAllSounds({ fadeMs });
}

export async function playSoundEffect(url, volume = 0.5) {
  if (!url) return;
  await ensureSoundRuntimeReady();
  await audioManager.playSound(url, volume);
}

export async function playPreview(url, volume = 0.5) {
  if (!url) return;
  await ensureSoundRuntimeReady();
  await audioManager.playPreview(url, volume);
}

export function stopPreview() {
  audioManager.stopPreview();
}

export async function startBackgroundMusicFromSettings() {
  const sounds = getSoundsSettings();
  if (!sounds.backgroundMusicEnabled) {
    audioManager.pauseBackgroundMusic();
    return;
  }
  await ensureSoundRuntimeReady();
  const enabledMusic = getEnabledBackgroundTracks();
  if (enabledMusic.length === 0) {
    audioManager.pauseBackgroundMusic();
    return;
  }

  if (sounds.backgroundMusicPlaylistMode) {
    const likedMusic = enabledMusic.filter((s) => s.liked);
    if (likedMusic.length > 0) {
      await audioManager.setBackgroundMusicPlaylist(likedMusic, !!sounds.backgroundMusicLooping);
    } else {
      const sound = enabledMusic[0];
      await audioManager.setBackgroundMusic(
        sound.url,
        sound.volume ?? 0.5,
        !!sounds.backgroundMusicLooping
      );
    }
  } else {
    const sound = enabledMusic[0];
    await audioManager.setBackgroundMusic(
      sound.url,
      sound.volume ?? 0.5,
      !!sounds.backgroundMusicLooping
    );
  }
}

export function stopBackgroundMusic() {
  audioManager.pauseBackgroundMusic();
}

export function updateBackgroundMusicLooping(looping) {
  audioManager.updateBackgroundMusicLooping(!!looping);
}

/** Prefer cache; fall back to sync empty until hydrate. */
export function peekLibrary() {
  return getSoundLibrarySync();
}

export { audioManager };
