/**
 * Idle-time image URL warming — decodes into browser cache for fewer janks when tiles/heroes mount.
 * Scoped URL set avoids duplicate work across sessions in one runtime.
 */

const warmedUrls = new Set();

function isHttpLike(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http') || url.startsWith('file:') || url.startsWith('blob:') || url.startsWith('data:');
}

/**
 * @param {string[]} urls
 * @param {{ max?: number }} [options]
 */
export function warmImageUrlsOnIdle(urls, options = {}) {
  if (typeof window === 'undefined' || !Array.isArray(urls) || urls.length === 0) return;

  const max = options.max ?? 48;
  const slice = urls.filter(isHttpLike).slice(0, max);

  const run = () => {
    slice.forEach((url) => {
      if (warmedUrls.has(url)) return;
      warmedUrls.add(url);
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    });
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 10000 });
  } else {
    window.setTimeout(run, 600);
  }
}

/**
 * Collect wallpaper + channel tile image URLs from consolidated store snapshot (getState()).
 * @param {object} storeState
 * @returns {string[]}
 */
export function collectWarmMediaUrlsFromStore(storeState) {
  const out = [];
  const wp = storeState?.wallpaper;
  if (wp?.current?.url) out.push(wp.current.url);
  const saved = wp?.savedWallpapers;
  if (Array.isArray(saved)) {
    saved.slice(0, 16).forEach((entry) => {
      if (entry?.url) out.push(entry.url);
    });
  }
  const liked = wp?.likedWallpapers;
  if (Array.isArray(liked)) {
    liked.slice(0, 8).forEach((entry) => {
      if (entry?.url) out.push(entry.url);
    });
  }

  const ch = storeState?.channels;
  const addFromConfigured = (configured) => {
    if (!configured || typeof configured !== 'object') return;
    Object.values(configured).forEach((slot) => {
      if (!slot || typeof slot !== 'object') return;
      const media = slot.media;
      if (media && typeof media === 'object' && media.url && typeof media.type === 'string') {
        if (media.type.startsWith('image') || media.type === 'gif' || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(media.url)) {
          out.push(media.url);
        }
      }
      if (slot.icon && typeof slot.icon === 'string' && isHttpLike(slot.icon)) {
        out.push(slot.icon);
      }
    });
  };

  try {
    if (ch?.data?.configuredChannels) addFromConfigured(ch.data.configuredChannels);
    if (ch?.dataBySpace?.home?.configuredChannels) addFromConfigured(ch.dataBySpace.home.configuredChannels);
    if (ch?.dataBySpace?.workspaces?.configuredChannels) addFromConfigured(ch.dataBySpace.workspaces.configuredChannels);
    const profiles = ch?.secondaryChannelProfiles;
    if (profiles && typeof profiles === 'object') {
      Object.values(profiles).forEach((entry) => {
        const cs = entry?.channelSpace?.configuredChannels;
        if (cs) addFromConfigured(cs);
      });
    }
  } catch {
    /* ignore */
  }

  return [...new Set(out)].filter(Boolean);
}
