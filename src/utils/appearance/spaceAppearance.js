/**
 * Per-shell-space appearance (Home / Work / Games): wallpaper, ribbon, time, overlay, theme UI.
 * Channels stay in `channels.dataBySpace`; this is look-and-feel only.
 */

import { mergeSpaceScopedRibbonFields } from './resolveEffectiveRibbonLook';

/** Keys on `wallpaper` that must not be persisted per space (runtime / transition). */
const WALLPAPER_TRANSIENT_KEYS = new Set([
  // Runtime-only transition fields.
  'next',
  'isTransitioning',
  'crossfadeProgress',
  'slideProgress',
  // Global wallpaper identity and library state should never be space-scoped.
  'current',
  'savedWallpapers',
  'likedWallpapers',
  // Cycling is global behavior; avoid per-space toggles/drift on space switch.
  'cycleWallpapers',
  'cycleInterval',
  'cycleAnimation',
  'slideDirection',
  'crossfadeDuration',
  'crossfadeEasing',
  'slideRandomDirection',
  'slideDuration',
  'slideEasing',
  // Settled URL for ambient — never space-scoped.
  'visualCommittedUrl',
]);

/** Space-row wallpaper fields that live on `appearanceBySpace[id].wallpaper` (not global `wallpaper.current`). */
const SPACE_SCOPED_WALLPAPER_KEYS = [
  'useGlobalWallpaper',
  'spaceWallpaperUrl',
  'wallpaperScope',
  'wallpaperByPage',
  'spaceBlur',
  'spaceBrightness',
  'spaceSaturate',
];

const SPACE_IDS = ['home', 'workspaces', 'mediahub', 'gamehub'];

/** Live match toggles are global Atmosphere settings — never space-scoped. */
const GLOBAL_UI_MATCH_KEYS = ['spotifyMatchEnabled', 'wallpaperMatchEnabled'];

/**
 * Empty defaults for a space appearance row (do not copy the active space’s live look).
 * Home follows global wallpaper; other spaces default to follow-global as well.
 */
export function createDefaultSpaceAppearance(spaceId = 'home') {
  const isHome = spaceId === 'home';
  return {
    wallpaper: {
      useGlobalWallpaper: true,
      spaceWallpaperUrl: null,
      wallpaperScope: 'space',
      wallpaperByPage: {},
      spaceBlur: isHome ? undefined : 0,
      spaceBrightness: isHome ? undefined : 1,
      spaceSaturate: isHome ? undefined : 1,
    },
    ribbon: {
      ribbonScope: 'space',
      ribbonByPage: {},
    },
    time: {},
    overlay: {},
    ui: {},
  };
}

/**
 * Merge space-scoped wallpaper identity onto a live wallpaper capture so space
 * switches / presets do not wipe `spaceWallpaperUrl`, per-page maps, etc.
 */
function mergeSpaceScopedWallpaperFields(liveWallpaper, storedWallpaper) {
  const wp = { ...liveWallpaper };
  const stored = storedWallpaper && typeof storedWallpaper === 'object' ? storedWallpaper : {};
  for (const key of SPACE_SCOPED_WALLPAPER_KEYS) {
    if (stored[key] !== undefined) {
      wp[key] = stored[key];
    }
  }
  if (typeof wp.useGlobalWallpaper !== 'boolean') {
    wp.useGlobalWallpaper = true;
  }
  if (wp.wallpaperScope !== 'perPage') {
    wp.wallpaperScope = 'space';
  }
  if (!wp.wallpaperByPage || typeof wp.wallpaperByPage !== 'object') {
    wp.wallpaperByPage = {};
  }
  return wp;
}

function stripGlobalMatchUi(ui) {
  if (!ui || typeof ui !== 'object') return ui;
  const next = { ...ui };
  for (const key of GLOBAL_UI_MATCH_KEYS) {
    delete next[key];
  }
  return next;
}

/** @returns {{ wallpaper: object, ribbon: object, time: object, overlay: object, ui: object }} */
export function captureSpaceAppearanceFromState(storeState) {
  const { wallpaper, ribbon, time, overlay, ui, spaces, appearanceBySpace } = storeState;
  const spaceId = spaces?.activeSpaceId || 'home';
  const stored = appearanceBySpace?.[spaceId] || null;
  const storedWp = stored?.wallpaper;
  const storedRibbon = stored?.ribbon;
  const wp = { ...wallpaper };
  WALLPAPER_TRANSIENT_KEYS.forEach((k) => {
    delete wp[k];
  });

  return {
    wallpaper: mergeSpaceScopedWallpaperFields(wp, storedWp),
    ribbon: mergeSpaceScopedRibbonFields({ ...ribbon }, storedRibbon),
    time: { ...time },
    overlay: { ...overlay },
    // Theme chrome only — wallpaper/Spotify match stay global (Atmosphere / Surfaces).
    ui: {
      isDarkMode: ui.isDarkMode,
      useCustomCursor: ui.useCustomCursor,
      classicMode: ui.classicMode,
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
    out.wallpaper = mergeSpaceScopedWallpaperFields(w, incoming.wallpaper);
  }
  if (incoming.ribbon) {
    out.ribbon = mergeSpaceScopedRibbonFields(
      { ...currentState.ribbon, ...incoming.ribbon },
      incoming.ribbon
    );
  }
  if (incoming.time) {
    out.time = { ...currentState.time, ...incoming.time };
  }
  if (incoming.overlay) {
    out.overlay = { ...currentState.overlay, ...incoming.overlay };
  }
  if (incoming.ui) {
    const uiPatch = stripGlobalMatchUi(incoming.ui);
    out.ui = {
      ...currentState.ui,
      ...uiPatch,
    };
  }
  return out;
}

/**
 * Refresh `appearanceBySpace[activeSpaceId]` from live slices.
 * Boot hydration re-applies this snapshot over ribbon/time/overlay; without a
 * re-capture after preset apply or ribbon edits while staying on a space, restart
 * clobbers the live look (wallpaper identity survives via WALLPAPER_TRANSIENT_KEYS).
 *
 * @param {{ getState: () => object, setAppearanceBySpaceState: (patch: object) => void }} storeApi
 * @returns {{ spaceId: string, appearance: object } | null}
 */
export function syncActiveSpaceAppearanceCapture(storeApi) {
  if (!storeApi || typeof storeApi.getState !== 'function') return null;
  const state = storeApi.getState();
  const spaceId = state?.spaces?.activeSpaceId || 'home';
  const appearance = captureSpaceAppearanceFromState(state);
  if (typeof storeApi.setAppearanceBySpaceState === 'function') {
    storeApi.setAppearanceBySpaceState({ [spaceId]: appearance });
  } else if (typeof state?.actions?.setAppearanceBySpaceState === 'function') {
    state.actions.setAppearanceBySpaceState({ [spaceId]: appearance });
  }
  return { spaceId, appearance };
}

export { SPACE_IDS, mergeSpaceScopedWallpaperFields, GLOBAL_UI_MATCH_KEYS };
