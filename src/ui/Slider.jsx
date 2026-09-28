import React from "react";
import WeeSlider from "./wee/WeeSlider";

/**
 * Labeled range — hub micro label over the gooey WeeSlider track.
 */
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
      {label ? (
        <div className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-tertiary))]">
          {label}
        </div>
      ) : null}
      <div className={`px-1 ${className}`.trim()}>
        <WeeSlider
          id={id}
          value={Number(value)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
          onChange={onChange}
        />
      </div>
      {!hideValue ? (
        <span className="mt-2 inline-block text-[length:var(--control-helper-font-size)] font-bold tabular-nums text-[hsl(var(--text-secondary))]">
          {value}
        </span>
      ) : null}
    </div>
  );
}
