import { useEffect, useState } from 'react';
import { RIBBON_CHROME_IDLE_DELAY_MS } from '../components/dock/ribbon/ribbonChromeEffectMeta';

/**
 * Shared idle gate for ribbon chrome FX + pulse glow.
 * When `idleOnly` is false, always ready. When true, ready only after unhover delay.
 */
export function useRibbonChromeIdleGate(idleOnly, hovered) {
  const [idleReady, setIdleReady] = useState(!idleOnly);

  useEffect(() => {
    if (!idleOnly) {
      setIdleReady(true);
      return undefined;
    }
    if (hovered) {
      setIdleReady(false);
      return undefined;
    }
    const t = window.setTimeout(() => setIdleReady(true), RIBBON_CHROME_IDLE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [idleOnly, hovered]);

  return idleReady;
}
