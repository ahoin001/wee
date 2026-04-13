import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Horizontal seek scrubber: pointer drag + click-to-seek without stale React state on commit.
 * @param {boolean} [options.disabled] — when true, no pointer handling (e.g. Spotify Free tier).
 */
export function usePlaybackSeek({ durationMs, onCommitSeek, disabled = false }) {
  const progressBarRef = useRef(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const seekPositionRef = useRef(0);
  const isSeekingRef = useRef(false);

  const positionFromClientX = useCallback(
    (clientX) => {
      const el = progressBarRef.current;
      if (!el || !durationMs) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return null;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.floor(durationMs * pct);
    },
    [durationMs]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isSeekingRef.current) return;
      const pos = positionFromClientX(e.clientX);
      if (pos == null) return;
      seekPositionRef.current = pos;
      setSeekPosition(pos);
    },
    [positionFromClientX]
  );

  const handlePointerUp = useCallback(() => {
    if (!isSeekingRef.current) return;
    isSeekingRef.current = false;
    setIsSeeking(false);
    if (!disabled) {
      onCommitSeek(seekPositionRef.current);
    }
  }, [disabled, onCommitSeek]);

  const handleSeekHandlePointerDown = useCallback(
    (e) => {
      if (disabled) return;
      if (!durationMs) return;
      e.preventDefault();
      e.stopPropagation();
      isSeekingRef.current = true;
      setIsSeeking(true);
      const pos = positionFromClientX(e.clientX);
      if (pos != null) {
        seekPositionRef.current = pos;
        setSeekPosition(pos);
      }
    },
    [disabled, durationMs, positionFromClientX]
  );

  useEffect(() => {
    if (!isSeeking) return undefined;
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isSeeking, handlePointerMove, handlePointerUp]);

  const handleProgressBarPointerDown = useCallback(
    (e) => {
      if (disabled) return;
      if (!durationMs || isSeekingRef.current) return;
      if (e.target.closest('.progress-handle-modern')) return;
      e.preventDefault();
      const pos = positionFromClientX(e.clientX);
      if (pos != null) onCommitSeek(pos);
    },
    [disabled, durationMs, positionFromClientX, onCommitSeek]
  );

  return {
    progressBarRef,
    isSeeking,
    seekPosition,
    handleSeekHandlePointerDown,
    handleProgressBarPointerDown,
  };
}
