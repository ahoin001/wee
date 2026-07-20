import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import Slider from '../../ui/Slider';
import WButton from '../../ui/WButton';
import { WeeSectionEyebrow, WeeSegmentedControl, WeeToggle } from '../../ui/wee';
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
 * Listening Stage controls — used in Now Playing Looks (compact) and full settings.
 * @param {{ compact?: boolean }} props
 */
function ImmersiveSoundModeSettingsSection({ compact = false }) {
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

  const intensityControl = (
    <div>
      {!compact ? (
        <Text
          variant="body"
          className="mb-2 text-[0.75rem] font-black uppercase tracking-[0.1em] text-[hsl(var(--text-secondary))]"
        >
          Intensity
        </Text>
      ) : (
        <p className="m-0 mb-1.5 text-[11px] font-black text-[hsl(var(--text-primary))]">
          Intensity
        </p>
      )}
      <WeeSegmentedControl
        size={compact ? 'sm' : undefined}
        ariaLabel="Listening Stage intensity"
        value={
          IMMERSIVE_SOUND_INTENSITIES.includes(prefs.intensity)
            ? prefs.intensity
            : DEFAULT_IMMERSIVE_SOUND_MODE.intensity
        }
        onChange={(value) => patchPrefs({ intensity: value })}
        options={INTENSITY_OPTIONS}
        layoutId={compact ? 'ismIntensityLooks' : 'ismIntensity'}
      />
      {!compact ? (
        <Text variant="caption" className="!mt-2 block text-[hsl(var(--text-tertiary))]">
          Calm is soft and still. Focus adds bars and light particles. Club pushes glow and motion.
        </Text>
      ) : null}
    </div>
  );

  const boardDimControl = (
    <div>
      <Slider
        label="Board dim"
        min={0.35}
        max={0.92}
        step={0.01}
        value={Number(prefs.boardDim.toFixed(2))}
        onChange={(value) => patchPrefs({ boardDim: value })}
      />
      {!compact ? (
        <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
          How strongly Listening Stage covers the Home board.
        </Text>
      ) : null}
    </div>
  );

  const previewButtons = (
    <div className={`flex flex-wrap items-center gap-3 ${compact ? 'pt-0.5' : 'pt-1'}`}>
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
  );

  if (compact) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
              Listening Stage
            </p>
            <p className="m-0 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
              Full-screen album stage — click cover art to enter
            </p>
          </div>
          <WeeToggle
            checked={prefs.enabled}
            onChange={(checked) => {
              patchPrefs({ enabled: checked });
              if (!checked) exitImmersiveSoundMode(useConsolidatedAppStore);
            }}
            title="Enable Listening Stage"
          />
        </div>

        {prefs.enabled ? (
          <>
            <div className="rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2.5">
              {intensityControl}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
              <div className="min-w-0">
                <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
                  Auto-enter on idle
                </p>
                <p className="m-0 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
                  Open when Home is idle and music plays
                </p>
              </div>
              <WeeToggle
                checked={prefs.autoIdle}
                onChange={(checked) => patchPrefs({ autoIdle: Boolean(checked) })}
                title="Auto-enter Listening Stage on idle"
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
              <div className="min-w-0">
                <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
                  Cover backdrop
                </p>
                <p className="m-0 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
                  Blur album art behind the stage
                </p>
              </div>
              <WeeToggle
                checked={prefs.coverBackdrop}
                onChange={(checked) => patchPrefs({ coverBackdrop: Boolean(checked) })}
                title="Cover backdrop"
              />
            </div>
            <div className="rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2.5">
              {boardDimControl}
            </div>
            <div className="rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2.5">
              {previewButtons}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <WeeSectionEyebrow>Listening Stage</WeeSectionEyebrow>
      <Text variant="desc" className="!mt-0 block max-w-prose">
        Dim the board, grow the album cover, and sit with the track. Click cover art on the Now
        Playing widget to enter. Separate from Album Wallpaper Wash and Now Playing takeover.
      </Text>

      <SettingsToggleFieldCard
        title="Enable Listening Stage"
        desc="Unlock the full-screen stage when music is playing. Click album art on Home to enter."
        checked={prefs.enabled}
        onChange={(checked) => {
          patchPrefs({ enabled: checked });
          if (!checked) exitImmersiveSoundMode(useConsolidatedAppStore);
        }}
      >
        <div className="space-y-5">
          {intensityControl}

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

          {boardDimControl}
          {previewButtons}
        </div>
      </SettingsToggleFieldCard>
    </section>
  );
}

ImmersiveSoundModeSettingsSection.propTypes = {
  compact: PropTypes.bool,
};

export default React.memo(ImmersiveSoundModeSettingsSection);
