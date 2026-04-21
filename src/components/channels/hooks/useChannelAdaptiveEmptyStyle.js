import { useMemo } from 'react';

export function useChannelAdaptiveEmptyStyle({
  effectiveIsEmpty,
  effectiveMedia,
  useAdaptiveEmptyChannels,
  ribbonGlowColor,
  ribbonColor,
}) {
  return useMemo(() => {
    if (!(effectiveIsEmpty && !effectiveMedia && useAdaptiveEmptyChannels)) {
      return undefined;
    }

    const accentColor =
      ribbonGlowColor ||
      ribbonColor ||
      'hsl(var(--primary))';

    return {
      '--adaptive-bg-color': `color-mix(in srgb, hsl(var(--surface-secondary)) 76%, ${accentColor} 24%)`,
      '--adaptive-bg-color-hover': `color-mix(in srgb, hsl(var(--surface-secondary)) 68%, ${accentColor} 32%)`,
      '--adaptive-border-color': `color-mix(in srgb, hsl(var(--border-primary)) 58%, ${accentColor} 42%)`,
      '--adaptive-glow-color': `color-mix(in srgb, transparent 72%, ${accentColor} 28%)`,
    };
  }, [
    effectiveIsEmpty,
    effectiveMedia,
    useAdaptiveEmptyChannels,
    ribbonGlowColor,
    ribbonColor,
  ]);
}

export default useChannelAdaptiveEmptyStyle;
