import React, { useState } from 'react';
import UnifiedAppPathCard from './UnifiedAppPathCard';
import Card from '../ui/Card';
import Button from '../ui/Button';

const UnifiedAppPathDemo = () => {
  const [config, setConfig] = useState({});
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    console.log('[Demo] Config changed:', newConfig);
  };

  const handleReset = () => {
    setConfig({});
    setShowConfig(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        marginBottom: '20px',
        color: 'hsl(var(--text-primary))'
      }}>
        Unified App Path Demo
      </h1>
      
      <p style={{ 
        fontSize: '16px', 
        color: 'hsl(var(--text-secondary))',
        marginBottom: '24px',
        lineHeight: '1.5'
      }}>
        This demo showcases the new unified app path system that consolidates all app types 
        (EXE, Steam, Epic, Microsoft Store) into a single searchable interface with just 
        two launch types: Application and URL.
      </p>

      <Card>
        <UnifiedAppPathCard
          value={config}
          onChange={handleConfigChange}
        />
      </Card>

      <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        <Button
          variant="primary"
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? 'Hide' : 'Show'} Configuration
        </Button>
        
        <Button
          variant="secondary"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>

      {showConfig && (
        <Card style={{ marginTop: '20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '12px',
            color: 'hsl(var(--text-primary))'
          }}>
            Current Configuration
          </h3>
          <pre style={{
            background: 'hsl(var(--surface-secondary))',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'hsl(var(--text-primary))',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        </Card>
      )}

      <div style={{ 
        marginTop: '24px',
        padding: '16px',
        background: 'hsl(var(--state-info) / 0.1)',
        border: '1px solid hsl(var(--state-info))',
        borderRadius: '8px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: 'hsl(var(--text-primary))'
        }}>
          Key Features
        </h3>
        <ul style={{ 
          color: 'hsl(var(--text-secondary))',
          lineHeight: '1.6'
        }}>
          <li><strong>Unified Search:</strong> Search across all app types (EXE, Steam, Epic, Microsoft Store) in one interface</li>
          <li><strong>Type Filtering:</strong> Filter by app type using the filter buttons</li>
          <li><strong>Auto-Path Generation:</strong> Selecting an app automatically generates the correct path</li>
          <li><strong>Manual Override:</strong> Users can still manually edit the path field</li>
          <li><strong>URL Support:</strong> Simple URL input for websites</li>
          <li><strong>Dark Mode:</strong> Fully compatible with the app's dark mode theme</li>
          <li><strong>Zustand Integration:</strong> Clean separation of concerns with centralized state management</li>
        </ul>
      </div>
    </div>
  );
};

export default UnifiedAppPathDemo; 