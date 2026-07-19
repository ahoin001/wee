import React, { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import {
  Code2,
  Image,
  Layers,
  Maximize,
  Moon,
  Mouse,
  Palette,
  PanelsTopLeft,
  RefreshCw,
  Settings,
  Square,
  StretchHorizontal,
  Waves,
  X,
} from 'lucide-react';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { IS_DEV } from '../../utils/env';
import { saveUnifiedSettingsSnapshot } from '../../utils/electronApi';
import {
  defaultAtmosphereLookName,
  saveCurrentAtmosphereLookPreset,
} from '../../utils/presets/saveCurrentAtmosphereLookPreset';
import { DEFAULT_AMBIENT_COLOR } from '../../utils/theme/extractImagePalette';
import { DEFAULT_RIBBON_GLOW_HEX, DEFAULT_RIBBON_SURFACE_HEX } from '../../design/runtimeColorStrings';
import { syncActiveSpaceAppearanceCapture } from '../../utils/appearance/spaceAppearance';
import { liveColorMatchUiPatch } from '../../utils/appearance/liveColorMatchMode';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import WToggle from '../../ui/WToggle';
import WeeButton from '../../ui/wee/WeeButton';
import { WeeMorphStack, WeeRevealWhen, WeeSettingsDisclosure } from '../../ui/wee';
import { useWeeMotion, WEE_VARIANTS } from '../../design/weeMotion';
import './SettingsActionMenu.css';

function QuickToggleRow({ label, icon: Icon, active, onToggle }) {
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-[var(--wee-radius-rail-item)] border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] p-4 text-left transition-colors hover:border-[hsl(var(--primary)/0.35)] hover:bg-[hsl(var(--state-hover)/0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))]"
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        {Icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--wee-surface-well))] text-[hsl(var(--wee-text-rail-muted))]">
            <Icon size={20} strokeWidth={2.2} aria-hidden />
          </span>
        ) : null}
        <span className="text-[11px] font-black uppercase italic tracking-wide text-[hsl(var(--wee-text-header))]">
          {label}
        </span>
      </span>
      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <WToggle checked={active} onChange={onToggle} disableLabelClick />
      </span>
    </div>
  );
}

QuickToggleRow.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

/** Action row sharing the QuickToggleRow card vocabulary (icon well + uppercase italic label). */
function ActionButtonRow({ label, icon: Icon, onClick, badge = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--wee-radius-rail-item)] border-2 border-[hsl(var(--wee-border-card))] bg-[hsl(var(--wee-surface-card))] p-4 text-left transition-colors hover:border-[hsl(var(--primary)/0.35)] hover:bg-[hsl(var(--state-hover)/0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))]"
    >
      {Icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--wee-surface-well))] text-[hsl(var(--wee-text-rail-muted))]">
          <Icon size={20} strokeWidth={2.2} aria-hidden />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-black uppercase italic tracking-wide text-[hsl(var(--wee-text-header))]">
        {label}
        {badge ? (
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]"
            aria-label="Update available"
          />
        ) : null}
      </span>
    </button>
  );
}

ActionButtonRow.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  onClick: PropTypes.func.isRequired,
  badge: PropTypes.bool,
};

