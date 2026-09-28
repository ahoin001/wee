/**
 * One writer for Surfaces and the on-page edit pill.
 * Wallpaper, look, overlay, cycling, and ribbon scope all go through here.
 */
import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  createDefaultSpaceAppearance,
  syncActiveSpaceAppearanceCapture,
} from './appearance/spaceAppearance';
import {
  mergeSpaceScopedRibbonFields,
  normalizeRibbonScope,
  pickRibbonLook,
} from './appearance/resolveEffectiveRibbonLook';
import { liveColorMatchUiPatch } from './appearance/liveColorMatchMode';
import {
  normalizeOverlayScope,
  pickLiveOverlay,
} from './appearance/resolveEffectiveOverlay';
import { saveUnifiedSettingsSnapshot } from './electronApi';

function storeActions() {
  return useConsolidatedAppStore.getState().actions;
}

export function patchSpaceWallpaper(spaceId, patch) {
  if (!spaceId) return;
  const state = useConsolidatedAppStore.getState();
  const currentSnapshot =
    state.appearanceBySpace?.[spaceId] ?? createDefaultSpaceAppearance(spaceId);
  storeActions().setAppearanceBySpaceState({
    [spaceId]: {
      ...currentSnapshot,
      wallpaper: {
        ...(currentSnapshot.wallpaper || {}),
        ...patch,
      },
    },
  });
}

export function setWallpaperOpacity(value) {
  storeActions().setWallpaperState({ opacity: value });
}

export function setSpaceBrightness(spaceId, value) {
  patchSpaceWallpaper(spaceId, { spaceBrightness: value });
  if (spaceId === 'gamehub' || spaceId === 'mediahub') {
    storeActions().setWallpaperState({ gameHubBrightness: value });
    return;
  }
  storeActions().setWallpaperState({ workspaceBrightness: value });
}

export function setSpaceSaturate(spaceId, value) {
  patchSpaceWallpaper(spaceId, { spaceSaturate: value });
  if (spaceId === 'gamehub' || spaceId === 'mediahub') {
    storeActions().setWallpaperState({ gameHubSaturate: value });
    return;
  }
  storeActions().setWallpaperState({ workspaceSaturate: value });
}

export function setSpaceBlur(spaceId, value) {
  patchSpaceWallpaper(spaceId, { spaceBlur: value });
  if (spaceId === 'home') {
    storeActions().setWallpaperState({ blur: value });
  }
}

export function setWallpaperScope(spaceId, scope) {
  patchSpaceWallpaper(spaceId, {
    wallpaperScope: scope === 'perPage' ? 'perPage' : 'space',
  });
}

export function applyWallpaperToPage(spaceId, pageIndex, url) {
  const state = useConsolidatedAppStore.getState();
  const prev = state.appearanceBySpace?.[spaceId]?.wallpaper?.wallpaperByPage;
  const nextByPage = { ...(prev && typeof prev === 'object' ? prev : {}) };
  const page = Math.max(0, Math.floor(Number(pageIndex) || 0));
  if (typeof url === 'string' && url.length > 0) {
    nextByPage[page] = url;
    nextByPage[String(page)] = url;
    patchSpaceWallpaper(spaceId, {
      wallpaperScope: 'perPage',
      wallpaperByPage: nextByPage,
    });
    return;
  }
  delete nextByPage[page];
  delete nextByPage[String(page)];
  patchSpaceWallpaper(spaceId, { wallpaperByPage: nextByPage });
}

