import React from 'react';
import Text from '../../../ui/Text';
import Slider from '../../../ui/Slider';
import { WeeButton, WeeModalFieldCard, WeeSliderValue } from '../../../ui/wee';

/**
 * Look card for the Surfaces studio — opacity + tone sliders for the selected space.
 * Source switching (Home vs space override, per-page pinning) lives in the studio
 * toolbar next to the Space / Scope / Page pickers, keeping this card sliders-only.
 */
function SpaceWallpaperAppearanceSection({
  wallpaperOpacity,
  handleWallpaperOpacityChange,
  selectedSpaceLabel,
  selectedSpaceBlur,
  handleSelectedSpaceBlurChange,
  selectedSpaceBrightness,
  handleSelectedSpaceBrightnessChange,
  selectedSpaceSaturate,
  handleSelectedSpaceSaturateChange,
  handleResetSelectedSpaceAppearance,
  /** Global image opacity only applies where the desktop wallpaper renders (Home). */
  showGlobalOpacity = true,
}) {
  return (
    <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
      <Text variant="h3" className="mb-1 playful-hero-text">
        Wallpaper look
      </Text>
      <Text variant="desc" className="mb-4">
        {showGlobalOpacity
          ? `Opacity, blur, brightness, and saturation for ${selectedSpaceLabel} — live in the scene.`
          : `Blur, brightness, and saturation for ${selectedSpaceLabel} — live in the scene.`}
      </Text>

      {showGlobalOpacity ? (
        <>
          <div className="settings-wee-slider-row">
            <label className="settings-wee-slider-row__label" htmlFor="wallpaper-opacity-range">
              Opacity
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
            <WeeSliderValue
              value={wallpaperOpacity}
              min={0}
              max={1}
              step={0.01}
              onChange={handleWallpaperOpacityChange}
              format={(v) => String(Math.round(v * 100))}
              suffix="%"
              aria-label="Wallpaper opacity value"
            />
          </div>
          <p className="settings-wee-help mb-3 pl-[156px] max-md:pl-0">
            100% = fully opaque image; lower values let the default background show through.
          </p>
        </>
      ) : null}

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
        <WeeSliderValue
          value={selectedSpaceBlur}
          min={0}
          max={24}
          step={0.5}
          onChange={handleSelectedSpaceBlurChange}
          format={(v) => v.toFixed(1)}
          suffix="px"
          aria-label="Wallpaper blur value"
        />
      </div>
      <p className="settings-wee-help mb-3 pl-[156px] max-md:pl-0">
        Softens the wallpaper behind channels and widgets. 0 = sharp.
      </p>

      <div className="settings-wee-slider-row">
        <label
          className="settings-wee-slider-row__label"
          htmlFor="wallpaper-space-brightness-range"
        >
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
        <WeeSliderValue
          value={selectedSpaceBrightness}
          min={0.45}
          max={1.2}
          step={0.01}
          onChange={handleSelectedSpaceBrightnessChange}
          format={(v) => v.toFixed(2)}
          suffix="×"
          aria-label="Wallpaper brightness value"
        />
      </div>
      <p className="settings-wee-help mb-3 pl-[156px] max-md:pl-0">
        1.00 = unchanged. Lower values dim the wallpaper and improve card readability.
      </p>

      <div className="settings-wee-slider-row">
        <label
          className="settings-wee-slider-row__label"
          htmlFor="wallpaper-space-saturate-range"
        >
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
        <WeeSliderValue
          value={selectedSpaceSaturate}
          min={0}
          max={1.5}
          step={0.02}
          onChange={handleSelectedSpaceSaturateChange}
          format={(v) => v.toFixed(2)}
          suffix="×"
          aria-label="Wallpaper saturation value"
        />
      </div>
      <p className="settings-wee-help !mb-0 pl-[156px] max-md:pl-0">
        1.00 = natural color; lower approaches grayscale; above 1 boosts vividness.
      </p>

      <div className="mt-5 flex justify-end border-t border-[hsl(var(--border-primary)/0.35)] pt-4">
        <WeeButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleResetSelectedSpaceAppearance}
          title={`Reset ${selectedSpaceLabel} wallpaper look and source to defaults`}
        >
          Reset {selectedSpaceLabel}
        </WeeButton>
      </div>
    </WeeModalFieldCard>
  );
}

export default SpaceWallpaperAppearanceSection;
