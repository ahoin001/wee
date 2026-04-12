const getApi = () => (typeof window !== 'undefined' ? window.api : null);

const safeCall = async (fn, fallback = null) => {
  try {
    return await fn();
  } catch (error) {
    console.warn('[electronApi] API call failed:', error);
    return fallback;
  }
};

/** Merge fields into `unified-data.json` → `settings.appearance` (e.g. spotifyMatchEnabled). */
export async function saveUnifiedAppearancePatch(patch) {
  const api = getApi();
  if (!api?.data?.get || !api?.data?.set) return false;
  const current = await safeCall(() => api.data.get(), null);
  if (!current?.settings) return false;
  return safeCall(
    () =>
      api.data.set({
        ...current,
        settings: {
          ...current.settings,
          appearance: {
            ...current.settings.appearance,
            ...patch,
          },
        },
      }),
    false
  );
}

/** Persist the consolidated sounds slice into `unified-data.json` → `settings.sounds`. */
export async function saveUnifiedSoundSettings(soundsState) {
  const api = getApi();
  if (!api?.data?.get || !api?.data?.set) return false;
  const current = await safeCall(() => api.data.get(), null);
  if (!current?.settings) return false;
  return safeCall(
    () =>
      api.data.set({
        ...current,
        settings: {
          ...current.settings,
          sounds: soundsState,
        },
      }),
    false
  );
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

  async getSettings() {
    const api = getApi();
    if (!api?.settings?.get) return null;
    return safeCall(() => api.settings.get(), null);
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
