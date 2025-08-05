import React from "react";

export default function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div 
          className="text-[hsl(var(--text-secondary))] mb-1" 
          style={{ marginBottom: 4 }}
        >
          {label}
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%" }}
      />
      <span 
        className="text-[hsl(var(--text-secondary))] ml-2"
        style={{ marginLeft: 8 }}
      >
        {value}
      </span>
    </div>
  );
} 