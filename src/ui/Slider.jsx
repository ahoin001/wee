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
}) {
  return (
    <div className={`mb-4 ${containerClassName}`.trim()}>
      {label && (
        <div className="mb-1 text-[hsl(var(--text-secondary))] text-[length:var(--control-label-font-size)]">
          {label}
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full accent-[hsl(var(--wii-blue))] ${className}`.trim()}
      />
      {!hideValue && (
        <span className="ml-2 text-[hsl(var(--text-secondary))] text-[length:var(--control-helper-font-size)]">
          {value}
        </span>
      )}
    </div>
  );
} 