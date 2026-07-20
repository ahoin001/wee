/**
 * BETA Scene FX host — mounts only enabled effect modules.
 * Removable with `src/features/sceneFxBeta/` (see README).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { isSceneFxEffectActive, normalizeSceneFxBeta } from './sceneFxBetaPrefs.js';
import SceneFxParallax from './effects/SceneFxParallax.jsx';
import SceneFxAtmosphere from './effects/SceneFxAtmosphere.jsx';
import SceneFxCursorWake from './effects/SceneFxCursorWake.jsx';
import SceneFxMusicBloom from './effects/SceneFxMusicBloom.jsx';
import './SceneFxBeta.css';

function SceneFxBetaRoot() {
  const rawPrefs = useConsolidatedAppStore(
    useShallow((state) => state.ui?.sceneFxBeta)
  );
  const prefs = useMemo(() => normalizeSceneFxBeta(rawPrefs), [rawPrefs]);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!prefs.enabled) return null;

  const parallaxOn = isSceneFxEffectActive(prefs, 'parallax', { reducedMotion });
  const atmosphereOn = isSceneFxEffectActive(prefs, 'atmosphere', { reducedMotion });
  const wakeOn = isSceneFxEffectActive(prefs, 'cursorWake', { reducedMotion });
  const bloomOn = isSceneFxEffectActive(prefs, 'musicBloom', { reducedMotion });

  return (
    <div className="scene-fx-beta-root" aria-hidden>
      {/* Parallax writes CSS vars onto the wallpaper shell — no DOM here */}
      {parallaxOn ? <SceneFxParallax amount={prefs.parallax.amount} /> : null}
      {atmosphereOn ? (
        <SceneFxAtmosphere vignette={prefs.atmosphere.vignette} shafts={prefs.atmosphere.shafts} />
      ) : null}
      {wakeOn ? (
        <SceneFxCursorWake intensity={prefs.cursorWake.intensity} reducedMotion={reducedMotion} />
      ) : null}
      {bloomOn ? <SceneFxMusicBloom intensity={prefs.musicBloom.intensity} /> : null}
    </div>
  );
}

export default React.memo(SceneFxBetaRoot);
