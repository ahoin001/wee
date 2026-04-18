import React from 'react';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WToggle from '../../../ui/WToggle';
import Slider from '../../../ui/Slider';
import WSelect from '../../../ui/WSelect';
import { saveSpotifyGradientToWallpapers } from '../../../utils/presets/spotifyLookRegistry';

const PANEL =
  'rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.65)] p-4';
const PANEL_ACCENT =
  'rounded-2xl border border-[hsl(var(--state-success)/0.28)] bg-[hsl(var(--state-success-light)/0.35)] p-4';

function handleSaveGradientClick() {
  saveSpotifyGradientToWallpapers().catch((err) => {
    alert(err?.message || 'Could not save gradient. Enable live gradient and wait for album colors.');
  });
}

const PresetsSpotifyMatchSection = React.memo(
  ({
    show,
    spotifyMatchEnabled,
    onSpotifyMatchToggle,
    immersiveModeState,
    onImmersiveModeToggle,
    onLiveGradientWallpaperToggle,
    onAmbientLightingToggle,
    onPulseEffectsToggle,
    onImmersiveModeSettingChange,
    onSaveLookAsPreset,
  }) => {
    if (!show) return null;

    return (
      <div className="space-y-4">
        <div className={PANEL}>
          <Text variant="caption" className="!mb-3 !mt-0 block leading-relaxed text-[hsl(var(--text-secondary))]">
            When enabled, ribbon colors, glow, and time display follow the current track&apos;s album art colors (stored
            in consolidated settings).
          </Text>
          <Text variant="caption" className="!mb-3 block font-semibold italic text-[hsl(var(--state-success))]">
            Cohesive visuals that respond to your music.
          </Text>
          <WToggle checked={spotifyMatchEnabled} onChange={onSpotifyMatchToggle} label="Enable Spotify Match" />
        </div>

        <div className={PANEL_ACCENT}>
          <div className="surface-row mb-2">
            <span className="text-[18px]" aria-hidden>
              🌟
            </span>
            <Text variant="body" className="font-semibold text-[hsl(var(--text-primary))]">
              Immersive experience
            </Text>
          </div>
          <Text variant="caption" className="!mb-3 !mt-0 block text-[hsl(var(--text-tertiary))]">
            Transform the desktop with colors from the current track.
          </Text>
          <WToggle
            checked={immersiveModeState.enabled || false}
            onChange={onImmersiveModeToggle}
            label="Enable immersive experience"
          />

          {immersiveModeState.enabled ? (
            <div className="mt-4 space-y-4 border-t border-[hsl(var(--border-primary)/0.3)] pt-4">
              <div>
                <WToggle
                  checked={immersiveModeState.liveGradientWallpaper || false}
                  onChange={onLiveGradientWallpaperToggle}
                  label="Live gradient wallpaper"
                />
                <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
                  Replace wallpaper with a live gradient matched to the track.
                </Text>
              </div>

              <div className={`${PANEL} space-y-3`}>
                <div className="surface-row mb-1">
                  <span className="text-[16px]" aria-hidden>
                    💾
                  </span>
                  <Text variant="body" className="font-semibold text-[hsl(var(--text-primary))]">
                    Save current look
                  </Text>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" onClick={handleSaveGradientClick}>
                    Save to wallpaper library
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onSaveLookAsPreset}>
                    Save as named preset
                  </Button>
                </div>
                <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                  Library stores the gradient image. Named preset freezes the look so you can reload it without playback.
                </Text>
              </div>

              {immersiveModeState.liveGradientWallpaper ? (
                <div className={`${PANEL} space-y-3`}>
                  <div className="surface-row mb-1">
                    <span className="text-[16px]" aria-hidden>
                      🎨
                    </span>
                    <Text variant="body" className="font-semibold text-[hsl(var(--text-primary))]">
                      Gradient settings
                    </Text>
                  </div>

                  <div>
                    <WToggle
                      checked={immersiveModeState.overlayMode || false}
                      onChange={(value) => onImmersiveModeSettingChange('overlayMode', value)}
                      label="Overlay on existing wallpaper"
                    />
                    <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
                      Gradient overlays your current wallpaper instead of replacing it.
                    </Text>
                  </div>

                  <div>
                    <Text variant="body" className="mb-2 font-medium text-[hsl(var(--text-primary))]">
                      Intensity: {Math.round((immersiveModeState.intensity || 0.7) * 100)}%
                    </Text>
                    <Slider
                      value={immersiveModeState.intensity || 0.7}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      onChange={(value) => onImmersiveModeSettingChange('intensity', value)}
                    />
                  </div>

                  <div>
                    <Text variant="body" className="mb-2 font-medium text-[hsl(var(--text-primary))]">
                      Gradient style
                    </Text>
                    <WSelect
                      value={immersiveModeState.style || 'radial'}
                      onChange={(value) => onImmersiveModeSettingChange('style', value)}
                      options={[
                        { value: 'radial', label: 'Radial (circular)' },
                        { value: 'linear', label: 'Linear (diagonal)' },
                        { value: 'waves', label: 'Waves (flowing)' },
                      ]}
                    />
                  </div>

                  <div>
                    <Text variant="body" className="mb-2 font-medium text-[hsl(var(--text-primary))]">
                      Animation: {['Static', 'Subtle', 'Dynamic', 'Intense'][immersiveModeState.animationLevel || 2]}
                    </Text>
                    <Slider
                      value={immersiveModeState.animationLevel || 2}
                      min={0}
                      max={3}
                      step={1}
                      onChange={(value) => onImmersiveModeSettingChange('animationLevel', value)}
                    />
                  </div>
                </div>
              ) : null}

              <div className={`${PANEL} space-y-3`}>
                <div className="surface-row mb-1">
                  <span className="text-[14px]" aria-hidden>
                    ✨
                  </span>
                  <Text variant="body" className="font-semibold text-[hsl(var(--text-primary))]">
                    Additional effects
                  </Text>
                </div>

                <div>
                  <WToggle
                    checked={immersiveModeState.ambientLighting || false}
                    onChange={onAmbientLightingToggle}
                    label="Ambient lighting"
                  />
                  <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
                    Subtle tinting and particles in the interface.
                  </Text>
                </div>

                <div>
                  <WToggle
                    checked={immersiveModeState.pulseEffects || false}
                    onChange={onPulseEffectsToggle}
                    label="Pulse effects"
                  />
                  <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
                    Pulses synchronized with playback.
                  </Text>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

PresetsSpotifyMatchSection.displayName = 'PresetsSpotifyMatchSection';

export default PresetsSpotifyMatchSection;
