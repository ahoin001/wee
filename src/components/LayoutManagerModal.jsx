import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import './BaseModal.css';

const LayoutManagerModal = ({ 
  isOpen, 
  onClose, 
  onSettingsChange,
  channels = [],
  gridSettings = {}
}) => {
  const [localGridSettings, setLocalGridSettings] = useState({
    rowGap: gridSettings.rowGap ?? 16,
    columnGap: gridSettings.columnGap ?? 16,
    gridPosition: gridSettings.gridPosition ?? 'center',
    responsiveRows: gridSettings.responsiveRows ?? 3,
    responsiveColumns: gridSettings.responsiveColumns ?? 4,
    hiddenChannels: gridSettings.hiddenChannels ?? [],
    gridAlignment: gridSettings.gridAlignment ?? 'start',
    gridJustification: gridSettings.gridJustification ?? 'center',
    ...gridSettings
  });

  // Update local state when props change
  useEffect(() => {
    setLocalGridSettings({
      rowGap: gridSettings.rowGap ?? 16,
      columnGap: gridSettings.columnGap ?? 16,
      gridPosition: gridSettings.gridPosition ?? 'center',
      responsiveRows: gridSettings.responsiveRows ?? 3,
      responsiveColumns: gridSettings.responsiveColumns ?? 4,
      hiddenChannels: gridSettings.hiddenChannels ?? [],
      gridAlignment: gridSettings.gridAlignment ?? 'start',
      gridJustification: gridSettings.gridJustification ?? 'center',
      ...gridSettings
    });
  }, [gridSettings]);

  const handleSave = () => {
    if (onSettingsChange) {
      onSettingsChange({
        gridSettings: localGridSettings
      });
    }
    onClose();
  };

  // Direct toggle for channel visibility
  const toggleChannelVisibility = (channelId) => {
    setLocalGridSettings(prev => ({
      ...prev,
      hiddenChannels: prev.hiddenChannels.includes(channelId)
        ? prev.hiddenChannels.filter(id => id !== channelId)
        : [...prev.hiddenChannels, channelId]
    }));
  };

  // Generate preview channels for the live grid
  const generatePreviewChannels = () => {
    const totalChannels = localGridSettings.responsiveRows * localGridSettings.responsiveColumns;
    const previewChannels = [];
    
    for (let i = 0; i < totalChannels; i++) {
      const channelId = `preview-channel-${i}`;
      const isHidden = localGridSettings.hiddenChannels.includes(channelId);
      
      previewChannels.push({
        id: channelId,
        name: `Channel ${i + 1}`,
        icon: '📺',
        background: isHidden ? 'transparent' : '#f0f0f0',
        isHidden
      });
    }
    
    return previewChannels;
  };

  const previewChannels = generatePreviewChannels();

  // Get grid container styles for preview
  const getPreviewGridStyles = () => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${localGridSettings.responsiveColumns}, 1fr)`,
      gridTemplateRows: `repeat(${localGridSettings.responsiveRows}, 1fr)`,
      gap: `${localGridSettings.rowGap}px ${localGridSettings.columnGap}px`,
      padding: '20px',
      width: '100%',
      height: '100%',
      minHeight: '300px',
      justifyContent: localGridSettings.gridJustification || 'center',
      alignItems: localGridSettings.gridAlignment || 'start',
      placeItems: localGridSettings.gridAlignment === 'stretch' ? 'stretch' : 'start'
    };
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Layout Manager"
      onClose={onClose}
      maxWidth="1200px"
      footerContent={({ handleClose }) => (
        <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="cancel-button" onClick={handleClose}>Cancel</button>
          <button className="save-button" onClick={handleSave} style={{ minWidth: 90 }}>Save</button>
        </div>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '700px' }}>
        {/* Settings Grid - 2 Columns */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {/* Grid Spacing */}
          <div className="wee-card">
            <div className="wee-card-header">
              <span className="wee-card-title">Grid Spacing</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">Adjust the spacing between channels in the grid.</div>
            
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Row Gap</span>
                <input
                  type="range"
                  min={8}
                  max={32}
                  step={2}
                  value={localGridSettings.rowGap}
                  onChange={e => setLocalGridSettings(prev => ({ ...prev, rowGap: Number(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: '#555' }}>{localGridSettings.rowGap}px</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Column Gap</span>
                <input
                  type="range"
                  min={8}
                  max={32}
                  step={2}
                  value={localGridSettings.columnGap}
                  onChange={e => setLocalGridSettings(prev => ({ ...prev, columnGap: Number(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: '#555' }}>{localGridSettings.columnGap}px</span>
              </div>
            </div>
          </div>

          {/* Grid Position */}
          <div className="wee-card">
            <div className="wee-card-header">
              <span className="wee-card-title">Grid Position</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">Choose how the grid is positioned within the available space.</div>
            
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Horizontal</span>
                <select
                  value={localGridSettings.gridJustification}
                  onChange={e => setLocalGridSettings(prev => ({ ...prev, gridJustification: e.target.value }))}
                  style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', flex: 1 }}
                >
                  <option value="start">Left</option>
                  <option value="center">Center</option>
                  <option value="end">Right</option>
                  <option value="space-between">Space Between</option>
                  <option value="space-around">Space Around</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Vertical</span>
                <select
                  value={localGridSettings.gridAlignment}
                  onChange={e => setLocalGridSettings(prev => ({ ...prev, gridAlignment: e.target.value }))}
                  style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid #ccc', flex: 1 }}
                >
                  <option value="start">Top</option>
                  <option value="center">Center</option>
                  <option value="end">Bottom</option>
                  <option value="stretch">Stretch</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid Size */}
          <div className="wee-card">
            <div className="wee-card-header">
              <span className="wee-card-title">Grid Size</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">Set the maximum number of rows and columns for the grid.</div>
            
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 12 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Max Rows</span>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={localGridSettings.responsiveRows}
                  onChange={e => setLocalGridSettings(prev => ({ ...prev, responsiveRows: Number(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: '#555' }}>{localGridSettings.responsiveRows}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Max Columns</span>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={localGridSettings.responsiveColumns}
                  onChange={e => setLocalGridSettings(prev => ({ ...prev, responsiveColumns: Number(e.target.value) }))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: '#555' }}>{localGridSettings.responsiveColumns}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="wee-card">
            <div className="wee-card-header">
              <span className="wee-card-title">Quick Actions</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">Quick actions for managing channel visibility.</div>
            
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setLocalGridSettings(prev => ({ ...prev, hiddenChannels: [] }))}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Show All Channels
              </button>
              <button
                onClick={() => {
                  const allChannelIds = previewChannels.map(ch => ch.id);
                  setLocalGridSettings(prev => ({ ...prev, hiddenChannels: allChannelIds }));
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Hide All Channels
              </button>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                💡 <strong>Tip:</strong> Click on channels in the preview below to toggle their visibility.
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Grid - Full Width */}
        <div className="wee-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="wee-card-header">
            <span className="wee-card-title">Live Preview</span>
          </div>
          <div className="wee-card-separator" />
          <div className="wee-card-desc">See how your layout changes will look in real-time. Click on channels to toggle their visibility.</div>
          
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginTop: '16px'
          }}>
            <div style={getPreviewGridStyles()}>
              {previewChannels.map((channel) => (
                <div
                  key={channel.id}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '50px',
                    backgroundColor: channel.background,
                    border: channel.isHidden ? '2px dashed #dc3545' : '2px solid #ddd',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: channel.isHidden ? 0.3 : 1,
                    fontSize: '14px',
                    color: channel.isHidden ? '#dc3545' : '#333',
                    userSelect: 'none'
                  }}
                  onClick={() => toggleChannelVisibility(channel.id)}
                  title={channel.isHidden ? 'Click to show channel' : 'Click to hide channel'}
                >
                  {channel.isHidden ? '👻' : channel.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

LayoutManagerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func.isRequired,
  channels: PropTypes.array,
  gridSettings: PropTypes.object
};

export default LayoutManagerModal; 