import { useEffect, useState } from 'react';

const getInitialActivity = () => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return { isVisible: true, isFocused: true };
  }

  return {
    isVisible: document.visibilityState === 'visible',
    isFocused: document.hasFocus(),
  };
};

const getInitialMainWindowActivity = () => ({
  isMinimized: false,
  isFocused: true,
  isVisible: true,
});

export const useAppActivity = () => {
  const [activity, setActivity] = useState(getInitialActivity);
  const [mainWindowActivity, setMainWindowActivity] = useState(getInitialMainWindowActivity);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined;
    }

    const updateVisibility = () => {
      setActivity((prev) => ({
        ...prev,
        isVisible: document.visibilityState === 'visible',
      }));
    };

    const onFocus = () => {
      setActivity((prev) => ({ ...prev, isFocused: true }));
    };

    const onBlur = () => {
      setActivity((prev) => ({ ...prev, isFocused: false }));
    };

    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    const api = typeof window !== 'undefined' ? window.api : null;
    if (!api?.onAppWindowActivity) return undefined;

    const handler = (payload) => {
      if (!payload || typeof payload !== 'object') return;
      setMainWindowActivity((prev) => ({
        ...prev,
        ...(typeof payload.isMinimized === 'boolean' ? { isMinimized: payload.isMinimized } : {}),
        ...(typeof payload.isFocused === 'boolean' ? { isFocused: payload.isFocused } : {}),
        ...(typeof payload.isVisible === 'boolean' ? { isVisible: payload.isVisible } : {}),
      }));
    };

    api.onAppWindowActivity(handler);
    return () => {
      api.offAppWindowActivity?.(handler);
    };
  }, []);

  const isAppActive =
    activity.isVisible &&
    activity.isFocused &&
    mainWindowActivity.isFocused &&
    !mainWindowActivity.isMinimized &&
    mainWindowActivity.isVisible;

  return {
    isVisible: activity.isVisible,
    isFocused: activity.isFocused,
    isMainMinimized: mainWindowActivity.isMinimized,
    mainWindowFocused: mainWindowActivity.isFocused,
    isAppActive,
  };
};
