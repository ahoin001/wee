import React, { useState, useEffect } from 'react';
import WBaseModal from './WBaseModal';
import Card from '../ui/Card';
import WToggle from '../ui/WToggle';
import WButton from '../ui/WButton';
import { useNavigationState, useIconState } from '../utils/useConsolidatedAppHooks';
import './surfaceStyles.css';

function NavigationCustomizationModal() {
  const { navigation, navigationManager } = useNavigationState();
  const { icons, iconManager } = useIconState();
  
  const {
    showNavigationModal: isOpen,
    customButtons,
    buttonOrder,
    defaultButtons,
    buttonConfigs
  } = navigation;
  
  const {
    savedIcons,
    loading: iconsLoading,
    error: iconsError,
    uploading: iconsUploading,
    uploadError: iconsUploadError
  } = icons;
  
  const { fetchIcons, uploadIcon, deleteIcon, clearIconError } = iconManager;
  
  // ✅ DATA LAYER: Get current icon from navigation state with proper fallbacks
  const currentIcon = navigation?.currentIcon || null;
  
  // Mock state for compatibility
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);
  const [side, setSide] = useState('left');
  const closeModal = () => navigationManager.closeNavigationModal();
  
  // Glass effect settings
  const [useGlassEffect, setUseGlassEffect] = useState(false);
  const [glassOpacity, setGlassOpacity] = useState(0.18);
  const [glassBlur, setGlassBlur] = useState(2.5);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.5);
  const [glassShineOpacity, setGlassShineOpacity] = useState(0.7);

  // Real-time glass effect preview
  useEffect(() => {
    if (isOpen && useGlassEffect) {
      const previewGlassSettings = {
        enabled: useGlassEffect,
        opacity: glassOpacity,
        blur: glassBlur,
        borderOpacity: glassBorderOpacity,
        shineOpacity: glassShineOpacity
      };
      
      // Dispatch preview event for real-time updates
      window.dispatchEvent(new CustomEvent('navigationGlassPreview', {
        detail: { side, glassSettings: previewGlassSettings }
      }));
    }
  }, [useGlassEffect, glassOpacity, glassBlur, glassBorderOpacity, glassShineOpacity, side, isOpen]);

  // Update selected icon when currentIcon changes
  useEffect(() => {
    if (currentIcon !== undefined) {
      setSelectedIcon(currentIcon);
    }
  }, [currentIcon]);

  // Fetch saved icons and glass settings on open
  useEffect(() => {
    if (isOpen) {
      fetchIcons();
      loadGlassSettings();
    }
  }, [isOpen, fetchIcons]);

  // Load glass effect settings
  const loadGlassSettings = async () => {
    if (window.api?.settings?.get) {
      try {
        const settings = await window.api.settings.get();
        const glassSettings = settings.navigationGlassEffect?.[side] || {};
        
        setUseGlassEffect(glassSettings.enabled || false);
        setGlassOpacity(glassSettings.opacity || 0.18);
        setGlassBlur(glassSettings.blur || 2.5);
        setGlassBorderOpacity(glassSettings.borderOpacity || 0.5);
        setGlassShineOpacity(glassSettings.shineOpacity || 0.7);
      } catch (error) {
        console.error('Failed to load glass settings:', error);
      }
    }
  };

  const handleIconUpload = async () => {
    const result = await uploadIcon();
    if (result.success) {
      setSelectedIcon(result.icon.url);
    }
  };

  const handleDeleteIcon = async (iconUrl) => {
    const result = await deleteIcon(iconUrl);
    if (result.success && selectedIcon === iconUrl) {
      setSelectedIcon(null);
    }
  };

  // Save icons and glass settings to settings and trigger component updates
  const saveSettings = async (side, iconUrl, glassSettings) => {
    if (window.api?.settings?.get && window.api?.settings?.set) {
      try {
        const settings = await window.api.settings.get();
        
        // Save icon settings
        const navigationIcons = settings.navigationIcons || {};
        navigationIcons[side] = iconUrl;
        
        // Save glass effect settings
        const navigationGlassEffect = settings.navigationGlassEffect || {};
        navigationGlassEffect[side] = glassSettings;
        
        await window.api.settings.set({
          ...settings,
          navigationIcons,
          navigationGlassEffect
        });
        
        // Dispatch a custom event to notify WiiSideNavigation of the change
        window.dispatchEvent(new CustomEvent('navigationSettingsChanged', {
          detail: { side, iconUrl, glassSettings }
        }));
      } catch (error) {
        console.error('Failed to save navigation settings:', error);
      }
    }
  };

  const handleSave = async () => {
    const glassSettings = {
      enabled: useGlassEffect,
      opacity: glassOpacity,
      blur: glassBlur,
      borderOpacity: glassBorderOpacity,
      shineOpacity: glassShineOpacity
    };
    await saveSettings(side, selectedIcon, glassSettings);
    closeModal();
  };

  const handleReset = async () => {
    const defaultGlassSettings = {
      enabled: false,
      opacity: 0.18,
      blur: 2.5,
      borderOpacity: 0.5,
      shineOpacity: 0.7
    };
    await saveSettings(side, null, defaultGlassSettings);
    setSelectedIcon(null);
    setUseGlassEffect(false);
    setGlassOpacity(0.18);
    setGlassBlur(2.5);
    setGlassBorderOpacity(0.5);
    setGlassShineOpacity(0.7);
    closeModal();
  };

  const getDefaultIcon = () => {
    if (side === 'left') {
      return (
        <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
          <path 
            d="M12 6 L8 10 L12 14" 
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
          <path 
            d="M8 6 L12 10 L8 14" 
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <WBaseModal
      title={`Customize ${side === 'left' ? 'Left' : 'Right'} Navigation Button`}
      onClose={closeModal}
      maxWidth="800px"
      footerContent={() => (
        <div className="surface-row-between w-full">
          <WButton
            variant="secondary"
            onClick={handleReset}
            className="!bg-[hsl(var(--state-error))] !text-[hsl(var(--text-on-accent))]"
          >
            🔄 Reset to Default
          </WButton>
          
          <div className="surface-actions">
            <WButton
              variant="secondary"
              onClick={closeModal}
            >
              Cancel
            </WButton>
            <WButton
              variant="primary"
              onClick={handleSave}
            >
              Save Changes
            </WButton>
          </div>
        </div>
      )}
    >
      {/* Icon Selection Card */}
      <Card 
        title="Icon Selection"
        separator={true}
        className="mb-[18px]"
      >
        {/* Default Icon Option */}
        <div className="mb-4">
          <button
            onClick={() => setSelectedIcon(null)}
            className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${selectedIcon === null ? 'border-2 border-sky-500 bg-sky-50' : 'border-2 border-slate-200 bg-white'}`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-slate-100">
              {getDefaultIcon()}
            </div>
            <div className="text-left flex-1">
              <div className="font-medium text-slate-800">Default Arrow</div>
              <div className="text-[14px] text-slate-500">Use the built-in arrow icon</div>
            </div>
            {selectedIcon === null && (
              <div className="text-sky-500">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Upload Button */}
        <div className="mb-5">
          <WButton
            variant="primary"
            onClick={handleIconUpload}
            disabled={iconsUploading}
            className="w-full"
          >
            {iconsUploading ? '🔄 Uploading...' : '🎨 Upload Custom Icon'}
          </WButton>
          {iconsUploadError && (
            <div className="text-[hsl(var(--state-error))] text-[13px] mt-2">
              {iconsUploadError}
            </div>
          )}
          <div className="text-[12px] text-secondary mt-1">
            Supports PNG files up to 2MB
          </div>
        </div>

        {/* Saved Icons Grid */}
        <div>
          <div className="surface-row-between mb-3">
            <div className="font-medium text-primary">Your Icons</div>
            <button
              onClick={fetchIcons}
              disabled={iconsLoading}
              className="bg-transparent border-0 text-[hsl(var(--wii-blue))] text-[14px] font-medium disabled:opacity-60"
            >
              {iconsLoading ? '🔄' : '↻'} Refresh
            </button>
          </div>

          {iconsLoading ? (
            <div className="text-center py-8 text-secondary">
              Loading your icons...
            </div>
          ) : savedIcons.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              No custom icons yet. Upload one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2 max-h-[200px] overflow-y-auto">
              {savedIcons.map((iconData) => (
                <div
                  key={iconData.url}
                  className="relative cursor-pointer"
                  onClick={() => setSelectedIcon(iconData.url)}
                >
                  <div
                    className={`rounded-lg p-2 transition-all h-[60px] flex items-center justify-center ${selectedIcon === iconData.url ? 'border-2 border-sky-500 bg-sky-50' : 'border-2 border-slate-200 bg-white'}`}
                  >
                    <img
                      src={iconData.url}
                      alt={iconData.name}
                      className="w-10 h-10 object-contain"
                    />
                    {selectedIcon === iconData.url && (
                      <div className="absolute top-1 right-1 text-sky-500">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteIcon(iconData.url);
                    }}
                    className="absolute -top-1 -left-1 bg-red-600 text-white border-0 rounded-full w-5 h-5 text-[12px] cursor-pointer flex items-center justify-center shadow-[var(--shadow-sm)]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Glass Effect Card */}
      <Card 
        title="Glass Effect"
        separator={true}
        headerActions={
          <WToggle
            checked={useGlassEffect}
            onChange={setUseGlassEffect}
            label="Enable"
          />
        }
      >
        <div className="text-secondary text-[14px] mb-4">
          Apply a glass morphism effect to the navigation button for a modern, translucent appearance.
        </div>
        
        {useGlassEffect && (
          <div className="p-4 bg-secondary rounded-[8px] border border-primary">
            {/* Glass Opacity */}
            <div className="mb-4">
              <div className="surface-row-between mb-2">
                <span className="text-[14px] font-medium text-slate-700">
                  Glass Opacity
                </span>
                <span className="text-[14px] text-slate-500">
                  {(glassOpacity * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={glassOpacity}
                onChange={(e) => setGlassOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Glass Blur */}
            <div className="mb-4">
              <div className="surface-row-between mb-2">
                <span className="text-[14px] font-medium text-slate-700">
                  Blur Strength
                </span>
                <span className="text-[14px] text-slate-500">
                  {glassBlur.toFixed(1)}px
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={glassBlur}
                onChange={(e) => setGlassBlur(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Glass Border Opacity */}
            <div className="mb-4">
              <div className="surface-row-between mb-2">
                <span className="text-[14px] font-medium text-slate-700">
                  Border Opacity
                </span>
                <span className="text-[14px] text-slate-500">
                  {(glassBorderOpacity * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={glassBorderOpacity}
                onChange={(e) => setGlassBorderOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Glass Shine Opacity */}
            <div>
              <div className="surface-row-between mb-2">
                <span className="text-[14px] font-medium text-slate-700">
                  Shine Opacity
                </span>
                <span className="text-[14px] text-slate-500">
                  {(glassShineOpacity * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={glassShineOpacity}
                onChange={(e) => setGlassShineOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </Card>
    </WBaseModal>
  );
}

export default NavigationCustomizationModal; 