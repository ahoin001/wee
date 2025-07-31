import React, { useState, useEffect } from 'react';
import UnifiedAppPathSearch from './UnifiedAppPathSearch';
import useUnifiedAppStore from '../utils/useUnifiedAppStore';
import Button from '../ui/Button';

const UnifiedAppPathCard = ({
  value = {},
  onChange,
  disabled = false
}) => {
  const {
    selectedApp,
    customPath,
    setCustomPath,
    clearSelection,
    getConfiguration
  } = useUnifiedAppStore();

  // Local state for the form
  const [launchType, setLaunchType] = useState(value.launchType || 'application');
  const [appName, setAppName] = useState(value.appName || '');
  const [path, setPath] = useState(value.path || '');
  const [pathError, setPathError] = useState('');

  // Sync with store when selected app changes
  useEffect(() => {
    if (selectedApp) {
      setAppName(selectedApp.name);
      // Use the generated path that includes arguments
      const generatedPath = getConfiguration().generatedPath;
      setPath(generatedPath);
    }
  }, [selectedApp, getConfiguration]);

  // Update parent when form changes
  useEffect(() => {
    const config = {
      launchType,
      appName,
      path,
      selectedApp,
      ...getConfiguration()
    };
    
    onChange?.(config);
  }, [launchType, appName, path, selectedApp, onChange, getConfiguration]);

  const handleLaunchTypeChange = (type) => {
    setLaunchType(type);
    if (type === 'url') {
      clearSelection();
      setAppName('');
      setPath('');
    }
  };

  const handleAppNameChange = (name) => {
    setAppName(name);
    setPathError('');
  };

  const handlePathChange = (newPath) => {
    setPath(newPath);
    setPathError('');
  };

  const handleBrowseFile = async () => {
    if (window.api && window.api.selectExeOrShortcutFile) {
      try {
        const result = await window.api.selectExeOrShortcutFile();
        if (result && result.success && result.file) {
          let newPath = result.file.path;
          if (result.file.args && result.file.args.trim()) {
            newPath += ' ' + result.file.args.trim();
          }
          setPath(newPath);
          setPathError('');
        } else if (result && result.error) {
          setPathError(result.error);
        }
      } catch (error) {
        setPathError('Failed to browse for file');
      }
    }
  };

  const validatePath = () => {
    if (launchType === 'url') {
      if (!path.startsWith('http://') && !path.startsWith('https://')) {
        setPathError('URL must start with http:// or https://');
        return false;
      }
    } else if (launchType === 'application') {
      if (!path.trim()) {
        setPathError('Path is required');
        return false;
      }
    }
    return true;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Launch Type Selection */}
      <div>
        <label style={{ 
          display: 'block', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: 'hsl(var(--text-primary))'
        }}>
          Launch Type
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer'
          }}>
            <input
              type="radio"
              name="launchType"
              value="application"
              checked={launchType === 'application'}
              onChange={(e) => handleLaunchTypeChange(e.target.value)}
              disabled={disabled}
              style={{ margin: 0 }}
            />
            <span style={{ color: 'hsl(var(--text-primary))' }}>Application</span>
          </label>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer'
          }}>
            <input
              type="radio"
              name="launchType"
              value="url"
              checked={launchType === 'url'}
              onChange={(e) => handleLaunchTypeChange(e.target.value)}
              disabled={disabled}
              style={{ margin: 0 }}
            />
            <span style={{ color: 'hsl(var(--text-primary))' }}>Website (URL)</span>
          </label>
        </div>
      </div>

      {/* Application Selection */}
      {launchType === 'application' && (
        <>
          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: 'hsl(var(--text-primary))'
            }}>
              Application
            </label>
            <UnifiedAppPathSearch
              value={appName}
              onChange={handleAppNameChange}
              disabled={disabled}
              placeholder="Search for an application..."
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: 'hsl(var(--text-primary))'
            }}>
              Path
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="text-input"
                placeholder="C:\Path\To\Application.exe or paste path here"
                value={path}
                onChange={(e) => handlePathChange(e.target.value)}
                disabled={disabled}
                style={{ 
                  flex: 1,
                  padding: '12px 14px', 
                  fontSize: '16px', 
                  borderRadius: '8px', 
                  border: `1.5px solid ${pathError ? 'hsl(var(--state-error))' : 'hsl(var(--border-primary))'}`,
                  background: 'hsl(var(--surface-primary))',
                  color: 'hsl(var(--text-primary))'
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBrowseFile}
                disabled={disabled}
                style={{ whiteSpace: 'nowrap' }}
              >
                Browse
              </Button>
            </div>
            {pathError && (
              <div style={{ color: 'hsl(var(--state-error))', fontSize: '13px', marginTop: '4px' }}>
                {pathError}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div style={{ 
            fontSize: '14px', 
            color: 'hsl(var(--text-secondary))',
            lineHeight: '1.4'
          }}>
            <p>
              <strong>Tip:</strong> Search for applications in the search bar above, or manually enter a path. 
              You can also use the Browse button to select executable files.
            </p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              <strong>Examples:</strong><br />
              • <code>C:\Program Files\Discord\Discord.exe</code><br />
              • <code>steam://rungameid/252950</code><br />
              • <code>com.epicgames.launcher://apps/Fortnite?action=launch&silent=true</code>
            </p>
          </div>
        </>
      )}

      {/* URL Input */}
      {launchType === 'url' && (
        <>
          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: 'hsl(var(--text-primary))'
            }}>
              Website URL
            </label>
            <input
              type="text"
              className="text-input"
              placeholder="https://example.com"
              value={path}
              onChange={(e) => handlePathChange(e.target.value)}
              disabled={disabled}
              style={{ 
                width: '100%',
                padding: '12px 14px', 
                fontSize: '16px', 
                borderRadius: '8px', 
                border: `1.5px solid ${pathError ? 'hsl(var(--state-error))' : 'hsl(var(--border-primary))'}`,
                background: 'hsl(var(--surface-primary))',
                color: 'hsl(var(--text-primary))'
              }}
            />
            {pathError && (
              <div style={{ color: 'hsl(var(--state-error))', fontSize: '13px', marginTop: '4px' }}>
                {pathError}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div style={{ 
            fontSize: '14px', 
            color: 'hsl(var(--text-secondary))'
          }}>
            <p>
              <strong>Tip:</strong> Enter the complete URL including https:// to open a website in your default browser.
            </p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>
              <strong>Examples:</strong><br />
              • <code>https://www.google.com</code><br />
              • <code>https://github.com</code><br />
              • <code>https://www.youtube.com</code>
            </p>
          </div>
        </>
      )}

      {/* Selected App Info */}
      {selectedApp && launchType === 'application' && (
        <div style={{
          padding: '12px',
          background: 'hsl(var(--state-success) / 0.1)',
          border: '1px solid hsl(var(--state-success))',
          borderRadius: '8px',
          marginTop: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '8px'
          }}>
            {selectedApp.icon ? (
              <img 
                src={selectedApp.icon} 
                alt={`${selectedApp.name} icon`}
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '4px',
                  objectFit: 'cover'
                }}
                onError={e => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: 'hsl(var(--surface-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                {selectedApp.type === 'steam' || selectedApp.type === 'epic' ? '🎮' : '💻'}
              </div>
            )}
            <span style={{ fontWeight: '600', color: 'hsl(var(--text-primary))' }}>
              {selectedApp.name}
            </span>
            <span style={{
              padding: '2px 6px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '600',
              background: 'hsl(var(--state-success))',
              color: 'hsl(var(--text-inverse))'
            }}>
              {selectedApp.category}
            </span>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: 'hsl(var(--text-secondary))',
            fontFamily: 'monospace',
            wordBreak: 'break-all'
          }}>
            {selectedApp.path}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedAppPathCard; 