const SettingsActionMenu = forwardRef(({ isOpen, onClose }, ref) => {
  const {
    isDarkMode,
    useCustomCursor,
    cursorStyle,
    showDock,
    updateAvailable,
    wheelSwitchSpaces,
    wheelHomePageTilt,
    wallpaperMatchEnabled,
    spotifyMatchEnabled,
    liveGradientWallpaper,
    canSaveAtmosphereLook,
    dynamicRibbonColorEnabled,
    ribbonColor,
    ambientPalette,
    immersiveMode,
  } = useConsolidatedAppStore(
    useShallow((state) => {
      const extracted = state.spotify?.extractedColors?.primary;
      const wallpaperOn = state.ui.wallpaperMatchEnabled !== false;
      const spotifyOn = Boolean(state.ui.spotifyMatchEnabled);
      const liveWash = Boolean(state.spotify?.immersiveMode?.liveGradientWallpaper);
      return {
        isDarkMode: state.ui.isDarkMode,
        useCustomCursor: state.ui.useCustomCursor,
        cursorStyle: state.ui.cursorStyle,
        showDock: state.ui.showDock,
        updateAvailable: state.app.updateAvailable,
        wheelSwitchSpaces: Boolean(state.navigation?.wheelSwitchSpaces),
        wheelHomePageTilt: state.navigation?.wheelHomePageTilt !== false,
        wallpaperMatchEnabled: wallpaperOn,
        spotifyMatchEnabled: spotifyOn,
        liveGradientWallpaper: liveWash,
        canSaveAtmosphereLook:
          Boolean(extracted) || wallpaperOn || spotifyOn || liveWash,
        dynamicRibbonColorEnabled: Boolean(state.ribbon?.dynamicRibbonColorEnabled),
        ribbonColor: state.ribbon?.ribbonColor ?? null,
        ambientPalette: state.ui?.ambientColor?.palette ?? null,
        immersiveMode: state.spotify?.immersiveMode || null,
      };
    })
  );
  const setUIState = useConsolidatedAppStore((state) => state.actions.setUIState);
  const setRibbonState = useConsolidatedAppStore((state) => state.actions.setRibbonState);
  const setNavigationState = useConsolidatedAppStore((state) => state.actions.setNavigationState);
  const setSpotifyState = useConsolidatedAppStore((state) => state.actions.setSpotifyState);
  const { backdropTransition, modalTransition } = useWeeMotion();
  const [atmosphereStatus, setAtmosphereStatus] = React.useState('');
  const [savingLook, setSavingLook] = React.useState(false);

  useEffect(() => {
    if (useCustomCursor) {
      document.body.classList.add('custom-cursor-enabled');

      let customCursor = document.getElementById('wii-custom-cursor');
      if (!customCursor) {
        customCursor = document.createElement('div');
        customCursor.id = 'wii-custom-cursor';
        document.body.appendChild(customCursor);
      }

      customCursor.setAttribute('data-style', cursorStyle);
      customCursor.style.display = 'block';

      const handleMouseMove = (e) => {
        customCursor.style.left = `${e.clientX}px`;
        customCursor.style.top = `${e.clientY}px`;
      };

      const handleMouseDown = () => {
        customCursor.classList.add('clicking');
      };

      const handleMouseUp = () => {
        customCursor.classList.remove('clicking');
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        customCursor.classList.remove('clicking');
      };
    }

    document.body.classList.remove('custom-cursor-enabled');
    const customCursor = document.getElementById('wii-custom-cursor');
    if (customCursor) {
      customCursor.style.display = 'none';
      customCursor.classList.remove('clicking');
    }
    return undefined;
  }, [useCustomCursor, cursorStyle]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const toggleDarkMode = useCallback(() => {
    setUIState({ isDarkMode: !isDarkMode });
  }, [isDarkMode, setUIState]);

  const toggleDock = useCallback(() => {
    setUIState({ showDock: !showDock });
  }, [showDock, setUIState]);

  const toggleCustomCursor = useCallback(() => {
    setUIState({ useCustomCursor: !useCustomCursor });
  }, [useCustomCursor, setUIState]);

  const toggleWheelSwitchSpaces = useCallback(() => {
    setNavigationState({ wheelSwitchSpaces: !wheelSwitchSpaces });
  }, [setNavigationState, wheelSwitchSpaces]);

  const toggleWheelHomePageTilt = useCallback(() => {
    setNavigationState({ wheelHomePageTilt: !wheelHomePageTilt });
  }, [setNavigationState, wheelHomePageTilt]);

  /** Live match needs dynamic chrome as a fallback when sampling pauses. */
  const ensureDynamicChromeOn = useCallback(async () => {
    if (dynamicRibbonColorEnabled) return;
    setRibbonState({ dynamicRibbonColorEnabled: true });
    await saveUnifiedSettingsSnapshot({ ribbon: { dynamicRibbonColorEnabled: true } });
  }, [dynamicRibbonColorEnabled, setRibbonState]);

  const toggleWallpaperMatch = useCallback(async () => {
    const next = !wallpaperMatchEnabled;
    if (next) await ensureDynamicChromeOn();
    const uiPatch = next
      ? liveColorMatchUiPatch('wallpaper')
      : { wallpaperMatchEnabled: false };
    setUIState(uiPatch);
    await saveUnifiedSettingsSnapshot({ ui: uiPatch });
    setAtmosphereStatus(
      next
        ? 'Wallpaper Color Match on — Now Playing match turned off'
        : 'Wallpaper Color Match off — pick your own colors in Dock'
    );
  }, [ensureDynamicChromeOn, setUIState, wallpaperMatchEnabled]);

  const toggleSpotifyMatch = useCallback(async () => {
    const next = !spotifyMatchEnabled;
    if (next) await ensureDynamicChromeOn();
    const uiPatch = next
      ? liveColorMatchUiPatch('spotify')
      : { spotifyMatchEnabled: false };
    setUIState(uiPatch);
    // Album wash rides on Now Playing match — turning match off turns the wash off too.
    if (!next && liveGradientWallpaper) {
      setSpotifyState({
        immersiveMode: { ...(immersiveMode || {}), liveGradientWallpaper: false },
      });
    }
    await saveUnifiedSettingsSnapshot({ ui: uiPatch });
    setAtmosphereStatus(
      next
        ? 'Now Playing Color Match on — Wallpaper match turned off'
        : 'Now Playing Color Match off'
    );
  }, [
    ensureDynamicChromeOn,
    immersiveMode,
    liveGradientWallpaper,
    setSpotifyState,
    setUIState,
    spotifyMatchEnabled,
  ]);

  const toggleLiveGradientWash = useCallback(() => {
    const next = !liveGradientWallpaper;
    const prev = immersiveMode || {};
    setSpotifyState({
      immersiveMode: {
        ...prev,
        liveGradientWallpaper: next,
        overlayMode: next ? true : Boolean(prev.overlayMode),
      },
    });
    setAtmosphereStatus(
      next
        ? 'Album wallpaper wash on — soft gradient over your wallpaper while music plays'
        : 'Album wallpaper wash off'
    );
  }, [immersiveMode, liveGradientWallpaper, setSpotifyState]);

  const lockAtmosphereLook = useCallback(async () => {
    const surface = ambientPalette?.surfaceHint || ribbonColor || DEFAULT_RIBBON_SURFACE_HEX;
    const glow = ambientPalette?.accent || ambientPalette?.primary || DEFAULT_RIBBON_GLOW_HEX;

    setRibbonState({
      ribbonColor: surface,
      ribbonGlowColor: glow,
      dynamicRibbonColorEnabled: true,
    });
    setUIState({
      wallpaperMatchEnabled: false,
      spotifyMatchEnabled: false,
      ambientColor: { ...DEFAULT_AMBIENT_COLOR },
    });

    const synced = syncActiveSpaceAppearanceCapture({
      getState: () => useConsolidatedAppStore.getState(),
      setAppearanceBySpaceState: useConsolidatedAppStore.getState().actions.setAppearanceBySpaceState,
    });

    await saveUnifiedSettingsSnapshot({
      ui: { wallpaperMatchEnabled: false, spotifyMatchEnabled: false },
      ribbon: {
        ribbonColor: surface,
        ribbonGlowColor: glow,
        dynamicRibbonColorEnabled: true,
      },
      ...(synced ? { appearanceBySpace: { [synced.spaceId]: synced.appearance } } : {}),
    });
    setAtmosphereStatus('Locked colors to ribbon — live match off');
  }, [ambientPalette, ribbonColor, setRibbonState, setUIState]);

  const openDockColors = useCallback(() => {
    openSettingsToTab(SETTINGS_TAB_ID.DOCK);
    handleClose();
  }, [handleClose]);

  const saveAtmosphereLook = useCallback(async () => {
    if (savingLook) return;
    setSavingLook(true);
    setAtmosphereStatus('');
    try {
      const result = await saveCurrentAtmosphereLookPreset({
        name: defaultAtmosphereLookName(),
      });
      if (!result.ok) {
        setAtmosphereStatus(result.error || 'Could not save look');
        return;
      }
      setAtmosphereStatus(`Saved “${result.preset.name}” under Presets`);
    } finally {
      setSavingLook(false);
    }
  }, [savingLook]);

  const toggleFullscreen = useCallback(() => {
    if (window.api?.toggleFullscreen) {
      window.api.toggleFullscreen();
    }
  }, []);

  const toggleFrame = useCallback(() => {
    if (window.api?.toggleFrame) {
      window.api.toggleFrame();
    }
  }, []);

  const openDevTools = useCallback(() => {
    if (window.api?.openDevTools) {
      window.api.openDevTools();
    }
    handleClose();
  }, [handleClose]);

  const openUpdatesModal = useCallback(() => {
    setUIState({ showUpdateModal: true, showSettingsActionMenu: false });
  }, [setUIState]);

  const closeApp = useCallback(() => {
    if (window.api?.closeApp) {
      window.api.closeApp();
    } else {
      window.close();
    }
    handleClose();
  }, [handleClose]);

  useImperativeHandle(
    ref,
    () => ({
      handleClose,
    }),
    [handleClose]
  );

  if (typeof document === 'undefined') {
    return null;
  }

  const tree = (
    <AnimatePresence>
      {isOpen ? (
        <>
          <m.button
            type="button"
            key="quick-menu-backdrop"
            aria-label="Close quick menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            className="fixed inset-0 z-[100000] cursor-default border-0 bg-[hsl(var(--wee-overlay-backdrop))] backdrop-blur-[8px]"
            onClick={handleClose}
          />
          <m.div
            key="quick-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wee-quick-menu-title"
            initial={{ ...WEE_VARIANTS.modalPanelInitial, x: 96 }}
            animate={{ ...WEE_VARIANTS.modalPanelAnimate, x: 0 }}
            exit={{ ...WEE_VARIANTS.modalPanelExit, x: 96 }}
            transition={modalTransition}
            className="fixed bottom-6 right-6 top-6 z-[100001] flex w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-[var(--wee-radius-shell)] border-[0.5rem] border-[hsl(var(--wee-border-outer))] bg-[hsl(var(--wee-surface-well))] shadow-[var(--wee-shadow-modal)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-[hsl(var(--border-primary)/0.25)] bg-[hsl(var(--wee-surface-shell))] px-8 pb-6 pt-10 md:px-10">
              <div className="min-w-0">
                <p className="m-0 text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--wee-text-rail-muted))]">
                  System control
                </p>
                <h2
                  id="wee-quick-menu-title"
                  className="m-0 mt-1 text-2xl font-black uppercase italic tracking-tighter text-[hsl(var(--wee-text-header))] md:text-3xl"
                >
                  Quick menu
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 rounded-full p-3 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--state-hover))] hover:text-[hsl(var(--text-primary))]"
                aria-label="Close quick menu"
              >
                <X size={24} strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="wee-modal-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-8 py-6 md:px-10">
              <WeeSettingsDisclosure
                title="Colors & accents"
                description="One live match at a time — wallpaper or Now Playing"
                defaultOpen
                className="!mb-0"
              >
                <div className="flex flex-col gap-3">
                  <QuickToggleRow
                    label="Wallpaper Color Match"
                    icon={Image}
                    active={wallpaperMatchEnabled}
                    onToggle={toggleWallpaperMatch}
                  />
                  <WeeMorphStack open={spotifyMatchEnabled} gapOpen="gap-3">
                    <QuickToggleRow
                      label="Now Playing Color Match"
                      icon={Palette}
                      active={spotifyMatchEnabled}
                      onToggle={toggleSpotifyMatch}
                    />
                    <WeeRevealWhen when={spotifyMatchEnabled}>
                      <QuickToggleRow
                        label="Album wallpaper wash"
                        icon={Waves}
                        active={liveGradientWallpaper}
                        onToggle={toggleLiveGradientWash}
                      />
                    </WeeRevealWhen>
                  </WeeMorphStack>
                  {(wallpaperMatchEnabled || spotifyMatchEnabled) && ambientPalette ? (
                    <ActionButtonRow
                      label="Lock these colors"
                      icon={Palette}
                      onClick={lockAtmosphereLook}
                    />
                  ) : null}
                  {canSaveAtmosphereLook ? (
                    <ActionButtonRow
                      label={savingLook ? 'Saving preset…' : 'Save these colors as Preset'}
                      icon={Palette}
                      onClick={saveAtmosphereLook}
                    />
                  ) : null}
                  <ActionButtonRow
                    label="Edit ribbon colors in Dock"
                    icon={Settings}
                    onClick={openDockColors}
                  />
                  {atmosphereStatus ? (
                    <p className="m-0 text-[11px] font-semibold text-[hsl(var(--text-secondary))]">
                      {atmosphereStatus}
                    </p>
                  ) : (
                    <p className="m-0 text-[11px] text-[hsl(var(--text-tertiary))]">
                      Ribbon &amp; accents follow Now Playing, then Wallpaper, then your ribbon
                      colors. Album wash and media widgets use track colors separately. Picking a
                      ribbon color in Dock turns live match off.
                    </p>
                  )}
                </div>
              </WeeSettingsDisclosure>

              <WeeSettingsDisclosure
                title="Appearance"
                description="Dock, theme, and pointer"
                defaultOpen={false}
                className="!mb-0"
              >
                <div className="flex flex-col gap-3">
                  <QuickToggleRow label="Show dock" icon={Layers} active={showDock} onToggle={toggleDock} />
                  <QuickToggleRow label="Dark mode" icon={Moon} active={isDarkMode} onToggle={toggleDarkMode} />
                  <QuickToggleRow
                    label="Custom cursor"
                    icon={Mouse}
                    active={useCustomCursor}
                    onToggle={toggleCustomCursor}
                  />
                </div>
              </WeeSettingsDisclosure>

              <WeeSettingsDisclosure
                title="Navigation"
                description="Mouse wheel shortcuts on Home and spaces"
                defaultOpen={false}
                className="!mb-0"
              >
                <div className="flex flex-col gap-3">
                  <QuickToggleRow
                    label="Mouse wheel switches spaces"
                    icon={PanelsTopLeft}
                    active={wheelSwitchSpaces}
                    onToggle={toggleWheelSwitchSpaces}
                  />
                  <QuickToggleRow
                    label="Tilt mouse wheel for pages"
                    icon={StretchHorizontal}
                    active={wheelHomePageTilt}
                    onToggle={toggleWheelHomePageTilt}
                  />
                </div>
              </WeeSettingsDisclosure>

              <WeeSettingsDisclosure
                title="Window"
                description="Frame chrome and fullscreen"
                defaultOpen={false}
                className="!mb-0"
              >
                <div className="grid grid-cols-1 gap-3">
                  <ActionButtonRow label="Toggle frame" icon={Square} onClick={toggleFrame} />
                  <ActionButtonRow label="Toggle fullscreen" icon={Maximize} onClick={toggleFullscreen} />
                </div>
              </WeeSettingsDisclosure>

              {IS_DEV ? (
                <WeeSettingsDisclosure
                  title="Developer"
                  description="Debug tools for this build"
                  defaultOpen={false}
                  className="!mb-0"
                >
                  <div className="grid grid-cols-1 gap-3">
                    <ActionButtonRow label="Developer tools" icon={Code2} onClick={openDevTools} />
                  </div>
                </WeeSettingsDisclosure>
              ) : null}
            </div>

            <div className="shrink-0 space-y-3 border-t-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-shell))] px-8 py-4 md:px-10">
              <p className="m-0 text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.2em] text-[hsl(var(--wee-text-rail-muted))]">
                Always available
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                <ActionButtonRow
                  label="Check for updates"
                  icon={RefreshCw}
                  onClick={openUpdatesModal}
                  badge={Boolean(updateAvailable)}
                />
                <WeeButton type="button" variant="danger" className="w-full" onClick={closeApp}>
                  Close app
                </WeeButton>
              </div>
            </div>

            <div className="shrink-0 border-t-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--wee-surface-input))] px-8 py-5 md:px-10">
              <div className="flex justify-center">
                <WeeButton type="button" variant="primary" onClick={handleClose}>
                  Finish
                </WeeButton>
              </div>
            </div>
          </m.div>
        </>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(tree, document.body);
});

SettingsActionMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
};

export default SettingsActionMenu;
