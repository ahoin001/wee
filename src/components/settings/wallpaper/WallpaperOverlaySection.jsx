import React from 'react';
import WSelect from '../../../ui/WSelect';
import Slider from '../../../ui/Slider';
import SettingsWeeSection from '../SettingsWeeSection';
import SettingsToggleFieldCard from '../SettingsToggleFieldCard';
import { OVERLAY_EFFECT_OPTIONS } from './wallpaperSettingsConstants';

function WallpaperOverlaySection({
  overlayEnabled,
  handleOverlayEnabledChange,
  overlayEffect,
  handleOverlayEffectChange,
  overlayIntensity,
  handleOverlayIntensityChange,
  overlaySpeed,
  handleOverlaySpeedChange,
  overlayWind,
  handleOverlayWindChange,
  overlayGravity,
  handleOverlayGravityChange,
}) {
  return (
    <SettingsWeeSection eyebrow="Overlay">
      <SettingsToggleFieldCard
        hoverAccent="discovery"
        title="Particle overlay"
        desc="Optional snow, rain, leaves, fireflies, dust, or fire — drawn above the wallpaper, under the UI."
        checked={overlayEnabled}
        onChange={handleOverlayEnabledChange}
      >
        <div className="flex flex-col gap-3">
          <div className="settings-wee-slider-row items-start">
            <label className="settings-wee-slider-row__label pt-1" htmlFor="wallpaper-overlay-effect">
              Effect
            </label>
            <div className="min-w-0 flex-1">
              <WSelect
                id="wallpaper-overlay-effect"
                options={OVERLAY_EFFECT_OPTIONS}
                value={overlayEffect}
                onChange={handleOverlayEffectChange}
                className="w-full"
              />
            </div>
          </div>
          <div className="settings-wee-slider-row">
            <label className="settings-wee-slider-row__label" htmlFor="wallpaper-overlay-intensity">
              Intensity
            </label>
            <div className="min-w-0 flex-1">
              <Slider
                id="wallpaper-overlay-intensity"
                aria-label="Particle overlay intensity"
                min={10}
                max={100}
                step={5}
                value={overlayIntensity}
                onChange={handleOverlayIntensityChange}
                containerClassName="!mb-0"
                hideValue
              />
            </div>
            <span className="settings-wee-slider-row__value">{overlayIntensity}%</span>
          </div>
          <div className="settings-wee-slider-row">
            <label className="settings-wee-slider-row__label" htmlFor="wallpaper-overlay-speed">
              Speed
            </label>
            <div className="min-w-0 flex-1">
              <Slider
                id="wallpaper-overlay-speed"
                aria-label="Particle overlay speed"
                min={0.1}
                max={3}
                step={0.05}
                value={overlaySpeed}
                onChange={handleOverlaySpeedChange}
                containerClassName="!mb-0"
                hideValue
              />
            </div>
            <span className="settings-wee-slider-row__value">{overlaySpeed}x</span>
          </div>
          <div className="settings-wee-slider-row">
            <label className="settings-wee-slider-row__label" htmlFor="wallpaper-overlay-wind">
              Wind
            </label>
            <div className="min-w-0 flex-1">
              <Slider
                id="wallpaper-overlay-wind"
                aria-label="Particle overlay wind"
                min={-0.1}
                max={0.1}
                step={0.005}
                value={overlayWind}
                onChange={handleOverlayWindChange}
                containerClassName="!mb-0"
                hideValue
              />
            </div>
            <span className="settings-wee-slider-row__value">{overlayWind.toFixed(3)}</span>
          </div>
          <div className="settings-wee-slider-row">
            <label className="settings-wee-slider-row__label" htmlFor="wallpaper-overlay-gravity">
              Gravity
            </label>
            <div className="min-w-0 flex-1">
              <Slider
                id="wallpaper-overlay-gravity"
                aria-label="Particle overlay gravity"
                min={-0.2}
                max={0.5}
                step={0.01}
                value={overlayGravity}
                onChange={handleOverlayGravityChange}
                containerClassName="!mb-0"
                hideValue
              />
            </div>
            <span className="settings-wee-slider-row__value">{overlayGravity.toFixed(2)}</span>
          </div>
          <p className="settings-wee-help !mb-0 mt-1">
            Heavier overlays cost more GPU — lower intensity on laptops or when many channels are visible.
          </p>
        </div>
      </SettingsToggleFieldCard>
    </SettingsWeeSection>
  );
}

export default WallpaperOverlaySection;
