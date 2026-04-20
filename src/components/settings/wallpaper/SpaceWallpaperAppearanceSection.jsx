import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import WToggle from '../../../ui/WToggle';
import Text from '../../../ui/Text';
import Slider from '../../../ui/Slider';
import SettingsWeeSection from '../SettingsWeeSection';
import { WeeButton, WeeModalFieldCard, WeeSpaceRailPillButton } from '../../../ui/wee';
import { SPACE_WALLPAPER_OPTIONS } from './wallpaperSettingsConstants';

function SpaceWallpaperAppearanceSection({
  wallpaperOpacity,
  wallpaperBlur,
  handleWallpaperOpacityChange,
  handleWallpaperBlurChange,
  selectedSpaceId,
  setSelectedSpaceId,
  reduceMotion,
  tabTransition,
  selectedSpaceLabel,
  selectedSpaceUsesGlobalWallpaper,
  handleSelectedSpaceUseGlobalWallpaperChange,
  selectedWallpaper,
  handleSelectedSpaceWallpaperOverride,
  selectedSpaceWallpaperEntry,
  selectedSpaceWallpaperUrl,
  selectedSpaceBlur,
  handleSelectedSpaceBlurChange,
  selectedSpaceBrightness,
  handleSelectedSpaceBrightnessChange,
  selectedSpaceSaturate,
  handleSelectedSpaceSaturateChange,
  handleResetSelectedSpaceAppearance,
  showSpaceSelector = true,
  showGlobalOpacity = true,
  /** Home uses the global active wallpaper only; hide per-space image override controls. */
  showWallpaperSourceSection = true,
}) {
  return (
    <SettingsWeeSection eyebrow="Wallpaper layer">
      <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
        <Text variant="h3" className="mb-1 playful-hero-text">
          3. Tune controls
        </Text>
        <Text variant="desc" className="mb-4">
          Opacity and blur apply everywhere. Brightness and saturation are per space so you can dim Game Hub /
          Media Hub and tune Home independently.
        </Text>
        <p className="mt-0 mb-3 text-[13px] text-[hsl(var(--text-secondary))]">
          These settings affect the desktop wallpaper layer behind channels, Game Hub, and Media Hub.
        </p>

        {showGlobalOpacity ? (
          <>
            <h4 className="settings-wee-subhead">Overall</h4>
            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-opacity-range">
                Wallpaper opacity
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-opacity-range"
                  aria-label="Wallpaper opacity"
                  min={0}
                  max={1}
                  step={0.01}
                  value={wallpaperOpacity}
                  onChange={handleWallpaperOpacityChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{Math.round(wallpaperOpacity * 100)}%</span>
            </div>
            <p className="settings-wee-help mb-4 pl-[156px] max-md:pl-0">
              100% = fully opaque image; lower values let more of the default background show through.
            </p>
          </>
        ) : null}

        <div className="settings-wee-slider-row">
          <label className="settings-wee-slider-row__label" htmlFor="wallpaper-blur-range">
            Background blur
          </label>
          <div className="flex-1 min-w-0">
            <Slider
              id="wallpaper-blur-range"
              aria-label="Background blur"
              min={0}
              max={24}
              step={0.5}
              value={wallpaperBlur}
              onChange={handleWallpaperBlurChange}
              containerClassName="!mb-0"
              hideValue
            />
          </div>
          <span className="settings-wee-slider-row__value">{wallpaperBlur}px</span>
        </div>
        <p className="settings-wee-help mb-5 pl-[156px] max-md:pl-0">
          Gaussian blur on the wallpaper only (not UI). 0 = sharp, higher = softer.
        </p>

        <h4 className="settings-wee-subhead">Per-space appearance</h4>
        {showSpaceSelector ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {SPACE_WALLPAPER_OPTIONS.map((space) => (
              <WeeSpaceRailPillButton
                key={space.id}
                type="button"
                size="sm"
                active={selectedSpaceId === space.id}
                onClick={() => setSelectedSpaceId(space.id)}
              >
                {space.label}
              </WeeSpaceRailPillButton>
            ))}
          </div>
        ) : null}
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={selectedSpaceId}
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.995 }}
            transition={tabTransition}
            className="rounded-xl border border-[hsl(var(--border-primary)/0.6)] bg-[hsl(var(--surface-secondary)/0.4)] p-4"
          >
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
              Configuring {selectedSpaceLabel}
            </p>

            {showWallpaperSourceSection ? (
              <>
                <div className="settings-wee-field-row mb-3">
                  <span className="settings-wee-field-row__label">Wallpaper source</span>
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <WToggle
                      checked={selectedSpaceUsesGlobalWallpaper}
                      onChange={handleSelectedSpaceUseGlobalWallpaperChange}
                      disableLabelClick
                      title="Use desktop wallpaper for this space"
                    />
                    <Text variant="small" className="!m-0 text-[hsl(var(--text-secondary))]">
                      {selectedSpaceUsesGlobalWallpaper
                        ? 'Using active desktop wallpaper'
                        : 'Using space-specific wallpaper override'}
                    </Text>
                  </div>
                </div>

                {!selectedSpaceUsesGlobalWallpaper ? (
                  <div className="mb-4 rounded-xl border border-[hsl(var(--border-primary)/0.6)] bg-[hsl(var(--surface-secondary)/0.55)] p-3">
                    <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--text-secondary))]">
                      Space wallpaper
                    </div>
                    <div className="mb-3 text-[13px] text-[hsl(var(--text-secondary))]">
                      Pick an asset from your wallpaper library for this space only.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <WeeButton
                        type="button"
                        variant="secondary"
                        className="!px-3 !py-2"
                        disabled={!selectedWallpaper?.url}
                        onClick={() => handleSelectedSpaceWallpaperOverride(selectedWallpaper?.url || null)}
                      >
                        Use selected library asset
                      </WeeButton>
                      <WeeButton
                        type="button"
                        variant="secondary"
                        className="!px-3 !py-2"
                        onClick={() => handleSelectedSpaceWallpaperOverride(null)}
                      >
                        Clear override
                      </WeeButton>
                    </div>
                    <p className="settings-wee-help !mb-0 mt-3">
                      {selectedSpaceWallpaperEntry?.name
                        ? `Current override: ${selectedSpaceWallpaperEntry.name}`
                        : selectedSpaceWallpaperUrl
                          ? 'Current override: custom space wallpaper'
                          : 'No override selected yet.'}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mb-4 text-[13px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Home always uses the active desktop wallpaper from the library above. Choose a tile and use &quot;Set for
                Home&quot; — Game Hub and Media Hub can use their own overrides in this section when selected.
              </p>
            )}

            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-space-blur-range">
                Blur
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-space-blur-range"
                  aria-label="Selected space wallpaper blur"
                  min={0}
                  max={24}
                  step={0.5}
                  value={selectedSpaceBlur}
                  onChange={handleSelectedSpaceBlurChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{selectedSpaceBlur.toFixed(1)}px</span>
            </div>
            <p className="settings-wee-help mb-3 pl-[156px] max-md:pl-0">
              Blur softens busy images behind cards and widgets for the selected space.
            </p>

            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-space-brightness-range">
                Brightness
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-space-brightness-range"
                  aria-label="Selected space wallpaper brightness"
                  min={0.45}
                  max={1.2}
                  step={0.01}
                  value={selectedSpaceBrightness}
                  onChange={handleSelectedSpaceBrightnessChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{selectedSpaceBrightness.toFixed(2)}×</span>
            </div>
            <p className="settings-wee-help mb-3 pl-[156px] max-md:pl-0">
              1.00 = unchanged. Lower values dim the wallpaper and improve card readability.
            </p>

            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-space-saturate-range">
                Saturation
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-space-saturate-range"
                  aria-label="Selected space wallpaper saturation"
                  min={0}
                  max={1.5}
                  step={0.02}
                  value={selectedSpaceSaturate}
                  onChange={handleSelectedSpaceSaturateChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{selectedSpaceSaturate.toFixed(2)}×</span>
            </div>
            <p className="settings-wee-help mb-3 pl-[156px] max-md:pl-0">
              1.00 = natural color; lower approaches grayscale; above 1 boosts vividness for the selected space.
            </p>

            <div className="flex justify-end">
              <WeeButton
                type="button"
                variant="secondary"
                className="!px-3 !py-2 text-[hsl(var(--state-error))]"
                onClick={handleResetSelectedSpaceAppearance}
              >
                Reset {selectedSpaceLabel}
              </WeeButton>
            </div>
          </m.div>
        </AnimatePresence>
      </WeeModalFieldCard>
    </SettingsWeeSection>
  );
}

export default SpaceWallpaperAppearanceSection;