/**
 * Pin a library wallpaper to a space. Home also becomes the desktop wallpaper.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function applyWallpaperToSpace(spaceId, wallpaper) {
  const url = wallpaper?.url || null;
  if (spaceId !== 'home') {
    patchSpaceWallpaper(spaceId, {
      useGlobalWallpaper: false,
      spaceWallpaperUrl: url,
    });
    return { ok: true };
  }
  const api = window.api?.wallpapers;
  if (!api?.setActive || !url) return { ok: false, error: 'No wallpaper to apply.' };
  const result = await api.setActive({ url });
  if (!result?.success) return { ok: false, error: result?.error || 'Failed to set wallpaper.' };
  storeActions().setWallpaperState({ current: wallpaper });
  patchSpaceWallpaper('home', {
    useGlobalWallpaper: true,
    spaceWallpaperUrl: null,
  });
  return { ok: true };
}

export async function clearSpaceWallpaper(spaceId) {
  if (spaceId !== 'home') {
    patchSpaceWallpaper(spaceId, {
      useGlobalWallpaper: true,
      spaceWallpaperUrl: null,
    });
    return { ok: true };
  }
  const api = window.api?.wallpapers;
  const result = await api?.setActive?.({ url: null });
  if (result && result.success === false) {
    return { ok: false, error: result.error || 'Failed to remove wallpaper.' };
  }
  storeActions().setWallpaperState({ current: null });
  patchSpaceWallpaper('home', {
    useGlobalWallpaper: true,
    spaceWallpaperUrl: null,
  });
  return { ok: true };
}

export function setOverlayPatch(patch) {
  storeActions().setOverlayState(patch);
}

const CHANNEL_BOARD_SPACES = new Set(['home', 'workspaces']);

function patchSpaceOverlay(spaceId, patch) {
  if (!spaceId) return;
  const state = useConsolidatedAppStore.getState();
  const currentSnapshot =
    state.appearanceBySpace?.[spaceId] ?? createDefaultSpaceAppearance(spaceId);
  storeActions().setAppearanceBySpaceState({
    [spaceId]: {
      ...currentSnapshot,
      overlay: {
        overlayScope: 'space',
        overlayByPage: {},
        ...(currentSnapshot.overlay || {}),
        ...patch,
      },
    },
  });
}

export function setOverlayScope(spaceId, scope) {
  const next = normalizeOverlayScope(scope);
  const state = useConsolidatedAppStore.getState();
  const currentSnapshot =
    state.appearanceBySpace?.[spaceId] ?? createDefaultSpaceAppearance(spaceId);
  const overlayRow = currentSnapshot.overlay || {};
  if (next === 'perPage' && CHANNEL_BOARD_SPACES.has(spaceId)) {
    const page = readBoardPageIndex(spaceId);
    const byPage = { ...(overlayRow.overlayByPage && typeof overlayRow.overlayByPage === 'object' ? overlayRow.overlayByPage : {}) };
    if (!byPage[page] && !byPage[String(page)]) {
      const seed = pickLiveOverlay({ ...state.overlay, ...overlayRow });
      byPage[page] = seed;
      byPage[String(page)] = seed;
    }
    patchSpaceOverlay(spaceId, { overlayScope: 'perPage', overlayByPage: byPage });
    return;
  }
  patchSpaceOverlay(spaceId, { overlayScope: 'space' });
}

/** Write overlay for the current scope. Live overlay stays the space default. */
export function setOverlayPatchForSpace(spaceId, patch) {
  if (!spaceId || !patch || typeof patch !== 'object') return;
  const state = useConsolidatedAppStore.getState();
  const currentSnapshot =
    state.appearanceBySpace?.[spaceId] ?? createDefaultSpaceAppearance(spaceId);
  const overlayRow = currentSnapshot.overlay || {};
  const perPage =
    normalizeOverlayScope(overlayRow.overlayScope) === 'perPage' &&
    CHANNEL_BOARD_SPACES.has(spaceId);
  if (perPage) {
    const page = readBoardPageIndex(spaceId);
    const byPage = { ...(overlayRow.overlayByPage && typeof overlayRow.overlayByPage === 'object' ? overlayRow.overlayByPage : {}) };
    const prev = byPage[page] || byPage[String(page)] || pickLiveOverlay({ ...state.overlay, ...overlayRow });
    const nextPage = { ...prev, ...pickLiveOverlay(patch) };
    byPage[page] = nextPage;
    byPage[String(page)] = nextPage;
    patchSpaceOverlay(spaceId, { overlayByPage: byPage });
    return;
  }
  storeActions().setOverlayState(patch);
  patchSpaceOverlay(spaceId, pickLiveOverlay({ ...state.overlay, ...overlayRow, ...patch }));
}

export function setHomeBoardWallpaperPeek(url) {
  storeActions().setUIState({
    homeBoardWallpaperPeek:
      typeof url === 'string' && url.length > 0 ? { url } : null,
  });
}

export function setCycleWallpapers(enabled) {
  storeActions().setWallpaperState({ cycleWallpapers: Boolean(enabled) });
}

export function patchSpaceRibbon(spaceId, patch) {
  if (!spaceId) return;
  const state = useConsolidatedAppStore.getState();
  const currentSnapshot =
    state.appearanceBySpace?.[spaceId] ?? createDefaultSpaceAppearance(spaceId);
  const nextRibbon = mergeSpaceScopedRibbonFields(
    { ...(currentSnapshot.ribbon || {}), ...patch },
    { ...(currentSnapshot.ribbon || {}), ...patch }
  );
  storeActions().setAppearanceBySpaceState({
    [spaceId]: {
      ...currentSnapshot,
      ribbon: nextRibbon,
    },
  });
  if (spaceId === state.spaces?.activeSpaceId) {
    storeActions().setRibbonState(pickRibbonLook(nextRibbon));
    syncActiveSpaceAppearanceCapture({
      getState: () => useConsolidatedAppStore.getState(),
      setAppearanceBySpaceState: storeActions().setAppearanceBySpaceState,
    });
  }
}

export function setRibbonScope(spaceId, scope) {
  const next = normalizeRibbonScope(scope);
  patchSpaceRibbon(spaceId, { ribbonScope: next === 'perPage' ? 'perPage' : 'space' });
}

export async function setWallpaperMatchEnabled(enabled) {
  const matchPatch = enabled
    ? liveColorMatchUiPatch('wallpaper')
    : { wallpaperMatchEnabled: false };
  storeActions().setUIState({
    ...matchPatch,
    ...(enabled
      ? {
          ambientColor: {
            source: 'wallpaper',
            seedHex: null,
            palette: null,
            cachedForUrl: null,
            seeds: [],
          },
        }
      : {}),
  });
  await saveUnifiedSettingsSnapshot({ ui: matchPatch });
}

/** Live board page for Home / Second Home. Hubs have no pages. */
export function readBoardPageIndex(spaceId) {
  const state = useConsolidatedAppStore.getState();
  const data = spaceId === 'workspaces'
    ? state.channels?.dataBySpace?.workspaces
    : state.channels?.dataBySpace?.home;
  const page = Number(data?.navigation?.currentPage);
  return Number.isFinite(page) && page >= 0 ? page : 0;
}
