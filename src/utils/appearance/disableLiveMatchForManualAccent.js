import { saveUnifiedSettingsSnapshot } from '../electronApi';
import useConsolidatedAppStore from '../useConsolidatedAppStore';

/**
 * Turn off live Color Match when the user picks a manual accent.
 * Keeps dynamic chrome on so the chosen ribbon/glow still drives --primary.
 *
 * @param {{ persist?: boolean }} [opts]
 */
export async function disableLiveMatchForManualAccent({ persist = true } = {}) {
  const { actions } = useConsolidatedAppStore.getState();
  actions.setUIState({
    wallpaperMatchEnabled: false,
    spotifyMatchEnabled: false,
  });
  actions.setRibbonState({ dynamicRibbonColorEnabled: true });

  if (!persist) return;

  try {
    await saveUnifiedSettingsSnapshot({
      ui: {
        wallpaperMatchEnabled: false,
        spotifyMatchEnabled: false,
      },
      ribbon: { dynamicRibbonColorEnabled: true },
    });
  } catch (e) {
    console.error('[disableLiveMatchForManualAccent] persist failed:', e);
  }
}
