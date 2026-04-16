import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import UnifiedAppPathSearch from './UnifiedAppPathSearch';
import { useUnifiedAppsState } from '../../utils/useConsolidatedAppHooks';
import { logError } from '../../utils/logger';
import Button from '../../ui/WButton';
import './unified-app-path-card.css';

const UnifiedAppPathCard = React.memo(({
  value = {},
  onChange,
  disabled = false,
  /** Canonical validation from ChannelModal (debounced); shown with local browse errors */
  externalValidationError = '',
}) => {
  const { unifiedApps, setUnifiedAppsState } = useUnifiedAppsState();
  const { selectedApp } = unifiedApps;

  const clearSelection = useCallback(() => {
    setUnifiedAppsState({ selectedApp: null });
  }, [setUnifiedAppsState]);

  const getConfiguration = useCallback(() => ({}), []);

  const prevConfigRef = useRef(null);

  const [launchType, setLaunchType] = useState(value.launchType || 'application');
  const [appName, setAppName] = useState(value.appName || '');
  const [path, setPath] = useState(value.path || '');
  const [pathError, setPathError] = useState('');
  /** Progressive disclosure: launch path row hidden until user needs it */
  const [showManualLaunchPath, setShowManualLaunchPath] = useState(false);

  const configuration = useMemo(() => {
    if (typeof getConfiguration === 'function') {
      return getConfiguration();
    }
    return {};
  }, [selectedApp]);

  useEffect(() => {
    setLaunchType(value.launchType || 'application');
    setAppName(value.appName || '');
    setPath(value.path || '');
    setPathError('');
  }, [value]);

  const displayPathError = pathError || externalValidationError;
  const pathTrimmed = String(path || '').trim();
  const hasManualPathWithoutApp =
    launchType === 'application' && !selectedApp && Boolean(pathTrimmed);
  const showLaunchPathBlock =
    launchType === 'application' &&
    (showManualLaunchPath || Boolean(displayPathError) || hasManualPathWithoutApp);

  useEffect(() => {
    if (displayPathError) {
      setShowManualLaunchPath(true);
    }
  }, [displayPathError]);

  useEffect(() => {
    if (hasManualPathWithoutApp) {
      setShowManualLaunchPath(true);
    }
  }, [hasManualPathWithoutApp]);

  useEffect(() => {
    if (launchType === 'application' && selectedApp) {
      setShowManualLaunchPath(false);
    }
  }, [launchType, selectedApp?.id]);

  useEffect(() => {
    const parentHasPath = Boolean(value.path && String(value.path).trim());
    const currentSelectedApp = value.selectedApp || (parentHasPath ? selectedApp : null);

    if (currentSelectedApp) {
      try {
        setAppName(currentSelectedApp.name);
        let generatedPath = currentSelectedApp?.path || '';
        if (currentSelectedApp?.args && currentSelectedApp.args.trim()) {
          generatedPath += ` ${currentSelectedApp.args.trim()}`;
        }
        setPath(generatedPath);
      } catch (error) {
        logError('UnifiedAppPathCard', 'Error generating path for app', error, {
          selectedApp: currentSelectedApp,
        });
        setPath('');
      }
    } else if (!value.path) {
      setPath('');
      setAppName('');
    }
  }, [selectedApp, value.selectedApp, value.path]);

  useEffect(() => {
    const config = {
      launchType,
      appName,
      path,
      selectedApp,
      ...configuration,
    };

    const prevConfig = prevConfigRef.current;
    const hasChanged =
      !prevConfig ||
      config.launchType !== prevConfig.launchType ||
      config.appName !== prevConfig.appName ||
      config.path !== prevConfig.path ||
      config.selectedApp?.id !== prevConfig.selectedApp?.id;

    if (hasChanged) {
      prevConfigRef.current = config;
      onChange?.(config);
    }
  }, [launchType, appName, path, selectedApp, configuration, onChange]);

  const handleLaunchTypeChange = useCallback(
    (type) => {
      setLaunchType(type);
      if (type === 'url') {
        clearSelection();
        setAppName('');
        setPath('');
        setShowManualLaunchPath(false);
      }
    },
    [clearSelection]
  );

  const handleAppNameChange = useCallback(
    (name) => {
      setAppName(name);
      setPathError('');
      if (name !== selectedApp?.name) {
        clearSelection();
      }
    },
    [selectedApp, clearSelection]
  );

  const handlePathChange = useCallback((newPath) => {
    setPath(newPath);
    setPathError('');
  }, []);

  const handleBrowseFile = useCallback(async () => {
    if (window.api && window.api.selectExeOrShortcutFile) {
      try {
        const result = await window.api.selectExeOrShortcutFile();
        if (result && result.success && result.file) {
          let newPath = result.file.path;
          if (result.file.args && result.file.args.trim()) {
            newPath += ` ${result.file.args.trim()}`;
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
  }, []);

  return (
    <div className="unified-app-path-card">
      <div className="mb-4">
        <span className="unified-app-path-card__label">Opens as</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="launchType"
              value="application"
              checked={launchType === 'application'}
              onChange={(e) => handleLaunchTypeChange(e.target.value)}
              disabled={disabled}
              className="m-0"
            />
            <span className="text-[hsl(var(--text-primary))] text-[0.9375rem]">App</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="launchType"
              value="url"
              checked={launchType === 'url'}
              onChange={(e) => handleLaunchTypeChange(e.target.value)}
              disabled={disabled}
              className="m-0"
            />
            <span className="text-[hsl(var(--text-primary))] text-[0.9375rem]">Website</span>
          </label>
        </div>
      </div>

      {launchType === 'application' && (
        <>
          <div className="mt-1">
            <label className="unified-app-path-card__label" htmlFor="channel-app-search">
              Find an app
            </label>
            <UnifiedAppPathSearch
              inputId="channel-app-search"
              value={appName}
              onChange={handleAppNameChange}
              disabled={disabled}
              placeholder="Search installed apps…"
            />
          </div>

          {launchType === 'application' && selectedApp && (
            <div className="unified-app-path-card__selection mt-3">
              <div className="unified-app-path-card__selection-row">
                {selectedApp.icon ? (
                  <img
                    src={selectedApp.icon}
                    alt=""
                    className="h-7 w-7 rounded object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-[hsl(var(--surface-tertiary))] text-xs">
                    {selectedApp.type === 'steam' || selectedApp.type === 'epic' ? '🎮' : '💻'}
                  </div>
                )}
                <span className="unified-app-path-card__selection-name">{selectedApp.name}</span>
                {selectedApp.category ? (
                  <span className="unified-app-path-card__selection-badge">{selectedApp.category}</span>
                ) : null}
              </div>
              {selectedApp.path ? (
                <div className="unified-app-path-card__selection-path">{selectedApp.path}</div>
              ) : null}
            </div>
          )}

          {!showLaunchPathBlock ? (
            <div className="unified-app-path-card__hint">
              <p className="mb-0 text-[0.8125rem] leading-snug text-[hsl(var(--text-secondary))]">
                Search picks the launch target for you. Need something else?
              </p>
              <button
                type="button"
                className="unified-app-path-card__disclosure"
                onClick={() => setShowManualLaunchPath(true)}
                disabled={disabled}
              >
                Add a launch path manually
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <label className="unified-app-path-card__label" htmlFor="channel-launch-path">
                Launch path
              </label>
              <div className="flex gap-2">
                <input
                  id="channel-launch-path"
                  type="text"
                  className={`unified-app-path-card__input flex-1 ${displayPathError ? 'unified-app-path-card__input--error' : ''}`}
                  placeholder="Browse or paste a path"
                  value={path}
                  onChange={(e) => handlePathChange(e.target.value)}
                  disabled={disabled}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBrowseFile}
                  disabled={disabled}
                  className="shrink-0 whitespace-nowrap"
                >
                  Browse
                </Button>
              </div>
              {displayPathError ? <div className="unified-app-path-card__error">{displayPathError}</div> : null}
            </div>
          )}
        </>
      )}

      {launchType === 'url' && (
        <div className="mt-1">
          <label className="unified-app-path-card__label" htmlFor="channel-website-url">
            Website address
          </label>
          <input
            id="channel-website-url"
            type="text"
            className={`unified-app-path-card__input w-full ${displayPathError ? 'unified-app-path-card__input--error' : ''}`}
            placeholder="https://…"
            value={path}
            onChange={(e) => handlePathChange(e.target.value)}
            disabled={disabled}
          />
          {displayPathError ? <div className="unified-app-path-card__error">{displayPathError}</div> : null}
        </div>
      )}
    </div>
  );
});

export default UnifiedAppPathCard;
