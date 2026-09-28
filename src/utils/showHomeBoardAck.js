import useConsolidatedAppStore from './useConsolidatedAppStore';
import { playChannelClick } from './soundPlayback';

/**
 * Transient Edit Board / scene ack. Not persisted.
 * `sound` plays the existing channel click when that sound is enabled.
 */
export function showHomeBoardAck(label, origin = null, { sound = false } = {}) {
  if (!label) return;
  const point =
    origin && typeof origin.x === 'number'
      ? { x: origin.x, y: origin.y }
      : null;
  useConsolidatedAppStore.getState().actions.setUIState({
    homeBoardAck: {
      label,
      origin: point,
      at: Date.now(),
    },
  });
  if (sound) void playChannelClick();
}

export function clearHomeBoardAck() {
  useConsolidatedAppStore.getState().actions.setUIState({ homeBoardAck: null });
}
