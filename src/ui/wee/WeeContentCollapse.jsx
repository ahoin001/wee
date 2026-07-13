import React, { useEffect, useId, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';

/** Fallback ms if CSS var cannot be read (matches --wee-collapse-duration). */
const COLLAPSE_FALLBACK_MS = 420;
const COLLAPSE_REDUCED_FALLBACK_MS = 100;

function readCollapseDurationMs(reduceMotion) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return reduceMotion ? COLLAPSE_REDUCED_FALLBACK_MS : COLLAPSE_FALLBACK_MS;
  }
  const styles = getComputedStyle(document.documentElement);
  const raw = styles
    .getPropertyValue(
      reduceMotion ? '--wee-collapse-duration-reduced' : '--wee-collapse-duration'
    )
    .trim();
  if (!raw) return reduceMotion ? COLLAPSE_REDUCED_FALLBACK_MS : COLLAPSE_FALLBACK_MS;
  if (raw.endsWith('ms')) return Math.max(0, parseFloat(raw) || 0);
  if (raw.endsWith('s')) return Math.max(0, (parseFloat(raw) || 0) * 1000);
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : reduceMotion ? COLLAPSE_REDUCED_FALLBACK_MS : COLLAPSE_FALLBACK_MS;
}

/**
 * Height-safe content expand/collapse via CSS grid 0fr→1fr.
 * Timing from `--wee-collapse-*` in design-system.css (single clock for content morph).
 * Prefer this over Framer opacity/scale exits or height:auto when reserved layout space must morph.
 *
 * @param {boolean} [keepMounted=true] When false, children unmount after the close morph finishes.
 */
function WeeContentCollapse({
  open,
  children,
  className = '',
  id,
  role,
  keepMounted = true,
  'aria-labelledby': ariaLabelledBy,
  'aria-hidden': ariaHiddenProp,
}) {
  const reduceMotion = useReducedMotion();
  const autoId = useId();
  const regionId = id || autoId;
  const ariaHidden = ariaHiddenProp ?? !open;
  const unmountTimerRef = useRef(null);
  const [showChildren, setShowChildren] = useState(() => keepMounted || open);

  const durationVar = reduceMotion
    ? 'var(--wee-collapse-duration-reduced)'
    : 'var(--wee-collapse-duration)';

  const clearUnmountTimer = useCallback(() => {
    if (unmountTimerRef.current != null) {
      window.clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (keepMounted) {
      clearUnmountTimer();
      setShowChildren(true);
      return undefined;
    }
    if (open) {
      clearUnmountTimer();
      setShowChildren(true);
      return undefined;
    }
    // Closing with keepMounted=false: wait for morph, then unmount.
    const ms = readCollapseDurationMs(reduceMotion) + 32;
    clearUnmountTimer();
    unmountTimerRef.current = window.setTimeout(() => {
      setShowChildren(false);
      unmountTimerRef.current = null;
    }, ms);
    return clearUnmountTimer;
  }, [open, keepMounted, reduceMotion, clearUnmountTimer]);

  const handleTransitionEnd = useCallback(
    (e) => {
      if (keepMounted || open) return;
      if (e.target !== e.currentTarget) return;
      if (e.propertyName !== 'grid-template-rows' && e.propertyName !== 'opacity') return;
      clearUnmountTimer();
      setShowChildren(false);
    },
    [keepMounted, open, clearUnmountTimer]
  );

  return (
    <div
      id={regionId}
      role={role}
      aria-labelledby={ariaLabelledBy}
      aria-hidden={ariaHidden}
      className={`wee-content-collapse grid min-h-0 transition-[grid-template-rows,opacity,margin] ease-[var(--wee-collapse-ease)] ${
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-80'
      } ${className}`.trim()}
      style={{ transitionDuration: durationVar }}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={open ? 'pointer-events-auto' : 'pointer-events-none'}>
          {showChildren ? children : null}
        </div>
      </div>
    </div>
  );
}

WeeContentCollapse.propTypes = {
  open: PropTypes.bool.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
  role: PropTypes.string,
  keepMounted: PropTypes.bool,
  'aria-labelledby': PropTypes.string,
  'aria-hidden': PropTypes.bool,
};

WeeContentCollapse.defaultProps = {
  children: null,
  className: '',
  id: undefined,
  role: undefined,
  keepMounted: true,
  'aria-labelledby': undefined,
  'aria-hidden': undefined,
};

export default React.memo(WeeContentCollapse);
