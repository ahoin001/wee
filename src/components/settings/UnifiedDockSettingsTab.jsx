import React, { useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WSelect from '../../ui/WSelect';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { findDockThemePath, getDockThemeByPath } from '../../utils/dockThemeUtils';
import { CLASSIC_DOCK_THEME_GROUPS as THEME_GROUPS } from '../../data/dock/classicDockThemeGroups';
import { CLASSIC_DOCK_DEFAULT_COLORS as DOCK_DEFAULT } from '../../design/classicDockThemeDefaults.js';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
} from '../../design/runtimeColorStrings.js';
import '../surfaceStyles.css';

// Add CSS for pulse animation
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Sub-tab configuration
const SUB_TABS = [
  {
    id: 'dock-type',
    label: 'Dock Type',
    icon: '⚓',
    description: 'Choose between Classic and Ribbon docks'
  },
  {
    id: 'classic-dock',
    label: 'Classic Dock',
    icon: '🎮',
    description: 'Customize the Classic Wii Dock appearance'
  },
  {
    id: 'wii-ribbon',
    label: 'Wii Ribbon',
    icon: '🎗️',
    description: 'Customize the Wii Ribbon appearance'
  },
  {
    id: 'animations',
    label: 'Animations',
    icon: '✨',
    description: 'Particle effects and shared animations'
  }
];

const ColorSettingRow = ({ label, value, fallback, onChange }) => {
  const resolvedValue = value ?? fallback;
  return (
    <div className="surface-row">
      <Text variant="body" className="surface-color-label">
        {label}
      </Text>
      <input
        type="color"
        value={resolvedValue}
        onChange={(e) => onChange(e.target.value)}
        className="surface-color-input"
      />
      <Text variant="caption" className="surface-caption !mt-0">
        {resolvedValue.toUpperCase()}
      </Text>
    </div>
  );
};

