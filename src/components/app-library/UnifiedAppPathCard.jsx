import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import UnifiedAppPathSearch from './UnifiedAppPathSearch';
import { useUnifiedAppsState } from '../../utils/useConsolidatedAppHooks';
import { logError } from '../../utils/logger';
import {
  WeeButton,
  WeeSectionEyebrow,
  WeeSegmentedControl,
  WeeHelpParagraph,
  WeeHelpLinkButton,
} from '../../ui/wee';

const inputWeeClass =
  'w-full rounded-2xl border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] px-5 py-4 font-[family-name:var(--font-ui)] text-left text-base font-bold italic text-[hsl(var(--text-primary))] outline-none shadow-[var(--wee-shadow-field)] transition-[border-color,box-shadow] placeholder:font-[family-name:var(--font-ui)] placeholder:font-normal placeholder:not-italic placeholder:text-[hsl(var(--text-tertiary))] focus:border-[hsl(var(--border-accent))] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] hover:border-[hsl(var(--wee-border-field-hover))] disabled:cursor-not-allowed disabled:opacity-60';

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
    <div className="flex flex-col gap-6 font-[family-name:var(--font-ui)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <WeeSectionEyebrow>Launch target</WeeSectionEyebrow>
        <WeeSegmentedControl
          ariaLabel="Launch as application or website"
          value={launchType}
          onChange={handleLaunchTypeChange}
          options={[
            { value: 'application', label: 'App' },
            { value: 'url', label: 'Website' },
          ]}
        />
      </div>

      {launchType === 'application' && (
        <>
          <div className="space-y-4">
            <div className="flex min-w-0 flex-col gap-2 text-left">
              <WeeSectionEyebrow className="text-left">Display name</WeeSectionEyebrow>
              <div className="min-w-0 w-full text-left">
                <UnifiedAppPathSearch
                  inputId="channel-app-search"
                  value={appName}
                  onChange={handleAppNameChange}
                  disabled={disabled}
                  placeholder="Search installed apps…"
                />
              </div>
            </div>
          </div>

          {launchType === 'application' && selectedApp && (
            <div className="rounded-2xl border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] px-4 py-3 shadow-[var(--wee-shadow-field)]">
              <div className="flex flex-wrap items-center gap-3">
                {selectedApp.icon ? (
                  <img
                    src={selectedApp.icon}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--surface-tertiary))] text-sm">
                    {selectedApp.type === 'steam' || selectedApp.type === 'epic' ? '🎮' : '💻'}
                  </div>
                )}
                <span className="text-[0.95rem] font-bold text-[hsl(var(--text-primary))]">
                  {selectedApp.name}
                </span>
                {selectedApp.category ? (
                  <span className="rounded-md border border-[hsl(var(--border-primary)/0.8)] bg-[hsl(var(--surface-tertiary))] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[hsl(var(--text-secondary))]">
                    {selectedApp.category}
                  </span>
                ) : null}
              </div>
              {selectedApp.path ? (
                <div className="mt-2 break-words text-[0.75rem] leading-snug text-[hsl(var(--text-tertiary))]">
                  {selectedApp.path}
                </div>
              ) : null}
            </div>
          )}

          {!showLaunchPathBlock ? (
            <div className="mt-3 space-y-0.5 text-left">
              <WeeHelpParagraph>
                Search picks the launch target for you. Need something else?
              </WeeHelpParagraph>
              <WeeHelpLinkButton onClick={() => setShowManualLaunchPath(true)} disabled={disabled}>
                Add a launch path manually
              </WeeHelpLinkButton>
            </div>
          ) : (
            <div className="space-y-6">
              <WeeSectionEyebrow>Target path</WeeSectionEyebrow>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <input
                  id="channel-launch-path"
                  type="text"
                  className={`${inputWeeClass} flex-1 truncate text-sm font-bold not-italic sm:min-w-0 ${displayPathError ? 'border-[hsl(var(--state-error))]' : ''}`}
                  placeholder="Browse or paste a path"
                  value={path}
                  onChange={(e) => handlePathChange(e.target.value)}
                  disabled={disabled}
                />
                <WeeButton
                  type="button"
                  variant="primary"
                  onClick={handleBrowseFile}
                  disabled={disabled}
                  className="shrink-0 whitespace-nowrap px-8 !py-4"
                >
                  Browse
                </WeeButton>
              </div>
              {displayPathError ? (
                <div className="text-[0.75rem] text-[hsl(var(--state-error))]">{displayPathError}</div>
              ) : null}
            </div>
          )}
        </>
      )}

      {launchType === 'url' && (
        <div className="space-y-4">
          <WeeSectionEyebrow>Website address</WeeSectionEyebrow>
          <input
            id="channel-website-url"
            type="text"
            className={`${inputWeeClass} ${displayPathError ? 'border-[hsl(var(--state-error))]' : ''}`}
            placeholder="https://…"
            value={path}
            onChange={(e) => handlePathChange(e.target.value)}
            disabled={disabled}
          />
          {displayPathError ? (
            <div className="text-[0.75rem] text-[hsl(var(--state-error))]">{displayPathError}</div>
          ) : null}
        </div>
      )}
    </div>
  );
});

export default UnifiedAppPathCard;
