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
  h1: { as: "h1", size: "xl", weight: 700, margin: "0 0 0.6em 0" },
  h2: { as: "h2", size: "lg", weight: 700, margin: "0 0 0.5em 0" },
  h3: { as: "h3", size: "lg", weight: 600, margin: "0 0 0.4em 0" },
  h4: { as: "h4", size: "md", weight: 600, margin: "0 0 0.3em 0" },
  p:  { as: "p",  size: "md", weight: 400, margin: "0 0 1em 0" },
  label: { as: "label", size: "md", weight: 500, margin: "0 0 0.2em 0" },
  span: { as: "span", size: "md", weight: 400, margin: 0 },
};

function getAutoTextColor(explicitColor) {
  if (explicitColor) return explicitColor;
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return colors.textOnPrimary || '#fff';
  }
  return colors.text;
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
  const resolvedColor = getAutoTextColor(color);
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