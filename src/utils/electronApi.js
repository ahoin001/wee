import {
  mergeCanonicalSettings,
  normalizeUnifiedSettingsSnapshot,
  withSettingsSchemaMeta,
} from './store/settingsPersistenceContract';
import isEqual from 'fast-deep-equal';
import PQueue from 'p-queue';

const getApi = () => (typeof window !== 'undefined' ? window.api : null);
const settingsWriteQueue = new PQueue({ concurrency: 1 });

const safeCall = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (error) {
    console.warn('[electronApi] API call failed:', error);
    return fallback;
  }
};

/**
 * Read unified-data and return only canonical settings slices.
 */
export async function loadUnifiedSettingsSnapshot() {
  const api = getApi();
  if (!api?.data?.get) return null;
  const unified = await safeCall(() => api.data.get(), null);
  if (!unified?.settings) return null;
  return normalizeUnifiedSettingsSnapshot(unified.settings);
}

/**
 * Persist canonical settings slices into unified-data.json.
 * This is the single source of truth writer for renderer settings.
 */
export async function saveUnifiedSettingsSnapshot(settingsSnapshot) {
  const api = getApi();
  if (!api?.data?.get || !api?.data?.set) return false;

  return settingsWriteQueue.add(async () => {
    const current = await safeCall(() => api.data.get(), null);
    if (!current) return false;

    const nextSettings = mergeCanonicalSettings(current.settings, settingsSnapshot || {});
    if (isEqual(current.settings, nextSettings)) {
      return true;
    }

    const payload = withSettingsSchemaMeta({
      ...current,
      settings: nextSettings,
    });

    return safeCall(() => api.data.set(payload), false);
  });
}

/** Merge fields into `unified-data.json` → `settings.appearance` (e.g. spotifyMatchEnabled). */
export async function saveUnifiedAppearancePatch(patch) {
  return saveUnifiedSettingsSnapshot({
    ui: { ...patch },
  });
}

/** Persist the consolidated sounds slice into `unified-data.json` → `settings.sounds`. */
export async function saveUnifiedSoundSettings(soundsState) {
  return saveUnifiedSettingsSnapshot({
    sounds: soundsState,
  });
}

export const electronApi = {
  async getUnifiedData() {
    const api = getApi();
    if (!api?.data?.get) return null;
    return safeCall(() => api.data.get(), null);
  },

  async getWallpapers() {
    const api = getApi();
    if (!api?.wallpapers?.get) return null;
    return safeCall(() => api.wallpapers.get(), null);
  },

  async getChannels() {
    const api = getApi();
    if (!api?.channels?.get) return null;
    return safeCall(() => api.channels.get(), null);
  },

  async setFullscreen(enabled) {
    const api = getApi();
    if (!api?.setFullscreen) return null;
    return safeCall(() => api.setFullscreen(enabled), null);
  },

  async openDevTools() {
    const api = getApi();
    if (!api?.openDevTools) return { success: false };
    return safeCall(() => api.openDevTools(), { success: false });
  },

  async forceDevTools() {
    const api = getApi();
    if (!api?.forceDevTools) return { success: false };
    return safeCall(() => api.forceDevTools(), { success: false });
  },
};
