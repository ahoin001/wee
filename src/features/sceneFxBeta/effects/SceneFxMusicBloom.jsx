/**
 * BETA Scene FX — subtle primary wash while Now Playing is active.
 * Removable: delete this file + unmount from SceneFxBetaRoot.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import useAnimationActivity from '../../../hooks/useAnimationActivity';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';

function restartCssAnimation(el) {
  if (!el) return;
  const prev = el.style.animation;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = prev;
}

function SceneFxMusicBloom({ intensity = 0.32 }) {
  const bloomRef = useRef(null);
  const { isPlaying, hasTrack } = useConsolidatedAppStore(
    useShallow((state) => ({
      isPlaying: Boolean(state.nowPlaying?.isPlaying),
      hasTrack: Boolean(state.nowPlaying?.trackName),
    }))
  );
  const { shouldAnimate } = useAnimationActivity({ activeFps: 1, lowPowerFps: 1 });
  const prevShouldAnimateRef = useRef(shouldAnimate);
  const [bloomEpoch, setBloomEpoch] = useState(0);

  const active = isPlaying && hasTrack;
  const bloomAlpha = useMemo(
    () => (Math.min(1, Math.max(0, Number(intensity) || 0)) * 0.28).toFixed(3),
    [intensity]
  );

  useEffect(() => {
    const rising = shouldAnimate && !prevShouldAnimateRef.current;
    prevShouldAnimateRef.current = shouldAnimate;
    if (rising) setBloomEpoch((n) => n + 1);
  }, [shouldAnimate]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setBloomEpoch((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!shouldAnimate || !active) return;
    restartCssAnimation(bloomRef.current);
  }, [bloomEpoch, shouldAnimate, active]);

  return (
    <div
      ref={bloomRef}
      className={`scene-fx-music-bloom${active ? ' scene-fx-music-bloom--active scene-fx-music-bloom--pulse' : ''}`}
      aria-hidden
      style={{ '--scene-fx-bloom-alpha': bloomAlpha }}
    />
  );
}

SceneFxMusicBloom.propTypes = {
  intensity: PropTypes.number,
};

export default React.memo(SceneFxMusicBloom);
