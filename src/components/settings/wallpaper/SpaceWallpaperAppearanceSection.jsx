import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import WToggle from '../../../ui/WToggle';
import Text from '../../../ui/Text';
import Slider from '../../../ui/Slider';
import SettingsWeeSection from '../SettingsWeeSection';
import { WeeButton, WeeModalFieldCard, WeeRevealWhen, WeeSpaceRailPillButton } from '../../../ui/wee';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import { SPACE_WALLPAPER_OPTIONS } from './wallpaperSettingsConstants';
import WallpaperScenePreview from './WallpaperScenePreview';

function SpaceWallpaperAppearanceSection({
  wallpaperOpacity,
  handleWallpaperOpacityChange,
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
  effectiveActiveWallpaperUrl,
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
  supportsPerPageWallpaper = false,
  selectedWallpaperScope = 'space',
  onWallpaperScopeChange,
  selectedBoardCurrentPage = 0,
  selectedPageWallpaperUrl = null,
  onApplyWallpaperToCurrentPage,
  onClearCurrentPageWallpaper,
  canApplyPageWallpaper = false,
}) {
  const mediaHubEnabled = useConsolidatedAppStore((s) => s.spaces.mediaHubEnabled === true);
  const spaceOptions = SPACE_WALLPAPER_OPTIONS.filter(
    (space) => mediaHubEnabled || space.id !== 'mediahub'
  );
  const sceneUrl =
    (typeof selectedWallpaper?.url === 'string' && selectedWallpaper.url) ||
    (typeof effectiveActiveWallpaperUrl === 'string' && effectiveActiveWallpaperUrl) ||
    (typeof selectedSpaceWallpaperUrl === 'string' && selectedSpaceWallpaperUrl) ||
    null;

  return (
    <SettingsWeeSection eyebrow="Wallpaper layer">
      <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
        <WallpaperScenePreview
          wallpaperUrl={sceneUrl}
          opacity={wallpaperOpacity}
          blur={selectedSpaceBlur}
          brightness={selectedSpaceBrightness}
          saturate={selectedSpaceSaturate}
          sticky
        />

        <Text variant="h3" className="mb-1 playful-hero-text">
          3. Tune controls
        </Text>
        <Text variant="desc" className="mb-4">
          Opacity applies everywhere. Blur, brightness, and saturation are per space so you can soften Home
          independently from Game Hub / Media Hub.
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
            <p className="settings-wee-help mb-5 pl-[156px] max-md:pl-0">
              100% = fully opaque image; lower values let more of the default background show through.
            </p>
          </>
        ) : null}

        <h4 className="settings-wee-subhead">Per-space appearance</h4>
        {showSpaceSelector ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {spaceOptions.map((space) => (
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

            {supportsPerPageWallpaper ? (
              <div className="settings-wee-field-row mb-3">
                <span className="settings-wee-field-row__label">Wallpaper scope</span>
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <WToggle
                    checked={selectedWallpaperScope === 'perPage'}
                    onChange={(checked) =>
                      onWallpaperScopeChange?.(checked ? 'perPage' : 'space')
                    }
                    disableLabelClick
                    title="Use a different wallpaper per channel page"
                  />
                  <Text variant="small" className="!m-0 text-[hsl(var(--text-secondary))]">
                    {selectedWallpaperScope === 'perPage'
                      ? 'Per page — flip pages to change the backdrop'
                      : 'One wallpaper for this whole space'}
                  </Text>
                </div>
              </div>
            ) : null}

            <WeeRevealWhen when={supportsPerPageWallpaper && selectedWallpaperScope === 'perPage'}>
              <div className="mb-4 rounded-xl border border-[hsl(var(--border-primary)/0.6)] bg-[hsl(var(--surface-secondary)/0.55)] p-3">
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--text-secondary))]">
                  Page {selectedBoardCurrentPage + 1}
                </div>
                <div className="mb-3 text-[13px] text-[hsl(var(--text-secondary))]">
                  Apply the selected library asset (or current desktop wallpaper) to this channel page.
                </div>
                <div className="flex flex-wrap gap-2">
                  <WeeButton
                    type="button"
                    variant="secondary"
                    className="!px-3 !py-2"
                    disabled={!canApplyPageWallpaper}
                    onClick={() => onApplyWallpaperToCurrentPage?.()}
                  >
                    Apply to this page
                  </WeeButton>
                  <WeeButton
                    type="button"
                    variant="secondary"
                    className="!px-3 !py-2"
                    onClick={() => onClearCurrentPageWallpaper?.()}
                  >
                    Clear page wallpaper
                  </WeeButton>
                </div>
                <p className="settings-wee-help !mb-0 mt-3">
                  {selectedPageWallpaperUrl
                    ? 'This page has a custom wallpaper. Clearing falls back to the space / desktop wallpaper.'
                    : 'No page wallpaper yet — falls back to space / desktop wallpaper.'}
                </p>
              </div>
            </WeeRevealWhen>

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

                <WeeRevealWhen when={!selectedSpaceUsesGlobalWallpaper}>
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
                </WeeRevealWhen>
              </>
            ) : (
              <p className="mb-4 text-[13px] leading-relaxed text-[hsl(var(--text-secondary))]">
                Home always uses the active desktop wallpaper from the library above (unless you enable per-page
                wallpapers). Choose a tile and use &quot;Set for Home&quot; — Game Hub and Media Hub can use their own
                overrides in this section when selected.
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
              Softens the wallpaper behind channels and widgets for this space only. 0 = sharp.
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
