import React from "react";

export default function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  className = "",
  containerClassName = "",
  disabled = false,
  hideValue = false,
  id,
  "aria-label": ariaLabel,
}) {
  return (
    <div className={`mb-4 ${containerClassName}`.trim()}>
      {label && (
        <div className="playful-system-label mb-2 text-[hsl(var(--text-secondary))]">
          {label}
        </div>
      )}
      <div className="rounded-[var(--control-radius-playful)] border-[var(--control-border-width-playful)] border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-4 py-3 shadow-[var(--playful-inner-glow)]">
        <input
          id={id}
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full accent-[hsl(var(--primary))] ${className}`.trim()}
        />
      </div>
      {!hideValue && (
        <span className="mt-2 inline-block text-[hsl(var(--text-secondary))] text-[length:var(--control-helper-font-size)] font-bold">
          {value}
        </span>
      )}
    </div>
  );
} 