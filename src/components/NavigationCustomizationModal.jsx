import React, { useState, useEffect } from 'react';
import WBaseModal from './WBaseModal';
import Card from '../ui/Card';
import WToggle from '../ui/WToggle';
import useNavigationModalStore from '../utils/useNavigationModalStore';
import useIconsStore from '../utils/useIconsStore';

function NavigationCustomizationModal() {
  const { isOpen, selectedSide: side, currentIcon, closeModal } = useNavigationModalStore();
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);
  
  // Icons store
  const {
    savedIcons,
    loading: iconsLoading,
    error: iconsError,
    uploading: iconsUploading,
    uploadError: iconsUploadError,
    fetchIcons,
    uploadIcon,
    deleteIcon,
    clearError: clearIconsError
  } = useIconsStore();
  
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
    setSelectedIcon(currentIcon);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button
            onClick={handleReset}
            style={{ 
              background: '#dc3545', 
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Reset to Default
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={closeModal}
              style={{ 
                background: '#6c757d', 
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{ 
                background: '#0ea5e9', 
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    >
      {/* Preview Card */}
      {/* <Card 
        title="Preview"
        separator={true}
        style={{ marginBottom: 18 }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
            marginBottom: '12px'
          }}>
            {selectedIcon ? (
              <img 
                src={selectedIcon} 
                alt="Selected icon" 
                style={{ width: 32, height: 32, objectFit: 'contain' }}
              />
            ) : (
              <div style={{ color: 'white' }}>
                {getDefaultIcon()}
              </div>
            )}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {selectedIcon ? 'Custom Icon' : 'Default Icon'}
          </div>
        </div>
      </Card> */}

      {/* Icon Selection Card */}
      <Card 
        title="Icon Selection"
        separator={true}
        style={{ marginBottom: 18 }}
      >
        {/* Default Icon Option */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setSelectedIcon(null)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: selectedIcon === null ? '2px solid #0ea5e9' : '2px solid #e5e7eb',
              borderRadius: '8px',
              background: selectedIcon === null ? '#f0f9ff' : 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '6px',
              background: '#f3f4f6'
            }}>
              {getDefaultIcon()}
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontWeight: 500, color: '#1f2937' }}>Default Arrow</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Use the built-in arrow icon</div>
            </div>
            {selectedIcon === null && (
              <div style={{ color: '#0ea5e9' }}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Upload Button */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={handleIconUpload}
            disabled={iconsUploading}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: iconsUploading ? '#9ca3af' : '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: iconsUploading ? 'not-allowed' : 'pointer'
            }}
          >
            {iconsUploading ? '🔄 Uploading...' : '🎨 Upload Custom Icon'}
          </button>
          {iconsUploadError && (
            <div style={{ color: '#dc3545', fontSize: '13px', marginTop: '8px' }}>
              {iconsUploadError}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Supports PNG files up to 2MB
          </div>
        </div>

        {/* Saved Icons Grid */}
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px' 
          }}>
            <div style={{ fontWeight: 500, color: '#1f2937' }}>Your Icons</div>
            <button
              onClick={fetchIcons}
              disabled={iconsLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#0ea5e9',
                cursor: iconsLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              {iconsLoading ? '🔄' : '↻'} Refresh
            </button>
          </div>

          {iconsLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
              Loading your icons...
            </div>
          ) : savedIcons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
              No custom icons yet. Upload one to get started!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {savedIcons.map((iconData) => (
                <div
                  key={iconData.url}
                  style={{
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedIcon(iconData.url)}
                >
                  <div
                    style={{
                      border: selectedIcon === iconData.url ? '2px solid #0ea5e9' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px',
                      background: selectedIcon === iconData.url ? '#f0f9ff' : 'white',
                      transition: 'all 0.2s ease',
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={iconData.url}
                      alt={iconData.name}
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        objectFit: 'contain' 
                      }}
                    />
                    {selectedIcon === iconData.url && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        color: '#0ea5e9'
                      }}>
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
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '-4px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
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
        <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Apply a glass morphism effect to the navigation button for a modern, translucent appearance.
        </div>
        
        {useGlassEffect && (
          <div style={{ 
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            {/* Glass Opacity */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 8 
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  Glass Opacity
                </span>
                <span style={{ fontSize: 14, color: '#6b7280' }}>
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
                style={{ width: '100%' }}
              />
            </div>

            {/* Glass Blur */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 8 
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  Blur Strength
                </span>
                <span style={{ fontSize: 14, color: '#6b7280' }}>
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
                style={{ width: '100%' }}
              />
            </div>

            {/* Glass Border Opacity */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 8 
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  Border Opacity
                </span>
                <span style={{ fontSize: 14, color: '#6b7280' }}>
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
                style={{ width: '100%' }}
              />
            </div>

            {/* Glass Shine Opacity */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 8 
              }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  Shine Opacity
                </span>
                <span style={{ fontSize: 14, color: '#6b7280' }}>
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
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </Card>
    </WBaseModal>
  );
}

export default NavigationCustomizationModal; 