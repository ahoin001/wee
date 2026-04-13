import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import Slider from '../ui/Slider';
import Text from '../ui/Text';
import WToggle from '../ui/WToggle';
import SDCardiconModal from './SDCardiconModal';
import WSelect from '../ui/WSelect';
import { spacing } from '../ui/tokens';
import { findDockThemePath, getDockThemeByPath } from '../utils/dockThemeUtils';
import { CLASSIC_DOCK_THEME_GROUPS as THEME_GROUPS } from '../data/dock/classicDockThemeGroups';
import { CLASSIC_DOCK_DEFAULT_COLORS as DOCK_DEFAULT } from '../design/classicDockThemeDefaults.js';
import { CSS_WII_BLUE } from '../design/runtimeColorStrings.js';

import './SoundModal.css';

function ClassicDockSettingsModal({ isOpen, onClose, onSettingsChange, dockSettings = {} }) {
  // Color states
  const [dockBaseGradientStart, setDockBaseGradientStart] = useState(dockSettings.dockBaseGradientStart || DOCK_DEFAULT.dockBaseGradientStart);
  const [dockBaseGradientEnd, setDockBaseGradientEnd] = useState(dockSettings.dockBaseGradientEnd || DOCK_DEFAULT.dockBaseGradientEnd);
  const [dockAccentColor, setDockAccentColor] = useState(dockSettings.dockAccentColor || DOCK_DEFAULT.dockAccentColor);
  const [sdCardBodyColor, setSdCardBodyColor] = useState(dockSettings.sdCardBodyColor || DOCK_DEFAULT.sdCardBodyColor);
  const [sdCardBorderColor, setSdCardBorderColor] = useState(dockSettings.sdCardBorderColor || DOCK_DEFAULT.sdCardBorderColor);
  const [sdCardLabelColor, setSdCardLabelColor] = useState(dockSettings.sdCardLabelColor || DOCK_DEFAULT.sdCardLabelColor);
  const [sdCardLabelBorderColor, setSdCardLabelBorderColor] = useState(dockSettings.sdCardLabelBorderColor || DOCK_DEFAULT.sdCardLabelBorderColor);
  const [sdCardBottomColor, setSdCardBottomColor] = useState(dockSettings.sdCardBottomColor || DOCK_DEFAULT.sdCardBottomColor);
  const [leftPodBaseColor, setLeftPodBaseColor] = useState(dockSettings.leftPodBaseColor || DOCK_DEFAULT.leftPodBaseColor);
  const [leftPodAccentColor, setLeftPodAccentColor] = useState(dockSettings.leftPodAccentColor || DOCK_DEFAULT.leftPodAccentColor);
  const [leftPodDetailColor, setLeftPodDetailColor] = useState(dockSettings.leftPodDetailColor || DOCK_DEFAULT.leftPodDetailColor);
  const [rightPodBaseColor, setRightPodBaseColor] = useState(dockSettings.rightPodBaseColor || DOCK_DEFAULT.rightPodBaseColor);
  const [rightPodAccentColor, setRightPodAccentColor] = useState(dockSettings.rightPodAccentColor || DOCK_DEFAULT.rightPodAccentColor);
  const [rightPodDetailColor, setRightPodDetailColor] = useState(dockSettings.rightPodDetailColor || DOCK_DEFAULT.rightPodDetailColor);
  const [buttonBorderColor, setButtonBorderColor] = useState(dockSettings.buttonBorderColor || DOCK_DEFAULT.buttonBorderColor);
  const [buttonGradientStart, setButtonGradientStart] = useState(dockSettings.buttonGradientStart || DOCK_DEFAULT.buttonGradientStart);
  const [buttonGradientEnd, setButtonGradientEnd] = useState(dockSettings.buttonGradientEnd || DOCK_DEFAULT.buttonGradientEnd);
  const [buttonIconColor, setButtonIconColor] = useState(dockSettings.buttonIconColor || DOCK_DEFAULT.buttonIconColor);
  const [rightButtonIconColor, setRightButtonIconColor] = useState(dockSettings.rightButtonIconColor || DOCK_DEFAULT.rightButtonIconColor);
  const [buttonHighlightColor, setButtonHighlightColor] = useState(dockSettings.buttonHighlightColor || DOCK_DEFAULT.buttonHighlightColor);

  // Glass effect states
  const [glassEnabled, setGlassEnabled] = useState(dockSettings.glassEnabled || false);
  const [glassOpacity, setGlassOpacity] = useState(dockSettings.glassOpacity || 0.18);
  const [glassBlur, setGlassBlur] = useState(dockSettings.glassBlur || 2.5);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(dockSettings.glassBorderOpacity || 0.5);
  const [glassShineOpacity, setGlassShineOpacity] = useState(dockSettings.glassShineOpacity || 0.7);

  // SD Card icon state
  const [sdCardIcon, setSdCardIcon] = useState(dockSettings.sdCardIcon || 'default');

  // Custom themes state
  const [customThemes, setCustomThemes] = useState(dockSettings.customThemes || {});
  const [showSaveThemeModal, setShowSaveThemeModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');

  // Helper function to normalize icon value
  const normalizeIconValue = (iconValue) => {
    // If it's 'default', empty, null, or undefined, show default icon
    if (!iconValue || iconValue === 'default' || iconValue === '') {
      return 'default';
    }
    // If it's a URL, show custom icon
    return iconValue;
  };

  // Helper function to check if an icon is built-in
  const isBuiltInIcon = (iconValue) => {
    return ['palette', 'star', 'heart'].includes(iconValue);
  };

  // Helper function to render built-in icons
  const renderBuiltInIcon = (iconType) => {
    switch (iconType) {
      case 'palette':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5"/>
            <circle cx="17.5" cy="10.5" r="2.5"/>
            <circle cx="8.5" cy="7.5" r="2.5"/>
            <circle cx="6.5" cy="12.5" r="2.5"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
        );
      case 'star':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        );
      case 'heart':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const normalizedSdCardIcon = normalizeIconValue(sdCardIcon);

  // Size settings
  const [dockScale, setDockScale] = useState(dockSettings.dockScale || 1.0);
  const [buttonSize, setButtonSize] = useState(dockSettings.buttonSize || 1.0);
  const [sdCardSize, setSdCardSize] = useState(dockSettings.sdCardSize || 1.0);

  // Modal states
  const [showSdCardIconModal, setShowSdCardIconModal] = useState(false);

  // Collapsible groups state
  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    pastel: false,
    modern: false,
    nature: false,
    vibrant: false,
    custom: false
  });

  // Recent colors
  const [recentColors, setRecentColors] = useState(dockSettings.recentColors || []);

  // Track current theme
  const [currentTheme, setCurrentTheme] = useState('default');

  // Update states when dockSettings changes
  useEffect(() => {
    if (dockSettings) {
      setDockBaseGradientStart(dockSettings.dockBaseGradientStart || DOCK_DEFAULT.dockBaseGradientStart);
      setDockBaseGradientEnd(dockSettings.dockBaseGradientEnd || DOCK_DEFAULT.dockBaseGradientEnd);
      setDockAccentColor(dockSettings.dockAccentColor || DOCK_DEFAULT.dockAccentColor);
      setSdCardBodyColor(dockSettings.sdCardBodyColor || DOCK_DEFAULT.sdCardBodyColor);
      setSdCardBorderColor(dockSettings.sdCardBorderColor || DOCK_DEFAULT.sdCardBorderColor);
      setSdCardLabelColor(dockSettings.sdCardLabelColor || DOCK_DEFAULT.sdCardLabelColor);
      setSdCardLabelBorderColor(dockSettings.sdCardLabelBorderColor || DOCK_DEFAULT.sdCardLabelBorderColor);
      setSdCardBottomColor(dockSettings.sdCardBottomColor || DOCK_DEFAULT.sdCardBottomColor);
      setLeftPodBaseColor(dockSettings.leftPodBaseColor || DOCK_DEFAULT.leftPodBaseColor);
      setLeftPodAccentColor(dockSettings.leftPodAccentColor || DOCK_DEFAULT.leftPodAccentColor);
      setLeftPodDetailColor(dockSettings.leftPodDetailColor || DOCK_DEFAULT.leftPodDetailColor);
      setRightPodBaseColor(dockSettings.rightPodBaseColor || DOCK_DEFAULT.rightPodBaseColor);
      setRightPodAccentColor(dockSettings.rightPodAccentColor || DOCK_DEFAULT.rightPodAccentColor);
      setRightPodDetailColor(dockSettings.rightPodDetailColor || DOCK_DEFAULT.rightPodDetailColor);
      setButtonBorderColor(dockSettings.buttonBorderColor || DOCK_DEFAULT.buttonBorderColor);
      setButtonGradientStart(dockSettings.buttonGradientStart || DOCK_DEFAULT.buttonGradientStart);
      setButtonGradientEnd(dockSettings.buttonGradientEnd || DOCK_DEFAULT.buttonGradientEnd);
      setButtonIconColor(dockSettings.buttonIconColor || DOCK_DEFAULT.buttonIconColor);
      setRightButtonIconColor(dockSettings.rightButtonIconColor || DOCK_DEFAULT.rightButtonIconColor);
      setButtonHighlightColor(dockSettings.buttonHighlightColor || DOCK_DEFAULT.buttonHighlightColor);
      setGlassEnabled(dockSettings.glassEnabled || false);
      setGlassOpacity(dockSettings.glassOpacity || 0.18);
      setGlassBlur(dockSettings.glassBlur || 2.5);
      setGlassBorderOpacity(dockSettings.glassBorderOpacity || 0.5);
      setGlassShineOpacity(dockSettings.glassShineOpacity || 0.7);
      setSdCardIcon(dockSettings.sdCardIcon || 'default');
      setDockScale(dockSettings.dockScale || 1.0);
      setButtonSize(dockSettings.buttonSize || 1.0);
      setSdCardSize(dockSettings.sdCardSize || 1.0);
      setRecentColors(dockSettings.recentColors || []);
      setCustomThemes(dockSettings.customThemes || {});
    }
  }, [dockSettings]);

  // Update THEME_GROUPS with custom themes
  useEffect(() => {
    THEME_GROUPS.custom.themes = customThemes;
  }, [customThemes]);

  // Save custom theme
  const saveCustomTheme = () => {
    if (!themeName.trim()) return;

    const newTheme = {
      name: themeName.trim(),
      description: themeDescription.trim() || 'Custom theme',
      colors: {
        dockBaseGradientStart,
        dockBaseGradientEnd,
        dockAccentColor,
        sdCardBodyColor,
        sdCardBorderColor,
        sdCardLabelColor,
        sdCardLabelBorderColor,
        sdCardBottomColor,
        leftPodBaseColor,
        leftPodAccentColor,
        leftPodDetailColor,
        rightPodBaseColor,
        rightPodAccentColor,
        rightPodDetailColor,
        buttonBorderColor,
        buttonGradientStart,
        buttonGradientEnd,
        buttonIconColor,
        rightButtonIconColor,
        buttonHighlightColor,
      }
    };

    const themeKey = themeName.trim().toLowerCase().replace(/\s+/g, '_');
    
    if (editingTheme) {
      // Edit existing theme
      const updatedThemes = { ...customThemes };
      delete updatedThemes[editingTheme];
      updatedThemes[themeKey] = newTheme;
      setCustomThemes(updatedThemes);
    } else {
      // Save new theme
      setCustomThemes(prev => ({
        ...prev,
        [themeKey]: newTheme
      }));
    }

    setThemeName('');
    setThemeDescription('');
    setEditingTheme(null);
    setShowSaveThemeModal(false);
  };

  // Edit custom theme
  const editCustomTheme = (themeKey) => {
    const theme = customThemes[themeKey];
    setThemeName(theme.name);
    setThemeDescription(theme.description);
    setEditingTheme(themeKey);
    setShowSaveThemeModal(true);
  };

  // Delete custom theme
  const deleteCustomTheme = (themeKey) => {
    if (window.confirm(`Are you sure you want to delete "${customThemes[themeKey].name}"?`)) {
      const updatedThemes = { ...customThemes };
      delete updatedThemes[themeKey];
      setCustomThemes(updatedThemes);
    }
  };

  // Open save theme modal
  const openSaveThemeModal = () => {
    setThemeName('');
    setThemeDescription('');
    setEditingTheme(null);
    setShowSaveThemeModal(true);
  };

  // Reset to default values
  const resetToDefault = () => {
    applyTheme('classic.default');
    setGlassEnabled(false);
    setGlassOpacity(0.18);
    setGlassBlur(2.5);
    setGlassBorderOpacity(0.5);
    setGlassShineOpacity(0.7);
    setDockScale(1.0);
    setButtonSize(1.0);
    setSdCardSize(1.0);
    setRecentColors([]);
  };

  const handleSave = async (handleClose) => {
    try {
      let newRecentColors = [dockBaseGradientStart, dockAccentColor, ...recentColors.filter(c => c !== dockBaseGradientStart && c !== dockAccentColor)].slice(0, 3);
       
      setRecentColors(newRecentColors);
      
      const settings = {
        dockBaseGradientStart,
        dockBaseGradientEnd,
        dockAccentColor,
        sdCardBodyColor,
        sdCardBorderColor,
        sdCardLabelColor,
        sdCardLabelBorderColor,
        sdCardBottomColor,
        leftPodBaseColor,
        leftPodAccentColor,
        leftPodDetailColor,
        rightPodBaseColor,
        rightPodAccentColor,
        rightPodDetailColor,
        buttonBorderColor,
        buttonGradientStart,
        buttonGradientEnd,
        buttonIconColor,
        rightButtonIconColor,
        buttonHighlightColor,
        glassEnabled,
        glassOpacity,
        glassBlur,
        glassBorderOpacity,
        glassShineOpacity,
        sdCardIcon,
        dockScale,
        buttonSize,
        sdCardSize,
        recentColors: newRecentColors,
        customThemes,
      };

      if (onSettingsChange) {
        onSettingsChange(settings);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving dock settings:', error);
    }
  };

  const handleSdCardIconChange = (newSettings) => {
    if (newSettings.sdCardIcon) {
      setSdCardIcon(newSettings.sdCardIcon);
    }
  };

  // Check if current colors match a theme
  const getCurrentTheme = () => {
    return findDockThemePath(THEME_GROUPS, {
      dockBaseGradientStart,
      dockBaseGradientEnd,
      dockAccentColor,
      sdCardBodyColor,
      sdCardBorderColor,
      sdCardLabelColor,
      sdCardLabelBorderColor,
      sdCardBottomColor,
      leftPodBaseColor,
      leftPodAccentColor,
      leftPodDetailColor,
      rightPodBaseColor,
      rightPodAccentColor,
      rightPodDetailColor,
      buttonBorderColor,
      buttonGradientStart,
      buttonGradientEnd,
      buttonIconColor,
      rightButtonIconColor,
      buttonHighlightColor,
    });
  };

  // Apply theme function
  const applyTheme = (themePath) => {
    const theme = getDockThemeByPath(THEME_GROUPS, themePath);
    if (theme) {
      setDockBaseGradientStart(theme.colors.dockBaseGradientStart);
      setDockBaseGradientEnd(theme.colors.dockBaseGradientEnd);
      setDockAccentColor(theme.colors.dockAccentColor);
      setSdCardBodyColor(theme.colors.sdCardBodyColor);
      setSdCardBorderColor(theme.colors.sdCardBorderColor);
      setSdCardLabelColor(theme.colors.sdCardLabelColor);
      setSdCardLabelBorderColor(theme.colors.sdCardLabelBorderColor);
      setSdCardBottomColor(theme.colors.sdCardBottomColor);
      setLeftPodBaseColor(theme.colors.leftPodBaseColor);
      setLeftPodAccentColor(theme.colors.leftPodAccentColor);
      setLeftPodDetailColor(theme.colors.leftPodDetailColor);
      setRightPodBaseColor(theme.colors.rightPodBaseColor);
      setRightPodAccentColor(theme.colors.rightPodAccentColor);
      setRightPodDetailColor(theme.colors.rightPodDetailColor);
      setButtonBorderColor(theme.colors.buttonBorderColor);
      setButtonGradientStart(theme.colors.buttonGradientStart);
      setButtonGradientEnd(theme.colors.buttonGradientEnd);
      setButtonIconColor(theme.colors.buttonIconColor);
      setRightButtonIconColor(theme.colors.rightButtonIconColor);
      setButtonHighlightColor(theme.colors.buttonHighlightColor);
      setCurrentTheme(themePath);
    }
  };

  if (!isOpen) return null;

  return (
    <WBaseModal
      title="Customize Classic Dock"
      onClose={onClose}
      maxWidth="1000px"
      footerContent={({ handleClose }) => (
        <div className="flex justify-end items-center gap-2">
          <button
            className="reset-button px-4 py-2 rounded-md border-2 border-[hsl(var(--wii-blue))] bg-transparent text-[hsl(var(--wii-blue))] font-medium text-sm transition-all hover:bg-[hsl(var(--wii-blue))] hover:text-[hsl(var(--text-on-accent))]"
            onClick={resetToDefault}
            type="button"
          >
            Reset to Default
          </button>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSave(handleClose)}>Save</Button>
        </div>
      )}
    >
      {/* Preset Themes */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Preset Themes</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Choose from pre-made themes or customize your own.
          <div className="mt-3.5">
            {Object.entries(THEME_GROUPS).map(([groupKey, group]) => (
              <div key={groupKey} className="mb-5">
                <div
                  className="wee-card-header flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedGroups(prev => ({
                    ...prev,
                    [groupKey]: !prev[groupKey]
                  }))}
                >
                  <div>
                    <span className="wee-card-title">{group.name}</span>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {group.description}
                    </div>
                  </div>
                  <div
                    className={`transition-transform text-lg text-gray-600 ${expandedGroups[groupKey] ? 'rotate-180' : ''}`}
                  >
                    ▼
                  </div>
                </div>
                {expandedGroups[groupKey] && (
                  <div className="grid gap-3.5 mt-3.5 p-3 bg-gray-50 rounded-lg"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {Object.entries(group.themes).map(([themeKey, theme]) => {
                      const themePath = `${groupKey}.${themeKey}`;
                      const isSelected = getCurrentTheme() === themePath;
                      const isCustomTheme = groupKey === 'custom';
                      return (
                        <button
                          key={themeKey}
                          onClick={() => applyTheme(themePath)}
                          type="button"
                          className={`relative flex flex-col gap-1.5 text-left p-3 rounded-lg border-2 transition-all
                            ${isSelected ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--surface-wii-tint))]' : 'border-gray-200 bg-white'}
                            hover:border-[hsl(var(--wii-blue))] hover:bg-gray-50`}
                        >
                          <div className="font-semibold text-sm text-gray-800">{theme.name}</div>
                          <div className="text-xs text-gray-600">{theme.description}</div>
                          <div className="flex gap-1 mt-1">
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.colors.dockBaseGradientStart }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.colors.dockAccentColor }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.colors.buttonGradientStart }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.colors.buttonIconColor }} />
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[hsl(var(--wii-blue))] flex items-center justify-center text-[hsl(var(--text-on-accent))] text-xs font-bold">
                              ✓
                            </div>
                          )}
                          {isCustomTheme && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              <button
                                onClick={e => { e.stopPropagation(); editCustomTheme(themeKey); }}
                                className="w-5 h-5 rounded-full bg-[hsl(var(--wii-blue))] border-none text-[hsl(var(--text-on-accent))] text-xs flex items-center justify-center"
                                title="Edit theme"
                                type="button"
                              >✏️</button>
                              <button
                                onClick={e => { e.stopPropagation(); deleteCustomTheme(themeKey); }}
                                className="w-5 h-5 rounded-full bg-red-600 border-none text-white text-xs flex items-center justify-center"
                                title="Delete theme"
                                type="button"
                              >🗑️</button>
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
        </div>
      </div>

      {/* Save Current Theme Button */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Save Current Theme</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Save your current color configuration as a custom theme for future use.
          <div className="mt-3.5">
            <Button
              variant="primary"
              onClick={openSaveThemeModal}
              className="text-sm px-4 py-2"
            >
              Save Current Theme
            </Button>
          </div>
        </div>
      </div>

      {/* Dock Base Colors */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Dock Base Colors</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the main dock structure colors.
          <div className="mt-3.5">
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Gradient Start</label>
              <input
                type="color"
                value={dockBaseGradientStart}
                onChange={e => setDockBaseGradientStart(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{dockBaseGradientStart.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Gradient End</label>
              <input
                type="color"
                value={dockBaseGradientEnd}
                onChange={e => setDockBaseGradientEnd(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{dockBaseGradientEnd.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Accent Color</label>
              <input
                type="color"
                value={dockAccentColor}
                onChange={e => setDockAccentColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{dockAccentColor.toUpperCase()}</span>
            </div>
            {recentColors.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 mr-0.5">Recent:</span>
                {recentColors.map((color, idx) => (
                  <button
                    key={color}
                    onClick={() => setDockAccentColor(color)}
                    className={`w-7 h-7 rounded-full outline-none cursor-pointer border ${color === dockAccentColor ? 'border-2 border-[hsl(var(--wii-blue))]' : 'border border-gray-400'}`}
                    style={{ background: color, marginLeft: idx === 0 ? 0 : 2 }}
                    title={color}
                    type="button"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SD Card Colors */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">SD Card Colors</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the SD card appearance.
          <div className="mt-3.5">
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Card Body</label>
              <input
                type="color"
                value={sdCardBodyColor}
                onChange={e => setSdCardBodyColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{sdCardBodyColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Card Border</label>
              <input
                type="color"
                value={sdCardBorderColor}
                onChange={e => setSdCardBorderColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{sdCardBorderColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Label Area</label>
              <input
                type="color"
                value={sdCardLabelColor}
                onChange={e => setSdCardLabelColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{sdCardLabelColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Bottom Section</label>
              <input
                type="color"
                value={sdCardBottomColor}
                onChange={e => setSdCardBottomColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{sdCardBottomColor.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Button Pod Colors */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Button Pod Colors</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the button pod appearance.
          <div className="mt-3.5">
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Left Pod Base</label>
              <input
                type="color"
                value={leftPodBaseColor}
                onChange={e => setLeftPodBaseColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{leftPodBaseColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Right Pod Base</label>
              <input
                type="color"
                value={rightPodBaseColor}
                onChange={e => setRightPodBaseColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{rightPodBaseColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Button Border</label>
              <input
                type="color"
                value={buttonBorderColor}
                onChange={e => setButtonBorderColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{buttonBorderColor.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="font-medium min-w-[140px]">Button Icon</label>
              <input
                type="color"
                value={buttonIconColor}
                onChange={e => setButtonIconColor(e.target.value)}
                className="w-[50px] h-10 rounded-lg border-none cursor-pointer"
              />
              <span className="text-gray-500 text-sm">{buttonIconColor.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Effect Card */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header flex items-center justify-between">
          <span className="wee-card-title">Glass Effect</span>
          <WToggle
            checked={glassEnabled}
            onChange={(checked) => setGlassEnabled(checked)}
          />
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Apply a glass morphism effect to the dock. Creates a frosted glass appearance.
          {glassEnabled && (
            <div className="mt-3.5">
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">Glass Opacity</span>
                  <span className="text-sm text-gray-600">{Math.round(glassOpacity * 100)}%</span>
                </div>
                <Slider
                  value={glassOpacity}
                  onChange={setGlassOpacity}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                />
              </div>
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">Glass Blur</span>
                  <span className="text-sm text-gray-600">{glassBlur}px</span>
                </div>
                <Slider
                  value={glassBlur}
                  onChange={setGlassBlur}
                  min={0.5}
                  max={8}
                  step={0.1}
                />
              </div>
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">Glass Border Intensity</span>
                  <span className="text-sm text-gray-600">{Math.round(glassBorderOpacity * 100)}%</span>
                </div>
                <Slider
                  value={glassBorderOpacity}
                  onChange={setGlassBorderOpacity}
                  min={0.1}
                  max={1}
                  step={0.05}
                />
              </div>
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-gray-600">Glass Shine Intensity</span>
                  <span className="text-sm text-gray-600">{Math.round(glassShineOpacity * 100)}%</span>
                </div>
                <Slider
                  value={glassShineOpacity}
                  onChange={setGlassShineOpacity}
                  min={0.1}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size Settings Card */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Size Settings</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Adjust the height of dock elements. The dock maintains full width while scaling height.
          <div className="mt-3.5">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-600">Dock Height</span>
                <span className="text-sm text-gray-600">{Math.round(dockScale * 100)}%</span>
              </div>
              <Slider
                value={dockScale}
                onChange={setDockScale}
                min={0.5}
                max={2.0}
                step={0.05}
              />
            </div>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-600">Button Size</span>
                <span className="text-sm text-gray-600">{Math.round(buttonSize * 100)}%</span>
              </div>
              <Slider
                value={buttonSize}
                onChange={setButtonSize}
                min={0.5}
                max={1.5}
                step={0.05}
              />
            </div>
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-gray-600">SD Card Size</span>
                <span className="text-sm text-gray-600">{Math.round(sdCardSize * 100)}%</span>
              </div>
              <Slider
                value={sdCardSize}
                onChange={setSdCardSize}
                min={0.5}
                max={2.0}
                step={0.05}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Button Customization Card */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">Button Customization</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the dock buttons. Right-click on any button to open the customization menu.
          <div className="mt-3.5">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium mb-2">Left Button</div>
                <div className="text-xs text-gray-600 mb-3">
                  Right-click to customize
                </div>
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300">
                  <span className="text-xs text-gray-600">Wii</span>
                </div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-sm font-medium mb-2">Right Button</div>
                <div className="text-xs text-gray-600 mb-3">
                  Right-click to customize
                </div>
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-300">
                  <span className="text-xs text-gray-600">Mail</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              💡 Tip: Right-click on any dock button to open the customization menu where you can change icons, text, and add actions.
            </div>
          </div>
        </div>
      </div>

      {/* SD Card Icon Card */}
      <div className="wee-card mt-4 mb-0">
        <div className="wee-card-header">
          <span className="wee-card-title">SD Card Icon</span>
        </div>
        <div className="wee-card-separator" />
        <div className="wee-card-desc">
          Customize the SD card icon that appears on the dock.
          <div className="mt-3.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border-2 border-gray-200 rounded-md flex items-center justify-center bg-gray-100">
                {(normalizedSdCardIcon === 'default' || !normalizedSdCardIcon || normalizedSdCardIcon === '') ? (
                  <svg width="32" height="32" viewBox="0 0 147 198" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* ...svg paths unchanged... */}
                    <path d="M0 12C0 5.37258 5.37258 0 12 0H116.327C119.629 0 122.785 1.36025 125.052 3.76052L143.724 23.5315C145.828 25.759 147 28.707 147 31.7709V186C147 192.627 141.627 198 135 198H12C5.37259 198 0 192.627 0 186V12Z" fill={sdCardBodyColor}/>
                    <path d="M0 186V12C1.93277e-07 5.37258 5.37258 4.83208e-08 12 0H116.327C119.629 0 122.785 1.36048 125.052 3.76074L143.725 23.5312C145.828 25.7587 147 28.7067 147 31.7705V186C147 192.627 141.627 198 135 198V191C137.761 191 140 188.761 140 186V31.7705C140 30.494 139.511 29.2659 138.635 28.3379L119.963 8.56641C119.018 7.56633 117.703 7 116.327 7H12C9.23858 7 7 9.23858 7 12V186C7 188.761 9.23858 191 12 191V198C5.47609 198 0.168106 192.794 0.00390625 186.31L0 186ZM135 191V198H12V191H135Z" fill={sdCardBorderColor}/>
                    <path d="M19 36C19 34.3431 20.3431 33 22 33H124C125.657 33 127 34.3431 127 36V149C127 150.657 125.657 152 124 152H22C20.3431 152 19 150.657 19 149V36Z" fill={sdCardLabelColor}/>
                    <path d="M124 149V152H22V149H124ZM124 36H22V152C20.3949 152 19.0842 150.739 19.0039 149.154L19 149V36C19 34.3431 20.3431 33 22 33H124L124.154 33.0039C125.739 33.0842 127 34.3949 127 36V149C127 150.605 125.739 151.916 124.154 151.996L124 152V36Z" fill={sdCardLabelBorderColor}/>
                    <path d="M19 160C19 158.343 20.3431 157 22 157H124C125.657 157 127 158.343 127 160V178C127 179.657 125.657 181 124 181H22C20.3431 181 19 179.657 19 178V160Z" fill={sdCardBottomColor}/>
                    <path d="M23 109L26 99H47.5C51.5 99 51.0818 96.3852 48 96C43 95.375 38.711 93.0944 36.5 91.5C34 89.6972 32.5 87.5 32.5 85C32.5 82.5 36.9 77 48.5 77H73.5L71.5 83H47.5C44 83 43 85 46.5 86.5C50 88 67 92 67 100C67 106.4 60 108.667 56.5 109H23Z" fill={dockAccentColor}/>
                    <path d="M71 108.5L75 96.5C92.5 95.5 93.5 92.5 95 91.5C96.2 90.7 95.8333 88.1667 95.5 87L114 82C116.667 83.8333 122 88 122 90C122 92.5 122.5 98.5 106 104.5C92.8 109.3 77.1667 109.167 71 108.5Z" fill={dockAccentColor}/>
                    <path d="M110.5 80C105.781 81.5909 99.7536 84.0159 95 85.5C94.8651 85.1501 93.6349 84.3499 93.5 84C97.6595 82.0753 101.341 79.9226 105.5 78L110.5 80Z" fill={dockAccentColor}/>
                    <path d="M98 77L89.5 83.5L78 82.5L82 77H98Z" fill={dockAccentColor}/>
                  </svg>
                ) : isBuiltInIcon(normalizedSdCardIcon) ? (
                  <div className="flex items-center justify-center">
                    {renderBuiltInIcon(normalizedSdCardIcon)}
                  </div>
                ) : (
                  <img
                    src={normalizedSdCardIcon}
                    alt="Custom SD Card Icon"
                    className="w-8 h-8 object-contain rounded"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">
                  {(normalizedSdCardIcon === 'default' || !normalizedSdCardIcon || normalizedSdCardIcon === '') ? 'Default SD Card' : isBuiltInIcon(normalizedSdCardIcon) ? 'Built-in Icon' : 'Custom Icon'}
                </div>
                <div className="text-xs text-gray-600">
                  {(normalizedSdCardIcon === 'default' || !normalizedSdCardIcon || normalizedSdCardIcon === '') ? 'Classic Wii SD card icon' : isBuiltInIcon(normalizedSdCardIcon) ? `${normalizedSdCardIcon.charAt(0).toUpperCase() + normalizedSdCardIcon.slice(1)} icon` : 'Custom uploaded icon'}
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowSdCardIconModal(true)}
                className="text-xs px-3 py-1.5"
              >
                Change Icon
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SD Card Icon Modal */}
      <SDCardiconModal
        isOpen={showSdCardIconModal}
        onClose={() => setShowSdCardIconModal(false)}
        onSettingsChange={handleSdCardIconChange}
        sdCardIcon={normalizedSdCardIcon}
      />

      {/* Save Theme Modal */}
      {showSaveThemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl p-6 w-[400px] max-w-[90vw] shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="m-0 text-lg font-semibold">
                {editingTheme ? 'Edit Theme' : 'Save Theme'}
              </h3>
              <button
                onClick={() => setShowSaveThemeModal(false)}
                className="bg-none border-none text-2xl cursor-pointer text-gray-500"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <label className="block mb-1.5 font-medium">
                Theme Name *
              </label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Enter theme name"
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm"
                autoFocus
              />
            </div>
            <div className="mb-5">
              <label className="block mb-1.5 font-medium">
                Description (optional)
              </label>
              <textarea
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
                placeholder="Enter theme description"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm resize-vertical"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowSaveThemeModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveCustomTheme}
                disabled={!themeName.trim()}
              >
                {editingTheme ? 'Update Theme' : 'Save Theme'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </WBaseModal>
  );
}

ClassicDockSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
  dockSettings: PropTypes.object,
};

export default ClassicDockSettingsModal;