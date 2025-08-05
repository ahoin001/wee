// Text.jsx - Unified text component for headings, paragraphs, labels, and spans
// Usage:
// <Text variant="h1">Heading 1</Text>
// <Text variant="p">Paragraph text</Text>
// <Text variant="label">Label</Text>
// <Text variant="span">Inline text</Text>
// Supports: color, size, weight, style, as (element override), and auto-contrast in dark mode

import React from "react";
import clsx from "clsx";

// CSS custom properties-based variant mapping for text styles
const variantMap = {
  h1: {
    as: "h1",
    className:
      "text-4xl font-bold text-[hsl(var(--text-primary))] mb-3 leading-tight tracking-tight",
  },
  h2: {
    as: "h2",
    className:
      "text-3xl font-bold text-[hsl(var(--text-primary))] mb-2.5 leading-tight tracking-tight",
  },
  h3: {
    as: "h3",
    className:
      "text-2xl font-semibold text-[hsl(var(--text-primary))] mb-2 leading-snug tracking-tight",
  },
  h4: {
    as: "h4",
    className:
      "text-xl font-semibold text-[hsl(var(--text-primary))] mb-1.5 leading-snug tracking-tight",
  },
  p: {
    as: "p",
    className:
      "text-base font-normal text-[hsl(var(--text-primary))] mb-4 leading-relaxed",
  },
  label: {
    as: "label",
    className:
      "text-base font-medium text-[hsl(var(--text-secondary))] mb-0.5 leading-normal",
  },
  span: {
    as: "span",
    className: "text-base font-normal text-[hsl(var(--text-primary))]",
  },
  desc: {
    as: "p",
    className:
      "text-sm font-normal text-[hsl(var(--text-secondary))] mb-2 leading-relaxed",
  },
  help: {
    as: "p",
    className:
      "text-sm font-normal text-[hsl(var(--text-tertiary))] mt-1 leading-relaxed",
  },
  error: {
    as: "p",
    className:
      "text-sm font-semibold text-[hsl(var(--state-error))] mt-1 leading-relaxed",
  },
  caption: {
    as: "p",
    className:
      "text-xs font-normal text-[hsl(var(--text-tertiary))] mt-1 leading-relaxed",
  },
  small: {
    as: "span",
    className: "text-xs font-normal text-[hsl(var(--text-secondary))]",
  },
};

export default function Text({
  variant = "span",
  as,
  color,
  size,
  weight,
  className,
  style,
  children,
  ...props
}) {
  const variantDef = variantMap[variant] || variantMap.span;
  const Tag = as || variantDef.as;

  // Compose Tailwind classes, allow override of color/size/weight via props
  const classes = clsx(
    variantDef.className,
    color && !color.startsWith("hsl(") && !color.startsWith("#")
      ? color // allow tailwind color class e.g. "text-red-500"
      : undefined,
    size && `text-${size}`,
    weight && `font-${weight}`,
    className
  );

  // Inline style for custom color (e.g. hsl/hex), otherwise rely on Tailwind
  const inlineStyle =
    color && (color.startsWith("hsl(") || color.startsWith("#"))
      ? { color, ...style }
      : style;

  return (
    <Tag className={classes} style={inlineStyle} {...props}>
      {children}
    </Tag>
  );
}