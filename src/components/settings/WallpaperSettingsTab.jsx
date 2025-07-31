import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import Toggle from '../../ui/Toggle';
import Text from '../../ui/Text';

const WallpaperSettingsTab = React.memo(({ localSettings, updateLocalSetting }) => {
  // Memoize callback functions to prevent unnecessary re-renders
  const handleWallpaperOpacityChange = useCallback((e) => {
    updateLocalSetting('wallpaper', 'wallpaperOpacity', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleWallpaperBlurChange = useCallback((e) => {
    updateLocalSetting('wallpaper', 'wallpaperBlur', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleCyclingChange = useCallback((checked) => {
    updateLocalSetting('wallpaper', 'cycling', checked);
  }, [updateLocalSetting]);

  const handleCycleIntervalChange = useCallback((e) => {
    updateLocalSetting('wallpaper', 'cycleInterval', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleCycleAnimationChange = useCallback((e) => {
    updateLocalSetting('wallpaper', 'cycleAnimation', e.target.value);
  }, [updateLocalSetting]);

  const handleOverlayEnabledChange = useCallback((checked) => {
    updateLocalSetting('wallpaper', 'overlayEnabled', checked);
  }, [updateLocalSetting]);

  const handleOverlayEffectChange = useCallback((e) => {
    updateLocalSetting('wallpaper', 'overlayEffect', e.target.value);
  }, [updateLocalSetting]);

  const handleOverlayIntensityChange = useCallback((e) => {
    updateLocalSetting('wallpaper', 'overlayIntensity', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleOverlaySpeedChange = useCallback((e) => {
    updateLocalSetting('wallpaper', 'overlaySpeed', Number(e.target.value));
  }, [updateLocalSetting]);

  return (
    <div>
      {/* Wallpaper Effects */}
      <Card
        title="Wallpaper Effects"
        separator
        desc="Adjust the transparency and blur of the wallpaper background."
        actions={
          <>
            <div style={{ fontSize: 14, color: 'hsl(var(--text-secondary))', marginTop: 0 }}>
              <strong>Wallpaper Opacity:</strong> Adjust the transparency of the wallpaper background.
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localSettings.wallpaper?.wallpaperOpacity ?? 1}
                onChange={handleWallpaperOpacityChange}
                style={{ flex: 1 }}
              />
              <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{Math.round((localSettings.wallpaper?.wallpaperOpacity ?? 1) * 100)}%</Text>
            </div>
            <Text variant="help" style={{ marginTop: 2 }}>Higher transparency makes the wallpaper more see-through. 0% = fully visible, 100% = fully transparent.</Text>
            
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={localSettings.wallpaper?.wallpaperBlur ?? 0}
                onChange={handleWallpaperBlurChange}
                style={{ flex: 1 }}
              />
              <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{localSettings.wallpaper?.wallpaperBlur ?? 0}px</Text>
            </div>
            <Text variant="help" style={{ marginTop: 2 }}>Higher blur makes the wallpaper more blurry. 0px = no blur, 24px = very blurry.</Text>
          </>
        }
      />

      {/* Wallpaper Cycling */}
      <Card
        title="Enable Wallpaper Cycling"
        separator
        desc="When enabled, your wallpapers will automatically cycle through your liked wallpapers at the interval you set below."
        headerActions={
          <Toggle
            checked={localSettings.wallpaper?.cycling ?? false}
            onChange={handleCyclingChange}
          />
        }
        actions={
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16 }}>
              <span style={{ fontWeight: 500, minWidth: 120 }}>Time per wallpaper</span>
              <input
                type="number"
                min={2}
                max={600}
                value={localSettings.wallpaper?.cycleInterval ?? 30}
                onChange={handleCycleIntervalChange}
                style={{ width: 70, fontSize: 15, padding: '4px 8px', borderRadius: 6, border: '1px solid hsl(var(--border-primary))', marginRight: 8, background: 'hsl(var(--surface-primary))', color: 'hsl(var(--text-primary))' }}
              />
              <Text variant="small" style={{ color: 'hsl(var(--text-secondary))' }}>seconds</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
              <span style={{ fontWeight: 500, minWidth: 120 }}>Animation</span>
              <select
                value={localSettings.wallpaper?.cycleAnimation ?? 'fade'}
                onChange={handleCycleAnimationChange}
                style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid hsl(var(--border-primary))', background: 'hsl(var(--surface-primary))', color: 'hsl(var(--text-primary))' }}
              >
                <option value="fade">Fade - Smooth crossfade between wallpapers</option>
                <option value="slide">Slide - Slide one wallpaper out while sliding the next in</option>
                <option value="zoom">Zoom - Zoom out current wallpaper while zooming in the next</option>
                <option value="ken-burns">Ken Burns - Classic documentary-style pan and zoom effect</option>
                <option value="dissolve">Dissolve - Pixel-based dissolve transition</option>
                <option value="wipe">Wipe - Clean wipe transition in the selected direction</option>
              </select>
            </div>
          </>
        }
      />

      {/* Wallpaper Overlay Effects */}
      <Card
        title="Wallpaper Overlay Effects"
        separator
        desc="Add beautiful animated overlay effects to your wallpaper, like snow, rain, leaves, fireflies, or dust particles."
        headerActions={
          <Toggle
            checked={localSettings.wallpaper?.overlayEnabled ?? false}
            onChange={handleOverlayEnabledChange}
          />
        }
        actions={
          localSettings.wallpaper?.overlayEnabled && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Effect Type</span>
                <select
                  value={localSettings.wallpaper?.overlayEffect ?? 'snow'}
                  onChange={handleOverlayEffectChange}
                  style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid hsl(var(--border-primary))', background: 'hsl(var(--surface-primary))', color: 'hsl(var(--text-primary))' }}
                >
                  <option value="snow">❄️ Snow</option>
                  <option value="rain">🌧️ Rain</option>
                  <option value="leaves">🍃 Leaves</option>
                  <option value="fireflies">✨ Fireflies</option>
                  <option value="dust">💨 Dust</option>
                  <option value="fire">🔥 Fire</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Intensity</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={localSettings.wallpaper?.overlayIntensity ?? 50}
                  onChange={handleOverlayIntensityChange}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{localSettings.wallpaper?.overlayIntensity ?? 50}%</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Speed</span>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.05}
                  value={localSettings.wallpaper?.overlaySpeed ?? 1}
                  onChange={handleOverlaySpeedChange}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{localSettings.wallpaper?.overlaySpeed ?? 1}x</span>
              </div>
            </>
          )
        }
      />
    </div>
  );
});

WallpaperSettingsTab.displayName = 'WallpaperSettingsTab';

export default WallpaperSettingsTab; 