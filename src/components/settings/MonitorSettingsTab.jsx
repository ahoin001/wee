import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';

const MonitorSettingsTab = React.memo(({ setShowMonitorModal }) => {
  const handleOpenMonitorSettings = useCallback(() => {
    setShowMonitorModal(true);
  }, [setShowMonitorModal]);

  return (
    <div>
      <Card
        title="Monitor Settings"
        separator
        desc="Configure which monitor the launcher appears on and manage multi-monitor preferences."
        actions={
          <div style={{ marginTop: 14 }}>
            <Button
              variant="secondary"
              onClick={handleOpenMonitorSettings}
              style={{ marginBottom: 8 }}
            >
              📺 Open Monitor Settings
            </Button>
            <div style={{ 
              fontSize: '13px', 
              color: 'hsl(var(--text-secondary))', 
              marginTop: '8px',
              padding: '12px',
              background: 'hsl(var(--surface-secondary))',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-primary))'
            }}>
              <strong>💡 Tip:</strong> Use the monitor settings to choose which display the launcher appears on. 
              You can set it to always use the primary monitor, secondary monitor, or remember your last choice.
            </div>
          </div>
        }
        style={{ marginBottom: '20px' }}
      />
    </div>
  );
});

MonitorSettingsTab.displayName = 'MonitorSettingsTab';

export default MonitorSettingsTab; 