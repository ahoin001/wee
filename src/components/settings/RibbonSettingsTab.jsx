import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import { spacing } from '../../ui/tokens';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const RibbonSettingsTab = React.memo(() => {
  // Use consolidated store for ribbon settings
  const { ribbon } = useConsolidatedAppStore();
  const { setRibbonState } = useConsolidatedAppStore(state => state.actions);
  
  // Memoize callback functions to prevent unnecessary re-renders
  const handleRibbonColorChange = useCallback((e) => {
    setRibbonState({ ribbonColor: e.target.value });
  }, [setRibbonState]);

  const handleRibbonGlowColorChange = useCallback((e) => {
    setRibbonState({ ribbonGlowColor: e.target.value });
  }, [setRibbonState]);

  const handleRibbonGlowStrengthChange = useCallback((value) => {
    setRibbonState({ ribbonGlowStrength: value });
  }, [setRibbonState]);

  const handleRibbonGlowStrengthHoverChange = useCallback((value) => {
    setRibbonState({ ribbonGlowStrengthHover: value });
  }, [setRibbonState]);

  const handleRibbonDockOpacityChange = useCallback((value) => {
    setRibbonState({ ribbonDockOpacity: value });
  }, [setRibbonState]);

  const handleGlassWiiRibbonChange = useCallback((checked) => {
    setRibbonState({ glassWiiRibbon: checked });
  }, [setRibbonState]);

  const handleGlassOpacityChange = useCallback((value) => {
    setRibbonState({ glassOpacity: value });
  }, [setRibbonState]);

  const handleGlassBlurChange = useCallback((value) => {
    setRibbonState({ glassBlur: value });
  }, [setRibbonState]);

  const handleGlassBorderOpacityChange = useCallback((value) => {
    setRibbonState({ glassBorderOpacity: value });
  }, [setRibbonState]);

  const handleGlassShineOpacityChange = useCallback((value) => {
    setRibbonState({ glassShineOpacity: value });
  }, [setRibbonState]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Text variant="h2" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
        Ribbon Appearance Settings
      </Text>
      
      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
        Customize the appearance of the Wii Ribbon including colors, glow effects, and glass morphism.
      </Text>

      {/* Ribbon Colors and Effects */}
      <Card>
        <div style={{ padding: '20px' }}>
          <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
            Ribbon Colors & Effects
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '120px' }}>
                Ribbon Color
              </Text>
              <input
                type="color"
                value={ribbon?.ribbonColor ?? '#e0e6ef'}
                onChange={handleRibbonColorChange}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(ribbon?.ribbonColor ?? '#e0e6ef').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '120px' }}>
                Ribbon Glow Color
              </Text>
              <input
                type="color"
                value={ribbon?.ribbonGlowColor ?? '#0099ff'}
                onChange={handleRibbonGlowColorChange}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(ribbon?.ribbonGlowColor ?? '#0099ff').toUpperCase()}
              </Text>
            </div>
            
            <div>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                Glow Strength
              </Text>
              <Slider
                value={ribbon?.ribbonGlowStrength ?? 20}
                min={0}
                max={50}
                step={1}
                onChange={handleRibbonGlowStrengthChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {ribbon?.ribbonGlowStrength ?? 20}px
              </Text>
            </div>
            
            <div>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                Glow Strength on Hover
              </Text>
              <Slider
                value={ribbon?.ribbonGlowStrengthHover ?? 28}
                min={0}
                max={96}
                step={1}
                onChange={handleRibbonGlowStrengthHoverChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {ribbon?.ribbonGlowStrengthHover ?? 28}px
              </Text>
            </div>
            
            <div>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                Dock Opacity
              </Text>
              <Slider
                value={ribbon?.ribbonDockOpacity ?? 1}
                min={0.1}
                max={1}
                step={0.1}
                onChange={handleRibbonDockOpacityChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {Math.round((ribbon?.ribbonDockOpacity ?? 1) * 100)}%
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Glass Effect */}
      <Card>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                Glass Effect
              </Text>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))' }}>
                Add a modern glass morphism effect to the ribbon.
              </Text>
            </div>
            <WToggle
              checked={ribbon?.glassWiiRibbon ?? false}
              onChange={handleGlassWiiRibbonChange}
            />
          </div>
          
          {ribbon?.glassWiiRibbon && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Glass Opacity
                </Text>
                <Slider
                  value={ribbon?.glassOpacity ?? 0.18}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  onChange={handleGlassOpacityChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {Math.round((ribbon?.glassOpacity ?? 0.18) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Glass Blur
                </Text>
                <Slider
                  value={ribbon?.glassBlur ?? 2.5}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onChange={handleGlassBlurChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {ribbon?.glassBlur ?? 2.5}px
                </Text>
              </div>
              
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Border Opacity
                </Text>
                <Slider
                  value={ribbon?.glassBorderOpacity ?? 0.5}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassBorderOpacityChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {Math.round((ribbon?.glassBorderOpacity ?? 0.5) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Shine Opacity
                </Text>
                <Slider
                  value={ribbon?.glassShineOpacity ?? 0.7}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassShineOpacityChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {Math.round((ribbon?.glassShineOpacity ?? 0.7) * 100)}%
                </Text>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

RibbonSettingsTab.displayName = 'RibbonSettingsTab';

export default RibbonSettingsTab; 