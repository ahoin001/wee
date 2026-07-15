import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { mergeMotionFeedback } from '../utils/motionFeedbackDefaults';
import {
  createGooeyCloseSpring,
  createGooeyModalPanelVariants,
  createGooeyOpenSpring,
  resolveGooeyHoverMotion,
  resolveSurfaceIntensity,
} from '../design/gooeyPhysics';

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
    const gooeyEnabled = !off && prefs.effects.gooeyHighlights !== false;

    const modalIntensity = resolveSurfaceIntensity(prefs.gooey, 'modals');
    const channelIntensity = resolveSurfaceIntensity(prefs.gooey, 'channels');
    const ribbonIntensity = resolveSurfaceIntensity(prefs.gooey, 'ribbon');
    const mediaHubIntensity = resolveSurfaceIntensity(prefs.gooey, 'mediaHub');

    const channelHover = resolveGooeyHoverMotion(prefs.gooey.channelHoverMode, channelIntensity, {
      baseScale: 1.06,
    });
    const ribbonHover = resolveGooeyHoverMotion(prefs.gooey.ribbonHoverMode, ribbonIntensity, {
      baseScale: 1.12,
    });
    const mediaHubHover = resolveGooeyHoverMotion(
      prefs.gooey.mediaHubHoverMode,
      mediaHubIntensity,
      { baseScale: 1.01 }
    );

    return {
      osReduced,
      prefs,
      /** Launch cinematic choreography — 'off' under reduced motion / master off (status pill still shows). */
      launchFeedbackMode: off ? 'off' : prefs.launch,
      /** Effective “no playful motion” for this surface */
      channelTap: !off && prefs.channels.tap,
      channelDragPreview: !off && prefs.channels.dragPreview,
      channelDropTarget: !off && prefs.channels.dropTarget,
      channelReorderParticles: !off && prefs.channels.reorderParticles,
      channelReorderSlotMotion: !off && prefs.channels.reorderSlotMotion,
      dockPress: !off && prefs.dock.press,
      ribbonTap: !off && prefs.ribbon.tap,
      modalSpringTransitions: !off && prefs.modals.springTransitions,
      modalStaggeredEntrance: !off && prefs.modals.staggeredEntrance,
      gooeyHighlights: gooeyEnabled,
      iconTilt: !off && prefs.effects.iconTilt,
      gooey: {
        enabled: gooeyEnabled,
        prefs: prefs.gooey,
        modalIntensity,
        channelIntensity,
        ribbonIntensity,
        mediaHubIntensity,
        modalPanelVariants: createGooeyModalPanelVariants(modalIntensity),
        modalOpenSpring: createGooeyOpenSpring(modalIntensity),
        modalCloseSpring: createGooeyCloseSpring(modalIntensity),
        channelHover: {
          enabled: gooeyEnabled,
          mode: prefs.gooey.channelHoverMode,
          intensity: channelIntensity,
          ...channelHover,
          transition: createGooeyOpenSpring(channelIntensity),
        },
        ribbonHover: {
          enabled: gooeyEnabled && prefs.ribbon.tap,
          mode: prefs.gooey.ribbonHoverMode,
          intensity: ribbonIntensity,
          ...ribbonHover,
          transition: createGooeyOpenSpring(ribbonIntensity),
        },
        mediaHubHover: {
          enabled: gooeyEnabled,
          mode: prefs.gooey.mediaHubHoverMode,
          intensity: mediaHubIntensity,
          ...mediaHubHover,
          transition: createGooeyOpenSpring(mediaHubIntensity),
        },
      },
    };
  }, [osReduced, prefs]);
}
