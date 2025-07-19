import React from "react";
import { colors, radii, shadows, spacing } from "./tokens";

export default function Card({ children, style, ...props }) {
  return (
    <div
      style={{
        background: colors.card,
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
} 