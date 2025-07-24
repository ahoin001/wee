// Card.jsx - Unified card component for app UI
// Usage:
// <Card><Text variant="h3">Title</Text>...</Card>

import React from "react";
import { colors, radii, shadows, spacing } from "./tokens";
import Text from "./Text";

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
      {title && <Text variant="h3" color={colors.text || '#222'} style={{ marginBottom: 6 }}>{title}</Text>}
      {separator && <div style={{ height: 1, background: '#e0e0e6', margin: '10px 0' }} />}
      {desc && <div style={{ color: '#555', fontSize: '0.97em', marginBottom: 10 }}>{desc}</div>}
      {actions}
      {children}
    </div>
  );
} 