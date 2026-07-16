import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { wallpaperEntryUrlKey } from '../utils/wallpaperShape';
import { applyAmbientRoleTokens } from '../utils/theme/extractImagePalette';
import { resolveDisplayWallpaperUrl } from '../utils/theme/resolveEffectiveAccent';
import {
  ambientPaletteToRibbonColors,
  getWallpaperAmbientPalette,
  peekWallpaperAmbientPalette,
  prefetchWallpaperAmbientPalette,
} from '../utils/theme/wallpaperAmbientPaletteCache';
import { resolveActiveBoardCurrentPage, getSecondaryChannelSpaceData } from '../utils/channelSpaces';
import { resolveLayout } from '../utils/channelLayoutSystem';
import { syncActiveSpaceAppearanceCapture } from '../utils/appearance/spaceAppearance';
import { hasExplicitPageRibbonLook } from '../utils/appearance/resolveEffectiveRibbonLook';

/** Debounce when already settled (e.g. wallpaper cycling). */
const EXTRACT_DEBOUNCE_SETTLED_MS = 400;
/** Page/space navigation: extract promptly so cache fills for the next flip. */
const EXTRACT_DEBOUNCE_NAV_MS = 32;

/**
 * Apply active ambient palette to store + CSS tokens (+ ribbon when allowed).
 */
function applyAmbientEntry({
  url,
  entry,
  setUIState,
  setRibbonState,
  writeRibbon,
}) {
  if (!entry?.palette) {
    setUIState({
      ambientColor: {
        source: 'manual',
        seedHex: null,
        palette: null,
        cachedForUrl: url,
        seeds: [],
      },
    });
    applyAmbientRoleTokens(null, { clear: true });
    return;
  }

  setUIState({
    ambientColor: {
      source: 'wallpaper',
      seedHex: entry.seedHex,
      palette: {
        primary: entry.palette.primary,
        secondary: entry.palette.secondary,
        accent: entry.palette.accent,
        surfaceHint: entry.palette.surfaceHint,
      },
      cachedForUrl: url,
      seeds: entry.seeds || [],
    },
  });
  applyAmbientRoleTokens(entry.palette);

  if (writeRibbon) {
    const colors = ambientPaletteToRibbonColors(entry.palette);
    if (colors) {
      setRibbonState({
        ...colors,
        dynamicRibbonColorEnabled: true,
      });
      syncActiveSpaceAppearanceCapture({
        getState: () => useConsolidatedAppStore.getState(),
        setAppearanceBySpaceState:
          useConsolidatedAppStore.getState().actions.setAppearanceBySpaceState,
      });
    }
  }
}

function resolveBoardTotalPages(activeSpaceId, channels) {
  const boardSpaceData =
    activeSpaceId === 'workspaces'
      ? getSecondaryChannelSpaceData(channels)
      : channels?.dataBySpace?.home;
  const layout = resolveLayout(boardSpaceData || {});
  return Math.max(1, Number(layout?.totalPages) || 1);
}

/**
 * Live-follow wallpaper → ambientColor while ui.wallpaperMatchEnabled.
 * Uses a URL-keyed session LRU so page flips can paint ribbon colors immediately
 * and tween with the wallpaper crossfade instead of waiting for a late extract.
 */
