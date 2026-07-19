import React from 'react';
import Text from '../../../ui/Text';
import WSelect from '../../../ui/WSelect';
import WInput from '../../../ui/WInput';
import Slider from '../../../ui/Slider';
import SettingsWeeSection from '../SettingsWeeSection';
import SettingsToggleFieldCard from '../SettingsToggleFieldCard';
import { WeeMorphStack, WeeRevealWhen, WeeSpaceRailPillButton } from '../../../ui/wee';
import { requestWallpaperCycleManual } from '../../../utils/wallpaperCyclingBridge';
import {
  EASING_OPTIONS,
  SLIDE_DIRECTION_MODE_OPTIONS,
  SLIDE_DIRECTION_OPTIONS,
  WALLPAPER_ANIMATIONS,
} from './wallpaperSettingsConstants';

/** Seconds — presets for the cycle timer. */
const CYCLE_INTERVAL_PRESETS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
];

const CYCLE_INTERVAL_MIN = 5;
const CYCLE_INTERVAL_MAX = 1800;

function clampCycleInterval(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 30;
  return Math.min(CYCLE_INTERVAL_MAX, Math.max(CYCLE_INTERVAL_MIN, Math.round(n)));
}

function WallpaperCyclingSection({
  cycling,
  handleCyclingChange,
  cycleInterval,
  handleCycleIntervalChange,
  cycleAnimation,
  handleCycleAnimationChange,
  slideRandomDirection,
  handleSlideRandomDirectionChange,
  slideDirection,
  handleSlideDirectionChange,
  slideDuration,
  handleSlideDurationChange,
  slideEasing,
  handleSlideEasingChange,
  crossfadeDuration,
  handleCrossfadeDurationChange,
  crossfadeEasing,
  handleCrossfadeEasingChange,
}) {
  const intervalSeconds = clampCycleInterval(cycleInterval);

  const setIntervalSeconds = (raw) => {
    handleCycleIntervalChange(clampCycleInterval(raw));
  };

  const runManualCycle = () => {
    if (window.api?.wallpapers?.cycle) {
      window.api.wallpapers.cycle();
    }
    requestWallpaperCycleManual();
  };

  return (
    <SettingsWeeSection eyebrow="Cycling">
      <SettingsToggleFieldCard
        hoverAccent="primary"
        title="Liked-wallpaper cycling"
        desc="Rotate liked wallpapers on a timer. On per-page boards, cycling runs only on pages that use the global wallpaper — pinned page art stays put."
        checked={cycling}
        onChange={handleCyclingChange}
      >
        <div className="flex flex-col gap-4">
          <div className="settings-wee-field-row mb-0">
            <span className="settings-wee-field-row__label">Try it</span>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <WeeSpaceRailPillButton type="button" size="sm" onClick={runManualCycle}>
                Manual cycle
              </WeeSpaceRailPillButton>
              <Text variant="small" className="!m-0 text-[hsl(var(--text-tertiary))]">
                Fire one advance with your current animation settings.
              </Text>
            </div>
          </div>

          <div className="settings-wee-slider-row !items-start">
            <span className="settings-wee-slider-row__label pt-1">Timer</span>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {CYCLE_INTERVAL_PRESETS.map((preset) => (
                  <WeeSpaceRailPillButton
                    key={preset.value}
                    type="button"
                    size="sm"
                    active={intervalSeconds === preset.value}
                    onClick={() => setIntervalSeconds(preset.value)}
                  >
                    {preset.label}
                  </WeeSpaceRailPillButton>
                ))}
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <Slider
                    min={CYCLE_INTERVAL_MIN}
                    max={CYCLE_INTERVAL_MAX}
                    step={5}
                    value={intervalSeconds}
                    onChange={setIntervalSeconds}
                    containerClassName="!mb-0"
                    hideValue
                  />
                </div>
                <div className="min-w-[5.5rem] max-w-[7rem] shrink-0">
                  <WInput
                    variant="wee"
                    type="number"
                    min={CYCLE_INTERVAL_MIN}
                    max={CYCLE_INTERVAL_MAX}
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                    className="!py-2.5 text-[15px] tabular-nums leading-normal"
                  />
                </div>
                <Text variant="small" className="text-[hsl(var(--text-tertiary))]">
                  seconds
                </Text>
              </div>
              <Text variant="small" className="!m-0 text-[hsl(var(--text-tertiary))]">
                How long each liked wallpaper stays before the next transition. Low-power mode
                floors this at 60s.
              </Text>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
            <span className="settings-wee-slider-row__label shrink-0 pt-0.5 lg:w-[8.75rem] lg:pt-1">
              Animation
            </span>
            <div className="min-w-0 flex-1">
              <WSelect
                options={WALLPAPER_ANIMATIONS}
                value={cycleAnimation}
                onChange={handleCycleAnimationChange}
                variant="wee"
                className="w-full min-w-0"
              />
              <Text variant="small" className="mt-1 text-[hsl(var(--text-tertiary))]">
                {cycleAnimation === 'fade' && 'Smooth crossfade — best for most wallpapers'}
                {cycleAnimation === 'slide' && 'Directional slide — good for panoramas'}
                {cycleAnimation === 'zoom' && 'Gentle zoom — subtle and calm'}
                {cycleAnimation === 'ken-burns' && 'Cinematic pan and zoom'}
                {cycleAnimation === 'morph' && 'Shape-style blend transition'}
                {cycleAnimation === 'blur' && 'Soft blur-based blend'}
              </Text>
            </div>
            <div className="flex shrink-0 justify-start lg:pt-1">
              <WeeSpaceRailPillButton
                type="button"
                size="sm"
                onClick={runManualCycle}
                title="Preview animation with current settings"
              >
                Preview
              </WeeSpaceRailPillButton>
            </div>
          </div>

          <WeeMorphStack open={cycleAnimation === 'slide' || cycleAnimation === 'fade'}>
            <WeeRevealWhen when={cycleAnimation === 'slide'}>
              <div className="flex flex-col gap-4">
                <div className="settings-wee-slider-row">
                  <span className="settings-wee-slider-row__label">Slide mode</span>
                  <div className="min-w-0 flex-1">
                    <WSelect
                      options={SLIDE_DIRECTION_MODE_OPTIONS}
                      value={slideRandomDirection ? 'random' : 'fixed'}
                      onChange={(value) => handleSlideRandomDirectionChange(value === 'random')}
                      variant="wee"
                      className="w-full"
                    />
                  </div>
                </div>

                <WeeRevealWhen when={!slideRandomDirection}>
                  <div className="settings-wee-slider-row">
                    <span className="settings-wee-slider-row__label">Direction</span>
                    <div className="min-w-0 flex-1">
                      <WSelect
                        options={SLIDE_DIRECTION_OPTIONS}
                        value={slideDirection}
                        onChange={handleSlideDirectionChange}
                        variant="wee"
                        className="w-full"
                      />
                    </div>
                  </div>
                </WeeRevealWhen>

                <div className="settings-wee-slider-row">
                  <span className="settings-wee-slider-row__label">Slide duration</span>
                  <div className="min-w-0 flex-1">
                    <Slider
                      min={0.3}
                      max={2}
                      step={0.1}
                      value={slideDuration}
                      onChange={handleSlideDurationChange}
                      containerClassName="!mb-0"
                      hideValue
                    />
                  </div>
                  <span className="settings-wee-slider-row__value">{slideDuration}s</span>
                </div>

                <div className="settings-wee-slider-row">
                  <span className="settings-wee-slider-row__label">Slide easing</span>
                  <div className="min-w-0 flex-1">
                    <WSelect
                      options={EASING_OPTIONS}
                      value={slideEasing}
                      onChange={handleSlideEasingChange}
                      variant="wee"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </WeeRevealWhen>

            <WeeRevealWhen when={cycleAnimation === 'fade'}>
              <div className="flex flex-col gap-4">
                <div className="settings-wee-slider-row">
                  <span className="settings-wee-slider-row__label">Crossfade duration</span>
                  <div className="min-w-0 flex-1">
                    <Slider
                      min={0.3}
                      max={2}
                      step={0.1}
                      value={crossfadeDuration}
                      onChange={handleCrossfadeDurationChange}
                      containerClassName="!mb-0"
                      hideValue
                    />
                  </div>
                  <span className="settings-wee-slider-row__value">{crossfadeDuration}s</span>
                </div>

                <div className="settings-wee-slider-row">
                  <span className="settings-wee-slider-row__label">Crossfade easing</span>
                  <div className="min-w-0 flex-1">
                    <WSelect
                      options={EASING_OPTIONS}
                      value={crossfadeEasing}
                      onChange={handleCrossfadeEasingChange}
                      variant="wee"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </WeeRevealWhen>
          </WeeMorphStack>

          <p className="settings-wee-help !mb-0 mt-2">
            Need at least two liked wallpapers. Transitions preload the next image before animating;
            keep the timer gentle on slower machines.
          </p>
        </div>
      </SettingsToggleFieldCard>
    </SettingsWeeSection>
  );
}

export default WallpaperCyclingSection;
