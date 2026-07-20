import { useEffect } from 'react';

/**
 * Decorative RAF resume supervisor — visibility restore / window focus.
 * Caller owns cancel+null then restart inside `onKick` (never silent-dead loops).
 *
 * @param {{ enabled: boolean, onKick: () => void }} opts
 */
export function useRafResumeKick({ enabled, onKick }) {
  useEffect(() => {
    if (!enabled || typeof onKick !== 'function') return undefined;
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

    const kick = () => {
      if (document.visibilityState === 'hidden') return;
      onKick();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') kick();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', kick);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', kick);
    };
  }, [enabled, onKick]);
}

export default useRafResumeKick;
