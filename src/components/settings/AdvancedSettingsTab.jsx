import React from 'react';

const AdvancedSettingsTab = React.memo(() => {
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--text-secondary))' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Advanced Settings</div>
        <div style={{ fontSize: '14px' }}>Coming soon - performance tuning, debug options, and expert configurations</div>
      </div>
    </div>
  );
});

AdvancedSettingsTab.displayName = 'AdvancedSettingsTab';

export default AdvancedSettingsTab; 