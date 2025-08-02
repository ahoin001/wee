// WSlider.jsx - Placeholder component (to be implemented)
import React from "react";

const WSlider = ({ value, onChange, min = 0, max = 100, className, ...props }) => {
  return (
    <div className={`w-full ${className || ''}`}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-surface-tertiary rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, hsl(var(--wii-blue)) 0%, hsl(var(--wii-blue)) ${(value - min) / (max - min) * 100}%, hsl(var(--surface-tertiary)) ${(value - min) / (max - min) * 100}%, hsl(var(--surface-tertiary)) 100%)`
        }}
        {...props}
      />
    </div>
  );
};

export default WSlider; 