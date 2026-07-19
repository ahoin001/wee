import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

function clampToStep(raw, min, max, step) {
  let n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const lo = Number(min);
  const hi = Number(max);
  const st = Number(step);
  if (Number.isFinite(lo)) n = Math.max(lo, n);
  if (Number.isFinite(hi)) n = Math.min(hi, n);
  if (Number.isFinite(st) && st > 0) {
    const base = Number.isFinite(lo) ? lo : 0;
    n = Math.round((n - base) / st) * st + base;
    // Avoid float drift on common decimal steps
    const decimals = String(st).includes('.') ? String(st).split('.')[1].length : 0;
    if (decimals > 0) n = Number(n.toFixed(decimals));
  }
  if (Number.isFinite(lo)) n = Math.max(lo, n);
  if (Number.isFinite(hi)) n = Math.min(hi, n);
  return n;
}

/**
 * Click-to-edit numeric value beside a slider. Displays a formatted button;
 * click swaps to a number input (Enter/blur commit, Escape cancel).
 */
function WeeSliderValue({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  suffix = '',
  'aria-label': ariaLabel,
  className = '',
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const display =
    typeof format === 'function' ? format(value) : String(value);

  useEffect(() => {
    if (!editing) return undefined;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [editing]);

  const beginEdit = useCallback(() => {
    setDraft(String(value));
    setEditing(true);
  }, [value]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft('');
  }, []);

  const commit = useCallback(() => {
    const next = clampToStep(draft, min, max, step);
    setEditing(false);
    setDraft('');
    if (next == null) return;
    if (next !== value) onChange?.(next);
  }, [draft, max, min, onChange, step, value]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft}
        aria-label={ariaLabel || 'Edit value'}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        className={`settings-wee-slider-row__value settings-wee-slider-row__value--input w-[4.5rem] rounded-md border border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-elevated))] px-1.5 py-0.5 text-right tabular-nums text-[hsl(var(--text-primary))] outline-none focus:border-[hsl(var(--primary))] ${className}`.trim()}
      />
    );
  }

  return (
    <button
      type="button"
      className={`settings-wee-slider-row__value settings-wee-slider-row__value--editable cursor-text rounded-md border border-transparent px-1.5 py-0.5 text-right tabular-nums transition-colors hover:border-[hsl(var(--border-primary)/0.45)] hover:bg-[hsl(var(--surface-secondary)/0.55)] ${className}`.trim()}
      onClick={beginEdit}
      title="Click to type a value"
      aria-label={ariaLabel || `Edit value, currently ${display}${suffix}`}
    >
      {display}
      {suffix}
    </button>
  );
}

WeeSliderValue.propTypes = {
  value: PropTypes.number.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  format: PropTypes.func,
  suffix: PropTypes.string,
  'aria-label': PropTypes.string,
  className: PropTypes.string,
};

export default WeeSliderValue;
