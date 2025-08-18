import React, { useState, useEffect } from 'react';
import WBaseModal from './WBaseModal';
import Card from '../ui/Card';
import Button from '../ui/WButton';
import WToggle from '../ui/WToggle';
import { useMonitorState } from '../utils/useConsolidatedAppHooks';
import MonitorWallpaperCard from './MonitorWallpaperCard';

const MonitorSelectionModal = ({ isOpen, onClose }) => {
  const {
    displays,
    currentDisplay,
    primaryDisplay,
    isLoading,
    error,
    preferredMonitor,
    specificMonitorId,
    rememberLastMonitor,
    setPreferredMonitor,
    setSpecificMonitorId,
    setRememberLastMonitor,
    moveToDisplay,
    fetchDisplays,
    fetchCurrentDisplay
  } = useMonitorState();

  const [selectedDisplayId, setSelectedDisplayId] = useState(null);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      // Add a small delay to ensure APIs are available
      setTimeout(() => {
        if (window.api?.monitors) {
          window.api.monitors.getDisplays().then(displays => {
          }).catch(err => {
            console.error('[MonitorSelection] getDisplays error:', err);
          });
        }
        
        fetchDisplays();
        fetchCurrentDisplay();
      }, 50);
    }
  }, [isOpen, fetchDisplays, fetchCurrentDisplay]);

  // Update selected display when current display changes
  useEffect(() => {
    if (currentDisplay) {
      setSelectedDisplayId(currentDisplay.id);
    }
  }, [currentDisplay]);

  const handleMoveToDisplay = async (displayId) => {
    const result = await moveToDisplay(displayId);
    if (result.success) {
      
    } else {
      console.error('[MonitorSelection] Failed to move to display:', result.error);
    }
  };

  const handlePreferenceChange = (preference) => {
    setPreferredMonitor(preference);
    if (preference === 'specific' && displays.length > 0) {
      setSpecificMonitorId(displays[0].id);
    }
  };

  const getDisplayName = (display) => {
    if (display.primary) return 'Primary Monitor';
    if (display.internal) return 'Internal Display';
    return `Monitor ${display.id}`;
  };

  const getDisplayInfo = (display) => {
    const { width, height } = display.size;
    const { x, y } = display.bounds;
    return `${width}x${height} @ (${x}, ${y})`;
  };

  if (!isOpen) return null;

  // Check if monitor APIs are available
  if (!window.api?.monitors) {
    return (
      <WBaseModal
        title="Monitor Settings"
        onClose={onClose}
        maxWidth="800px"
        footerContent={({ handleClose }) => (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      >
        <Card title="Monitor APIs Not Available" separator desc="The monitor APIs are not available in this environment.">
          <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖥️</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Monitor Support Unavailable</div>
            <div style={{ fontSize: '14px' }}>
              Multi-monitor support is not available in this environment. 
              This feature requires the Electron desktop application.
            </div>
            <div style={{ fontSize: '12px', marginTop: '10px', padding: '10px', background: 'hsl(var(--surface-secondary))', borderRadius: '4px' }}>
              Debug Info: window.api.monitors is undefined
            </div>
          </div>
        </Card>
      </WBaseModal>
    );
  }

  return (
    <WBaseModal
      title="Monitor Settings"
      onClose={onClose}
      maxWidth="800px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      )}
    >
      {/* Monitor Detection */}
      <Card title="Detected Monitors" separator desc="Manage which monitor the launcher appears on.">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-secondary))' }}>
            Detecting monitors...
          </div>
        ) : error ? (
          <div style={{ color: 'hsl(var(--state-error))', padding: '10px' }}>
            Error: {error}
          </div>
        ) : displays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-secondary))' }}>
            No monitors detected
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displays.map((display) => (
              <div
                key={display.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  border: `2px solid ${currentDisplay?.id === display.id ? 'hsl(var(--wii-blue))' : 'hsl(var(--border-primary))'}`,
                  borderRadius: '8px',
                  background: currentDisplay?.id === display.id ? 'hsl(var(--wii-blue) / 0.1)' : 'hsl(var(--surface-primary))',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: '600', color: 'hsl(var(--text-primary))' }}>
                      {getDisplayName(display)}
                    </span>
                    {display.primary && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'hsl(var(--state-success))',
                        color: 'hsl(var(--text-inverse))'
                      }}>
                        Primary
                      </span>
                    )}
                    {currentDisplay?.id === display.id && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'hsl(var(--wii-blue))',
                        color: 'hsl(var(--text-inverse))'
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                    {getDisplayInfo(display)}
                  </div>
                </div>
                <Button
                  variant={currentDisplay?.id === display.id ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleMoveToDisplay(display.id)}
                  disabled={currentDisplay?.id === display.id}
                >
                  {currentDisplay?.id === display.id ? 'Current' : 'Move Here'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Monitor Preferences */}
      <Card title="Launch Preferences" separator desc="Choose which monitor the launcher should appear on when starting.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preference Selection */}
          <div>
            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', color: 'hsl(var(--text-primary))' }}>
              Preferred Monitor
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="preferredMonitor"
                  value="primary"
                  checked={preferredMonitor === 'primary'}
                  onChange={(e) => handlePreferenceChange(e.target.value)}
                />
                <span style={{ color: 'hsl(var(--text-primary))' }}>Primary Monitor</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="preferredMonitor"
                  value="secondary"
                  checked={preferredMonitor === 'secondary'}
                  onChange={(e) => handlePreferenceChange(e.target.value)}
                />
                <span style={{ color: 'hsl(var(--text-primary))' }}>Secondary Monitor</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="preferredMonitor"
                  value="last-used"
                  checked={preferredMonitor === 'last-used'}
                  onChange={(e) => handlePreferenceChange(e.target.value)}
                />
                <span style={{ color: 'hsl(var(--text-primary))' }}>Last Used Monitor</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="preferredMonitor"
                  value="specific"
                  checked={preferredMonitor === 'specific'}
                  onChange={(e) => handlePreferenceChange(e.target.value)}
                />
                <span style={{ color: 'hsl(var(--text-primary))' }}>Specific Monitor</span>
              </label>
            </div>
          </div>

          {/* Specific Monitor Selection */}
          {preferredMonitor === 'specific' && (
            <div>
              <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', color: 'hsl(var(--text-primary))' }}>
                Select Monitor
              </label>
              <select
                value={specificMonitorId || ''}
                onChange={(e) => setSpecificMonitorId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid hsl(var(--border-primary))',
                  background: 'hsl(var(--surface-primary))',
                  color: 'hsl(var(--text-primary))'
                }}
              >
                {displays.map((display) => (
                  <option key={display.id} value={display.id}>
                    {getDisplayName(display)} - {getDisplayInfo(display)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Remember Last Used */}
          <div>
            <WToggle
              checked={rememberLastMonitor}
              onChange={(checked) => setRememberLastMonitor(checked)}
              label="Remember last used monitor"
            />
            <div style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginTop: '4px', marginLeft: '24px' }}>
              When enabled, the launcher will remember which monitor you last used and return to it on startup.
            </div>
          </div>
        </div>
      </Card>

             {/* Monitor-Specific Settings */}
       {displays.length > 0 && (
         <Card title="Monitor-Specific Settings" separator desc="Customize wallpapers and settings for each monitor.">
           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
             {displays.map((display) => (
               <MonitorWallpaperCard
                 key={display.id}
                 monitorId={display.id}
                 monitorName={getDisplayName(display)}
               />
             ))}
           </div>
         </Card>
       )}

       {/* Quick Actions */}
       <Card title="Quick Actions" separator desc="Quick monitor management actions.">
         <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
           <Button
             variant="secondary"
             size="sm"
             onClick={() => {
               if (primaryDisplay) {
                 handleMoveToDisplay(primaryDisplay.id);
               }
             }}
             disabled={!primaryDisplay || currentDisplay?.id === primaryDisplay?.id}
           >
             Move to Primary
           </Button>
           
           <Button
             variant="secondary"
             size="sm"
             onClick={() => {
               const secondary = displays.find(d => !d.primary);
               if (secondary) {
                 handleMoveToDisplay(secondary.id);
               }
             }}
             disabled={displays.filter(d => !d.primary).length === 0}
           >
             Move to Secondary
           </Button>
           
           <Button
             variant="secondary"
             size="sm"
             onClick={() => {
               fetchDisplays();
               fetchCurrentDisplay();
             }}
           >
             Refresh
           </Button>
         </div>
       </Card>
    </WBaseModal>
  );
};

export default MonitorSelectionModal; 