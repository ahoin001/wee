import React from "react";
import { colors, radii, fontSizes } from "./tokens";

export default function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ fontWeight: 500, color: colors.text, fontSize: fontSizes.md }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: "100%",
          padding: "0.75rem",
          border: `1px solid ${error ? colors.error : colors.border}`,
          borderRadius: radii.md,
          fontSize: fontSizes.md,
          marginTop: 4,
        }}
        {...props}
      />
      {error && <div style={{ color: colors.error, fontSize: fontSizes.sm }}>{error}</div>}
    </div>
  );
} 