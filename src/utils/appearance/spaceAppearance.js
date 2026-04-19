/**
 * Per-shell-space appearance (Home / Work / Games): wallpaper, ribbon, time, overlay, theme UI.
 * Channels stay in `channels.dataBySpace`; this is look-and-feel only.
 */

/** Keys on `wallpaper` that must not be persisted per space (runtime / transition). */
const WALLPAPER_TRANSIENT_KEYS = new Set([
  'next',
  'isTransitioning',
  'crossfadeProgress',
  'slideProgress',
]);

const SPACE_IDS = ['home', 'workspaces', 'mediahub', 'gamehub'];

/** @returns {{ wallpaper: object, ribbon: object, time: object, overlay: object, ui: object }} */
export function captureSpaceAppearanceFromState(storeState) {
  const { wallpaper, ribbon, time, overlay, ui } = storeState;
  const wp = { ...wallpaper };
  WALLPAPER_TRANSIENT_KEYS.forEach((k) => {
    delete wp[k];
  });

  return {
    wallpaper: wp,
    ribbon: { ...ribbon },
    time: { ...time },
    overlay: { ...overlay },
    ui: {
      isDarkMode: ui.isDarkMode,
      useCustomCursor: ui.useCustomCursor,
      classicMode: ui.classicMode,
      spotifyMatchEnabled: ui.spotifyMatchEnabled ?? false,
    },
  };
}

/**
 * Merge incoming appearance onto live slices, preserving wallpaper transition fields.
 */
export function mergeLiveStateFromSpaceAppearance(currentState, incoming) {
  if (!incoming) return {};

  const out = {};
  if (incoming.wallpaper) {
    const w = { ...currentState.wallpaper, ...incoming.wallpaper };
    WALLPAPER_TRANSIENT_KEYS.forEach((k) => {
      if (currentState.wallpaper[k] !== undefined) {
        w[k] = currentState.wallpaper[k];
      }
    });
    out.wallpaper = w;
  }
  if (incoming.ribbon) {
    out.ribbon = { ...currentState.ribbon, ...incoming.ribbon };
  }
  if (incoming.time) {
    out.time = { ...currentState.time, ...incoming.time };
  }
  if (incoming.overlay) {
    out.overlay = { ...currentState.overlay, ...incoming.overlay };
  }
  if (incoming.ui) {
    out.ui = {
      ...currentState.ui,
      ...incoming.ui,
    };
  }
  return out;
}

export { SPACE_IDS };
