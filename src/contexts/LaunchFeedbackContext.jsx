import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LaunchErrorToast } from '../components/core';
import { WeeGooeyStatusPill } from '../ui/wee';
import { buildLaunchErrorReport, getLaunchErrorPresentation } from '../utils/launchErrorMessages';
import { openSettingsToTab } from '../utils/settingsNavigation';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { LAUNCH_CINEMATIC_MAX_MS } from '../utils/launchCinematic';

const LaunchFeedbackContext = createContext(null);

const AUTO_DISMISS_MS = 12000;

/**
 * Transient shell choreography state (`ui.launchCinematic`) — written only here.
 * The Electron launch IPC is never delayed; the cinematic reacts concurrently and stops
 * when the launch resolves, the window blurs (launched app took focus), errors surface,
 * or the safety ceiling elapses. Consumers gate rendering by motion prefs / reduced motion.
 */
const setLaunchCinematic = (value) => {
  useConsolidatedAppStore.getState().actions.setUIState({ launchCinematic: value });
};

export function LaunchFeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [launching, setLaunching] = useState(null);
  const timerRef = useRef(null);
  const cinematicRef = useRef({ token: null, timer: null });

  const clearLaunchCinematic = useCallback((token) => {
    const current = cinematicRef.current;
    if (!current.token) return; // nothing active — avoid store churn on every window blur
    if (token && current.token !== token) return;
    if (current.timer) clearTimeout(current.timer);
    cinematicRef.current = { token: null, timer: null };
    setLaunchCinematic(null);
  }, []);

  const beginLaunchCinematic = useCallback(
    ({ token, origin, source }) => {
      // Rapid repeated launches replace the previous cinematic cleanly.
      clearLaunchCinematic();
      cinematicRef.current = {
        token,
        timer: setTimeout(() => clearLaunchCinematic(token), LAUNCH_CINEMATIC_MAX_MS),
      };
      setLaunchCinematic({
        token,
        channelId: origin.channelId,
        source: source || 'app',
        startedAt: Date.now(),
      });
    },
    [clearLaunchCinematic]
  );

  // The launched app taking focus (or session power change hiding us) ends the choreography.
  useEffect(() => {
    const stop = () => clearLaunchCinematic();
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);
    return () => {
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', stop);
      clearLaunchCinematic();
    };
  }, [clearLaunchCinematic]);

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

      // Errors cancel choreography cleanly — the toast owns attention now.
      clearLaunchCinematic();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    },
    [dismiss, clearLaunchCinematic]
  );

  const value = useMemo(
    () => ({
      showLaunchError,
      dismissLaunchError: dismiss,
      beginLaunchFeedback: ({ token, label, launchType, path, source = 'app', origin = null }) => {
        setLaunching({
          token,
          label: label || 'Launching...',
          launchType: launchType || 'app',
          path: path || '',
          source,
          startedAt: Date.now(),
        });
        if (origin?.channelId) {
          beginLaunchCinematic({ token, origin, source });
        }
      },
      endLaunchFeedback: (token) => {
        setLaunching((prev) => {
          if (!prev) return null;
          if (!token || prev.token === token) return null;
          return prev;
        });
        // Cinematic intentionally outlives the (fast) launch IPC — it ends on window
        // blur, error toast, or the LAUNCH_CINEMATIC_MAX_MS ceiling, whichever first.
      },
    }),
    [showLaunchError, dismiss, beginLaunchCinematic]
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
      <WeeGooeyStatusPill open={Boolean(launching)} label={launching?.label} />
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
