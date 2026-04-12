import React from 'react';
import Card from '../../../ui/Card';
import Button from '../../../ui/WButton';
import Text from '../../../ui/Text';
import WToggle from '../../../ui/WToggle';
import Slider from '../../../ui/Slider';
import WSelect from '../../../ui/WSelect';
import { saveSpotifyGradientToWallpapers } from '../../../utils/presets/spotifyLookRegistry';

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
      <Card
        variant="wii-emphasis"
        color="green"
        icon="🎵"
        title="Spotify Match"
        subtitle="Dynamic Color Matching"
        className="mb-[18px]"
        noHover
      >
        <div className="bg-white/70 rounded-xl p-4 mb-4">
          <div className="mb-3">
            <Text size="sm" color="#2C3E50" className="mb-2 leading-[1.4]">
              When enabled, your ribbon colors, glow effects, and time display adapt to the current track&apos;s album art
              colors (stored in Settings → consolidated state, not polled from disk).
            </Text>
            <Text size="sm" color="#4CAF50" className="italic font-medium mb-3">
              Cohesive visuals that respond to your music.
            </Text>
            <WToggle checked={spotifyMatchEnabled} onChange={onSpotifyMatchToggle} label="Enable Spotify Match" />
          </div>
        </div>

        <div className="bg-white/60 rounded-xl p-4 border-2 border-[#4caf50]/20">
          <div className="mb-3">
            <div className="surface-row mb-1">
              <span className="text-[18px]">🌟</span>
              <Text size="lg" color="#2C3E50" className="font-semibold">
                Immersive Experience
              </Text>
            </div>
            <Text size="sm" color="#5D6D7E" className="leading-[1.4] mb-3">
              Transform your desktop with dynamic colors from the current track
            </Text>
            <WToggle checked={immersiveModeState.enabled || false} onChange={onImmersiveModeToggle} label="Enable Immersive Experience" />
          </div>

          {immersiveModeState.enabled && (
            <div className="mt-4 p-4 bg-white/80 rounded-lg border border-[#4caf50]/30">
              <div className="mb-4">
                <WToggle
                  checked={immersiveModeState.liveGradientWallpaper || false}
                  onChange={onLiveGradientWallpaperToggle}
                  label="Live Gradient Wallpaper"
                />
                <Text size="sm" color="#5D6D7E" className="ml-7 mt-1 leading-[1.4]">
                  Replace your wallpaper with a live gradient that matches the current track&apos;s colors
                </Text>
              </div>

              <div className="mb-4 p-3 bg-[#4caf50]/10 rounded-lg border border-[#4caf50]/20">
                <div className="surface-row mb-2">
                  <span className="text-[16px]">💾</span>
                  <Text size="sm" color="#2C3E50" className="font-semibold">
                    Save Current Look
                  </Text>
                </div>
                <div className="flex flex-wrap gap-2 mb-1.5">
                  <Button variant="primary" size="sm" onClick={handleSaveGradientClick}>
                    Save to Wallpaper Library
                  </Button>
                  <Button variant="secondary" size="sm" onClick={onSaveLookAsPreset}>
                    Save as Named Preset
                  </Button>
                </div>
                <Text size="xs" color="#5D6D7E" className="leading-[1.3]">
                  Wallpaper library saves the gradient image. Named preset freezes the current look (including Spotify colors)
                  so you can reload it without playing music.
                </Text>
              </div>

              {immersiveModeState.liveGradientWallpaper && (
                <div className="mb-4 p-4 bg-[#4caf50]/5 rounded-lg border border-[#4caf50]/15">
                  <div className="surface-row mb-3">
                    <span className="text-[16px]">🎨</span>
                    <Text size="sm" color="#2C3E50" className="font-semibold">
                      Gradient Settings
                    </Text>
                  </div>

                  <div className="mb-3">
                    <WToggle
                      checked={immersiveModeState.overlayMode || false}
                      onChange={(value) => onImmersiveModeSettingChange('overlayMode', value)}
                      label="Overlay on Existing Wallpaper"
                    />
                    <Text size="xs" color="#5D6D7E" className="ml-7 mt-1 leading-[1.3]">
                      When enabled, gradient overlays your current wallpaper instead of replacing it
                    </Text>
                  </div>

                  <div className="mb-3">
                    <Text size="sm" color="#2C3E50" className="mb-1.5 font-medium">
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

                  <div className="mb-3">
                    <Text size="sm" color="#2C3E50" className="mb-1.5 font-medium">
                      Gradient Style
                    </Text>
                    <WSelect
                      value={immersiveModeState.style || 'radial'}
                      onChange={(value) => onImmersiveModeSettingChange('style', value)}
                      options={[
                        { value: 'radial', label: '⭕ Radial (Circular)' },
                        { value: 'linear', label: '📐 Linear (Diagonal)' },
                        { value: 'waves', label: '🌊 Waves (Flowing)' },
                      ]}
                    />
                  </div>

                  <div className="mb-3">
                    <Text size="sm" color="#2C3E50" className="mb-1.5 font-medium">
                      Animation Level: {['Static', 'Subtle', 'Dynamic', 'Intense'][immersiveModeState.animationLevel || 2]}
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
              )}

              <div className="p-3 bg-[#4caf50]/8 rounded-lg border border-[#4caf50]/20">
                <div className="surface-row mb-3">
                  <span className="text-[14px]">✨</span>
                  <Text size="sm" color="#2C3E50" className="font-semibold">
                    Additional Effects
                  </Text>
                </div>

                <div className="mb-3">
                  <WToggle
                    checked={immersiveModeState.ambientLighting || false}
                    onChange={onAmbientLightingToggle}
                    label="Ambient Lighting"
                  />
                  <Text size="xs" color="#5D6D7E" className="ml-7 mt-1 leading-[1.3]">
                    Subtle color tinting and floating particles in the interface
                  </Text>
                </div>

                <div className="mb-3">
                  <WToggle checked={immersiveModeState.pulseEffects || false} onChange={onPulseEffectsToggle} label="Pulse Effects" />
                  <Text size="xs" color="#5D6D7E" className="ml-7 mt-1 leading-[1.3]">
                    Pulses synchronized with playback
                  </Text>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

PresetsSpotifyMatchSection.displayName = 'PresetsSpotifyMatchSection';

export default PresetsSpotifyMatchSection;
