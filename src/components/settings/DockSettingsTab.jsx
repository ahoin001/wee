import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WSelect from '../../ui/WSelect';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { CLASSIC_DOCK_THEME_GROUPS as THEME_GROUPS } from '../../data/dock/classicDockThemeGroups';
import { CLASSIC_DOCK_DEFAULT_COLORS as DOCK_DEFAULT } from '../../design/classicDockThemeDefaults.js';
import '../surfaceStyles.css';

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

const ClassicDockSettingsTab = React.memo(() => {
  // Use legacy settings system to work with SettingsModal
  const [localDockSettings, setLocalDockSettings] = useState({});
  
  // Load dock settings from legacy system on component mount
  useEffect(() => {
    const loadDockSettings = () => {
      try {
        // Load from legacy window.settings system
        const legacySettings = window.settings || {};
        const dockSettings = legacySettings.dockSettings || {};
        setLocalDockSettings(dockSettings);
      } catch (error) {
        console.error('[DockSettingsTab] Failed to load dock settings:', error);
      }
    };
    
    loadDockSettings();
  }, []);
  
  // Utility function to save dock setting to legacy system
  const saveDockSetting = useCallback((key, value) => {
    try {
      // Update local state
      setLocalDockSettings(prev => ({
        ...prev,
        [key]: value
      }));
      
      // Update legacy window.settings system
      if (!window.settings) {
        window.settings = {};
      }
      if (!window.settings.dockSettings) {
        window.settings.dockSettings = {};
      }
      window.settings.dockSettings[key] = value;
      
      // Dispatch custom event to notify components of settings change
      window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: { type: 'dockSettings', key, value }
      }));
    } catch (error) {
      console.error(`[DockSettingsTab] Failed to save ${key} setting:`, error);
    }
  }, []);
  
  // Local state for expanded groups
  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    games: false
  });

  // Apply theme function with immediate save
  const applyTheme = useCallback((themePath) => {
    const [groupKey, themeKey] = themePath.split('.');
    const group = THEME_GROUPS[groupKey];
    const theme = group?.themes[themeKey];
    if (theme) {
      // Update local state with theme colors
      setLocalDockSettings(prev => ({
        ...prev,
        ...theme.colors
      }));
      
      // Save all theme colors to legacy system immediately
      try {
        if (!window.settings) {
          window.settings = {};
        }
        if (!window.settings.dockSettings) {
          window.settings.dockSettings = {};
        }
        
        // Update window.settings with theme colors
        Object.entries(theme.colors).forEach(([key, value]) => {
          window.settings.dockSettings[key] = value;
        });
        
      } catch (error) {
        console.error('[DockSettingsTab] Failed to save theme:', error);
      }
    }
  }, []);

  // Check if current colors match a theme
  const getCurrentTheme = useCallback(() => {
    for (const [groupKey, group] of Object.entries(THEME_GROUPS)) {
      for (const [themeKey, theme] of Object.entries(group.themes)) {
        const themePath = `${groupKey}.${themeKey}`;
        const colors = theme.colors;
        
        if (
          colors.dockBaseGradientStart === localDockSettings?.dockBaseGradientStart &&
          colors.dockBaseGradientEnd === localDockSettings?.dockBaseGradientEnd &&
          colors.dockAccentColor === localDockSettings?.dockAccentColor &&
          colors.sdCardBodyColor === localDockSettings?.sdCardBodyColor &&
          colors.sdCardBorderColor === localDockSettings?.sdCardBorderColor &&
          colors.sdCardLabelColor === localDockSettings?.sdCardLabelColor &&
          colors.sdCardLabelBorderColor === localDockSettings?.sdCardLabelBorderColor &&
          colors.sdCardBottomColor === localDockSettings?.sdCardBottomColor &&
          colors.leftPodBaseColor === localDockSettings?.leftPodBaseColor &&
          colors.leftPodAccentColor === localDockSettings?.leftPodAccentColor &&
          colors.leftPodDetailColor === localDockSettings?.leftPodDetailColor &&
          colors.rightPodBaseColor === localDockSettings?.rightPodBaseColor &&
          colors.rightPodAccentColor === localDockSettings?.rightPodAccentColor &&
          colors.rightPodDetailColor === localDockSettings?.rightPodDetailColor &&
          colors.buttonBorderColor === localDockSettings?.buttonBorderColor &&
          colors.buttonGradientStart === localDockSettings?.buttonGradientStart &&
          colors.buttonGradientEnd === localDockSettings?.buttonGradientEnd &&
          colors.buttonIconColor === localDockSettings?.buttonIconColor &&
          colors.rightButtonIconColor === localDockSettings?.rightButtonIconColor &&
          colors.buttonHighlightColor === localDockSettings?.buttonHighlightColor
        ) {
          return themePath;
        }
      }
    }
    return null;
  }, [localDockSettings]);

  // Color change handlers with immediate save
  const handleColorChange = useCallback((key, value) => {
    setLocalDockSettings(prev => ({ ...prev, [key]: value }));
    saveDockSetting(key, value);
  }, [saveDockSetting]);

  // Glass effect handlers with immediate save
  const handleGlassEnabledChange = useCallback((checked) => {
    setLocalDockSettings(prev => ({ ...prev, glassEnabled: checked }));
    saveDockSetting('glassEnabled', checked);
  }, [saveDockSetting]);

  const handleGlassOpacityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, glassOpacity: value }));
    saveDockSetting('glassOpacity', value);
  }, [saveDockSetting]);

  const handleGlassBlurChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, glassBlur: value }));
    saveDockSetting('glassBlur', value);
  }, [saveDockSetting]);

  const handleGlassBorderOpacityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, glassBorderOpacity: value }));
    saveDockSetting('glassBorderOpacity', value);
  }, [saveDockSetting]);

  const handleGlassShineOpacityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, glassShineOpacity: value }));
    saveDockSetting('glassShineOpacity', value);
  }, [saveDockSetting]);

  // Size handlers with immediate save
  const handleDockScaleChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, dockScale: value }));
    saveDockSetting('dockScale', value);
  }, [saveDockSetting]);

  const handleButtonSizeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, buttonSize: value }));
    saveDockSetting('buttonSize', value);
  }, [saveDockSetting]);

  const handleSdCardSizeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, sdCardSize: value }));
    saveDockSetting('sdCardSize', value);
  }, [saveDockSetting]);

  // Particle system handlers with immediate save
  const handleParticleEnabledChange = useCallback((checked) => {
    setLocalDockSettings(prev => ({ ...prev, particleSystemEnabled: checked }));
    saveDockSetting('particleSystemEnabled', checked);
  }, [saveDockSetting]);

  const handleParticleEffectTypeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleEffectType: value }));
    saveDockSetting('particleEffectType', value);
  }, [saveDockSetting]);

  const handleParticleDirectionChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleDirection: value }));
    saveDockSetting('particleDirection', value);
  }, [saveDockSetting]);

  const handleParticleSpeedChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleSpeed: value }));
    saveDockSetting('particleSpeed', value);
  }, [saveDockSetting]);

  const handleParticleCountChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleCount: value }));
    saveDockSetting('particleCount', value);
  }, [saveDockSetting]);

  const handleParticleSpawnRateChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleSpawnRate: value }));
    saveDockSetting('particleSpawnRate', value);
  }, [saveDockSetting]);

  const handleParticleSizeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleSize: value }));
    saveDockSetting('particleSize', value);
  }, [saveDockSetting]);

  const handleParticleGravityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleGravity: value }));
    saveDockSetting('particleGravity', value);
  }, [saveDockSetting]);

  const handleParticleFadeSpeedChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleFadeSpeed: value }));
    saveDockSetting('particleFadeSpeed', value);
  }, [saveDockSetting]);

  const handleParticleSizeDecayChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleSizeDecay: value }));
    saveDockSetting('particleSizeDecay', value);
  }, [saveDockSetting]);

  const handleParticleUseAdaptiveColorChange = useCallback((checked) => {
    setLocalDockSettings(prev => ({ ...prev, particleUseAdaptiveColor: checked }));
    saveDockSetting('particleUseAdaptiveColor', checked);
  }, [saveDockSetting]);

  const handleParticleColorIntensityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleColorIntensity: value }));
    saveDockSetting('particleColorIntensity', value);
  }, [saveDockSetting]);

  const handleParticleColorVariationChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleColorVariation: value }));
    saveDockSetting('particleColorVariation', value);
  }, [saveDockSetting]);

  const handleParticleRotationSpeedChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleRotationSpeed: value }));
    saveDockSetting('particleRotationSpeed', value);
  }, [saveDockSetting]);

  const handleParticleLifetimeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleLifetime: value }));
    saveDockSetting('particleLifetime', value);
  }, [saveDockSetting]);

  return (
    <div className="surface-stack">
      <Text variant="h2" className="surface-title">
        Classic Dock Settings
      </Text>
      
      <Text variant="body" className="surface-subtitle">
        Customize the appearance of the Classic Wii Dock including colors, themes, glass effects, and sizing.
      </Text>
      
      {/* Preset Themes */}
      <Card>
        <div className="surface-card-section">
          <Text variant="h3" className="surface-card-title">
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
                  <Text variant="h4" className="text-primary mb-1">
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
          <Text variant="h3" className="surface-card-title">
            Dock Base Colors
          </Text>
          <Text variant="body" className="surface-card-description">
            Customize the main dock structure colors.
          </Text>
          
          <div className="surface-controls">
            <ColorSettingRow
              label="Gradient Start"
              value={localDockSettings?.dockBaseGradientStart}
              fallback={DOCK_DEFAULT.dockBaseGradientStart}
              onChange={(next) => handleColorChange('dockBaseGradientStart', next)}
            />
            <ColorSettingRow
              label="Gradient End"
              value={localDockSettings?.dockBaseGradientEnd}
              fallback={DOCK_DEFAULT.dockBaseGradientEnd}
              onChange={(next) => handleColorChange('dockBaseGradientEnd', next)}
            />
            <ColorSettingRow
              label="Accent Color"
              value={localDockSettings?.dockAccentColor}
              fallback={DOCK_DEFAULT.dockAccentColor}
              onChange={(next) => handleColorChange('dockAccentColor', next)}
            />
          </div>
        </div>
      </Card>

      {/* SD Card Colors */}
      <Card>
        <div className="surface-card-section">
          <Text variant="h3" className="surface-card-title">
            SD Card Colors
          </Text>
          <Text variant="body" className="surface-card-description">
            Customize the SD card appearance.
          </Text>
          
          <div className="surface-controls">
            <ColorSettingRow
              label="Card Body"
              value={localDockSettings?.sdCardBodyColor}
              fallback={DOCK_DEFAULT.sdCardBodyColor}
              onChange={(next) => handleColorChange('sdCardBodyColor', next)}
            />
            <ColorSettingRow
              label="Card Border"
              value={localDockSettings?.sdCardBorderColor}
              fallback={DOCK_DEFAULT.sdCardBorderColor}
              onChange={(next) => handleColorChange('sdCardBorderColor', next)}
            />
            <ColorSettingRow
              label="Label Area"
              value={localDockSettings?.sdCardLabelColor}
              fallback={DOCK_DEFAULT.sdCardLabelColor}
              onChange={(next) => handleColorChange('sdCardLabelColor', next)}
            />
            <ColorSettingRow
              label="Bottom Section"
              value={localDockSettings?.sdCardBottomColor}
              fallback={DOCK_DEFAULT.sdCardBottomColor}
              onChange={(next) => handleColorChange('sdCardBottomColor', next)}
            />
          </div>
        </div>
      </Card>

      {/* Button Pod Colors */}
      <Card>
        <div className="surface-card-section">
          <Text variant="h3" className="surface-card-title">
            Button Pod Colors
          </Text>
          <Text variant="body" className="surface-card-description">
            Customize the button pod appearance.
          </Text>
          
          <div className="surface-controls">
            <ColorSettingRow
              label="Left Pod Base"
              value={localDockSettings?.leftPodBaseColor}
              fallback={DOCK_DEFAULT.leftPodBaseColor}
              onChange={(next) => handleColorChange('leftPodBaseColor', next)}
            />
            <ColorSettingRow
              label="Right Pod Base"
              value={localDockSettings?.rightPodBaseColor}
              fallback={DOCK_DEFAULT.rightPodBaseColor}
              onChange={(next) => handleColorChange('rightPodBaseColor', next)}
            />
            <ColorSettingRow
              label="Button Border"
              value={localDockSettings?.buttonBorderColor}
              fallback={DOCK_DEFAULT.buttonBorderColor}
              onChange={(next) => handleColorChange('buttonBorderColor', next)}
            />
            <ColorSettingRow
              label="Button Icon"
              value={localDockSettings?.buttonIconColor}
              fallback={DOCK_DEFAULT.buttonIconColor}
              onChange={(next) => handleColorChange('buttonIconColor', next)}
            />
          </div>
        </div>
      </Card>

      {/* Glass Effect */}
      <Card>
        <div className="surface-card-section">
          <div className="surface-row-between mb-4">
            <div>
              <Text variant="h3" className="surface-title">
                Glass Effect
              </Text>
              <Text variant="body" className="text-secondary">
                Apply a glass morphism effect to the dock.
              </Text>
            </div>
            <WToggle
              checked={localDockSettings?.glassEnabled ?? false}
              onChange={handleGlassEnabledChange}
            />
          </div>
          
          {localDockSettings?.glassEnabled && (
            <div className="surface-controls">
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Glass Opacity
                </Text>
                <Slider
                  value={localDockSettings?.glassOpacity ?? 0.18}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  onChange={handleGlassOpacityChange}
                />
                <Text variant="caption" className="surface-caption">
                  {Math.round((localDockSettings?.glassOpacity ?? 0.18) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Glass Blur
                </Text>
                <Slider
                  value={localDockSettings?.glassBlur ?? 2.5}
                  min={0.5}
                  max={8}
                  step={0.1}
                  onChange={handleGlassBlurChange}
                />
                <Text variant="caption" className="surface-caption">
                  {localDockSettings?.glassBlur ?? 2.5}px
                </Text>
              </div>
              
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Border Opacity
                </Text>
                <Slider
                  value={localDockSettings?.glassBorderOpacity ?? 0.5}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassBorderOpacityChange}
                />
                <Text variant="caption" className="surface-caption">
                  {Math.round((localDockSettings?.glassBorderOpacity ?? 0.5) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Shine Opacity
                </Text>
                <Slider
                  value={localDockSettings?.glassShineOpacity ?? 0.7}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassShineOpacityChange}
                />
                <Text variant="caption" className="surface-caption">
                  {Math.round((localDockSettings?.glassShineOpacity ?? 0.7) * 100)}%
                </Text>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Size Settings */}
      <Card>
        <div className="surface-card-section">
          <Text variant="h3" className="surface-card-title">
            Size Settings
          </Text>
          <Text variant="body" className="surface-card-description">
            Adjust the height of dock elements. The dock maintains full width while scaling height.
          </Text>
          
          <div className="surface-controls">
            <div>
              <Text variant="body" className="text-secondary mb-2">
                Dock Height
              </Text>
              <Slider
                value={localDockSettings?.dockScale ?? 1.0}
                min={0.5}
                max={2.0}
                step={0.05}
                onChange={handleDockScaleChange}
              />
              <Text variant="caption" className="surface-caption">
                {Math.round((localDockSettings?.dockScale ?? 1.0) * 100)}%
              </Text>
            </div>
            
            <div>
              <Text variant="body" className="text-secondary mb-2">
                Button Size
              </Text>
              <Slider
                value={localDockSettings?.buttonSize ?? 1.0}
                min={0.5}
                max={1.5}
                step={0.05}
                onChange={handleButtonSizeChange}
              />
              <Text variant="caption" className="surface-caption">
                {Math.round((localDockSettings?.buttonSize ?? 1.0) * 100)}%
              </Text>
            </div>
            
            <div>
              <Text variant="body" className="text-secondary mb-2">
                SD Card Size
              </Text>
              <Slider
                value={localDockSettings?.sdCardSize ?? 1.0}
                min={0.5}
                max={2.0}
                step={0.05}
                onChange={handleSdCardSizeChange}
              />
              <Text variant="caption" className="surface-caption">
                {Math.round((localDockSettings?.sdCardSize ?? 1.0) * 100)}%
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Particle System */}
      <Card>
        <div className="surface-card-section">
          <div className="surface-row-between mb-4">
            <div>
              <Text variant="h3" className="surface-title">
                Particle System
              </Text>
              <Text variant="body" className="text-secondary">
                Add magical particle effects around the dock for visual enhancement.
              </Text>
            </div>
            <WToggle
              checked={localDockSettings?.particleSystemEnabled ?? false}
              onChange={handleParticleEnabledChange}
            />
          </div>
          
          {localDockSettings?.particleSystemEnabled && (
            <div className="surface-controls">
              {/* Effect Type */}
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Effect Type
                </Text>
                <WSelect
                  value={localDockSettings?.particleEffectType ?? 'normal'}
                  onChange={handleParticleEffectTypeChange}
                  options={[
                    { value: 'normal', label: '✨ Normal Particles' },
                    { value: 'stars', label: '⭐ Stars' },
                    { value: 'paws', label: '🐾 Paws' },
                    { value: 'waterDrops', label: '💧 Water Drops' },
                    { value: 'sparkles', label: '✨ Sparkles' },
                    { value: 'magic', label: '🔮 Magic' },
                    { value: 'fireflies', label: '🦟 Fireflies' },
                    { value: 'dust', label: '💨 Dust' }
                  ]}
                />
              </div>

              {/* Direction */}
              <div>
                <Text variant="body" className="text-secondary mb-2">
                  Direction
                </Text>
                <WSelect
                  value={localDockSettings?.particleDirection ?? 'upward'}
                  onChange={handleParticleDirectionChange}
                  options={[
                    { value: 'upward', label: '⬆️ Upward' },
                    { value: 'all', label: '🌐 All Directions' }
                  ]}
                />
              </div>

              {/* Basic Settings */}
              <div className="surface-grid-2">
                <div>
                  <Text variant="body" className="text-secondary mb-2">
                    Particle Speed
                  </Text>
                  <Slider
                    value={localDockSettings?.particleSpeed ?? 2}
                    min={0.5}
                    max={5}
                    step={0.1}
                    onChange={handleParticleSpeedChange}
                  />
                  <Text variant="caption" className="surface-caption">
                    {localDockSettings?.particleSpeed ?? 2}x speed
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" className="text-secondary mb-2">
                    Particle Count
                  </Text>
                  <Slider
                    value={localDockSettings?.particleCount ?? 3}
                    min={1}
                    max={10}
                    step={1}
                    onChange={handleParticleCountChange}
                  />
                  <Text variant="caption" className="surface-caption">
                    {localDockSettings?.particleCount ?? 3} particles
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" className="text-secondary mb-2">
                    Spawn Rate
                  </Text>
                  <Slider
                    value={localDockSettings?.particleSpawnRate ?? 60}
                    min={10}
                    max={120}
                    step={5}
                    onChange={handleParticleSpawnRateChange}
                  />
                  <Text variant="caption" className="surface-caption">
                    {localDockSettings?.particleSpawnRate ?? 60} per second
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" className="text-secondary mb-2">
                    Particle Size
                  </Text>
                  <Slider
                    value={localDockSettings?.particleSize ?? 3}
                    min={1}
                    max={8}
                    step={0.5}
                    onChange={handleParticleSizeChange}
                  />
                  <Text variant="caption" className="surface-caption">
                    {localDockSettings?.particleSize ?? 3}px
                  </Text>
                </div>
              </div>

              {/* Physics Settings */}
              <div className="surface-grid-2">
                <div>
                  <Text variant="body" className="text-secondary mb-2">
                    Gravity
                  </Text>
                  <Slider
                    value={localDockSettings?.particleGravity ?? 0.02}
                    min={0}
                    max={0.1}
                    step={0.005}
                    onChange={handleParticleGravityChange}
                  />
                  <Text variant="caption" className="surface-caption">
                    {localDockSettings?.particleGravity ?? 0.02}
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" className="text-secondary mb-2">
                    Fade Speed
                  </Text>
                  <Slider
                    value={localDockSettings?.particleFadeSpeed ?? 0.008}
                    min={0.001}
                    max={0.02}
                    step={0.001}
                    onChange={handleParticleFadeSpeedChange}
                  />
                  <Text variant="caption" className="surface-caption">
                    {localDockSettings?.particleFadeSpeed ?? 0.008}
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" className="text-secondary mb-2">
                    Size Decay
                  </Text>
                  <Slider
                    value={localDockSettings?.particleSizeDecay ?? 0.02}
                    min={0}
                    max={0.05}
                    step={0.005}
                    onChange={handleParticleSizeDecayChange}
                  />
                  <Text variant="caption" className="surface-caption">
                    {localDockSettings?.particleSizeDecay ?? 0.02}
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" className="text-secondary mb-2">
                    Rotation Speed
                  </Text>
                  <Slider
                    value={localDockSettings?.particleRotationSpeed ?? 0.05}
                    min={0}
                    max={0.2}
                    step={0.01}
                    onChange={handleParticleRotationSpeedChange}
                  />
                  <Text variant="caption" className="surface-caption">
                    {localDockSettings?.particleRotationSpeed ?? 0.05}
                  </Text>
                </div>
              </div>

              {/* Color Settings */}
              <div>
                <div className="surface-row-between mb-2">
                  <Text variant="body" className="text-secondary">
                    Use Adaptive Colors
                  </Text>
                  <WToggle
                    checked={localDockSettings?.particleUseAdaptiveColor ?? false}
                    onChange={handleParticleUseAdaptiveColorChange}
                  />
                </div>
                <Text variant="caption" className="text-tertiary">
                  Use dock accent color for particles
                </Text>
              </div>

              {localDockSettings?.particleUseAdaptiveColor && (
                <div className="surface-grid-2">
                  <div>
                    <Text variant="body" className="text-secondary mb-2">
                      Color Intensity
                    </Text>
                    <Slider
                      value={localDockSettings?.particleColorIntensity ?? 1.0}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      onChange={handleParticleColorIntensityChange}
                    />
                    <Text variant="caption" className="surface-caption">
                      {localDockSettings?.particleColorIntensity ?? 1.0}x
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="body" className="text-secondary mb-2">
                      Color Variation
                    </Text>
                    <Slider
                      value={localDockSettings?.particleColorVariation ?? 0.3}
                      min={0}
                      max={1}
                      step={0.1}
                      onChange={handleParticleColorVariationChange}
                    />
                    <Text variant="caption" className="surface-caption">
                      {localDockSettings?.particleColorVariation ?? 0.3}
                    </Text>
                  </div>
                </div>
              )}
              
              {/* Save Button for Particle System */}
              <div className="mt-5 pt-4 border-t border-primary">
                <WButton
                  onClick={async () => {
                    try {
                      if (window.api?.data?.get && window.api?.data?.set) {
                        const currentData = await window.api.data.get();
                        const updatedData = {
                          ...currentData,
                          settings: {
                            ...currentData.settings,
                            dock: {
                              ...currentData.settings?.dock,
                              particleSystemEnabled: localDockSettings?.particleSystemEnabled ?? false,
                              particleEffectType: localDockSettings?.particleEffectType ?? 'normal',
                              particleDirection: localDockSettings?.particleDirection ?? 'upward',
                              particleSpeed: localDockSettings?.particleSpeed ?? 2,
                              particleCount: localDockSettings?.particleCount ?? 3,
                              particleSpawnRate: localDockSettings?.particleSpawnRate ?? 60,
                              particleSize: localDockSettings?.particleSize ?? 3,
                              particleGravity: localDockSettings?.particleGravity ?? 0.02,
                              particleFadeSpeed: localDockSettings?.particleFadeSpeed ?? 0.008,
                              particleSizeDecay: localDockSettings?.particleSizeDecay ?? 0.02,
                              particleUseAdaptiveColor: localDockSettings?.particleUseAdaptiveColor ?? false,
                              particleColorIntensity: localDockSettings?.particleColorIntensity ?? 1.0,
                              particleColorVariation: localDockSettings?.particleColorVariation ?? 0.3,
                              particleRotationSpeed: localDockSettings?.particleRotationSpeed ?? 0.05,
                              particleLifetime: localDockSettings?.particleLifetime ?? 3.0
                            }
                          }
                        };
                        await window.api.data.set(updatedData);
                      }
                    } catch (error) {
                      console.error('[DockSettingsTab] Failed to save particle system settings:', error);
                    }
                  }}
                  className="w-full"
                >
                  Save Particle System Settings
                </WButton>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

ClassicDockSettingsTab.displayName = 'ClassicDockSettingsTab';

export default ClassicDockSettingsTab; 