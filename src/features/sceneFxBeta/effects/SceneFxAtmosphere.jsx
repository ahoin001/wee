/**
 * BETA Scene FX — vignette + soft light shafts.
 * Removable: delete this file + CSS block + unmount from SceneFxBetaRoot.
 */
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import useAnimationActivity from '../../../hooks/useAnimationActivity';

function restartCssAnimation(el) {
  if (!el) return;
  const prev = el.style.animation;
  el.style.animation = 'none';
  // Force reflow so the browser drops the frozen animation timeline.
  void el.offsetWidth;
  el.style.animation = prev;
}

function SceneFxAtmosphere({ vignette = 0.38, shafts = 0.28 }) {
  const vignetteAlpha = (Math.min(1, Math.max(0, vignette)) * 0.55).toFixed(3);
  const shaftsOpacity = (Math.min(1, Math.max(0, shafts)) * 0.55).toFixed(3);
  const shaftsRef = useRef(null);
  const { shouldAnimate } = useAnimationActivity({ activeFps: 1, lowPowerFps: 1 });
  const prevShouldAnimateRef = useRef(shouldAnimate);
  const [shaftEpoch, setShaftEpoch] = useState(0);

  useEffect(() => {
    const rising = shouldAnimate && !prevShouldAnimateRef.current;
    prevShouldAnimateRef.current = shouldAnimate;
    if (rising) setShaftEpoch((n) => n + 1);
  }, [shouldAnimate]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setShaftEpoch((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!shouldAnimate) return;
    restartCssAnimation(shaftsRef.current);
  }, [shaftEpoch, shouldAnimate]);

  const showShafts = Number(shafts) > 0.02;

  return (
    <div
      className="scene-fx-atmosphere"
      aria-hidden
      style={{
        '--scene-fx-vignette-alpha': vignetteAlpha,
        '--scene-fx-shafts-opacity': shaftsOpacity,
      }}
    >
      <div className="scene-fx-atmosphere__vignette" />
      {showShafts ? (
        <div
          key={shaftEpoch}
          ref={shaftsRef}
          className="scene-fx-atmosphere__shafts"
        />
      ) : null}
    </div>
  );
}

SceneFxAtmosphere.propTypes = {
  vignette: PropTypes.number,
  shafts: PropTypes.number,
};

export default React.memo(SceneFxAtmosphere);
