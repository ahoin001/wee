import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import '../surfaceStyles.css';

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
    <div className="surface-stack">
      <Text variant="h2" className="surface-title">
        Ribbon Appearance Settings
      </Text>
      
      <Text variant="body" className="surface-subtitle">
        Customize the appearance of the Wii Ribbon including colors, glow effects, and glass morphism.
      </Text>

      {/* Ribbon Colors and Effects */}
      <Card>
        <div className="surface-card-body">
          <Text variant="h3" className="surface-subtitle">
            Ribbon Colors & Effects
          </Text>
          <div className="surface-controls">
            <div className="surface-row">
              <Text variant="body" className="surface-color-label-sm">
                Ribbon Color
              </Text>
              <input
                type="color"
                value={ribbon?.ribbonColor ?? '#e0e6ef'}
                onChange={handleRibbonColorChange}
                className="surface-color-input"
              />
              <Text variant="caption" className="surface-caption !mt-0">
                {(ribbon?.ribbonColor ?? '#e0e6ef').toUpperCase()}
              </Text>
            </div>
            
            <div className="surface-row">
              <Text variant="body" className="surface-color-label-sm">
                Ribbon Glow Color
              </Text>
              <input
                type="color"
                value={ribbon?.ribbonGlowColor ?? '#0099ff'}
                onChange={handleRibbonGlowColorChange}
                className="surface-color-input"
              />
              <Text variant="caption" className="surface-caption !mt-0">
                {(ribbon?.ribbonGlowColor ?? '#0099ff').toUpperCase()}
              </Text>
            </div>
            
            <div>
              <Text variant="body" className="text-secondary mb-2">
                Glow Strength
              </Text>
              <Slider
                value={ribbon?.ribbonGlowStrength ?? 20}
                min={0}
                max={50}
                step={1}
                onChange={handleRibbonGlowStrengthChange}
              />
              <Text variant="caption" className="surface-caption">
                {ribbon?.ribbonGlowStrength ?? 20}px
              </Text>
            </div>
            
            <div>
              <Text variant="body" className="text-secondary mb-2">
                Glow Strength on Hover
              </Text>
              <Slider
                value={ribbon?.ribbonGlowStrengthHover ?? 28}
                min={0}
                max={96}
                step={1}
                onChange={handleRibbonGlowStrengthHoverChange}
              />
              <Text variant="caption" className="surface-caption">
                {ribbon?.ribbonGlowStrengthHover ?? 28}px
              </Text>
            </div>
            
            <div>
              <Text variant="body" className="text-secondary mb-2">
                Dock Opacity
              </Text>
              <Slider
                value={ribbon?.ribbonDockOpacity ?? 1}
                min={0.1}
                max={1}
                step={0.1}
                onChange={handleRibbonDockOpacityChange}
              />
              <Text variant="caption" className="surface-caption">
                {Math.round((ribbon?.ribbonDockOpacity ?? 1) * 100)}%
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Glass Effect */}
      <Card>
        <div className="surface-card-body">
          <div className="surface-row-between mb-4">
            <div>
              <Text variant="h3" className="surface-title">
                Glass Effect
              </Text>
              <Text variant="body" className="text-secondary">
                Add a modern glass morphism effect to the ribbon.
              </Text>
            </div>
            <WToggle
              checked={ribbon?.glassWiiRibbon ?? false}
              onChange={handleGlassWiiRibbonChange}
            />
          </div>
          
          {ribbon?.glassWiiRibbon && (
            <div className="surface-controls">
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Glass Opacity
                </Text>
                <Slider
                  value={ribbon?.glassOpacity ?? 0.18}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  onChange={handleGlassOpacityChange}
                />
                <Text variant="caption" className="surface-caption">
                  {Math.round((ribbon?.glassOpacity ?? 0.18) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Glass Blur
                </Text>
                <Slider
                  value={ribbon?.glassBlur ?? 2.5}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onChange={handleGlassBlurChange}
                />
                <Text variant="caption" className="surface-caption">
                  {ribbon?.glassBlur ?? 2.5}px
                </Text>
              </div>
              
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Border Opacity
                </Text>
                <Slider
                  value={ribbon?.glassBorderOpacity ?? 0.5}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassBorderOpacityChange}
                />
                <Text variant="caption" className="surface-caption">
                  {Math.round((ribbon?.glassBorderOpacity ?? 0.5) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Shine Opacity
                </Text>
                <Slider
                  value={ribbon?.glassShineOpacity ?? 0.7}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassShineOpacityChange}
                />
                <Text variant="caption" className="surface-caption">
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