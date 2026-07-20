import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { normalizeImmersiveSoundMode } from './immersiveSoundModePrefs.js';
import ImmersiveSoundModeStage from './ImmersiveSoundModeStage.jsx';

/**
 * Immersive Sound Mode lifecycle + stage mount.
 * Isolated beta — delete with `src/features/immersiveSoundMode/` (see README).
 *
 * - Prefs master `enabled` gates all work.
 * - `autoIdle`: enter when music plays and Home idle reaches ambient/attract.
 * - Manual sessions stay until Exit / Escape / master off.
 * - Auto sessions exit on Escape, when idle returns to active, or playback stops.
 *
 * Do not call normalizeImmersiveSoundMode inside useShallow — fresh objects each
 * getSnapshot trip React #185 (maximum update depth).
 */
function ImmersiveSoundModeController() {
  const { rawPrefs, session, isPlaying, hasTrack, idleStage, blockingChrome } =
    useConsolidatedAppStore(
      useShallow((s) => ({
        rawPrefs: s.ui?.immersiveSoundMode,
        session: s.ui?.immersiveSoundModeActive || false,
        isPlaying: Boolean(s.nowPlaying?.isPlaying),
        hasTrack: Boolean(s.nowPlaying?.trackName),
        idleStage: s.ui?.homeIdleStage || 'active',
        blockingChrome: Boolean(
          s.ui?.showSettingsModal ||
            s.ui?.commandPaletteOpen ||
            s.ui?.homeBoardArrangeMode ||
            s.ui?.channelConfigureModalOpen
        ),
      }))
    );
  const prefs = useMemo(() => normalizeImmersiveSoundMode(rawPrefs), [rawPrefs]);
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);

  // Master off → never stay active.
  useEffect(() => {
    if (!prefs.enabled && session) {
      setUIState({ immersiveSoundModeActive: false });
    }
  }, [prefs.enabled, session, setUIState]);

  // Auto-enter from shared Home idle clock.
  useEffect(() => {
    if (!prefs.enabled || !prefs.autoIdle || session || blockingChrome) return;
    if (!isPlaying || !hasTrack) return;
    if (idleStage !== 'ambient' && idleStage !== 'attract') return;
    setUIState({ immersiveSoundModeActive: 'auto' });
  }, [
    prefs.enabled,
    prefs.autoIdle,
    session,
    blockingChrome,
    isPlaying,
    hasTrack,
    idleStage,
    setUIState,
  ]);

  // Forced exits for auto sessions.
  useEffect(() => {
    if (!session) return;
    if (session === 'auto' && (!isPlaying || idleStage === 'active')) {
      setUIState({ immersiveSoundModeActive: false });
    }
  }, [session, isPlaying, idleStage, setUIState]);

  // Escape always exits; prevent Quick Menu from stealing the key.
  useEffect(() => {
    if (!session) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setUIState({ immersiveSoundModeActive: false });
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [session, setUIState]);

  if (!prefs.enabled && !session) return null;

  return <ImmersiveSoundModeStage />;
}

export default ImmersiveSoundModeController;
