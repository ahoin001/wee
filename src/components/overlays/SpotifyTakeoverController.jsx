import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { normalizeNowPlayingExperience } from '../../utils/spotifyTakeover';

/**
 * Now Playing takeover lifecycle (renders nothing).
 *
 * - `autoIdle` mode: enters takeover when the shared Home idle machine reaches
 *   ambient/attract while music is playing; any interaction exits it.
 * - `manual` takeovers (palette / Now Playing tile) stay up until toggled off
 *   or Escape is pressed.
 * - Playback stopping or the preference switching to Off always exits.
 */
function SpotifyTakeoverController() {
  const { mode, takeover, isPlaying, idleStage } = useConsolidatedAppStore(
    useShallow((s) => ({
      mode: normalizeNowPlayingExperience(s.spotify.nowPlayingExperience),
      takeover: s.ui.spotifyTakeoverActive,
      isPlaying: Boolean(s.spotify.isPlaying),
      idleStage: s.ui.homeIdleStage,
    }))
  );
  const setUIState = useConsolidatedAppStore((s) => s.actions.setUIState);

  // Auto-enter from the shared idle clock (no timer of its own).
  useEffect(() => {
    if (
      mode === 'autoIdle' &&
      !takeover &&
      isPlaying &&
      (idleStage === 'ambient' || idleStage === 'attract')
    ) {
      setUIState({ spotifyTakeoverActive: 'auto' });
    }
  }, [mode, takeover, isPlaying, idleStage, setUIState]);

  // Forced exits: preference off, or auto takeover with playback stopped.
  useEffect(() => {
    if (!takeover) return;
    if (mode === 'off' || (takeover === 'auto' && !isPlaying)) {
      setUIState({ spotifyTakeoverActive: false });
    }
  }, [takeover, mode, isPlaying, setUIState]);

  // Interaction exits while active: any input ends auto takeover; Escape ends manual.
  useEffect(() => {
    if (!takeover) return undefined;
    const exit = () => setUIState({ spotifyTakeoverActive: false });
    const onKeyDown = (event) => {
      if (takeover === 'auto' || event.key === 'Escape') exit();
    };
    const onPointerDown = () => {
      if (takeover === 'auto') exit();
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [takeover, setUIState]);

  return null;
}

export default SpotifyTakeoverController;
