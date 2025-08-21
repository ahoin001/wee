import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WInput from '../../ui/WInput';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const NavigationSettingsTab = () => {
  const { setNavigationState, navigation } = useConsolidatedAppStore();
  
  // Local state for form inputs
  const [leftIcon, setLeftIcon] = useState('');
  const [rightIcon, setRightIcon] = useState('');
  const [leftGlassEnabled, setLeftGlassEnabled] = useState(false);
  const [rightGlassEnabled, setRightGlassEnabled] = useState(false);
  const [leftGlassOpacity, setLeftGlassOpacity] = useState(0.18);
  const [rightGlassOpacity, setRightGlassOpacity] = useState(0.18);
  const [leftGlassBlur, setLeftGlassBlur] = useState(2.5);
  const [rightGlassBlur, setRightGlassBlur] = useState(2.5);
  const [leftGlassBorderOpacity, setLeftGlassBorderOpacity] = useState(0.5);
  const [rightGlassBorderOpacity, setRightGlassBorderOpacity] = useState(0.5);
  const [leftGlassShineOpacity, setLeftGlassShineOpacity] = useState(0.7);
  const [rightGlassShineOpacity, setRightGlassShineOpacity] = useState(0.7);
  const [spotifyIntegration, setSpotifyIntegration] = useState(false);

  // Icon management state
  const [savedIcons, setSavedIcons] = useState([]);
  const [iconsLoading, setIconsLoading] = useState(false);
  const [iconsError, setIconsError] = useState(null);
  const [iconsUploading, setIconsUploading] = useState(false);
  const [iconsUploadError, setIconsUploadError] = useState(null);

  // Load current settings on mount
  useEffect(() => {
    // Load from store
    if (navigation.icons) {
      setLeftIcon(navigation.icons.left || '');
      setRightIcon(navigation.icons.right || '');
    }
    
    if (navigation.glassEffect) {
      const leftGlass = navigation.glassEffect.left;
      const rightGlass = navigation.glassEffect.right;
      
      if (leftGlass) {
        setLeftGlassEnabled(leftGlass.enabled || false);
        setLeftGlassOpacity(leftGlass.opacity || 0.18);
        setLeftGlassBlur(leftGlass.blur || 2.5);
        setLeftGlassBorderOpacity(leftGlass.borderOpacity || 0.5);
        setLeftGlassShineOpacity(leftGlass.shineOpacity || 0.7);
      }
      
      if (rightGlass) {
        setRightGlassEnabled(rightGlass.enabled || false);
        setRightGlassOpacity(rightGlass.opacity || 0.18);
        setRightGlassBlur(rightGlass.blur || 2.5);
        setRightGlassBorderOpacity(rightGlass.borderOpacity || 0.5);
        setRightGlassShineOpacity(rightGlass.shineOpacity || 0.7);
      }
    }
    
    setSpotifyIntegration(navigation.spotifyIntegration || false);
    
    // Load saved icons
    fetchIcons();
  }, [navigation]);

  // Fetch saved icons
  const fetchIcons = async () => {
    setIconsLoading(true);
    setIconsError(null);
    
    try {
      if (window.api?.data?.get) {
        const iconsData = await window.api.data.get('savedIcons') || [];
        // Ensure iconsData is always an array
        setSavedIcons(Array.isArray(iconsData) ? iconsData : []);
      } else {
        // If API is not available, set empty array
        setSavedIcons([]);
      }
    } catch (error) {
      console.error('Failed to fetch icons:', error);
      setIconsError('Failed to load saved icons');
      // Set empty array on error
      setSavedIcons([]);
    } finally {
      setIconsLoading(false);
    }
  };

  // Upload icon
  const uploadIcon = async () => {
    setIconsUploading(true);
    setIconsUploadError(null);
    
    try {
      if (window.api?.file?.selectFile) {
        const result = await window.api.file.selectFile({
          title: 'Select Icon',
          filters: [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'] }
          ],
          properties: ['openFile']
        });
        
        if (result.canceled) {
          return { success: false };
        }
        
        const filePath = result.filePaths[0];
        
        // Save icon to data store
        const newIcon = {
          id: Date.now().toString(),
          name: filePath.split('/').pop().split('\\').pop(),
          url: `file://${filePath}`,
          uploadedAt: new Date().toISOString()
        };
        
        const currentIcons = Array.isArray(savedIcons) ? savedIcons : [];
        const updatedIcons = [...currentIcons, newIcon];
        await window.api.data.set('savedIcons', updatedIcons);
        setSavedIcons(updatedIcons);
        
        return { success: true, icon: newIcon };
      }
    } catch (error) {
      console.error('Failed to upload icon:', error);
      setIconsUploadError('Failed to upload icon');
      return { success: false, error: error.message };
    } finally {
      setIconsUploading(false);
    }
    
    return { success: false };
  };

  // Delete icon
  const deleteIcon = async (iconUrl) => {
    try {
      const currentIcons = Array.isArray(savedIcons) ? savedIcons : [];
      const updatedIcons = currentIcons.filter(icon => icon.url !== iconUrl);
      await window.api.data.set('savedIcons', updatedIcons);
      setSavedIcons(updatedIcons);
      
      // Clear from navigation if it was being used
      if (leftIcon === iconUrl) {
        setLeftIcon('');
      }
      if (rightIcon === iconUrl) {
        setRightIcon('');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete icon:', error);
      return { success: false, error: error.message };
    }
  };

  // Save settings
  const saveSettings = () => {
    try {
      setNavigationState({
        icons: {
          left: leftIcon,
          right: rightIcon
        },
        glassEffect: {
          left: {
            enabled: leftGlassEnabled,
            opacity: leftGlassOpacity,
            blur: leftGlassBlur,
            borderOpacity: leftGlassBorderOpacity,
            shineOpacity: leftGlassShineOpacity
          },
          right: {
            enabled: rightGlassEnabled,
            opacity: rightGlassOpacity,
            blur: rightGlassBlur,
            borderOpacity: rightGlassBorderOpacity,
            shineOpacity: rightGlassShineOpacity
          }
        },
        spotifyIntegration: spotifyIntegration
      });
      
      console.log('Navigation settings saved successfully');
    } catch (error) {
      console.error('Failed to save navigation settings:', error);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setLeftIcon('');
    setRightIcon('');
    setLeftGlassEnabled(false);
    setRightGlassEnabled(false);
    setLeftGlassOpacity(0.18);
    setRightGlassOpacity(0.18);
    setLeftGlassBlur(2.5);
    setRightGlassBlur(2.5);
    setLeftGlassBorderOpacity(0.5);
    setRightGlassBorderOpacity(0.5);
    setLeftGlassShineOpacity(0.7);
    setRightGlassShineOpacity(0.7);
    setSpotifyIntegration(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h3" className="text-[hsl(var(--text-primary))]">
            Navigation Settings
          </Text>
          <Text variant="body" className="text-[hsl(var(--text-secondary))] mt-1">
            Customize the side navigation buttons appearance and behavior
          </Text>
        </div>
        <div className="flex gap-2">
          <WButton variant="secondary" onClick={resetToDefaults}>
            Reset to Defaults
          </WButton>
          <WButton variant="primary" onClick={saveSettings}>
            Save Settings
          </WButton>
        </div>
      </div>

      {/* Spotify Integration */}
      <Card variant="wii-feature" color="green" icon="🎵" title="Spotify Integration" subtitle="Dynamic color matching" noHover={true}>
        <div className="space-y-4">
          <WToggle
            label="Enable Spotify Dynamic Colors"
            description="Use colors from currently playing Spotify track for navigation buttons"
            checked={spotifyIntegration}
            onChange={setSpotifyIntegration}
          />
          {spotifyIntegration && (
            <div className="p-4 bg-[hsl(var(--surface-secondary))] rounded-lg border border-[hsl(var(--border-primary))]">
              <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                When enabled, the left navigation button will use the secondary color from the Spotify track art, 
                and the right navigation button will use the accent color. Text colors will also adapt to the track's color scheme.
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Icon Management */}
      <Card variant="wii-feature" color="blue" icon="🎨" title="Icon Management" subtitle="Upload and manage custom icons" noHover={true}>
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text variant="h4" className="text-[hsl(var(--text-primary))]">Upload New Icon</Text>
              <WButton 
                variant="secondary" 
                onClick={fetchIcons}
                disabled={iconsLoading}
              >
                {iconsLoading ? '🔄' : '↻'} Refresh
              </WButton>
            </div>
            
            <WButton 
              variant="primary" 
              onClick={uploadIcon}
              disabled={iconsUploading}
            >
              {iconsUploading ? '🔄 Uploading...' : '🎨 Upload Custom Icon'}
            </WButton>
            
            {iconsUploadError && (
              <div className="text-red-500 text-sm">
                {iconsUploadError}
              </div>
            )}
            
            <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
              Supports PNG, JPG, GIF, and SVG files up to 2MB
            </Text>
          </div>

          {/* Saved Icons Grid */}
          <div className="space-y-3">
            <Text variant="h4" className="text-[hsl(var(--text-primary))]">Your Icons</Text>
            
            {iconsLoading ? (
              <div className="text-center py-8 text-[hsl(var(--text-secondary))]">
                Loading your icons...
              </div>
            ) : !Array.isArray(savedIcons) || savedIcons.length === 0 ? (
              <div className="text-center py-8 text-[hsl(var(--text-secondary))]">
                No custom icons yet. Upload one to get started!
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-3 max-h-48 overflow-y-auto">
                {savedIcons.map((iconData) => (
                  <div
                    key={iconData.id}
                    className="relative group cursor-pointer"
                  >
                    <div
                      className={`p-2 rounded-lg border-2 transition-all ${
                        (leftIcon === iconData.url || rightIcon === iconData.url) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={iconData.url}
                        alt={iconData.name}
                        className="w-8 h-8 object-contain mx-auto"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteIcon(iconData.url);
                      }}
                      className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Icon Selection */}
      <Card variant="wii-feature" color="purple" icon="🎯" title="Icon Selection" subtitle="Choose icons for each button" noHover={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Button Icon */}
          <div className="space-y-3">
            <Text variant="h4" className="text-[hsl(var(--text-primary))]">Left Button Icon</Text>
            
            {/* Default Option */}
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                !leftIcon ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setLeftIcon('')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M12 6 L8 10 L12 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <Text variant="body" className="font-medium">Default Arrow</Text>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))]">Built-in left arrow</Text>
                </div>
              </div>
            </div>
            
            {/* Custom Icon Options */}
            {Array.isArray(savedIcons) && savedIcons.map((iconData) => (
              <div
                key={`left-${iconData.id}`}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  leftIcon === iconData.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setLeftIcon(iconData.url)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={iconData.url}
                    alt={iconData.name}
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <Text variant="body" className="font-medium">{iconData.name}</Text>
                    <Text variant="caption" className="text-[hsl(var(--text-secondary))]">Custom icon</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Button Icon */}
          <div className="space-y-3">
            <Text variant="h4" className="text-[hsl(var(--text-primary))]">Right Button Icon</Text>
            
            {/* Default Option */}
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                !rightIcon ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setRightIcon('')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M8 6 L12 10 L8 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <Text variant="body" className="font-medium">Default Arrow</Text>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))]">Built-in right arrow</Text>
                </div>
              </div>
            </div>
            
            {/* Custom Icon Options */}
            {Array.isArray(savedIcons) && savedIcons.map((iconData) => (
              <div
                key={`right-${iconData.id}`}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  rightIcon === iconData.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setRightIcon(iconData.url)}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={iconData.url}
                    alt={iconData.name}
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <Text variant="body" className="font-medium">{iconData.name}</Text>
                    <Text variant="caption" className="text-[hsl(var(--text-secondary))]">Custom icon</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Glass Effect Settings */}
      <Card variant="wii-feature" color="purple" icon="✨" title="Glass Effect" subtitle="Customize the glass morphism effect" noHover={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Button Glass Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Text variant="h4" className="text-[hsl(var(--text-primary))]">Left Button</Text>
              <WToggle
                checked={leftGlassEnabled}
                onChange={setLeftGlassEnabled}
              />
            </div>
            
            {leftGlassEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-[hsl(var(--border-primary))]">
                <div>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))] mb-2 block">
                    Background Opacity: {leftGlassOpacity.toFixed(2)}
                  </Text>
                  <Slider
                    value={leftGlassOpacity}
                    onChange={setLeftGlassOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                
                <div>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))] mb-2 block">
                    Blur Amount: {leftGlassBlur.toFixed(1)}px
                  </Text>
                  <Slider
                    value={leftGlassBlur}
                    onChange={setLeftGlassBlur}
                    min={0}
                    max={10}
                    step={0.1}
                  />
                </div>
                
                <div>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))] mb-2 block">
                    Border Opacity: {leftGlassBorderOpacity.toFixed(2)}
                  </Text>
                  <Slider
                    value={leftGlassBorderOpacity}
                    onChange={setLeftGlassBorderOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                
                <div>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))] mb-2 block">
                    Shine Opacity: {leftGlassShineOpacity.toFixed(2)}
                  </Text>
                  <Slider
                    value={leftGlassShineOpacity}
                    onChange={setLeftGlassShineOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Button Glass Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Text variant="h4" className="text-[hsl(var(--text-primary))]">Right Button</Text>
              <WToggle
                checked={rightGlassEnabled}
                onChange={setRightGlassEnabled}
              />
            </div>
            
            {rightGlassEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-[hsl(var(--border-primary))]">
                <div>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))] mb-2 block">
                    Background Opacity: {rightGlassOpacity.toFixed(2)}
                  </Text>
                  <Slider
                    value={rightGlassOpacity}
                    onChange={setRightGlassOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                
                <div>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))] mb-2 block">
                    Blur Amount: {rightGlassBlur.toFixed(1)}px
                  </Text>
                  <Slider
                    value={rightGlassBlur}
                    onChange={setRightGlassBlur}
                    min={0}
                    max={10}
                    step={0.1}
                  />
                </div>
                
                <div>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))] mb-2 block">
                    Border Opacity: {rightGlassBorderOpacity.toFixed(2)}
                  </Text>
                  <Slider
                    value={rightGlassBorderOpacity}
                    onChange={setRightGlassBorderOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                
                <div>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))] mb-2 block">
                    Shine Opacity: {rightGlassShineOpacity.toFixed(2)}
                  </Text>
                  <Slider
                    value={rightGlassShineOpacity}
                    onChange={setRightGlassShineOpacity}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Preview Section */}
      <Card variant="wii-stats" color="gray" icon="👁️" title="Preview" subtitle="See how your navigation will look" noHover={true}>
        <div className="flex justify-center items-center gap-8 p-6 bg-[hsl(var(--surface-secondary))] rounded-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-[hsl(var(--surface-primary))] rounded-lg border border-[hsl(var(--border-primary))] flex items-center justify-center mb-2">
              <span className="text-lg">←</span>
            </div>
            <Text variant="caption" className="text-[hsl(var(--text-secondary))]">Left Button</Text>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[hsl(var(--surface-primary))] rounded-lg border border-[hsl(var(--border-primary))] flex items-center justify-center mb-2">
              <span className="text-lg">→</span>
            </div>
            <Text variant="caption" className="text-[hsl(var(--text-secondary))]">Right Button</Text>
          </div>
        </div>
        <Text variant="caption" className="text-[hsl(var(--text-secondary))] mt-4 text-center">
          Note: The actual appearance will depend on your current wallpaper and Spotify track (if enabled)
        </Text>
      </Card>
    </div>
  );
};

export default NavigationSettingsTab;
