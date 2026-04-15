import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LaunchErrorToast } from '../components/core';
import { buildLaunchErrorReport, getLaunchErrorPresentation } from '../utils/launchErrorMessages';
import { openSettingsToTab } from '../utils/settingsNavigation';

const LaunchFeedbackContext = createContext(null);

const AUTO_DISMISS_MS = 12000;

export function LaunchFeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [launching, setLaunching] = useState(null);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showLaunchError = useCallback(
    ({ technicalError, launchType, path, source = 'app' }) => {
      const refId = `WEE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const at = new Date().toISOString();
      const { headline, hint, settingsTabId } = getLaunchErrorPresentation({
        technicalError,
        launchType,
        path,
      });
      const reportText = buildLaunchErrorReport({
        refId,
        at,
        source,
        launchType,
        path,
        technicalError,
      });

      setToast({
        refId,
        at,
        headline,
        hint,
        technicalError: technicalError || '',
        reportText,
        launchType,
        path,
        settingsTabId,
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      showLaunchError,
      dismissLaunchError: dismiss,
      beginLaunchFeedback: ({ token, label, launchType, path, source = 'app' }) => {
        setLaunching({
          token,
          label: label || 'Launching...',
          launchType: launchType || 'app',
          path: path || '',
          source,
          startedAt: Date.now(),
        });
      },
      endLaunchFeedback: (token) => {
        setLaunching((prev) => {
          if (!prev) return null;
          if (!token || prev.token === token) return null;
          return prev;
        });
      },
    }),
    [showLaunchError, dismiss]
  );

  return (
    <LaunchFeedbackContext.Provider value={value}>
      {children}
      {toast ? (
        <LaunchErrorToast
          headline={toast.headline}
          hint={toast.hint}
          technicalError={toast.technicalError}
          reportText={toast.reportText}
          referenceId={toast.refId}
          settingsTabId={toast.settingsTabId}
          onOpenSettingsTab={(tabId) => {
            openSettingsToTab(tabId);
            dismiss();
          }}
          onDismiss={dismiss}
        />
      ) : null}
      {launching ? (
        <div className="fixed left-1/2 top-6 z-[100000] -translate-x-1/2 rounded-full border border-[hsl(var(--wii-blue)/0.35)] bg-[hsl(var(--surface-elevated)/0.96)] px-4 py-2 text-xs font-semibold text-[hsl(var(--text-primary))] shadow-[var(--shadow-lg)] backdrop-blur-md">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--wii-blue))]" />
            {launching.label}
          </span>
        </div>
      ) : null}
    </LaunchFeedbackContext.Provider>
  );
}

export function useLaunchFeedback() {
  const ctx = useContext(LaunchFeedbackContext);
  if (!ctx) {
    return {
      showLaunchError: () => {},
      dismissLaunchError: () => {},
      beginLaunchFeedback: () => {},
      endLaunchFeedback: () => {},
    };
  }
  return ctx;
}
