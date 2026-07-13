import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { wallpaperEntryUrlKey } from '../utils/wallpaperShape';
import {
  applyAmbientRoleTokens,
  extractImagePalette,
} from '../utils/theme/extractImagePalette';
import { resolveDisplayWallpaperUrl } from '../utils/theme/resolveEffectiveAccent';

const EXTRACT_DEBOUNCE_MS = 400;

/**
 * Live-follow wallpaper → ambientColor cache while ui.wallpaperMatchEnabled.
 * Keys off visualCommittedUrl (settled after wallpaper crossfade/cycle) so ribbon
 * and CSS ambient tokens do not hard-cut mid-transition.
 */
export function useWallpaperAmbientColor() {
  const {
    wallpaperMatchEnabled,
    activeSpaceId,
    wallpaperCurrent,
    appearanceBySpace,
    visualCommittedUrl,
    cachedForUrl,
    setUIState,
    setRibbonState,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      wallpaperMatchEnabled: state.ui.wallpaperMatchEnabled ?? false,
      activeSpaceId: state.spaces.activeSpaceId,
      wallpaperCurrent: state.wallpaper?.current,
      appearanceBySpace: state.appearanceBySpace,
      visualCommittedUrl: state.wallpaper?.visualCommittedUrl ?? null,
      cachedForUrl: state.ui.ambientColor?.cachedForUrl ?? null,
      setUIState: state.actions.setUIState,
      setRibbonState: state.actions.setRibbonState,
    }))
  );

  const sessionPower = useConsolidatedAppStore((s) => s.ui.sessionPower ?? 'normal');

  const displayUrl = resolveDisplayWallpaperUrl({
    activeSpaceId,
    wallpaperCurrent,
    appearanceBySpace,
    wallpaperEntryUrlKey,
  });

  // Prefer settled visual URL; fall back to display only before the wallpaper layer mounts.
  const ambientSourceUrl =
    visualCommittedUrl != null && visualCommittedUrl !== ''
      ? visualCommittedUrl
      : displayUrl;

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!wallpaperMatchEnabled) {
      applyAmbientRoleTokens(null, { clear: true });
      return undefined;
    }

    // Deep-pause after intensive launch — keep last tokens, skip re-extract.
    if (sessionPower === 'away') {
      return undefined;
    }

    if (!ambientSourceUrl) {
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

    // Still mid wallpaper crossfade/cycle — wait for visual commit to catch up.
    if (displayUrl && visualCommittedUrl && visualCommittedUrl !== displayUrl) {
      return undefined;
    }

    if (cachedForUrl === ambientSourceUrl) {
      const palette = useConsolidatedAppStore.getState().ui.ambientColor?.palette;
      if (palette) applyAmbientRoleTokens(palette);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      const url = ambientSourceUrl;
      extractImagePalette(url).then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (!result) {
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
            seedHex: result.seedHex,
            palette: {
              primary: result.palette.primary,
              secondary: result.palette.secondary,
              accent: result.palette.accent,
              surfaceHint: result.palette.surfaceHint,
            },
            cachedForUrl: url,
            seeds: result.seeds || [],
          },
        });
        // Keep adaptive ribbon/particle consumers in sync without a parallel color API.
        setRibbonState({
          ribbonGlowColor: result.palette.accent || result.palette.primary,
          ribbonColor: result.palette.surfaceHint || result.palette.secondary,
          dynamicRibbonColorEnabled: true,
        });
        applyAmbientRoleTokens(result.palette);
      });
    }, EXTRACT_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    wallpaperMatchEnabled,
    sessionPower,
    ambientSourceUrl,
    displayUrl,
    visualCommittedUrl,
    cachedForUrl,
    setUIState,
    setRibbonState,
  ]);
}

export default useWallpaperAmbientColor;
