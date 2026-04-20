import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import WToggle from '../../../ui/WToggle';
import Text from '../../../ui/Text';
import WSelect from '../../../ui/WSelect';
import WInput from '../../../ui/WInput';
import Slider from '../../../ui/Slider';
import SettingsWeeSection from '../SettingsWeeSection';
import { WeeModalFieldCard, WeeSpaceRailPillButton } from '../../../ui/wee';
import {
  EASING_OPTIONS,
  SLIDE_DIRECTION_MODE_OPTIONS,
  SLIDE_DIRECTION_OPTIONS,
  WALLPAPER_ANIMATIONS,
} from './wallpaperSettingsConstants';

function WallpaperCyclingSection({
  cycling,
  handleCyclingChange,
  reduceMotion,
  tabTransition,
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
  return (
    <SettingsWeeSection eyebrow="Cycling">
      <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Text variant="h3" className="mb-1 playful-hero-text">
              Liked-wallpaper cycling
            </Text>
            <Text variant="desc" className="!m-0">
              Rotate through liked wallpapers on an interval. Only applies when cycling is enabled.
            </Text>
          </div>
          <WToggle checked={cycling} onChange={handleCyclingChange} disableLabelClick title="Enable automatic cycling" />
        </div>
        <AnimatePresence initial={false}>
          {cycling ? (
            <m.div
              key="cycling-panel"
              layout
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ ...tabTransition, layout: { duration: 0.28 } }}
              className="flex flex-col gap-4"
            >
              <div className="settings-wee-field-row mb-0">
                <span className="settings-wee-field-row__label">Try it</span>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <WeeSpaceRailPillButton
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (window.api?.wallpapers?.cycle) {
                        window.api.wallpapers.cycle();
                      }
                      if (window.cycleToNextWallpaper) {
                        window.cycleToNextWallpaper();
                      }
                    }}
                  >
                    Manual cycle
                  </WeeSpaceRailPillButton>
                  <Text variant="small" className="!m-0 text-[hsl(var(--text-tertiary))]">
                    Fire one advance with your current animation settings.
                  </Text>
                </div>
              </div>

              <div className="settings-wee-slider-row !items-center">
                <span className="settings-wee-slider-row__label">Interval</span>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <div className="min-w-[6rem] max-w-[8rem] shrink-0">
                    <WInput
                      variant="wee"
                      type="number"
                      min={2}
                      max={600}
                      value={cycleInterval}
                      onChange={(e) => handleCycleIntervalChange(Number(e.target.value))}
                      className="!py-2.5 text-[15px] tabular-nums leading-normal"
                    />
                  </div>
                  <Text variant="small" className="text-[hsl(var(--text-tertiary))]">
                    seconds per wallpaper
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
                    onClick={() => {
                      if (window.cycleToNextWallpaper) {
                        window.cycleToNextWallpaper();
                      }
                    }}
                    title="Preview animation with current settings"
                  >
                    Preview
                  </WeeSpaceRailPillButton>
                </div>
              </div>

              {cycleAnimation === 'slide' ? (
                <>
                  <div className="settings-wee-slider-row">
                    <span className="settings-wee-slider-row__label">Slide mode</span>
                    <div className="min-w-0 flex-1">
                      <WSelect
                        options={SLIDE_DIRECTION_MODE_OPTIONS}
                        value={slideRandomDirection ? 'random' : 'fixed'}
                        onChange={(value) => handleSlideRandomDirectionChange(value === 'random')}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {!slideRandomDirection ? (
                    <div className="settings-wee-slider-row">
                      <span className="settings-wee-slider-row__label">Direction</span>
                      <div className="min-w-0 flex-1">
                        <WSelect
                          options={SLIDE_DIRECTION_OPTIONS}
                          value={slideDirection}
                          onChange={handleSlideDirectionChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ) : null}

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
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {cycleAnimation === 'fade' ? (
                <>
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
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <p className="settings-wee-help !mb-0 mt-2">
                Fade, slide, zoom, Ken Burns, morph, and blur transitions use the same liked set — tune the interval
                so cycling stays gentle on slower machines.
              </p>
            </m.div>
          ) : null}
        </AnimatePresence>
      </WeeModalFieldCard>
    </SettingsWeeSection>
  );
}

export default WallpaperCyclingSection;
