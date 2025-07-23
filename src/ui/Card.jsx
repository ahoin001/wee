// Card.jsx - Unified card component for app UI
// Usage:
// <Card><Text variant="h3">Title</Text>...</Card>

import React from "react";
import { colors, radii, shadows, spacing } from "./tokens";

export default function Card({ children, style, title, separator, desc, actions, ...props }) {
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
      {title && <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: 6 }}>{title}</div>}
      {separator && <div style={{ height: 1, background: '#e0e0e6', margin: '10px 0' }} />}
      {desc && <div style={{ color: '#555', fontSize: '0.97em', marginBottom: 10 }}>{desc}</div>}
      {actions}
      {children}
    </div>
  );
} 