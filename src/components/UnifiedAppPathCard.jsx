import React, { useState, useEffect } from 'react';
import UnifiedAppPathSearch from './UnifiedAppPathSearch';
import useUnifiedAppStore from '../utils/useUnifiedAppStore';
import Button from '../ui/WButton';

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
    <div className="flex flex-col">
      {/* Launch Type Selection */}
      <div className='mb-4'>
        <label className="block font-semibold mb-2 text-[hsl(var(--text-primary))]">
          Launch Type
        </label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="launchType"
              value="application"
              checked={launchType === 'application'}
              onChange={(e) => handleLaunchTypeChange(e.target.value)}
              disabled={disabled}
              className="m-0"
            />
            <span className="text-[hsl(var(--text-primary))]">Application</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="launchType"
              value="url"
              checked={launchType === 'url'}
              onChange={(e) => handleLaunchTypeChange(e.target.value)}
              disabled={disabled}
              className="m-0"
            />
            <span className="text-[hsl(var(--text-primary))]">Website (URL)</span>
          </label>
        </div>
      </div>

      {/* Application Selection */}
      <>
      {launchType === 'application' && (
        <>
          <div className='mt-2'>
            <label className="block font-semibold mb-2 text-[hsl(var(--text-primary))]">
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
            <label className="block font-semibold mb-2 text-[hsl(var(--text-primary))]">
              Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className={`text-input flex-1 px-[14px] py-3 text-base rounded-lg border-[1.5px] ${
                  pathError
                    ? 'border-[hsl(var(--state-error))]'
                    : 'border-[hsl(var(--border-primary))]'
                } bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-primary))]`}
                placeholder="C:\Path\To\Application.exe or paste path here"
                value={path}
                onChange={(e) => handlePathChange(e.target.value)}
                disabled={disabled}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBrowseFile}
                disabled={disabled}
                className="whitespace-nowrap"
              >
                Browse
              </Button>
            </div>
            {pathError && (
              <div className="text-[hsl(var(--state-error))] text-xs mt-1">
                {pathError}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-4 text-sm text-[hsl(var(--text-secondary))] leading-[1.4]">
            <p>
              <strong>Tip:</strong> Search for applications in the search bar above, or manually enter a path. 
              You can also use the Browse button to select executable files.
            </p>
            <p className="text-xs mt-2">
              <strong>Examples:</strong><br />
              • <code>C:\Program Files\Discord\Discord.exe</code><br />
              • <code>steam://rungameid/252950</code><br />
              • <code>com.epicgames.launcher://apps/Fortnite?action=launch&silent=true</code>
            </p>
          </div>
        </>
      )}

      </>
      
      {/* URL Input */}
      {launchType === 'url' && (
        <>
          <div>
            <label className="block font-semibold mb-2 text-[hsl(var(--text-primary))]">
              Website URL
            </label>
            <input
              type="text"
              className={`text-input w-full px-[14px] py-3 text-base rounded-lg border-[1.5px] ${
                pathError
                  ? 'border-[hsl(var(--state-error))]'
                  : 'border-[hsl(var(--border-primary))]'
              } bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-primary))]`}
              placeholder="https://example.com"
              value={path}
              onChange={(e) => handlePathChange(e.target.value)}
              disabled={disabled}
            />
            {pathError && (
              <div className="text-[hsl(var(--state-error))] text-xs mt-1">
                {pathError}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-4 text-sm text-[hsl(var(--text-secondary))]">
            <p>
              <strong>Tip:</strong> Enter the complete URL including https:// to open a website in your default browser.
            </p>
            <p className="text-xs mt-2">
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
        <div
          className="p-3 bg-[hsl(var(--state-success)_/_0.1)] border border-[hsl(var(--state-success))] rounded-lg mt-2"
        >
          <div className="flex items-center gap-3 mb-2">
            {selectedApp.icon ? (
              <img 
                src={selectedApp.icon} 
                alt={`${selectedApp.name} icon`}
                className="w-6 h-6 rounded object-cover"
                onError={e => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-6 h-6 rounded bg-[hsl(var(--surface-secondary))] flex items-center justify-center text-xs">
                {selectedApp.type === 'steam' || selectedApp.type === 'epic' ? '🎮' : '💻'}
              </div>
            )}
            <span className="font-semibold text-[hsl(var(--text-primary))]">
              {selectedApp.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[hsl(var(--state-success))] text-[hsl(var(--text-inverse))]">
              {selectedApp.category}
            </span>
          </div>
          <div className="text-xs text-[hsl(var(--text-secondary))] font-mono break-all">
            {selectedApp.path}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedAppPathCard; 