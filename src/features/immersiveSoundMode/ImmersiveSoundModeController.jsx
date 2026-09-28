import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { resolveActiveBoardCurrentPage } from '../../utils/channelSpaces';
import { normalizeImmersiveSoundMode } from './immersiveSoundModePrefs.js';
import { isImmersiveEditorOpen } from './immersiveSoundModeApi.js';
import ImmersiveSoundModeStage from './ImmersiveSoundModeStage.jsx';

/**
 * Immersive Sound Mode lifecycle + stage mount.
 *
 * - Prefs master `enabled` gates all work.
 * - `autoIdle`: own wait (`idleDelaySec`) while music plays and nothing is clicked.
 * - Settings and Edit Home stay open over the stage so blur, darken, and wait can be tuned live.
 * - Command palette and channel configure still dismiss the stage.
 * - Manual sessions stay until Exit / Escape / master off / dismiss gestures.
 * - Auto sessions also exit on a click outside the stage controls, or when playback stops.
 *
 * Do not call normalizeImmersiveSoundMode inside useShallow — fresh objects each
 * getSnapshot trip React #185 (maximum update depth).
 */
function ImmersiveSoundModeController() {
  const {
    rawPrefs,
    session,
    isPlaying,
    hasTrack,
    editorOpen,
    dismissChrome,
    activeSpaceId,
    channels,
  } = useConsolidatedAppStore(
    useShallow((s) => ({
      rawPrefs: s.ui?.immersiveSoundMode,
      session: s.ui?.immersiveSoundModeActive || false,
      isPlaying: Boolean(s.nowPlaying?.isPlaying),
      hasTrack: Boolean(s.nowPlaying?.trackName),
      editorOpen: isImmersiveEditorOpen(s.ui),
      dismissChrome: Boolean(
        s.ui?.commandPaletteOpen || s.ui?.channelConfigureModalOpen
      ),
      activeSpaceId: s.spaces?.activeSpaceId || 'home',
      channels: s.channels,
    }))
  );
  const prefs = useMemo(() => normalizeImmersiveSoundMode(rawPrefs), [rawPrefs]);
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);
  const boardPage = resolveActiveBoardCurrentPage({ activeSpaceId, channels });

  const navSnapshotRef = useRef({ spaceId: activeSpaceId, page: boardPage });

  // Master off → never stay active.
  useEffect(() => {
    if (!prefs.enabled && session) {
      setUIState({ immersiveSoundModeActive: false });
    }
  }, [prefs.enabled, session, setUIState]);

  // Passive takeover uses its own wait so it does not depend on Home idle being enabled.
  useEffect(() => {
    if (!prefs.enabled || !prefs.autoIdle || session || editorOpen || dismissChrome) {
      return undefined;
    }
    if (!isPlaying || !hasTrack) return undefined;

    const delayMs = prefs.idleDelaySec * 1000;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setUIState({ immersiveSoundModeActive: 'auto' });
      }, delayMs);
    };
    arm();
    const opts = { capture: true, passive: true };
    window.addEventListener('pointerdown', arm, opts);
    window.addEventListener('keydown', arm, opts);
    window.addEventListener('wheel', arm, opts);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', arm, true);
      window.removeEventListener('keydown', arm, true);
      window.removeEventListener('wheel', arm, true);
    };
  }, [
    prefs.enabled,
    prefs.autoIdle,
    prefs.idleDelaySec,
    session,
    editorOpen,
    dismissChrome,
    isPlaying,
    hasTrack,
    setUIState,
  ]);

  // Auto sessions leave when playback stops. Editing chrome does not count as "active".
  useEffect(() => {
    if (session !== 'auto' || isPlaying) return;
    setUIState({ immersiveSoundModeActive: false });
  }, [session, isPlaying, setUIState]);

  // Command palette and channel configure dismiss. Settings and Edit Home do not.
  useEffect(() => {
    if (!session || !dismissChrome) return;
    setUIState({ immersiveSoundModeActive: false });
  }, [session, dismissChrome, setUIState]);

  // Space switch or Home page change dismisses the stage.
  useEffect(() => {
    if (!session) {
      navSnapshotRef.current = { spaceId: activeSpaceId, page: boardPage };
      return;
    }
    const prev = navSnapshotRef.current;
    if (prev.spaceId !== activeSpaceId || prev.page !== boardPage) {
      navSnapshotRef.current = { spaceId: activeSpaceId, page: boardPage };
      setUIState({ immersiveSoundModeActive: false });
      return;
    }
    navSnapshotRef.current = { spaceId: activeSpaceId, page: boardPage };
  }, [session, activeSpaceId, boardPage, setUIState]);

  // Escape exits unless Settings, Edit Home, or the palette is already handling it.
  useEffect(() => {
    if (!session) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      const ui = useConsolidatedAppStore.getState().ui;
      if (isImmersiveEditorOpen(ui) || ui?.commandPaletteOpen || ui?.channelConfigureModalOpen) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setUIState({ immersiveSoundModeActive: false });
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [session, setUIState]);

  // Clicks outside stage controls end an auto session. Editor chrome and the Edit button do not.
  useEffect(() => {
    if (session !== 'auto') return undefined;
    const onPointerDown = (event) => {
      const ui = useConsolidatedAppStore.getState().ui;
      if (isImmersiveEditorOpen(ui)) return;
      const target = event.target;
      if (target instanceof Element && target.closest('[data-immersive-sound-controls]')) return;
      setUIState({ immersiveSoundModeActive: false });
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [session, setUIState]);

  // Wheel exits so page/space gestures aren't trapped, except while a settings surface is scrolling.
  useEffect(() => {
    if (!session) return undefined;
    const onWheel = (event) => {
      if (isImmersiveEditorOpen(useConsolidatedAppStore.getState().ui)) return;
      const target = event.target;
      if (target instanceof Element && target.closest('[data-immersive-sound-controls]')) return;
      setUIState({ immersiveSoundModeActive: false });
    };
    window.addEventListener('wheel', onWheel, { capture: true, passive: true });
    return () => window.removeEventListener('wheel', onWheel, true);
  }, [session, setUIState]);

  if (!prefs.enabled && !session) return null;

  return <ImmersiveSoundModeStage />;
}

export default ImmersiveSoundModeController;
