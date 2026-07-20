/**
 * BETA Scene FX — Music Bloom only (Settings → Beta).
 * Parallax / scene light / cursor wake live on Surfaces → Atmosphere.
 * Removable with `src/features/sceneFxBeta/` (see README).
 */
import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import { WeeHelpLinkButton, WeeSectionEyebrow } from '../../ui/wee';
import SettingsToggleFieldCard from '../../components/settings/SettingsToggleFieldCard';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { normalizeSceneFxBeta } from './sceneFxBetaPrefs.js';
import SceneFxIntensityRow from './SceneFxIntensityRow.jsx';

function SceneFxBetaSettingsSection() {
  const { rawPrefs, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      rawPrefs: state.ui?.sceneFxBeta,
      setUIState: state.actions.setUIState,
    }))
  );

  const prefs = useMemo(() => normalizeSceneFxBeta(rawPrefs), [rawPrefs]);

  const patchEffect = useCallback(
    (effectId, partial) => {
      setUIState((prev) => {
        const current = normalizeSceneFxBeta(prev.sceneFxBeta);
        return {
          sceneFxBeta: normalizeSceneFxBeta({
            ...current,
            [effectId]: {
              ...current[effectId],
              ...partial,
            },
          }),
        };
      });
    },
    [setUIState]
  );

  const openSurfacesSceneEffects = useCallback(() => {
    openSettingsToTab(SETTINGS_TAB_ID.SURFACES, { surfacesSegment: 'atmosphere' });
  }, []);

  return (
    <section className="space-y-4">
      <WeeSectionEyebrow>Music bloom (Beta)</WeeSectionEyebrow>
      <Text variant="desc" className="!mt-0 block max-w-prose">
        Experimental accent wash while Now Playing is active. Subtle by design — try it with music
        playing and Scene effects enabled.
      </Text>

      {!prefs.enabled ? (
        <div className="space-y-1">
          <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
            Scene effects master is off — enable it on Surfaces first, then opt in below.
          </Text>
          <WeeHelpLinkButton className="!mt-0" onClick={openSurfacesSceneEffects}>
            Open Surfaces → Atmosphere
          </WeeHelpLinkButton>
        </div>
      ) : null}

      <SettingsToggleFieldCard
        hoverAccent="discovery"
        title="Music bloom"
        desc="Soft primary wash that breathes with playback. Easy to miss at low intensity — raise the slider while a track is playing."
        checked={prefs.musicBloom.enabled}
        onChange={(checked) => patchEffect('musicBloom', { enabled: checked })}
      >
        <SceneFxIntensityRow
          id="scene-fx-bloom"
          label="Intensity"
          value={prefs.musicBloom.intensity}
          onChange={(intensity) => patchEffect('musicBloom', { intensity })}
        />
      </SettingsToggleFieldCard>

      <div className="space-y-1">
        <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
          Depth, scene light, and cursor wake live under Surfaces → Atmosphere.
        </Text>
        <WeeHelpLinkButton className="!mt-0" onClick={openSurfacesSceneEffects}>
          Open Surfaces → Atmosphere
        </WeeHelpLinkButton>
      </div>
    </section>
  );
}

export default React.memo(SceneFxBetaSettingsSection);
