import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import LaunchErrorToast from '../components/LaunchErrorToast';
import { buildLaunchErrorReport, getLaunchErrorPresentation } from '../utils/launchErrorMessages';
import { openSettingsToTab } from '../utils/settingsNavigation';

const LaunchFeedbackContext = createContext(null);

const AUTO_DISMISS_MS = 12000;

export function LaunchFeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
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
    </LaunchFeedbackContext.Provider>
  );
}

export function useLaunchFeedback() {
  const ctx = useContext(LaunchFeedbackContext);
  if (!ctx) {
    return {
      showLaunchError: () => {},
      dismissLaunchError: () => {},
    };
  }
  return ctx;
}
