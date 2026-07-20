import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import Slider from '../../ui/Slider';
import WButton from '../../ui/WButton';
import { WeeSectionEyebrow, WeeSegmentedControl } from '../../ui/wee';
import SettingsToggleFieldCard from '../../components/settings/SettingsToggleFieldCard';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  DEFAULT_IMMERSIVE_SOUND_MODE,
  IMMERSIVE_SOUND_INTENSITIES,
  normalizeImmersiveSoundMode,
} from './immersiveSoundModePrefs.js';
import {
  enterImmersiveSoundMode,
  exitImmersiveSoundMode,
} from './immersiveSoundModeApi.js';

const INTENSITY_OPTIONS = [
  { value: 'calm', label: 'Calm' },
  { value: 'focus', label: 'Focus' },
  { value: 'club', label: 'Club' },
];

/**
 * Settings section for Immersive Sound Mode.
 * Lives in the Beta tab — delete with the feature folder (see README).
 */
function ImmersiveSoundModeSettingsSection() {
  const { rawPrefs, sessionActive, hasTrack, isPlaying, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      rawPrefs: state.ui?.immersiveSoundMode,
      sessionActive: Boolean(state.ui?.immersiveSoundModeActive),
      hasTrack: Boolean(state.nowPlaying?.trackName),
      isPlaying: Boolean(state.nowPlaying?.isPlaying),
      setUIState: state.actions.setUIState,
    }))
  );

  const prefs = useMemo(() => normalizeImmersiveSoundMode(rawPrefs), [rawPrefs]);

  const patchPrefs = useCallback(
    (partial) => {
      setUIState((prev) => ({
        immersiveSoundMode: normalizeImmersiveSoundMode({
          ...normalizeImmersiveSoundMode(prev.immersiveSoundMode),
          ...partial,
        }),
      }));
    },
    [setUIState]
  );

  const canEnter = prefs.enabled && (hasTrack || isPlaying);

  return (
    <section className="space-y-4">
      <WeeSectionEyebrow>Immersive Sound Mode</WeeSectionEyebrow>
      <Text variant="desc" className="!mt-0 block max-w-prose">
        Experimental Listening Stage — dim the board, grow the album cover, and blur art as a real
        backdrop. Separate from Album Wallpaper Wash and Now Playing takeover. Off by default; safe
        to turn off or remove later.
      </Text>

      <SettingsToggleFieldCard
        title="Enable Immersive Sound Mode"
        desc="Unlock Listening Stage when music is playing. Master switch for this beta feature."
        checked={prefs.enabled}
        onChange={(checked) => {
          patchPrefs({ enabled: checked });
          if (!checked) exitImmersiveSoundMode(useConsolidatedAppStore);
        }}
      >
        <div className="space-y-5">
          <div>
            <Text
              variant="body"
              className="mb-2 text-[0.75rem] font-black uppercase tracking-[0.1em] text-[hsl(var(--text-secondary))]"
            >
              Intensity
            </Text>
            <WeeSegmentedControl
              ariaLabel="Listening Stage intensity"
              value={
                IMMERSIVE_SOUND_INTENSITIES.includes(prefs.intensity)
                  ? prefs.intensity
                  : DEFAULT_IMMERSIVE_SOUND_MODE.intensity
              }
              onChange={(value) => patchPrefs({ intensity: value })}
              options={INTENSITY_OPTIONS}
              layoutId="ismIntensity"
            />
            <Text variant="caption" className="!mt-2 block text-[hsl(var(--text-tertiary))]">
              Calm is soft and still. Focus adds bars and light particles. Club pushes glow and
              motion.
            </Text>
          </div>

          <SettingsToggleFieldCard
            title="Auto-enter on idle"
            desc="When Home reaches ambient or attract idle and music is playing, open Listening Stage."
            checked={prefs.autoIdle}
            onChange={(checked) => patchPrefs({ autoIdle: checked })}
            className="!rounded-2xl"
          />

          <SettingsToggleFieldCard
            title="Cover backdrop"
            desc="Blur the current album art across the stage behind the hero cover."
            checked={prefs.coverBackdrop}
            onChange={(checked) => patchPrefs({ coverBackdrop: checked })}
            className="!rounded-2xl"
          />

          <div>
            <Slider
              label="Board dim"
              min={0.35}
              max={0.92}
              step={0.01}
              value={Number(prefs.boardDim.toFixed(2))}
              onChange={(value) => patchPrefs({ boardDim: value })}
            />
            <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
              How strongly Listening Stage covers the Home board.
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <WButton
              variant="primary"
              size="sm"
              disabled={!canEnter || sessionActive}
              onClick={() => enterImmersiveSoundMode(useConsolidatedAppStore, 'manual')}
            >
              Enter Listening Stage
            </WButton>
            <WButton
              variant="secondary"
              size="sm"
              disabled={!sessionActive}
              onClick={() => exitImmersiveSoundMode(useConsolidatedAppStore)}
            >
              Exit stage
            </WButton>
            {!hasTrack && !isPlaying ? (
              <Text variant="caption" className="text-[hsl(var(--text-tertiary))]">
                Start playing music to preview.
              </Text>
            ) : null}
          </div>
        </div>
      </SettingsToggleFieldCard>
    </section>
  );
}

export default React.memo(ImmersiveSoundModeSettingsSection);
