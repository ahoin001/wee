import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WSelect from '../../ui/WSelect';
import Slider from '../../ui/Slider';
import Button from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const LayoutSettingsTab = () => {
  const { channels, actions } = useConsolidatedAppStore();
  const { setChannelData, setChannelNavigation } = actions;

  // State for success message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Local state for form controls
  const [localSettings, setLocalSettings] = useState({
    navigationMode: 'wii', // 'simple' or 'wii'
    gridColumns: 4,
    gridRows: 3,
    channelsPerPage: 12,
    totalPages: 3,
    totalChannels: 36,
    animationType: 'slide',
    animationDuration: 500,
    animationEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    enableSlideAnimation: true
  });

  // Load current settings on mount
  useEffect(() => {
    const currentData = channels?.data || {};
    const currentNavigation = currentData.navigation || {};
    
    const newSettings = {
      navigationMode: currentNavigation.mode || 'wii',
      gridColumns: currentData.gridColumns || 4,
      gridRows: currentData.gridRows || 3,
      channelsPerPage: (currentData.gridColumns || 4) * (currentData.gridRows || 3),
      totalPages: currentNavigation.totalPages || 3,
      totalChannels: currentData.totalChannels || 36,
      animationType: currentNavigation.animationType || 'slide',
      animationDuration: currentNavigation.animationDuration || 500,
      animationEasing: currentNavigation.animationEasing || 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      enableSlideAnimation: currentNavigation.enableSlideAnimation !== false
    };
    
    // Only update if settings have actually changed
    setLocalSettings(prevSettings => {
      const hasChanged = JSON.stringify(prevSettings) !== JSON.stringify(newSettings);
      return hasChanged ? newSettings : prevSettings;
    });
  }, [channels?.data?.gridColumns, channels?.data?.gridRows, channels?.data?.totalChannels, channels?.data?.navigation?.mode, channels?.data?.navigation?.totalPages, channels?.data?.navigation?.animationType, channels?.data?.navigation?.animationDuration, channels?.data?.navigation?.animationEasing, channels?.data?.navigation?.enableSlideAnimation]);

  // Update local setting
  const updateLocalSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  // Apply settings to store
  const applySettings = () => {
    const { navigationMode, gridColumns, gridRows, channelsPerPage, totalPages, totalChannels, animationType, animationDuration, animationEasing, enableSlideAnimation } = localSettings;

    // Update channel data
    setChannelData({
      gridColumns,
      gridRows,
      totalChannels,
      channelsPerPage
    });

    // Update navigation settings
    setChannelNavigation({
      mode: navigationMode,
      totalPages,
      animationType,
      animationDuration,
      animationEasing,
      enableSlideAnimation
    });

    console.log('[LayoutSettingsTab] Applied settings:', localSettings);
    
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Calculate derived values
  const calculatedChannelsPerPage = localSettings.gridColumns * localSettings.gridRows;
  const calculatedTotalChannels = calculatedChannelsPerPage * localSettings.totalPages;

  // Check if settings have changed from current store values
  const currentData = channels?.data || {};
  const currentNavigation = currentData.navigation || {};
  const hasChanges = 
    localSettings.navigationMode !== (currentNavigation.mode || 'wii') ||
    localSettings.gridColumns !== (currentData.gridColumns || 4) ||
    localSettings.gridRows !== (currentData.gridRows || 3) ||
    localSettings.totalPages !== (currentNavigation.totalPages || 3) ||
    localSettings.totalChannels !== (currentData.totalChannels || 36) ||
    localSettings.animationType !== (currentNavigation.animationType || 'slide') ||
    localSettings.animationDuration !== (currentNavigation.animationDuration || 500) ||
    localSettings.animationEasing !== (currentNavigation.animationEasing || 'cubic-bezier(0.4, 0.0, 0.2, 1)') ||
    localSettings.enableSlideAnimation !== (currentNavigation.enableSlideAnimation !== false);

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <Text variant="body" className="font-medium text-green-800">
            ✅ Layout settings applied successfully!
          </Text>
        </div>
      )}

      {/* Navigation Mode Selection */}
      <Card>
        <div className="space-y-4">
          <Text variant="h3" className="text-lg font-semibold">
            Navigation Mode
          </Text>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-[hsl(var(--border-primary))] rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <div>
                  <Text variant="body" className="font-medium">Wii Mode</Text>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                    Single continuous grid with horizontal sliding navigation
                  </Text>
                </div>
              </div>
              <WToggle
                checked={localSettings.navigationMode === 'wii'}
                onChange={() => updateLocalSetting('navigationMode', 'wii')}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-[hsl(var(--border-primary))] rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <Text variant="body" className="font-medium">Simple Mode</Text>
                  <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                    Individual pages with distinct channel grids
                  </Text>
                </div>
              </div>
              <WToggle
                checked={localSettings.navigationMode === 'simple'}
                onChange={() => updateLocalSetting('navigationMode', 'simple')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Configuration */}
      <Card>
        <div className="space-y-4">
          <Text variant="h3" className="text-lg font-semibold">
            Grid Configuration
          </Text>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text variant="body" className="font-medium mb-2">Grid Columns</Text>
              <WSelect
                value={localSettings.gridColumns.toString()}
                onChange={(value) => updateLocalSetting('gridColumns', parseInt(value))}
                options={[
                  { value: '3', label: '3 Columns' },
                  { value: '4', label: '4 Columns' },
                  { value: '5', label: '5 Columns' },
                  { value: '6', label: '6 Columns' }
                ]}
              />
            </div>
            
            <div>
              <Text variant="body" className="font-medium mb-2">Grid Rows</Text>
              <WSelect
                value={localSettings.gridRows.toString()}
                onChange={(value) => updateLocalSetting('gridRows', parseInt(value))}
                options={[
                  { value: '2', label: '2 Rows' },
                  { value: '3', label: '3 Rows' },
                  { value: '4', label: '4 Rows' },
                  { value: '5', label: '5 Rows' }
                ]}
              />
            </div>
          </div>

          <div className="p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
            <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
              Channels per page: {calculatedChannelsPerPage} | Total channels: {calculatedTotalChannels}
            </Text>
          </div>
        </div>
      </Card>

      {/* Page Configuration */}
      <Card>
        <div className="space-y-4">
          <Text variant="h3" className="text-lg font-semibold">
            Page Configuration
          </Text>
          
          <div>
            <Text variant="body" className="font-medium mb-2">Number of Pages</Text>
            <WSelect
              value={localSettings.totalPages.toString()}
              onChange={(value) => updateLocalSetting('totalPages', parseInt(value))}
              options={[
                { value: '1', label: '1 Page' },
                { value: '2', label: '2 Pages' },
                { value: '3', label: '3 Pages' },
                { value: '4', label: '4 Pages' },
                { value: '5', label: '5 Pages' }
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Animation Settings */}
      <Card>
        <div className="space-y-4">
          <Text variant="h3" className="text-lg font-semibold">
            Animation Settings
          </Text>
          
          <div className="space-y-4">
            <div>
              <Text variant="body" className="font-medium mb-2">Animation Type</Text>
              <WSelect
                value={localSettings.animationType}
                onChange={(value) => updateLocalSetting('animationType', value)}
                options={[
                  { value: 'slide', label: 'Slide' },
                  { value: 'fade', label: 'Fade' },
                  { value: 'none', label: 'None' }
                ]}
              />
            </div>

            <div>
              <Text variant="body" className="font-medium mb-2">
                Animation Duration: {localSettings.animationDuration}ms
              </Text>
              <Slider
                value={localSettings.animationDuration}
                onChange={(value) => updateLocalSetting('animationDuration', value)}
                min={100}
                max={1000}
                step={50}
              />
            </div>

            <WToggle
              label="Enable Slide Animation"
              checked={localSettings.enableSlideAnimation}
              onChange={(checked) => updateLocalSetting('enableSlideAnimation', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Mode Information */}
      <Card>
        <div className="space-y-4">
          <Text variant="h3" className="text-lg font-semibold">
            Mode Information
          </Text>
          
          {localSettings.navigationMode === 'wii' ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Text variant="body" className="font-medium text-blue-800 mb-2">
                Wii Mode - Nintendo Wii Style Navigation
              </Text>
              <Text variant="caption" className="text-blue-700">
                • Single continuous grid spanning all pages<br/>
                • Horizontal sliding animation between sections<br/>
                • Navigation buttons appear on sides when available<br/>
                • Smooth, continuous pan transitions<br/>
                • No infinite scrolling or vertical scrollbars
              </Text>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <Text variant="body" className="font-medium text-green-800 mb-2">
                Simple Mode - Individual Page Navigation
              </Text>
              <Text variant="caption" className="text-green-700">
                • Each page has its own distinct channel grid<br/>
                • Channels are unique per page (no overlap)<br/>
                • Clean page transitions<br/>
                • Independent channel configurations per page<br/>
                • Traditional pagination experience
              </Text>
            </div>
                     )}
         </div>
       </Card>

       {/* Apply Changes Button */}
       <Card>
         <div className="space-y-4">
           <Text variant="h3" className="text-lg font-semibold">
             Apply Changes
           </Text>
           
           <div className="flex items-center justify-between">
             <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
               Click the button below to apply your layout changes to the channel grid.
             </Text>
             
             <Button
               variant="primary"
               onClick={applySettings}
               disabled={!hasChanges}
               className={hasChanges ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
             >
               {hasChanges ? 'Apply Changes' : 'No Changes'}
             </Button>
           </div>
         </div>
       </Card>
     </div>
   );
 };

export default LayoutSettingsTab;
