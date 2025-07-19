import React from "react";
import { colors } from "./tokens";

export default function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ color: colors.textSecondary, marginBottom: 4 }}>{label}</div>}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        style={{ width: "100%" }}
      />
      <span style={{ color: colors.textSecondary, marginLeft: 8 }}>{value}</span>
    </div>
  );
} 