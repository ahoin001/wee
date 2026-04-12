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

export const useAppActivity = () => {
  const [activity, setActivity] = useState(getInitialActivity);

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

  return {
    isVisible: activity.isVisible,
    isFocused: activity.isFocused,
    isAppActive: activity.isVisible && activity.isFocused,
  };
};
