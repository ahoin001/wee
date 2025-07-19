import React from "react";
import { colors, radii, fontSizes } from "./tokens";

export default function Button({ variant = "primary", children, ...props }) {
  const style = {
    background: variant === "primary" ? colors.primary : "#f8f9fa",
    color: variant === "primary" ? colors.textOnPrimary : colors.text,
    border: variant === "primary" ? "none" : `1px solid ${colors.border}`,
    borderRadius: radii.md,
    fontSize: fontSizes.md,
    fontWeight: 500,
    padding: "0.75rem 1.5rem",
    cursor: "pointer",
    transition: "all 0.2s",
  };
  return (
    <button style={style} {...props}>
      {children}
    </button>
  );
} 