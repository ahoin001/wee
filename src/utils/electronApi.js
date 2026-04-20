import {
  mergeCanonicalSettings,
  normalizeUnifiedSettingsSnapshot,
  withSettingsSchemaMeta,
} from './store/settingsPersistenceContract';
import isEqual from 'fast-deep-equal';
import PQueue from 'p-queue';

const getApi = () => (typeof window !== 'undefined' ? window.api : null);
const settingsWriteQueue = new PQueue({ concurrency: 1 });

/** Coalesce rapid partial saves before a single read–merge–write (settings churn). */
const SETTINGS_SAVE_DEBOUNCE_MS = 400;
let debouncedPatchAccumulator = null;
let debounceFlushTimer = null;
const debounceWaiters = [];

function flushDebouncedSettingsWrites() {
  debounceFlushTimer = null;
  const patch = debouncedPatchAccumulator;
  debouncedPatchAccumulator = null;
  const waiters = debounceWaiters.splice(0);
  const api = getApi();
  if (!patch) {
    waiters.forEach((w) => w.resolve(true));
    return;
  }
  if (!api?.data?.get || !api?.data?.set) {
    waiters.forEach((w) => w.resolve(false));
    return;
  }

  settingsWriteQueue
    .add(async () => {
      const current = await safeCall(() => api.data.get(), null);
      if (!current) return false;

      const nextSettings = mergeCanonicalSettings(current.settings, patch);
      if (isEqual(current.settings, nextSettings)) {
        return true;
      }

      const payload = withSettingsSchemaMeta({
        ...current,
        settings: nextSettings,
      });

      return safeCall(() => api.data.set(payload), false);
    })
    .then(
      (r) => waiters.forEach((w) => w.resolve(r)),
      (e) => waiters.forEach((w) => w.reject(e))
    );
}

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

  debouncedPatchAccumulator = debouncedPatchAccumulator
    ? mergeCanonicalSettings(debouncedPatchAccumulator, settingsSnapshot || {})
    : mergeCanonicalSettings({}, settingsSnapshot || {});

  return new Promise((resolve, reject) => {
    debounceWaiters.push({ resolve, reject });
    if (debounceFlushTimer) clearTimeout(debounceFlushTimer);
    debounceFlushTimer = setTimeout(flushDebouncedSettingsWrites, SETTINGS_SAVE_DEBOUNCE_MS);
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
