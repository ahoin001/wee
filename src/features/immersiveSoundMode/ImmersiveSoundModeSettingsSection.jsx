import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import Text from '../../ui/Text';
import Slider from '../../ui/Slider';
import WButton from '../../ui/WButton';
import { WeeRevealWhen, WeeSectionEyebrow, WeeSegmentedControl, WeeToggle } from '../../ui/wee';
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
 * @param {{ compact?: boolean, embedded?: boolean }} props
 */
function ImmersiveSoundModeSettingsSection({ compact = false, embedded = false }) {
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
          Blur and darken stay on their own sliders.
        </Text>
      ) : null}
    </div>
  );

  const overlayBlurControl = (
    <div>
      <Slider
        label="Overlay blur (px)"
        min={0}
        max={48}
        step={1}
        value={prefs.overlayBlurPx}
        onChange={(value) => patchPrefs({ overlayBlurPx: value })}
        containerClassName="!mb-1"
      />
      {!compact ? (
        <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
          How much the Home screen softens behind the stage. Also blurs the album wash.
        </Text>
      ) : null}
    </div>
  );

  const boardDimControl = (
    <div>
      <Slider
        label="Overlay darken (%)"
        min={12}
        max={92}
        step={1}
        value={Math.round(prefs.boardDim * 100)}
        onChange={(value) => patchPrefs({ boardDim: value / 100 })}
        containerClassName="!mb-1"
      />
      {!compact ? (
        <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
          Percent of darkness laid over Home. Changes apply while the stage is open.
        </Text>
      ) : null}
    </div>
  );

  const idleDelayControl = (
    <div>
      <Slider
        label="Wait before takeover (seconds)"
        min={5}
        max={180}
        step={5}
        value={prefs.idleDelaySec}
        onChange={(value) => patchPrefs({ idleDelaySec: value })}
        containerClassName="!mb-1"
      />
      {!compact ? (
        <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
          Seconds of no clicks or keys while music plays before the stage takes over.
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
      {sessionActive ? (
        <Text variant="caption" className="text-[hsl(var(--text-tertiary))]">
          Stage is open. Blur, darken, and intensity update live.
        </Text>
      ) : !hasTrack && !isPlaying ? (
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
            <div className="rounded-xl bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-[11px] font-black text-[hsl(var(--text-primary))]">
                    Passive takeover
                  </p>
                  <p className="m-0 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
                    Take over Home after music plays untouched
                  </p>
                </div>
                <WeeToggle
                  checked={prefs.autoIdle}
                  onChange={(checked) => patchPrefs({ autoIdle: Boolean(checked) })}
                  title="Passive Listening Stage takeover"
                />
              </div>
              <WeeRevealWhen when={prefs.autoIdle}>
                <div className="pt-2">{idleDelayControl}</div>
              </WeeRevealWhen>
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
              {overlayBlurControl}
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
      {embedded ? null : <WeeSectionEyebrow>Listening Stage</WeeSectionEyebrow>}
      <Text variant="desc" className="!mt-0 block max-w-prose">
        Dim and blur Home, grow the album cover, and sit with the track. Click cover art on the
        Now Playing widget, or let passive takeover open it after the wait below. Sliders keep
        working while the stage is open — use Edit on the stage, or stay in this panel.
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
            title="Passive takeover"
            desc="When music is playing and you leave the screen alone, Listening Stage takes over Home."
            checked={prefs.autoIdle}
            onChange={(checked) => patchPrefs({ autoIdle: checked })}
            className="!rounded-2xl"
          >
            {idleDelayControl}
          </SettingsToggleFieldCard>

          <SettingsToggleFieldCard
            title="Cover backdrop"
            desc="Lay the current album art across the stage behind the hero cover."
            checked={prefs.coverBackdrop}
            onChange={(checked) => patchPrefs({ coverBackdrop: checked })}
            className="!rounded-2xl"
          />

          {overlayBlurControl}
          {boardDimControl}
          {previewButtons}
        </div>
      </SettingsToggleFieldCard>
    </section>
  );
}

ImmersiveSoundModeSettingsSection.propTypes = {
  compact: PropTypes.bool,
  embedded: PropTypes.bool,
};

export default React.memo(ImmersiveSoundModeSettingsSection);
