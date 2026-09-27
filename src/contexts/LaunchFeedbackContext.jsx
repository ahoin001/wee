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

function measureChannelCenter(channelId) {
  if (!channelId || typeof document === 'undefined') return null;
  const escaped =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(String(channelId))
      : String(channelId).replace(/"/g, '');
  const el = document.querySelector(`[data-channel-id="${escaped}"]`);
  if (!(el instanceof HTMLElement)) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function LaunchFeedbackProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [launching, setLaunching] = useState(null);
  const timerRef = useRef(null);
  const cinematicRef = useRef({ token: null, timer: null });
  const originRef = useRef(null);

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
        origin: originRef.current,
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
        const originPoint = origin?.channelId ? measureChannelCenter(origin.channelId) : null;
        originRef.current = originPoint;
        setLaunching({
          token,
          label: label || 'Launching...',
          launchType: launchType || 'app',
          path: path || '',
          source,
          startedAt: Date.now(),
          origin: originPoint,
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
          origin={toast.origin}
          onOpenSettingsTab={(tabId) => {
            openSettingsToTab(tabId);
            dismiss();
          }}
          onDismiss={dismiss}
        />
      ) : null}
      <WeeGooeyStatusPill
        open={Boolean(launching)}
        label={launching?.label}
        origin={launching?.origin}
      />
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
