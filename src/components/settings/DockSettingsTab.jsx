import React from 'react';

const DockSettingsTab = React.memo(() => {
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--text-secondary))' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚓</div>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Dock Settings</div>
        <div style={{ fontSize: '14px' }}>Coming soon - customize dock size, themes, and button configurations</div>
      </div>
    </div>
  );
});

DockSettingsTab.displayName = 'DockSettingsTab';

export default DockSettingsTab; 