const UnifiedDockSettingsTab = React.memo(() => {
  // Use consolidated store for better performance and consistency
  const { dock, ribbon, ui } = useConsolidatedAppStore(
    useShallow((state) => ({
      dock: state.dock,
      ribbon: state.ribbon,
      ui: state.ui,
    }))
  );
  const { setDockState, setRibbonState, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setDockState: state.actions.setDockState,
      setRibbonState: state.actions.setRibbonState,
      setUIState: state.actions.setUIState,
    }))
  );
  
  // Utility function to save settings to new architecture
  const saveSetting = useCallback(async (category, key, value) => {
    try {
      // Update consolidated store
      if (category === 'dock') {
        setDockState({ [key]: value });
      } else if (category === 'ribbon') {
        setRibbonState({ [key]: value });
      } else if (category === 'ui') {
        setUIState({ [key]: value });
      }
    } catch (error) {
      console.error(`[UnifiedDockSettingsTab] Failed to save ${category}.${key} setting:`, error);
    }
  }, [setDockState, setRibbonState, setUIState]);
  
  // Local state for sub-tabs and expanded groups
  const [activeSubTab, setActiveSubTab] = useState(() => {
    // Use dockSubTab from UI state if available, otherwise fall back to dock mode
    if (ui?.dockSubTab) {
      return ui.dockSubTab;
    }
    // Automatically set the appropriate sub-tab based on current dock mode
    const fallbackTab = ui?.classicMode ? 'classic-dock' : 'wii-ribbon';
    return fallbackTab;
  });
  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    games: false
  });

  // Clear dockSubTab after component mounts to allow manual tab switching
  React.useEffect(() => {
    if (ui?.dockSubTab) {
      // Clear the dockSubTab after a short delay to allow the initial tab to be set
      const timer = setTimeout(() => {
        saveSetting('ui', 'dockSubTab', undefined);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [ui?.dockSubTab, saveSetting]);

  // Dock type selection
  const handleDockTypeChange = useCallback((dockType) => {
    saveSetting('ui', 'classicMode', dockType === 'classic');
  }, [saveSetting]);

  // Classic Dock handlers
  const applyTheme = useCallback((themePath) => {
    const theme = getDockThemeByPath(THEME_GROUPS, themePath);
    if (theme) {
      // Update consolidated store with theme colors
      setDockState(theme.colors);
      
      // Save all theme colors to backend
      Object.entries(theme.colors).forEach(([key, value]) => {
        saveSetting('dock', key, value);
      });
    }
  }, [saveSetting, setDockState]);

  const getCurrentTheme = useCallback(() => {
    return findDockThemePath(THEME_GROUPS, {
      dockBaseGradientStart: dock?.dockBaseGradientStart,
      dockBaseGradientEnd: dock?.dockBaseGradientEnd,
      dockAccentColor: dock?.dockAccentColor,
      sdCardBodyColor: dock?.sdCardBodyColor,
      sdCardBorderColor: dock?.sdCardBorderColor,
      sdCardLabelColor: dock?.sdCardLabelColor,
      sdCardLabelBorderColor: dock?.sdCardLabelBorderColor,
      sdCardBottomColor: dock?.sdCardBottomColor,
      leftPodBaseColor: dock?.leftPodBaseColor,
      leftPodAccentColor: dock?.leftPodAccentColor,
      leftPodDetailColor: dock?.leftPodDetailColor,
      rightPodBaseColor: dock?.rightPodBaseColor,
      rightPodAccentColor: dock?.rightPodAccentColor,
      rightPodDetailColor: dock?.rightPodDetailColor,
      buttonBorderColor: dock?.buttonBorderColor,
      buttonGradientStart: dock?.buttonGradientStart,
      buttonGradientEnd: dock?.buttonGradientEnd,
      buttonIconColor: dock?.buttonIconColor,
      rightButtonIconColor: dock?.rightButtonIconColor,
      buttonHighlightColor: dock?.buttonHighlightColor,
    });
  }, [dock]);

  const handleColorChange = useCallback((key, value) => {
    setDockState({ [key]: value });
    saveSetting('dock', key, value);
  }, [saveSetting, setDockState]);

  // Ribbon handlers
  const handleRibbonColorChange = useCallback((e) => {
    setRibbonState({ ribbonColor: e.target.value });
    saveSetting('ribbon', 'ribbonColor', e.target.value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonGlowColorChange = useCallback((e) => {
    setRibbonState({ ribbonGlowColor: e.target.value });
    saveSetting('ribbon', 'ribbonGlowColor', e.target.value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonGlowStrengthChange = useCallback((value) => {
    setRibbonState({ ribbonGlowStrength: value });
    saveSetting('ribbon', 'ribbonGlowStrength', value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonGlowStrengthHoverChange = useCallback((value) => {
    setRibbonState({ ribbonGlowStrengthHover: value });
    saveSetting('ribbon', 'ribbonGlowStrengthHover', value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonDockOpacityChange = useCallback((value) => {
    setRibbonState({ ribbonDockOpacity: value });
    saveSetting('ribbon', 'ribbonDockOpacity', value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonHoverAnimationChange = useCallback((checked) => {
    setRibbonState({ ribbonHoverAnimationEnabled: checked });
    saveSetting('ribbon', 'ribbonHoverAnimationEnabled', checked);
  }, [saveSetting, setRibbonState]);

  const handleGlassWiiRibbonChange = useCallback((checked) => {
    setRibbonState({ glassWiiRibbon: checked });
    saveSetting('ribbon', 'glassWiiRibbon', checked);
  }, [saveSetting, setRibbonState]);

  const handleGlassOpacityChange = useCallback((value) => {
    setRibbonState({ glassOpacity: value });
    saveSetting('ribbon', 'glassOpacity', value);
  }, [saveSetting, setRibbonState]);

  const handleGlassBlurChange = useCallback((value) => {
    setRibbonState({ glassBlur: value });
    saveSetting('ribbon', 'glassBlur', value);
  }, [saveSetting, setRibbonState]);

  const handleGlassBorderOpacityChange = useCallback((value) => {
    setRibbonState({ glassBorderOpacity: value });
    saveSetting('ribbon', 'glassBorderOpacity', value);
  }, [saveSetting, setRibbonState]);

  const handleGlassShineOpacityChange = useCallback((value) => {
    setRibbonState({ glassShineOpacity: value });
    saveSetting('ribbon', 'glassShineOpacity', value);
  }, [saveSetting, setRibbonState]);

  // Animation handlers
  const handleParticleEnabledChange = useCallback((checked) => {
    setDockState({ particleSystemEnabled: checked });
    saveSetting('dock', 'particleSystemEnabled', checked);
  }, [saveSetting, setDockState]);

  const handleParticleEffectTypeChange = useCallback((value) => {
    setDockState({ particleEffectType: value });
    saveSetting('dock', 'particleEffectType', value);
  }, [saveSetting, setDockState]);

  const handleParticleDirectionChange = useCallback((value) => {
    setDockState({ particleDirection: value });
    saveSetting('dock', 'particleDirection', value);
  }, [saveSetting, setDockState]);

  const handleParticleCountChange = useCallback((value) => {
    setDockState({ particleCount: value });
    saveSetting('dock', 'particleCount', value);
  }, [saveSetting, setDockState]);

  const handleParticleSpeedChange = useCallback((value) => {
    setDockState({ particleSpeed: value });
    saveSetting('dock', 'particleSpeed', value);
  }, [saveSetting, setDockState]);

  const handleParticleSizeChange = useCallback((value) => {
    setDockState({ particleSize: value });
    saveSetting('dock', 'particleSize', value);
  }, [saveSetting, setDockState]);

  const handleParticleGravityChange = useCallback((value) => {
    setDockState({ particleGravity: value });
    saveSetting('dock', 'particleGravity', value);
  }, [saveSetting, setDockState]);

  const handleParticleFadeSpeedChange = useCallback((value) => {
    setDockState({ particleFadeSpeed: value });
    saveSetting('dock', 'particleFadeSpeed', value);
  }, [saveSetting, setDockState]);

  const handleParticleUseAdaptiveColorChange = useCallback((checked) => {
    setDockState({ particleUseAdaptiveColor: checked });
    saveSetting('dock', 'particleUseAdaptiveColor', checked);
  }, [saveSetting, setDockState]);

  const handleParticleColorIntensityChange = useCallback((value) => {
    setDockState({ particleColorIntensity: value });
    saveSetting('dock', 'particleColorIntensity', value);
  }, [saveSetting, setDockState]);

  const handleParticleColorVariationChange = useCallback((value) => {
    setDockState({ particleColorVariation: value });
    saveSetting('dock', 'particleColorVariation', value);
  }, [saveSetting, setDockState]);

  const handleParticleRotationSpeedChange = useCallback((value) => {
    setDockState({ particleRotationSpeed: value });
    saveSetting('dock', 'particleRotationSpeed', value);
  }, [saveSetting, setDockState]);

  const handleParticleLifetimeChange = useCallback((value) => {
    setDockState({ particleLifetime: value });
    saveSetting('dock', 'particleLifetime', value);
  }, [saveSetting, setDockState]);

  const handleParticleClipPathFollowChange = useCallback((checked) => {
    setDockState({ particleClipPathFollow: checked });
    saveSetting('dock', 'particleClipPathFollow', checked);
  }, [saveSetting, setDockState]);

  // Render sub-tab content
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'dock-type':
        return (
          <div className="surface-stack">
            <Text variant="h3" className="surface-card-title">
              Choose Your Dock Type
            </Text>
            <Text variant="body" className="text-secondary mb-6">
              Select between the Classic Wii Dock or the modern Wii Ribbon. Each has its own customization options.
            </Text>
            
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
              {/* Classic Dock Option */}
              <Card>
                <div className="surface-card-section text-center">
                  <div className="text-[48px] mb-4">🎮</div>
                  <Text variant="h4" className="surface-title">
                    Classic Wii Dock
                  </Text>
                  <Text variant="body" className="surface-card-description">
                    Authentic Wii-style dock with SD card slot and button pods. Perfect for nostalgia and classic gaming themes.
                  </Text>
                  <WButton
                    variant={ui.classicMode ? 'primary' : 'secondary'}
                    onClick={() => handleDockTypeChange('classic')}
                    className="w-full"
                  >
                    {ui.classicMode ? '✓ Selected' : 'Select Classic Dock'}
                  </WButton>
                </div>
              </Card>

              {/* Wii Ribbon Option */}
              <Card>
                <div className="surface-card-section text-center">
                  <div className="text-[48px] mb-4">🎗️</div>
                  <Text variant="h4" className="surface-title">
                    Wii Ribbon
                  </Text>
                  <Text variant="body" className="surface-card-description">
                    Modern ribbon-style dock with glass effects and customizable buttons. Great for contemporary themes.
                  </Text>
                  <WButton
                    variant={!ui.classicMode ? 'primary' : 'secondary'}
                    onClick={() => handleDockTypeChange('ribbon')}
                    className="w-full"
                  >
                    {!ui.classicMode ? '✓ Selected' : 'Select Wii Ribbon'}
                  </WButton>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'classic-dock':
        return (
          <div className="surface-stack">
            <Text variant="h3" className="surface-card-title">
              Classic Dock Customization
            </Text>
            <Text variant="body" className="surface-card-description">
              Customize the appearance of the Classic Wii Dock including colors, themes, glass effects, and sizing.
            </Text>

            {/* Preset Themes */}
            <Card>
              <div className="surface-card-section">
                <Text variant="h4" className="surface-card-title">
                  Preset Themes
                </Text>
                <Text variant="body" className="surface-card-description">
                  Choose from pre-made themes or customize your own.
                </Text>
                
                {Object.entries(THEME_GROUPS).map(([groupKey, group]) => (
                  <div key={groupKey} className="mb-5">
                    <div
                      className="surface-theme-header"
                      onClick={() => setExpandedGroups(prev => ({
                        ...prev,
                        [groupKey]: !prev[groupKey]
                      }))}
                    >
                      <div>
                        <Text variant="h5" className="text-primary mb-1">
                          {group.name}
                        </Text>
                        <Text variant="caption" className="text-secondary">
                          {group.description}
                        </Text>
                      </div>
                      <div className={`surface-theme-chevron ${expandedGroups[groupKey] ? 'surface-theme-chevron-open' : 'surface-theme-chevron-closed'}`}>
                        ▼
                      </div>
                    </div>
                    
                    {expandedGroups[groupKey] && (
                      <div className="surface-theme-grid">
                        {Object.entries(group.themes).map(([themeKey, theme]) => {
                          const themePath = `${groupKey}.${themeKey}`;
                          const isSelected = getCurrentTheme() === themePath;
                          
                          return (
                            <button
                              key={themeKey}
                              onClick={() => applyTheme(themePath)}
                              className={`surface-theme-button ${isSelected ? 'surface-theme-button-selected' : 'surface-theme-button-unselected'}`}
                            >
                              <Text variant="body" className="font-semibold text-primary">
                                {theme.name}
                              </Text>
                              <Text variant="caption" className="text-secondary">
                                {theme.description}
                              </Text>
                              <div className="surface-color-swatches">
                                <div className="surface-color-dot" style={{ background: theme.colors.dockBaseGradientStart }} />
                                <div className="surface-color-dot" style={{ background: theme.colors.dockAccentColor }} />
                                <div className="surface-color-dot" style={{ background: theme.colors.buttonGradientStart }} />
                                <div className="surface-color-dot" style={{ background: theme.colors.buttonIconColor }} />
                              </div>
                              {isSelected && (
                                <div className="surface-selected-check">
                                  ✓
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Dock Base Colors */}
            <Card>
              <div className="surface-card-section">
                <Text variant="h4" className="surface-card-title">
                  Dock Base Colors
                </Text>
                <Text variant="body" className="surface-card-description">
                  Customize the main dock structure colors.
                </Text>
                
                <div className="surface-controls">
                  <ColorSettingRow
                    label="Gradient Start"
                    value={dock?.dockBaseGradientStart}
                    fallback={DOCK_DEFAULT.dockBaseGradientStart}
                    onChange={(next) => handleColorChange('dockBaseGradientStart', next)}
                  />
                  <ColorSettingRow
                    label="Gradient End"
                    value={dock?.dockBaseGradientEnd}
                    fallback={DOCK_DEFAULT.dockBaseGradientEnd}
                    onChange={(next) => handleColorChange('dockBaseGradientEnd', next)}
                  />
                  <ColorSettingRow
                    label="Accent Color"
                    value={dock?.dockAccentColor}
                    fallback={DOCK_DEFAULT.dockAccentColor}
                    onChange={(next) => handleColorChange('dockAccentColor', next)}
                  />
                </div>
              </div>
            </Card>

            {/* Glass Effect */}
            <Card>
              <div className="surface-card-section">
                <div className="surface-row-between mb-4">
                  <div>
                    <Text variant="h4" className="surface-title">
                      Glass Effect
                    </Text>
                    <Text variant="body" className="text-secondary">
                      Apply a glass morphism effect to the dock.
                    </Text>
                  </div>
                  <WToggle
                    checked={dock?.glassEnabled ?? false}
                    onChange={(checked) => {
                      setDockState({ glassEnabled: checked });
                      saveSetting('dock', 'glassEnabled', checked);
                    }}
                  />
                </div>
                
                {dock?.glassEnabled && (
                  <div className="surface-controls">
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Glass Opacity
                      </Text>
                      <Slider
                        value={dock?.glassOpacity ?? 0.18}
                        min={0.05}
                        max={0.5}
                        step={0.01}
                        onChange={(value) => {
                          setDockState({ glassOpacity: value });
                          saveSetting('dock', 'glassOpacity', value);
                        }}
                      />
                      <Text variant="caption" className="surface-caption">
                        {Math.round((dock?.glassOpacity ?? 0.18) * 100)}%
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Glass Blur
                      </Text>
                      <Slider
                        value={dock?.glassBlur ?? 2.5}
                        min={0.5}
                        max={8}
                        step={0.1}
                        onChange={(value) => {
                          setDockState({ glassBlur: value });
                          saveSetting('dock', 'glassBlur', value);
                        }}
                      />
                      <Text variant="caption" className="surface-caption">
                        {dock?.glassBlur ?? 2.5}px
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'wii-ribbon':
        return (
          <div className="surface-stack">
            <Text variant="h3" className="surface-card-title">
              Ribbon Appearance Settings
            </Text>
            <Text variant="body" className="surface-card-description">
              Configure style mode, glow, and hover behavior with controls that match live ribbon behavior.
            </Text>

            <Card>
              <div className="surface-card-section">
                <div className="surface-row-between mb-4">
                  <div>
                    <Text variant="h4" className="surface-title">
                      Ribbon Style
                    </Text>
                    <Text variant="body" className="text-secondary">
                      Switch between solid and glass rendering.
                    </Text>
                  </div>
                  <WToggle
                    checked={ribbon?.glassWiiRibbon ?? false}
                    onChange={handleGlassWiiRibbonChange}
                    label={(ribbon?.glassWiiRibbon ?? false) ? 'Glass' : 'Solid'}
                  />
                </div>

                <div className="surface-row-between mb-2">
                  <Text variant="body" className="text-secondary">
                    Ribbon Hover Animation
                  </Text>
                  <WToggle
                    checked={ribbon?.ribbonHoverAnimationEnabled ?? true}
                    onChange={handleRibbonHoverAnimationChange}
                  />
                </div>
                <Text variant="caption" className="surface-caption !mt-0">
                  Controls hover lift/stretch behavior and hover glow boost.
                </Text>
              </div>
            </Card>

            <Card>
              <div className="surface-card-section">
                <Text variant="h4" className="surface-card-title">
                  Ribbon Surface
                </Text>
                <Text variant="caption" className="surface-caption !mt-0 mb-3">
                  {(ribbon?.glassWiiRibbon ?? false)
                    ? 'Solid ribbon controls are disabled while Glass mode is active.'
                    : 'Controls for Solid mode surface rendering.'}
                </Text>
                <div className={`surface-controls ${(ribbon?.glassWiiRibbon ?? false) ? 'opacity-60' : ''}`}>
                  <div className="surface-row">
                    <Text variant="body" className="surface-color-label-sm">
                      Ribbon Color
                    </Text>
                    <input
                      type="color"
                      value={ribbon?.ribbonColor ?? DEFAULT_RIBBON_SURFACE_HEX}
                      onChange={handleRibbonColorChange}
                      disabled={ribbon?.glassWiiRibbon ?? false}
                      className="surface-color-input"
                    />
                    <Text variant="caption" className="surface-caption !mt-0">
                      {(ribbon?.ribbonColor ?? DEFAULT_RIBBON_SURFACE_HEX).toUpperCase()}
                    </Text>
                  </div>
                  <div>
                    <Text variant="body" className="text-secondary mb-2">
                      Ribbon Opacity (Solid Mode)
                    </Text>
                    <Slider
                      value={ribbon?.ribbonDockOpacity ?? 1}
                      min={0.1}
                      max={1}
                      step={0.1}
                      disabled={ribbon?.glassWiiRibbon ?? false}
                      onChange={handleRibbonDockOpacityChange}
                    />
                    <Text variant="caption" className="surface-caption">
                      {Math.round((ribbon?.ribbonDockOpacity ?? 1) * 100)}%
                    </Text>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="surface-card-section">
                <Text variant="h4" className="surface-card-title">
                  Ribbon Glow
                </Text>
                <div className="surface-controls">
                  <div className="surface-row">
                    <Text variant="body" className="surface-color-label-sm">
                      Glow Color
                    </Text>
                    <input
                      type="color"
                      value={ribbon?.ribbonGlowColor ?? DEFAULT_RIBBON_GLOW_HEX}
                      onChange={handleRibbonGlowColorChange}
                      className="surface-color-input"
                    />
                    <Text variant="caption" className="surface-caption !mt-0">
                      {(ribbon?.ribbonGlowColor ?? DEFAULT_RIBBON_GLOW_HEX).toUpperCase()}
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
                  <div className={(ribbon?.ribbonHoverAnimationEnabled ?? true) ? '' : 'opacity-60'}>
                    <Text variant="body" className="text-secondary mb-2">
                      Hover Glow Boost
                    </Text>
                    <Slider
                      value={ribbon?.ribbonGlowStrengthHover ?? 28}
                      min={0}
                      max={96}
                      step={1}
                      disabled={!(ribbon?.ribbonHoverAnimationEnabled ?? true)}
                      onChange={handleRibbonGlowStrengthHoverChange}
                    />
                    <Text variant="caption" className="surface-caption">
                      {ribbon?.ribbonGlowStrengthHover ?? 28}px
                    </Text>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="surface-card-section">
                <Text variant="h4" className="surface-title">
                  Glass Surface
                </Text>
                <Text variant="caption" className="surface-caption !mt-0 mb-3">
                  {(ribbon?.glassWiiRibbon ?? false)
                    ? 'Glass mode is active. These controls affect the ribbon surface.'
                    : 'Enable Glass style above to apply these controls.'}
                </Text>
                <div className={`surface-controls ${(ribbon?.glassWiiRibbon ?? false) ? '' : 'opacity-60'}`}>
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Glass Opacity
                      </Text>
                      <Slider
                        value={ribbon?.glassOpacity ?? 0.18}
                        min={0}
                        max={0.5}
                        step={0.01}
                        disabled={!(ribbon?.glassWiiRibbon ?? false)}
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
                        min={0}
                        max={10}
                        step={0.5}
                        disabled={!(ribbon?.glassWiiRibbon ?? false)}
                        onChange={handleGlassBlurChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {ribbon?.glassBlur ?? 2.5}px
                      </Text>
                    </div>
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Glass Border Intensity
                      </Text>
                      <Slider
                        value={ribbon?.glassBorderOpacity ?? 0.5}
                        min={0}
                        max={1}
                        step={0.05}
                        disabled={!(ribbon?.glassWiiRibbon ?? false)}
                        onChange={handleGlassBorderOpacityChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {Math.round((ribbon?.glassBorderOpacity ?? 0.5) * 100)}%
                      </Text>
                    </div>
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Glass Shine Intensity
                      </Text>
                      <Slider
                        value={ribbon?.glassShineOpacity ?? 0.7}
                        min={0}
                        max={1}
                        step={0.05}
                        disabled={!(ribbon?.glassWiiRibbon ?? false)}
                        onChange={handleGlassShineOpacityChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {Math.round((ribbon?.glassShineOpacity ?? 0.7) * 100)}%
                      </Text>
                    </div>
                  </div>
              </div>
            </Card>
          </div>
        );

      case 'animations':
        return (
          <div className="surface-stack">
            <Text variant="h3" className="surface-card-title">
              Animation & Particle Effects
            </Text>
            <Text variant="body" className="surface-card-description">
              Customize particle effects and animations that apply to both dock types.
            </Text>

            {/* Particle System */}
            <Card>
              <div className="surface-card-section">
                <div className="surface-row-between mb-4">
                  <div>
                    <Text variant="h4" className="surface-title">
                      Particle System
                    </Text>
                    <Text variant="body" className="text-secondary">
                      Add floating particles around the dock for visual enhancement.
                    </Text>
                  </div>
                  <div className="surface-row">
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: dock?.particleSystemEnabled
                        ? 'hsl(var(--state-success))'
                        : 'hsl(var(--text-tertiary))',
                      animation: dock?.particleSystemEnabled ? 'pulse 2s infinite' : 'none'
                    }} />
                    <WToggle
                      checked={dock?.particleSystemEnabled ?? false}
                      onChange={handleParticleEnabledChange}
                    />
                  </div>
                </div>
                
                {dock?.particleSystemEnabled && (
                  <div className="surface-controls">
                    {/* Status indicator */}
                    <div className="surface-soft-panel !bg-emerald-500/10 !border-emerald-500/20 surface-row">
                      <div className="text-[16px]">✨</div>
                      <div>
                        <Text variant="body" className="text-emerald-500 font-semibold">
                          Particle System Active
                        </Text>
                        <Text variant="caption" className="text-secondary">
                          {dock?.particleEffectType || 'normal'} effect with {dock?.particleCount || 3} particles
                        </Text>
                      </div>
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Effect Type
                      </Text>
                      <WSelect
                        value={dock?.particleEffectType ?? 'normal'}
                        onChange={(value) => handleParticleEffectTypeChange(value)}
                        options={[
                          { value: 'normal', label: 'Normal Particles' },
                          { value: 'stars', label: 'Stars' },
                          { value: 'sparkles', label: 'Sparkles' },
                          { value: 'fireflies', label: 'Fireflies' },
                          { value: 'dust', label: 'Dust' },
                          { value: 'energy', label: 'Energy Orbs' },
                          { value: 'magic', label: 'Magic Sparkles' }
                        ]}
                      />
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Direction
                      </Text>
                      <WSelect
                        value={dock?.particleDirection ?? 'upward'}
                        onChange={(value) => handleParticleDirectionChange(value)}
                        options={[
                          { value: 'upward', label: 'Upward' },
                          { value: 'downward', label: 'Downward' },
                          { value: 'leftward', label: 'Leftward' },
                          { value: 'rightward', label: 'Rightward' },
                          { value: 'random', label: 'Random' },
                          { value: 'outward', label: 'Outward from Center' },
                          { value: 'inward', label: 'Inward to Center' }
                        ]}
                      />
                    </div>
                    
                    <div>
                      <div className="surface-row-between mb-2">
                        <Text variant="body" className="text-secondary">
                          Follow Border Path
                        </Text>
                        <WToggle
                          checked={dock?.particleClipPathFollow ?? false}
                          onChange={(checked) => handleParticleClipPathFollowChange(checked)}
                        />
                      </div>
                      <Text variant="caption" className="text-tertiary">
                        Particles emit from dock/ribbon borders instead of base
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Particle Count
                      </Text>
                      <Slider
                        value={dock?.particleCount ?? 3}
                        min={1}
                        max={10}
                        step={1}
                        onChange={handleParticleCountChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {dock?.particleCount ?? 3} particles
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Animation Speed
                      </Text>
                      <Slider
                        value={dock?.particleSpeed ?? 2}
                        min={0.5}
                        max={5}
                        step={0.1}
                        onChange={handleParticleSpeedChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {dock?.particleSpeed ?? 2}x speed
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Particle Size
                      </Text>
                      <Slider
                        value={dock?.particleSize ?? 3}
                        min={1}
                        max={10}
                        step={0.5}
                        onChange={handleParticleSizeChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {dock?.particleSize ?? 3}px
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Gravity
                      </Text>
                      <Slider
                        value={dock?.particleGravity ?? 0.02}
                        min={0}
                        max={0.1}
                        step={0.005}
                        onChange={handleParticleGravityChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {dock?.particleGravity ?? 0.02}
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Fade Speed
                      </Text>
                      <Slider
                        value={dock?.particleFadeSpeed ?? 0.008}
                        min={0.001}
                        max={0.02}
                        step={0.001}
                        onChange={handleParticleFadeSpeedChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {dock?.particleFadeSpeed ?? 0.008}
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Particle Lifetime
                      </Text>
                      <Slider
                        value={dock?.particleLifetime ?? 3.0}
                        min={1}
                        max={10}
                        step={0.5}
                        onChange={handleParticleLifetimeChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {dock?.particleLifetime ?? 3.0}s
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Advanced Particle Settings */}
            {dock?.particleSystemEnabled && (
              <Card>
                <div className="surface-card-section">
                  <Text variant="h4" className="surface-card-title">
                    Advanced Particle Settings
                  </Text>
                  <Text variant="body" className="surface-card-description">
                    Fine-tune particle appearance and behavior.
                  </Text>
                  
                  <div className="surface-controls">
                    <div className="surface-row-between">
                      <div>
                        <Text variant="body" className="text-secondary mb-1">
                          Adaptive Colors
                        </Text>
                        <Text variant="caption" className="text-tertiary">
                          Particles adapt to dock colors
                        </Text>
                      </div>
                      <WToggle
                        checked={dock?.particleUseAdaptiveColor ?? false}
                        onChange={handleParticleUseAdaptiveColorChange}
                      />
                    </div>
                    
                    {!dock?.particleUseAdaptiveColor && (
                      <>
                        <div>
                          <Text variant="body" className="text-secondary mb-2">
                            Color Intensity
                          </Text>
                          <Slider
                            value={dock?.particleColorIntensity ?? 1.0}
                            min={0.1}
                            max={2.0}
                            step={0.1}
                            onChange={handleParticleColorIntensityChange}
                          />
                          <Text variant="caption" className="surface-caption">
                            {dock?.particleColorIntensity ?? 1.0}x
                          </Text>
                        </div>
                        
                        <div>
                          <Text variant="body" className="text-secondary mb-2">
                            Color Variation
                          </Text>
                          <Slider
                            value={dock?.particleColorVariation ?? 0.3}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={handleParticleColorVariationChange}
                          />
                          <Text variant="caption" className="surface-caption">
                            {Math.round((dock?.particleColorVariation ?? 0.3) * 100)}%
                          </Text>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Text variant="body" className="text-secondary mb-2">
                        Rotation Speed
                      </Text>
                      <Slider
                        value={dock?.particleRotationSpeed ?? 0.05}
                        min={0}
                        max={0.2}
                        step={0.01}
                        onChange={handleParticleRotationSpeedChange}
                      />
                      <Text variant="caption" className="surface-caption">
                        {dock?.particleRotationSpeed ?? 0.05}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Performance & Optimization */}
            <Card>
              <div className="surface-card-section">
                <Text variant="h4" className="surface-card-title">
                  Performance & Optimization
                </Text>
                <Text variant="body" className="surface-card-description">
                  Tips for optimal performance with particle effects.
                </Text>
                
                <div className="surface-controls !gap-3">
                  <div className="surface-soft-panel !bg-blue-500/10 !border-blue-500/20">
                    <Text variant="body" className="text-blue-500 font-semibold mb-1">
                      💡 Performance Tips
                    </Text>
                    <Text variant="caption" className="text-secondary">
                      • Lower particle count for better performance<br/>
                      • Use 'normal' or 'dust' effects for minimal impact<br/>
                      • Disable adaptive colors if not needed<br/>
                      • Higher-end effects like 'energy' use more resources
                    </Text>
                  </div>
                  
                  <div className="surface-soft-panel !bg-amber-500/10 !border-amber-500/20">
                    <Text variant="body" className="text-amber-500 font-semibold mb-1">
                      ⚡ New Features
                    </Text>
                    <Text variant="caption" className="text-secondary">
                      • Clip Path Followers: Particles follow dock shape<br/>
                      • Energy Orbs: Pulsing energy effects<br/>
                      • Magic Sparkles: Enhanced sparkle effects<br/>
                      • Multiple direction options for varied movement
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{pulseAnimation}</style>
      <div className="surface-stack">
        <Text variant="h2" className="surface-title">
          Dock Settings
        </Text>
      
      <Text variant="body" className="surface-subtitle">
        Customize your dock appearance, choose between Classic and Ribbon styles, and configure animations.
      </Text>

      {/* Sub-tab Navigation */}
      <div className="surface-tab-nav">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`surface-tab-button ${activeSubTab === tab.id ? 'surface-tab-button-active' : 'surface-tab-button-inactive'}`}
          >
            <span className="text-[16px]">{tab.icon}</span>
            <div className="text-left">
              <div className="text-[14px] font-inherit">{tab.label}</div>
              <div className="text-[11px] opacity-70 mt-0.5">{tab.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Sub-tab Content */}
      {renderSubTabContent()}
    </div>
    </>
  );
});

UnifiedDockSettingsTab.displayName = 'UnifiedDockSettingsTab';

export default UnifiedDockSettingsTab;
