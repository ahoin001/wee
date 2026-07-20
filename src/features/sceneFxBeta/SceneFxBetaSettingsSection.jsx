/**
 * BETA Scene FX settings — Settings → Beta.
 * Removable with `src/features/sceneFxBeta/` (see README).
 */
import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import Slider from '../../ui/Slider';
import { WeeSectionEyebrow, WeeSliderValue } from '../../ui/wee';
import SettingsToggleFieldCard from '../../components/settings/SettingsToggleFieldCard';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { DEFAULT_SCENE_FX_BETA, normalizeSceneFxBeta } from './sceneFxBetaPrefs.js';

function IntensityRow({ id, label, value, onChange }) {
  return (
    <div className="settings-wee-slider-row">
      <label className="settings-wee-slider-row__label" htmlFor={id}>
        {label}
      </label>
      <div className="min-w-0 flex-1">
        <Slider
          id={id}
          aria-label={label}
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={onChange}
          containerClassName="!mb-0"
          hideValue
        />
      </div>
      <WeeSliderValue
        value={value}
        min={0}
        max={1}
        step={0.05}
        onChange={onChange}
        format={(v) => `${Math.round(v * 100)}`}
        suffix="%"
        aria-label={`${label} value`}
      />
    </div>
  );
}

function SceneFxBetaSettingsSection() {
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
      <WeeSectionEyebrow>Scene FX</WeeSectionEyebrow>
      <Text variant="desc" className="!mt-0 block max-w-prose">
        Wallpaper Engine–inspired atmosphere for the living desktop: parallax, vignette/light
        shafts, cursor wake, and optional music bloom. Off by default. Each effect can be toggled
        independently — and the whole module can be removed later without touching overlays or
        ribbon FX.
      </Text>

      <SettingsToggleFieldCard
        hoverAccent="discovery"
        title="Enable Scene FX (Beta)"
        desc="Master switch. When off, nothing from this experiment runs."
        checked={prefs.enabled}
        onChange={(checked) => patchPrefs({ enabled: checked })}
      >
        <div className="space-y-4">
          <SettingsToggleFieldCard
            title="Wallpaper parallax"
            desc="Soft cursor-follow depth on the wallpaper shell."
            checked={prefs.parallax.enabled}
            onChange={(checked) => patchEffect('parallax', { enabled: checked })}
          >
            <IntensityRow
              id="scene-fx-parallax-amount"
              label="Amount"
              value={prefs.parallax.amount}
              onChange={(amount) => patchEffect('parallax', { amount })}
            />
          </SettingsToggleFieldCard>

          <SettingsToggleFieldCard
            title="Atmosphere"
            desc="Edge vignette and drifting light shafts tinted by your accent."
            checked={prefs.atmosphere.enabled}
            onChange={(checked) => patchEffect('atmosphere', { enabled: checked })}
          >
            <div className="flex flex-col gap-3">
              <IntensityRow
                id="scene-fx-vignette"
                label="Vignette"
                value={prefs.atmosphere.vignette}
                onChange={(vignette) => patchEffect('atmosphere', { vignette })}
              />
              <IntensityRow
                id="scene-fx-shafts"
                label="Shafts"
                value={prefs.atmosphere.shafts}
                onChange={(shafts) => patchEffect('atmosphere', { shafts })}
              />
            </div>
          </SettingsToggleFieldCard>

          <SettingsToggleFieldCard
            title="Cursor wake"
            desc="Ripples on click and light trails while moving."
            checked={prefs.cursorWake.enabled}
            onChange={(checked) => patchEffect('cursorWake', { enabled: checked })}
          >
            <IntensityRow
              id="scene-fx-wake"
              label="Intensity"
              value={prefs.cursorWake.intensity}
              onChange={(intensity) => patchEffect('cursorWake', { intensity })}
            />
          </SettingsToggleFieldCard>

          <SettingsToggleFieldCard
            title="Music bloom"
            desc="Subtle accent wash while Now Playing is active. Off inside the beta until you opt in."
            checked={prefs.musicBloom.enabled}
            onChange={(checked) => patchEffect('musicBloom', { enabled: checked })}
          >
            <IntensityRow
              id="scene-fx-bloom"
              label="Intensity"
              value={prefs.musicBloom.intensity}
              onChange={(intensity) => patchEffect('musicBloom', { intensity })}
            />
          </SettingsToggleFieldCard>

          <Text variant="caption" className="!m-0 block text-[hsl(var(--text-tertiary))]">
            Master defaults off ({DEFAULT_SCENE_FX_BETA.enabled ? 'on' : 'off'}). Respects reduced
            motion and low-power activity gates. Particle snow/rain overlays stay separate under
            Surfaces → Atmosphere.
          </Text>
        </div>
      </SettingsToggleFieldCard>
    </section>
  );
}

export default React.memo(SceneFxBetaSettingsSection);
