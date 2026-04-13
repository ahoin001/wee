import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { mergeMotionFeedback } from '../utils/motionFeedbackDefaults';

/**
 * Resolved motion flags: combines OS `prefers-reduced-motion` with app `ui.motionFeedback`.
 * Use in Framer-powered components instead of only `useReducedMotion()` when feature is user-toggleable.
 */
export function useMotionFeedback() {
  const osReduced = useReducedMotion();
  const raw = useConsolidatedAppStore((state) => state.ui.motionFeedback);
  const prefs = useMemo(() => mergeMotionFeedback(raw), [raw]);

  return useMemo(() => {
    const masterOff = !prefs.master;
    const off = osReduced || masterOff;
    return {
      osReduced,
      prefs,
      /** Effective “no playful motion” for this surface */
      channelTap: !off && prefs.channels.tap,
      channelDragPreview: !off && prefs.channels.dragPreview,
      channelDropTarget: !off && prefs.channels.dropTarget,
      channelReorderParticles: !off && prefs.channels.reorderParticles,
      channelReorderSlotMotion: !off && prefs.channels.reorderSlotMotion,
      dockPress: !off && prefs.dock.press,
      ribbonTap: !off && prefs.ribbon.tap,
    };
  }, [osReduced, prefs]);
}
