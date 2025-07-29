// Text.jsx - Unified text component for headings, paragraphs, labels, and spans
// Usage:
// <Text variant="h1">Heading 1</Text>
// <Text variant="p">Paragraph text</Text>
// <Text variant="label">Label</Text>
// <Text variant="span">Inline text</Text>
// Supports: color, size, weight, style, as (element override), and auto-contrast in dark mode

import React from "react";
import { colors, fontSizes } from "./tokens";

const variantDefaults = {
  h1: { as: "h1", size: "xl", weight: 700, margin: "0 0 0.6em 0", color: "hsl(var(--text-primary))" },
  h2: { as: "h2", size: "lg", weight: 700, margin: "0 0 0.5em 0", color: "hsl(var(--text-primary))" },
  h3: { as: "h3", size: "lg", weight: 600, margin: "0 0 0.4em 0", color: "hsl(var(--text-primary))" },
  h4: { as: "h4", size: "md", weight: 600, margin: "0 0 0.3em 0", color: "hsl(var(--text-primary))" },
  p:  { as: "p",  size: "md", weight: 400, margin: "0 0 1em 0", color: "hsl(var(--text-primary))" },
  label: { as: "label", size: "md", weight: 500, margin: "0 0 0.2em 0", color: "hsl(var(--text-primary))" },
  span: { as: "span", size: "md", weight: 400, margin: 0, color: "hsl(var(--text-primary))" },
  desc: { as: "p", size: "sm", weight: 400, margin: "0 0 0.5em 0", color: "hsl(var(--text-secondary))" },
  help: { as: "p", size: "sm", weight: 400, margin: "0.25em 0 0 0", color: "hsl(var(--text-tertiary))" },
  error: { as: "p", size: "sm", weight: 500, margin: "0.25em 0 0 0", color: "hsl(var(--state-error))" },
  caption: { as: "p", size: "sm", weight: 400, margin: "0.25em 0 0 0", color: "hsl(var(--text-tertiary))" },
  small: { as: "span", size: "sm", weight: 400, margin: 0, color: "hsl(var(--text-secondary))" },
};

function getAutoTextColor(explicitColor) {
  if (explicitColor) return explicitColor;
  // Use design system CSS variables that automatically handle dark mode
  return "hsl(var(--text-primary))";
}

export default function Text({
  variant = "span",
  as,
  color,
  size,
  weight,
  style,
  children,
  ...props
}) {
  const defaults = variantDefaults[variant] || variantDefaults.span;
  const Tag = as || defaults.as;
  const resolvedColor = color || defaults.color || getAutoTextColor(color);
  return (
    <Tag
      style={{
        color: resolvedColor,
        fontSize: fontSizes[size || defaults.size] || fontSizes.md,
        fontWeight: weight !== undefined ? weight : defaults.weight,
        margin: defaults.margin,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
} 