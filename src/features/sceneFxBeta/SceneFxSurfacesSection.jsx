/**
 * Scene FX controls for Surfaces → Atmosphere.
 * Writes `ui.sceneFxBeta` (same SSOT as Beta Music Bloom). Removable with feature folder.
 */
import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import { WeeSectionEyebrow } from '../../ui/wee';
import SettingsToggleFieldCard from '../../components/settings/SettingsToggleFieldCard';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { normalizeSceneFxBeta } from './sceneFxBetaPrefs.js';
import SceneFxIntensityRow from './SceneFxIntensityRow.jsx';

function SceneFxSurfacesSection() {
  const { rawPrefs, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      rawPrefs: state.ui?.sceneFxBeta,
      setUIState: state.actions.setUIState,
    }))
  );

  const prefs = useMemo(() => normalizeSceneFxBeta(rawPrefs), [rawPrefs]);

  const patchPrefs = useCallback(
    (partial) => {
      setUIState((prev) => ({
        sceneFxBeta: normalizeSceneFxBeta({
          ...normalizeSceneFxBeta(prev.sceneFxBeta),
          ...partial,
        }),
      }));
    },
    [setUIState]
  );

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

  return (
    <section className="space-y-4">
      <WeeSectionEyebrow>Scene effects</WeeSectionEyebrow>
      <Text variant="desc" className="!mt-0 block max-w-prose">
        Soft depth and light over the wallpaper — works on every space. Separate from Home particle
        snow/rain below.
      </Text>

      <SettingsToggleFieldCard
        hoverAccent="discovery"
        title="Scene effects"
        desc="Turns on depth, scene light, and cursor wake across spaces."
        checked={prefs.enabled}
        onChange={(checked) => patchPrefs({ enabled: checked })}
      >
        <div className="space-y-4">
          <SettingsToggleFieldCard
            title="Wallpaper parallax"
            desc="Wallpaper gently follows the cursor for soft depth."
            checked={prefs.parallax.enabled}
            onChange={(checked) => patchEffect('parallax', { enabled: checked })}
          >
            <SceneFxIntensityRow
              id="scene-fx-surfaces-parallax-amount"
              label="Amount"
              value={prefs.parallax.amount}
              onChange={(amount) => patchEffect('parallax', { amount })}
            />
          </SettingsToggleFieldCard>

          <SettingsToggleFieldCard
            title="Scene light"
            desc="Vignette and accent-tinted light shafts over the wallpaper — separate from particle snow/rain."
            checked={prefs.atmosphere.enabled}
            onChange={(checked) => patchEffect('atmosphere', { enabled: checked })}
          >
            <div className="flex flex-col gap-3">
              <SceneFxIntensityRow
                id="scene-fx-surfaces-vignette"
                label="Vignette"
                value={prefs.atmosphere.vignette}
                onChange={(vignette) => patchEffect('atmosphere', { vignette })}
              />
              <SceneFxIntensityRow
                id="scene-fx-surfaces-shafts"
                label="Shafts"
                value={prefs.atmosphere.shafts}
                onChange={(shafts) => patchEffect('atmosphere', { shafts })}
              />
            </div>
          </SettingsToggleFieldCard>

          <SettingsToggleFieldCard
            title="Cursor wake"
            desc="Ripples on click; light trails while moving."
            checked={prefs.cursorWake.enabled}
            onChange={(checked) => patchEffect('cursorWake', { enabled: checked })}
          >
            <SceneFxIntensityRow
              id="scene-fx-surfaces-wake"
              label="Intensity"
              value={prefs.cursorWake.intensity}
              onChange={(intensity) => patchEffect('cursorWake', { intensity })}
            />
          </SettingsToggleFieldCard>

          <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
            Respects reduced motion and low-power gates. Experimental music bloom stays under
            Settings → Beta.
          </Text>
        </div>
      </SettingsToggleFieldCard>
    </section>
  );
}

export default React.memo(SceneFxSurfacesSection);
