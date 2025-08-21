import React from 'react';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WSelect from '../../ui/WSelect';
import Slider from '../../ui/Slider';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const LayoutSettingsTab = () => {
  const { channels, actions } = useConsolidatedAppStore();
  const { setChannelData, setChannelNavigation } = actions;



  // Get current settings from consolidated store
  const currentData = channels?.data || {};
  const currentNavigation = currentData.navigation || {};
  
  // Current settings values
  const navigationMode = currentNavigation.mode || 'wii';
  const gridColumns = currentData.gridColumns || 4;
  const gridRows = currentData.gridRows || 3;
  const channelsPerPage = (currentData.gridColumns || 4) * (currentData.gridRows || 3);
  const totalPages = currentNavigation.totalPages || 3;
  const totalChannels = currentData.totalChannels || 36;
  const animationType = currentNavigation.animationType || 'slide';
  const animationDuration = currentNavigation.animationDuration || 500;
  const animationEasing = currentNavigation.animationEasing || 'cubic-bezier(0.4, 0.0, 0.2, 1)';
  const enableSlideAnimation = currentNavigation.enableSlideAnimation !== false;

  // Update functions that directly modify the consolidated store
  const updateNavigationMode = (mode) => {
    setChannelNavigation({ ...currentNavigation, mode });
  };

  // Helper function to handle channel count changes
  const handleChannelCountChange = (newTotalChannels) => {
    const currentTotalChannels = currentData.totalChannels || 36;
    const configuredChannels = currentData.configuredChannels || {};

    if (newTotalChannels > currentTotalChannels) {
      // Adding more channels - no need to remove existing ones
      console.log(`[LayoutSettingsTab] Adding ${newTotalChannels - currentTotalChannels} new channels`);
    } else if (newTotalChannels < currentTotalChannels) {
      // Check if there are any configured channels that will be lost
      const channelsToLose = [];
      for (let i = newTotalChannels; i < currentTotalChannels; i++) {
        const channelId = `channel-${i}`;
        if (configuredChannels[channelId] && !configuredChannels[channelId].empty) {
          channelsToLose.push(channelId);
        }
      }
      
      if (channelsToLose.length > 0) {
        // Warn user about data loss
        const confirmed = window.confirm(
          `Reducing the number of channels from ${currentTotalChannels} to ${newTotalChannels} will remove ${channelsToLose.length} configured channel(s). This action cannot be undone. Continue?`
        );
        
        if (!confirmed) {
          return false; // Cancel the operation
        }
      }
      
      // Reducing channels - remove channels beyond the new limit
      console.log(`[LayoutSettingsTab] Reducing channels from ${currentTotalChannels} to ${newTotalChannels}`);
      
      // Remove channels beyond the new limit
      const channelsToRemove = [];
      for (let i = newTotalChannels; i < currentTotalChannels; i++) {
        const channelId = `channel-${i}`;
        channelsToRemove.push(channelId);
      }
      
      // Update the store to remove these channels
      channelsToRemove.forEach(channelId => {
        actions.updateChannel(channelId, null); // Remove channel
        actions.updateChannelConfig(channelId, null); // Remove config
      });
    }
    
    return true; // Operation completed successfully
  };

  const updateGridColumns = (columns) => {
    const newChannelsPerPage = columns * gridRows;
    const newTotalChannels = newChannelsPerPage * totalPages;
    
    // Handle channel count changes
    if (handleChannelCountChange(newTotalChannels)) {
      setChannelData({ 
        ...currentData, 
        gridColumns: columns,
        totalChannels: newTotalChannels
      });
    }
  };

  const updateGridRows = (rows) => {
    const newChannelsPerPage = gridColumns * rows;
    const newTotalChannels = newChannelsPerPage * totalPages;
    
    // Handle channel count changes
    if (handleChannelCountChange(newTotalChannels)) {
      setChannelData({ 
        ...currentData, 
        gridRows: rows,
        totalChannels: newTotalChannels
      });
    }
  };

  const updateTotalPages = (pages) => {
    const newTotalChannels = calculatedChannelsPerPage * pages;
    
    // Handle channel count changes
    if (handleChannelCountChange(newTotalChannels)) {
      // Adjust current page if it's beyond the new total pages
      const currentPage = currentNavigation.currentPage || 0;
      const adjustedCurrentPage = Math.min(currentPage, pages - 1);
      
      setChannelNavigation({ 
        ...currentNavigation, 
        totalPages: pages,
        currentPage: adjustedCurrentPage
      });
      setChannelData({ ...currentData, totalChannels: newTotalChannels });
    }
  };

  const updateAnimationType = (type) => {
    setChannelNavigation({ ...currentNavigation, animationType: type });
  };

  const updateAnimationDuration = (duration) => {
    setChannelNavigation({ ...currentNavigation, animationDuration: duration });
  };

  const updateEnableSlideAnimation = (enabled) => {
    setChannelNavigation({ ...currentNavigation, enableSlideAnimation: enabled });
  };

  // Calculate derived values
  const calculatedChannelsPerPage = gridColumns * gridRows;
  const calculatedTotalChannels = calculatedChannelsPerPage * totalPages;

  return (
    <div className="space-y-6">


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
                checked={navigationMode === 'wii'}
                onChange={() => updateNavigationMode('wii')}
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
                checked={navigationMode === 'simple'}
                onChange={() => updateNavigationMode('simple')}
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
                value={gridColumns.toString()}
                onChange={(value) => updateGridColumns(parseInt(value))}
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
                value={gridRows.toString()}
                onChange={(value) => updateGridRows(parseInt(value))}
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
            {calculatedTotalChannels !== (currentData.totalChannels || 36) && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <Text variant="caption" className="text-yellow-800">
                  ⚠️ This change will {calculatedTotalChannels > (currentData.totalChannels || 36) ? 'add' : 'remove'} {Math.abs(calculatedTotalChannels - (currentData.totalChannels || 36))} channel(s)
                </Text>
              </div>
            )}
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
              value={totalPages.toString()}
              onChange={(value) => updateTotalPages(parseInt(value))}
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
                value={animationType}
                onChange={(value) => updateAnimationType(value)}
                options={[
                  { value: 'slide', label: 'Slide' },
                  { value: 'fade', label: 'Fade' },
                  { value: 'none', label: 'None' }
                ]}
              />
            </div>

            <div>
              <Text variant="body" className="font-medium mb-2">
                Animation Duration: {animationDuration}ms
              </Text>
              <Slider
                value={animationDuration}
                onChange={(value) => updateAnimationDuration(value)}
                min={100}
                max={1000}
                step={50}
              />
            </div>

            <WToggle
              label="Enable Slide Animation"
              checked={enableSlideAnimation}
              onChange={(checked) => updateEnableSlideAnimation(checked)}
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
          
          {navigationMode === 'wii' ? (
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


     </div>
   );
 };

export default LayoutSettingsTab;
