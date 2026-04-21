import React, { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { UnifiedAppPathCard } from '../app-library';
import {
  WeeModalShell,
  WeeModalFieldCard,
  WeeSettingsSection,
  WeeButton,
  WeeSectionEyebrow,
  WeeToggle,
  WeeSegmentedControl,
  WeeDescriptionToggleRow,
  WeeHelpParagraph,
  WeeSlider,
} from '../../ui/wee';
import WInput from '../../ui/WInput';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { parseColorToRgb, tintImageWithOverwrite } from '../../utils/iconTinting';
import {
  CSS_STATE_ERROR,
  DEFAULT_RIBBON_GLOW_HEX,
} from '../../design/runtimeColorStrings.js';

const ICON_NEUTRAL_BORDER = 'hsl(var(--border-secondary))';
const ICON_SURFACE = 'hsl(var(--surface-primary))';
const ICON_IDLE_SHADOW = 'var(--shadow-sm)';
const ICON_DELETE_BADGE_FILL = 'hsl(var(--state-error-light))';

function PrimaryActionsModalComponent({
  isOpen,
  onClose,
  onSave,
  config,
  buttonIndex,
  ribbonGlowColor = DEFAULT_RIBBON_GLOW_HEX,
  onExitAnimationComplete,
}) {
  const [type, setType] = useState(config?.type || 'text');
  const [text, setText] = useState(config?.text || (buttonIndex === 0 ? 'Wii' : ''));
  const [icon, setIcon] = useState(config?.icon || null);
  const [actionType, setActionType] = useState(config?.actionType === 'none' ? 'exe' : config?.actionType || 'exe');
  const [action, setAction] = useState(config?.action || '');
  const [appName, setAppName] = useState('');
  const [useWiiGrayFilter, setUseWiiGrayFilter] = useState(config?.useWiiGrayFilter || false);
  const [useAdaptiveColor, setUseAdaptiveColor] = useState(config?.useAdaptiveColor || false);
  const [useGlowEffect, setUseGlowEffect] = useState(config?.useGlowEffect || false);
  const [glowStrength, setGlowStrength] = useState(config?.glowStrength || 20);
  const [useGlassEffect, setUseGlassEffect] = useState(config?.useGlassEffect || false);
  const [glassOpacity, setGlassOpacity] = useState(config?.glassOpacity || 0.18);
  const [glassBlur, setGlassBlur] = useState(config?.glassBlur || 2.5);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(config?.glassBorderOpacity || 0.5);
  const [glassShineOpacity, setGlassShineOpacity] = useState(config?.glassShineOpacity || 0.7);
  const [textFont, setTextFont] = useState(config?.textFont || 'default');
  const [tintedImages, setTintedImages] = useState({});
  const [iconsUploadWarning, setIconsUploadWarning] = useState('');

  // Granular store subscriptions (avoid re-rendering on unrelated appLibrary / icons fields)
  const {
    installedApps,
    appsLoading,
    steamGames,
    steamLoading,
    epicGames,
    epicLoading,
    uwpApps,
    uwpLoading,
    customSteamPath,
    fetchInstalledApps,
    fetchSteamGames,
    fetchEpicGames,
    fetchUwpApps,
  } = useConsolidatedAppStore(
    useShallow((s) => ({
      installedApps: s.appLibrary.installedApps,
      appsLoading: s.appLibrary.appsLoading,
      steamGames: s.appLibrary.steamGames,
      steamLoading: s.appLibrary.steamLoading,
      epicGames: s.appLibrary.epicGames,
      epicLoading: s.appLibrary.epicLoading,
      uwpApps: s.appLibrary.uwpApps,
      uwpLoading: s.appLibrary.uwpLoading,
      customSteamPath: s.appLibrary.customSteamPath,
      fetchInstalledApps: s.appLibraryManager.fetchInstalledApps,
      fetchSteamGames: s.appLibraryManager.fetchSteamGames,
      fetchEpicGames: s.appLibraryManager.fetchEpicGames,
      fetchUwpApps: s.appLibraryManager.fetchUwpApps,
    }))
  );

  const {
    savedIcons,
    iconsLoading,
    iconsUploading,
    iconsUploadError,
    fetchIcons,
    uploadIcon,
    deleteIcon,
  } = useConsolidatedAppStore(
    useShallow((s) => ({
      savedIcons: s.icons.savedIcons,
      iconsLoading: s.icons.loading,
      iconsUploading: s.icons.uploading,
      iconsUploadError: s.icons.uploadError,
      fetchIcons: s.iconManager.fetchIcons,
      uploadIcon: s.iconManager.uploadIcon,
      deleteIcon: s.iconManager.deleteIcon,
    }))
  );

  const unifiedApps = useConsolidatedAppStore((s) => s.unifiedApps);

  useEffect(() => {
    if (config) {
      setType(config.type || 'text');
      setText(config.text || (buttonIndex === 0 ? 'Wii' : ''));
      setIcon(config.icon || null);
      setActionType(config.actionType === 'none' ? 'exe' : config.actionType || 'exe');
      setAction(config.action || '');
      setUseWiiGrayFilter(config.useWiiGrayFilter || false);
      setUseAdaptiveColor(config.useAdaptiveColor || false);
      setUseGlowEffect(config.useGlowEffect || false);
      setGlowStrength(config.glowStrength || 20);
      setUseGlassEffect(config.useGlassEffect || false);
      setGlassOpacity(config.glassOpacity || 0.18);
      setGlassBlur(config.glassBlur || 2.5);
      setGlassBorderOpacity(config.glassBorderOpacity || 0.5);
      setGlassShineOpacity(config.glassShineOpacity || 0.7);
      setTextFont(config.textFont || 'default');
    }
  }, [config, buttonIndex]);

  useEffect(() => {
    if (isOpen) {
      fetchIcons();
    }
  }, [isOpen, fetchIcons]);

  useEffect(() => {
    if (useAdaptiveColor && savedIcons.length > 0) {
      // Use the same color logic as WiiRibbon for consistency
      const colorToUse = ribbonGlowColor;
      const rgbColor = parseColorToRgb(colorToUse);
      const newTintedImages = {};

      savedIcons.forEach(icon => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          try {
          const tintedUrl = await tintImageWithOverwrite(img, rgbColor);
            newTintedImages[icon.url] = tintedUrl;
            setTintedImages(prev => ({ ...prev, ...newTintedImages }));
                  } catch (error) {
          console.error('[PrimaryActionsModal] Error tinting image:', error);
        }
        };
        img.src = icon.url;
      });
    }
  }, [ribbonGlowColor, useAdaptiveColor, savedIcons]);

  useEffect(() => {
    if (isOpen) {
      if (installedApps.length === 0 && !appsLoading) {
        fetchInstalledApps();
      }
      if (uwpApps.length === 0 && !uwpLoading) {
        fetchUwpApps();
      }
      if (steamGames.length === 0 && !steamLoading) {
        fetchSteamGames(customSteamPath);
      }
      if (epicGames.length === 0 && !epicLoading) {
        fetchEpicGames();
      }
    }
  }, [isOpen, installedApps.length, appsLoading, uwpApps.length, uwpLoading, steamGames.length, steamLoading, epicGames.length, epicLoading, fetchInstalledApps, fetchUwpApps, fetchSteamGames, fetchEpicGames, customSteamPath]);

  const getIconColor = () => {
    if (useAdaptiveColor) {
      return ribbonGlowColor;
    }
    return DEFAULT_RIBBON_GLOW_HEX;
  };

  const getIconFilter = () => {
    if (useWiiGrayFilter) {
      return 'grayscale(100%) brightness(0.6) contrast(1.2)';
    }
    return 'none';
  };

  const getImageSource = (originalUrl) => {
    if (useAdaptiveColor && tintedImages[originalUrl]) {
      return tintedImages[originalUrl];
    }
    return originalUrl;
  };

  // Handle Wii gray filter toggle with mutual exclusivity
  const handleWiiGrayFilterToggle = (checked) => {
    setUseWiiGrayFilter(checked);
    if (checked && useAdaptiveColor) {
      setUseAdaptiveColor(false);
    }
  };

  // Handle adaptive color toggle with mutual exclusivity
  const handleAdaptiveColorToggle = async (checked) => {
    setUseAdaptiveColor(checked);
    if (checked && useWiiGrayFilter) {
      setUseWiiGrayFilter(false);
    }
    
    // Generate tinted images for all saved icons when adaptive color is enabled
    if (checked && savedIcons.length > 0) {
      const colorToUse = ribbonGlowColor;
      const rgbColor = parseColorToRgb(colorToUse);
      const newTintedImages = {};
      
      for (const icon of savedIcons) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = async () => {
            const tintedUrl = await tintImageWithOverwrite(img, rgbColor);
            newTintedImages[icon.url] = tintedUrl;
            setTintedImages(prev => ({ ...prev, ...newTintedImages }));
          };
          img.src = icon.url;
        } catch (error) {
          console.error('[PrimaryActionsModal] Error tinting image:', error);
        }
      }
    } else if (!checked) {
      // Clear tinted images when adaptive color is disabled
      setTintedImages({});
    }
  };

  // Upload and save icon immediately
  const handleUploadIcon = async () => {
    setIconsUploadWarning('');
    const result = await uploadIcon();
    if (result.success) {
      setIcon(result.icon.url);
      if (result.warning) {
        setIconsUploadWarning(result.warning);
      }
    }
  };

  const handleDeleteSavedIcon = async (iconUrl) => {
    const result = await deleteIcon(iconUrl);
    if (result.success && icon === iconUrl) {
      setIcon(null);
    }
  };

  const validatePath = () => {
    if (!action.trim()) return true;
    if (actionType === 'url') {
      try {
        const url = new URL(action.trim());
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }
    if (actionType === 'steam') {
      const t = action.trim();
      return (
        t.startsWith('steam://') ||
        t.startsWith('steam://rungameid/') ||
        t.startsWith('steam://launch/')
      );
    }
    if (actionType === 'epic') {
      return action.trim().startsWith('com.epicgames.launcher://apps/');
    }
    if (actionType === 'microsoftstore') {
      return typeof action === 'string' && action.includes('!');
    }
    if (actionType === 'exe') {
      const trimmedPath = action.trim();
      return (
        /\.exe(\s+.*)?$/i.test(trimmedPath) ||
        /\.exe/i.test(trimmedPath) ||
        trimmedPath.startsWith('\\')
      );
    }
    return true;
  };

  // Check if this is for the presets button or accessory button
  const isPresetsButton = buttonIndex === "presets";
  const isAccessoryButton = buttonIndex === "accessory";

  const handleSave = () => {
    
    if (!isPresetsButton && !isAccessoryButton && !validatePath()) return;
    
    const saveData = {
      type,
      text: type === 'text' ? text : '',
      icon: type === 'icon' ? icon : null,
      actionType: actionType, // Use actionType from unified system
      action: action,         // Use action from unified system
      useWiiGrayFilter: type === 'icon' ? useWiiGrayFilter : false,
      useAdaptiveColor,
      useGlowEffect,
      glowStrength,
      useGlassEffect,
      glassOpacity,
      glassBlur,
      glassBorderOpacity,
      glassShineOpacity,
      textFont: type === 'text' ? textFont : 'default', // Include font in save
    };
    
    onSave(saveData);
  };

  // --- Section Renderers ---
  


  function renderIconSection() {
    return (
      <>
        <WeeSegmentedControl
          ariaLabel="Button label type"
          className="mb-4"
          options={[
            { value: 'text', label: 'Text' },
            { value: 'icon', label: 'Icon (PNG)' },
          ]}
          value={type}
          onChange={setType}
        />
        {type === 'text' ? (
          <>
            <WInput
              variant="wee"
              type="text"
              placeholder="Button text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={16}
              className="mb-3"
            />
            <div className="mb-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-[hsl(var(--wee-text-rail-muted))]">
                Text font
              </p>
              <WeeSegmentedControl
                ariaLabel="Text font"
                wrap
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'digital', label: 'Digital' },
                ]}
                value={textFont}
                onChange={setTextFont}
              />
            </div>
          </>
        ) : (
          <>
            {/* Built-in Icons Section */}
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-[hsl(var(--wee-text-rail-muted))]">
                Built-in icons
              </p>
              <div className="flex gap-2 flex-wrap">
                {/* Palette Icon */}
                <button
                  type="button"
                  style={{
                    border: icon === 'palette' ? `2.5px solid ${getIconColor()}` : `1.5px solid ${ICON_NEUTRAL_BORDER}`,
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'palette' ? `${getIconColor()}10` : ICON_SURFACE,
                    boxShadow: icon === 'palette' ? `0 0 0 2px ${getIconColor()}40` : ICON_IDLE_SHADOW,
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('palette')}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={getIconColor()} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ filter: getIconFilter() }}
                  >
                    <circle cx="13.5" cy="6.5" r="2.5"/>
                    <circle cx="17.5" cy="10.5" r="2.5"/>
                    <circle cx="8.5" cy="7.5" r="2.5"/>
                    <circle cx="6.5" cy="12.5" r="2.5"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                </button>
                
                {/* Star Icon */}
                <button
                  type="button"
                  style={{
                    border: icon === 'star' ? `2.5px solid ${getIconColor()}` : `1.5px solid ${ICON_NEUTRAL_BORDER}`,
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'star' ? `${getIconColor()}10` : ICON_SURFACE,
                    boxShadow: icon === 'star' ? `0 0 0 2px ${getIconColor()}40` : ICON_IDLE_SHADOW,
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('star')}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={getIconColor()} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ filter: getIconFilter() }}
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </button>
                
                {/* Heart Icon */}
                <button
                  type="button"
                  style={{
                    border: icon === 'heart' ? `2.5px solid ${getIconColor()}` : `1.5px solid ${ICON_NEUTRAL_BORDER}`,
                    borderRadius: 8,
                    padding: 8,
                    background: icon === 'heart' ? `${getIconColor()}10` : ICON_SURFACE,
                    boxShadow: icon === 'heart' ? `0 0 0 2px ${getIconColor()}40` : ICON_IDLE_SHADOW,
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'border 0.18s, box-shadow 0.18s',
                  }}
                  onClick={() => setIcon('heart')}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={getIconColor()} 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ filter: getIconFilter() }}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Upload New Icon Button */}
            <WeeButton
              type="button"
              variant="primary"
              onClick={handleUploadIcon}
              disabled={iconsUploading}
              className="mb-4"
            >
              {iconsUploading ? 'Uploading...' : 'Upload New Icon'}
            </WeeButton>
            {iconsUploadError ? (
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--state-error))]">
                {iconsUploadError}
              </p>
            ) : null}
            {iconsUploadWarning ? (
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--state-warning))]">
                {iconsUploadWarning}
              </p>
            ) : null}
            {/* Saved Icons Section */}
            <div className="mb-3">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-[hsl(var(--wee-text-rail-muted))]">
                Your saved icons
              </p>
              {iconsLoading ? (
                <WeeHelpParagraph className="mb-3">Loading saved icons…</WeeHelpParagraph>
              ) : savedIcons.length > 0 ? (
                <div className="flex gap-3 flex-wrap">
                  {savedIcons.map((i, idx) => (
                    <div key={i.url} style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        type="button"
                        style={{
                          border: icon === i.url ? `2.5px solid ${getIconColor()}` : `1.5px solid ${ICON_NEUTRAL_BORDER}`,
                          borderRadius: 8,
                          padding: 0,
                          background: icon === i.url ? `${getIconColor()}10` : ICON_SURFACE,
                          boxShadow: icon === i.url ? `0 0 0 2px ${getIconColor()}40` : ICON_IDLE_SHADOW,
                          outline: 'none',
                          cursor: 'pointer',
                          width: 44,
                          height: 44,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'border 0.18s, box-shadow 0.18s',
                        }}
                        aria-label={`Select saved icon ${idx + 1}`}
                        onClick={() => setIcon(i.url)}
                      >
                        <img 
                          src={getImageSource(i.url)} 
                          alt={i.name} 
                          style={{ 
                            maxHeight: 32, 
                            maxWidth: 32, 
                            borderRadius: 6,
                            filter: getIconFilter()
                          }} 
                        />
                      </button>
                      <button
                        type="button"
                        title="Delete icon"
                        className="icon-delete-btn absolute -right-2 -top-2 z-[2] flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border-0 bg-[hsl(var(--surface-primary))] text-[hsl(var(--state-error))] shadow-[var(--shadow-md)] transition-colors hover:bg-[hsl(var(--state-error)/0.13)]"
                        onClick={() => handleDeleteSavedIcon(i.url)}
                        aria-label="Delete icon"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="10" fill={ICON_DELETE_BADGE_FILL}/>
                          <path d="M7.5 10.5L10 8m0 0l2.5 2.5M10 8v4" stroke={CSS_STATE_ERROR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="6.5" y="6.5" width="7" height="7" rx="1.5" stroke={CSS_STATE_ERROR} strokeWidth="1.2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <WeeHelpParagraph className="mb-3">No saved icons yet.</WeeHelpParagraph>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  const modalTitle = isPresetsButton
    ? 'Customize Presets Button'
    : isAccessoryButton
      ? 'Customize Accessory Button'
      : 'Primary Actions';

  return (
    <WeeModalShell
      isOpen={isOpen}
      onClose={onClose}
      onExitAnimationComplete={onExitAnimationComplete}
      headerTitle={modalTitle}
      showRail={false}
      maxWidth="min(760px, 96vw)"
      footerContent={({ handleClose }) => (
        <div className="flex flex-wrap justify-end gap-3">
          <WeeButton type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </WeeButton>
          <WeeButton
            type="button"
            variant="primary"
            onClick={() => {
              if (isPresetsButton || isAccessoryButton || validatePath()) {
                handleSave();
                handleClose();
              }
            }}
          >
            Save
          </WeeButton>
        </div>
      )}
    >
      <WeeModalFieldCard className="mb-6">
        <WeeSettingsSection
          className="!mb-0"
          label={isPresetsButton ? 'Presets button icon' : isAccessoryButton ? 'Accessory button icon' : 'Channel icon'}
          description={
            isPresetsButton
              ? 'Choose or upload a custom icon for the presets button. This button opens the presets modal when clicked.'
              : isAccessoryButton
                ? 'Choose or upload a custom icon for the accessory button. This button can be configured to launch apps or URLs.'
                : 'Choose or upload a custom icon for this channel. PNG recommended for best results.'
          }
        >
          {renderIconSection()}
        </WeeSettingsSection>
      </WeeModalFieldCard>

      {type === 'icon' && !isPresetsButton && !isAccessoryButton && (
        <WeeModalFieldCard className="mb-6">
          <WeeSettingsSection className="!mb-0" label="Icon color settings">
            <div className="mb-4 space-y-4">
              <WeeDescriptionToggleRow description="Make the icon Wii gray to match the classic Wii button style.">
                <WeeToggle
                  checked={useWiiGrayFilter}
                  onChange={handleWiiGrayFilterToggle}
                  label="Use Wii button color filter"
                />
              </WeeDescriptionToggleRow>
              <WeeDescriptionToggleRow
                description={`Make the icon color match the ribbon glow color (${ribbonGlowColor}).`}
              >
                <WeeToggle
                  checked={useAdaptiveColor}
                  onChange={handleAdaptiveColorToggle}
                  label="Use adaptive color"
                />
              </WeeDescriptionToggleRow>
            </div>
          </WeeSettingsSection>
        </WeeModalFieldCard>
      )}

      {!isPresetsButton && (
        <WeeModalFieldCard className="mb-6">
          <WeeSettingsSection
            className="!mb-0"
            label="App path"
            description="Search and pick apps across EXE, Steam, Epic, and Microsoft Store in one place."
          >
          <UnifiedAppPathCard
              key={`unified-app-path-${buttonIndex}-${isOpen}`} // Force remount when button or modal changes
              value={{
                launchType: actionType === 'url' ? 'url' : 'application',
                appName: appName,
                path: action,
                selectedApp: unifiedApps?.selectedApp || null // Pass the selected app from consolidated store
              }}
              onChange={(config) => {
                if (config.launchType === 'url') {
                  setActionType('url');
                  setAction(config.path || '');
                  setAppName('');
                } else {
                  // Map app type to action type
                  let newActionType = 'exe'; // default
                  if (config.selectedApp) {
                    switch (config.selectedApp.type) {
                      case 'steam':
                        newActionType = 'steam';
                        break;
                      case 'epic':
                        newActionType = 'epic';
                        break;
                      case 'microsoft':
                        newActionType = 'microsoftstore';
                        break;
                      case 'exe':
                      default:
                        newActionType = 'exe';
                        break;
                    }
                  }
                  setActionType(newActionType);
                  setAction(config.path || '');
                  if (config.selectedApp) {
                    setAppName(config.selectedApp.name);
                  }
                }
              }}
            />
          </WeeSettingsSection>
        </WeeModalFieldCard>
      )}

      <WeeModalFieldCard className="mb-6">
        <WeeSettingsSection
          className="!mb-0"
          label="Hover effect"
          description="Choose how the button looks when you hover over it."
        >
          <div className="mb-3 space-y-3">
            <WeeSegmentedControl
              ariaLabel="Hover highlight style"
              className="mb-1"
              options={[
                { value: 'border', label: 'Border' },
                { value: 'glow', label: 'Glow' },
              ]}
              value={useGlowEffect ? 'glow' : 'border'}
              onChange={(v) => setUseGlowEffect(v === 'glow')}
            />
            <div className="pl-0 sm:pl-1">
              <WeeToggle
                checked={useAdaptiveColor}
                onChange={(checked) => setUseAdaptiveColor(checked)}
                label="Adaptive color (ribbon glow)"
              />
            </div>
          </div>

          {useGlowEffect ? (
            <div className="mt-2 border-t border-[hsl(var(--border-primary)/0.2)] pt-3">
              <div className="mb-2 flex items-center gap-3">
                <span className="min-w-[4.5rem] text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--wee-text-rail-muted))]">
                  Strength
                </span>
                <WeeSlider
                  min={5}
                  max={50}
                  step={1}
                  value={glowStrength}
                  onChange={setGlowStrength}
                  className="flex-1"
                  aria-label="Glow strength"
                />
                <span className="min-w-[2.5rem] text-right text-[11px] font-black tabular-nums text-[hsl(var(--wee-text-header))]">
                  {glowStrength}px
                </span>
              </div>
            </div>
          ) : null}
        </WeeSettingsSection>
      </WeeModalFieldCard>

      <WeeModalFieldCard>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <WeeSectionEyebrow>Glass effect</WeeSectionEyebrow>
            <WeeHelpParagraph className="mt-2 max-w-prose">
              Apply a glass morphism effect to the button background. Text and icons appear above the glass.
            </WeeHelpParagraph>
          </div>
          <WeeToggle checked={useGlassEffect} onChange={(checked) => setUseGlassEffect(checked)} label="Enable" />
        </div>
        {useGlassEffect ? (
          <div className="space-y-4 border-t border-[hsl(var(--border-primary)/0.2)] pt-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--wee-text-rail-muted))]">
                  Opacity
                </span>
                <span className="text-[11px] font-black tabular-nums text-[hsl(var(--wee-text-header))]">
                  {Math.round(glassOpacity * 100)}%
                </span>
              </div>
              <WeeSlider
                min={0.05}
                max={0.5}
                step={0.01}
                value={glassOpacity}
                onChange={setGlassOpacity}
                aria-label="Glass opacity"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--wee-text-rail-muted))]">
                  Blur
                </span>
                <span className="text-[11px] font-black tabular-nums text-[hsl(var(--wee-text-header))]">{glassBlur}px</span>
              </div>
              <WeeSlider min={0.5} max={8} step={0.1} value={glassBlur} onChange={setGlassBlur} aria-label="Glass blur" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--wee-text-rail-muted))]">
                  Border
                </span>
                <span className="text-[11px] font-black tabular-nums text-[hsl(var(--wee-text-header))]">
                  {Math.round(glassBorderOpacity * 100)}%
                </span>
              </div>
              <WeeSlider
                min={0.1}
                max={1}
                step={0.05}
                value={glassBorderOpacity}
                onChange={setGlassBorderOpacity}
                aria-label="Glass border intensity"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[hsl(var(--wee-text-rail-muted))]">
                  Shine
                </span>
                <span className="text-[11px] font-black tabular-nums text-[hsl(var(--wee-text-header))]">
                  {Math.round(glassShineOpacity * 100)}%
                </span>
              </div>
              <WeeSlider
                min={0.1}
                max={1}
                step={0.05}
                value={glassShineOpacity}
                onChange={setGlassShineOpacity}
                aria-label="Glass shine intensity"
              />
            </div>
          </div>
        ) : null}
      </WeeModalFieldCard>
    </WeeModalShell>
  );
}

function arePrimaryActionsModalPropsEqual(prev, next) {
  return (
    prev.isOpen === next.isOpen &&
    prev.buttonIndex === next.buttonIndex &&
    prev.ribbonGlowColor === next.ribbonGlowColor &&
    prev.config === next.config &&
    prev.onClose === next.onClose &&
    prev.onSave === next.onSave &&
    prev.onExitAnimationComplete === next.onExitAnimationComplete
  );
}

const PrimaryActionsModal = React.memo(
  PrimaryActionsModalComponent,
  arePrimaryActionsModalPropsEqual
);

export default PrimaryActionsModal;
