import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import Toggle from '../../ui/Toggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import { spacing } from '../../ui/tokens';

const RibbonSettingsTab = React.memo(({ localSettings, updateLocalSetting }) => {
  // Memoize callback functions to prevent unnecessary re-renders
  const handleRibbonColorChange = useCallback((e) => {
    updateLocalSetting('ribbon', 'ribbonColor', e.target.value);
  }, [updateLocalSetting]);

  const handleRibbonGlowChange = useCallback((e) => {
    updateLocalSetting('ribbon', 'ribbonGlow', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleRibbonTransparencyChange = useCallback((e) => {
    updateLocalSetting('ribbon', 'ribbonTransparency', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleGlassOpacityChange = useCallback((e) => {
    updateLocalSetting('ribbon', 'glassOpacity', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleGlassBlurChange = useCallback((e) => {
    updateLocalSetting('ribbon', 'glassBlur', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleGlassBorderChange = useCallback((e) => {
    updateLocalSetting('ribbon', 'glassBorder', Number(e.target.value));
  }, [updateLocalSetting]);

  const handleGlassShineChange = useCallback((checked) => {
    updateLocalSetting('ribbon', 'glassShine', checked);
  }, [updateLocalSetting]);

  return (
    <div>
      {/* Ribbon Styles */}
      <Card
        title="Ribbon Styles"
        separator
        desc="Customize the appearance of the Wii Ribbon including colors and glow effects."
        actions={
          <>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Ribbon Color</label>
                <input
                  type="color"
                  value={localSettings.ribbon?.ribbonColor ?? '#e0e6ef'}
                  onChange={handleRibbonColorChange}
                  style={{
                    width: 50,
                    height: 40,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <Text variant="small" style={{ color: 'hsl(var(--text-secondary))' }}>
                  {(localSettings.ribbon?.ribbonColor ?? '#e0e6ef').toUpperCase()}
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Ribbon Glow</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={localSettings.ribbon?.ribbonGlow ?? 0}
                  onChange={handleRibbonGlowChange}
                  style={{ flex: 1 }}
                />
                <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  {localSettings.ribbon?.ribbonGlow ?? 0}px
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Transparency</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localSettings.ribbon?.ribbonTransparency ?? 0}
                  onChange={handleRibbonTransparencyChange}
                  style={{ flex: 1 }}
                />
                <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  {Math.round((localSettings.ribbon?.ribbonTransparency ?? 0) * 100)}%
                </Text>
              </div>
            </div>
          </>
        }
      />

      {/* Glass Effect */}
      <Card
        title="Glass Effect"
        separator
        desc="Add a modern glass morphism effect to the ribbon with customizable opacity, blur, and border settings."
        actions={
          <>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localSettings.ribbon?.glassOpacity ?? 0.1}
                  onChange={handleGlassOpacityChange}
                  style={{ flex: 1 }}
                />
                <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  {Math.round((localSettings.ribbon?.glassOpacity ?? 0.1) * 100)}%
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Blur</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={localSettings.ribbon?.glassBlur ?? 8}
                  onChange={handleGlassBlurChange}
                  style={{ flex: 1 }}
                />
                <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  {localSettings.ribbon?.glassBlur ?? 8}px
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Border</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localSettings.ribbon?.glassBorder ?? 0.5}
                  onChange={handleGlassBorderChange}
                  style={{ flex: 1 }}
                />
                <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  {localSettings.ribbon?.glassBorder ?? 0.5}px
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Shine Effect</label>
                <Toggle
                  checked={localSettings.ribbon?.glassShine ?? true}
                  onChange={handleGlassShineChange}
                />
              </div>
            </div>
          </>
        }
      />
    </div>
  );
});

RibbonSettingsTab.displayName = 'RibbonSettingsTab';

export default RibbonSettingsTab; 