export function useWallpaperAmbientColor() {
  const {
    wallpaperMatchEnabled,
    activeSpaceId,
    wallpaperCurrent,
    appearanceBySpace,
    channels,
    visualCommittedUrl,
    cachedForUrl,
    setUIState,
    setRibbonState,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      wallpaperMatchEnabled: state.ui.wallpaperMatchEnabled !== false,
      activeSpaceId: state.spaces.activeSpaceId,
      wallpaperCurrent: state.wallpaper?.current,
      appearanceBySpace: state.appearanceBySpace,
      channels: state.channels,
      visualCommittedUrl: state.wallpaper?.visualCommittedUrl ?? null,
      cachedForUrl: state.ui.ambientColor?.cachedForUrl ?? null,
      setUIState: state.actions.setUIState,
      setRibbonState: state.actions.setRibbonState,
    }))
  );

  const sessionPower = useConsolidatedAppStore((s) => s.ui.sessionPower ?? 'normal');
  const currentPage = resolveActiveBoardCurrentPage({ activeSpaceId, channels });
  const supportsPerPage = activeSpaceId === 'home' || activeSpaceId === 'workspaces';
  const spaceRibbon = appearanceBySpace?.[activeSpaceId]?.ribbon || null;

  const displayUrl = resolveDisplayWallpaperUrl({
    activeSpaceId,
    wallpaperCurrent,
    appearanceBySpace,
    wallpaperEntryUrlKey,
    currentPage,
  });

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!wallpaperMatchEnabled) {
      applyAmbientRoleTokens(null, { clear: true });
      return undefined;
    }

    if (sessionPower === 'away') {
      return undefined;
    }

    if (!displayUrl) {
      setUIState({
        ambientColor: {
          source: 'manual',
          seedHex: null,
          palette: null,
          cachedForUrl: null,
          seeds: [],
        },
      });
      applyAmbientRoleTokens(null, { clear: true });
      return undefined;
    }

    const writeRibbon = !hasExplicitPageRibbonLook({
      spaceRibbon,
      currentPage,
      supportsPerPage,
    });

    const cached = peekWallpaperAmbientPalette(displayUrl);
    if (cached) {
      if (cachedForUrl !== displayUrl) {
        applyAmbientEntry({
          url: displayUrl,
          entry: cached,
          setUIState,
          setRibbonState,
          writeRibbon,
        });
      } else {
        applyAmbientRoleTokens(cached.palette);
      }
      return undefined;
    }

    // Mid crossfade with no cache: keep current ribbon; extract destination ASAP.
    const midCrossfade =
      Boolean(visualCommittedUrl) &&
      visualCommittedUrl !== '' &&
      visualCommittedUrl !== displayUrl;
    const debounceMs = midCrossfade ? EXTRACT_DEBOUNCE_NAV_MS : EXTRACT_DEBOUNCE_SETTLED_MS;

    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      const url = displayUrl;
      getWallpaperAmbientPalette(url).then((entry) => {
        if (requestId !== requestIdRef.current) return;
        // Still the active target page URL?
        const state = useConsolidatedAppStore.getState();
        const stillPage = resolveActiveBoardCurrentPage({
          activeSpaceId: state.spaces.activeSpaceId,
          channels: state.channels,
        });
        const stillUrl = resolveDisplayWallpaperUrl({
          activeSpaceId: state.spaces.activeSpaceId,
          wallpaperCurrent: state.wallpaper?.current,
          appearanceBySpace: state.appearanceBySpace,
          wallpaperEntryUrlKey,
          currentPage: stillPage,
        });
        if (stillUrl !== url) return;

        const stillWriteRibbon = !hasExplicitPageRibbonLook({
          spaceRibbon: state.appearanceBySpace?.[state.spaces.activeSpaceId]?.ribbon || null,
          currentPage: stillPage,
          supportsPerPage:
            state.spaces.activeSpaceId === 'home' || state.spaces.activeSpaceId === 'workspaces',
        });

        applyAmbientEntry({
          url,
          entry,
          setUIState,
          setRibbonState,
          writeRibbon: stillWriteRibbon,
        });
      });
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    wallpaperMatchEnabled,
    sessionPower,
    displayUrl,
    visualCommittedUrl,
    cachedForUrl,
    currentPage,
    spaceRibbon,
    supportsPerPage,
    setUIState,
    setRibbonState,
  ]);

  // Prefetch neighbor page wallpapers into the LRU (no apply).
  useEffect(() => {
    if (!wallpaperMatchEnabled || sessionPower === 'away') return undefined;
    if (!(activeSpaceId === 'home' || activeSpaceId === 'workspaces')) return undefined;

    const totalPages = resolveBoardTotalPages(activeSpaceId, channels);
    const neighbors = [currentPage - 1, currentPage + 1].filter(
      (p) => p >= 0 && p < totalPages && p !== currentPage
    );

    const timer = window.setTimeout(() => {
      for (const pageIndex of neighbors) {
        const url = resolveDisplayWallpaperUrl({
          activeSpaceId,
          wallpaperCurrent,
          appearanceBySpace,
          wallpaperEntryUrlKey,
          currentPage: pageIndex,
        });
        if (url && url !== displayUrl && !peekWallpaperAmbientPalette(url)) {
          prefetchWallpaperAmbientPalette(url);
        }
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [
    wallpaperMatchEnabled,
    sessionPower,
    activeSpaceId,
    channels,
    currentPage,
    wallpaperCurrent,
    appearanceBySpace,
    displayUrl,
  ]);
}

export default useWallpaperAmbientColor;
