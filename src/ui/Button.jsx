// Button.jsx - Versatile, plug-and-play button for all app uses
// Usage:
// <Button variant="primary">Label</Button>
// <Button variant="secondary" size="sm">Small Button</Button>
// <Button variant="tertiary" fullWidth>Full Width</Button>
// <Button variant="danger-primary">Delete</Button>
// <Button variant="danger-secondary" size="sm">Remove</Button>
// <Button color="#ff0" bgColor="#333">Custom</Button>

import React from "react";
import { colors, radii, fontSizes, shadows } from "./tokens";
import Text from "./Text";

function getAutoButtonColors({ variant, color, bgColor, borderColor }) {
  // Use design system CSS variables that automatically handle dark mode
  let text = color;
  let bg = bgColor;
  let border = borderColor;
  if (!color) {
    if (variant === "primary") text = "hsl(var(--text-inverse))";
    else if (variant === "danger-primary") text = "hsl(var(--text-inverse))";
    else text = "hsl(var(--text-primary))";
  }
  if (!bgColor) {
    if (variant === "primary") bg = "hsl(var(--wii-blue))";
    else if (variant === "secondary") bg = "hsl(var(--surface-secondary))";
    else if (variant === "danger-primary") bg = "hsl(var(--state-error))";
    else if (variant === "danger-secondary") bg = "hsl(var(--surface-secondary))";
    else bg = "transparent";
  }
  if (!borderColor) {
    if (variant === "primary") border = "hsl(var(--wii-blue))";
    else if (variant === "secondary") border = "hsl(var(--border-primary))";
    else if (variant === "danger-primary") border = "hsl(var(--state-error))";
    else if (variant === "danger-secondary") border = "hsl(var(--state-error))";
    else border = "transparent";
  }
  return { text, bg, border };
}

export default function Button({
  variant = "primary",
  size = "md",
  weight = 600,
  fullWidth = false,
  rounded = false,
  color,
  bgColor,
  borderColor,
  style,
  children,
  ...props
}) {
  const { text, bg, border } = getAutoButtonColors({ variant, color, bgColor, borderColor });
  const sizes = {
    sm: { fontSize: fontSizes.sm, padding: "0.32rem 0.8rem" },
    md: { fontSize: fontSizes.md, padding: "0.45rem 1.1rem" },
    lg: { fontSize: fontSizes.lg, padding: "0.7rem 1.6rem" },
  };
  const baseStyle = {
    borderRadius: rounded ? 999 : radii.md,
    fontSize: sizes[size].fontSize,
    fontWeight: weight,
    padding: sizes[size].padding,
    cursor: "pointer",
    outline: "none",
    transition: "background 0.18s, color 0.18s, border 0.18s, box-shadow 0.18s, transform 0.18s",
    position: "relative",
    boxShadow: variant !== "tertiary" ? shadows.card : "none",
    border: `1.5px solid ${border}`,
    backgroundColor: bg,
    color: text,
    width: fullWidth ? "100%" : undefined,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...style,
  };
  const [hovered, setHovered] = React.useState(false);
  let hoverStyle = {};
  if (hovered) {
    if (variant === "primary") {
      hoverStyle = {
        backgroundColor: "hsl(var(--wii-blue-hover))",
        border: `1.5px solid hsl(var(--wii-blue-hover))`,
        boxShadow: `var(--shadow-md), var(--shadow-glow)`,
        color: "hsl(var(--text-inverse))",
        transform: "translateY(-1px) scale(1.03)",
  };
    } else if (variant === "secondary") {
      hoverStyle = {
        backgroundColor: "hsl(var(--state-hover))",
        border: `1.5px solid hsl(var(--wii-blue))`,
        color: "hsl(var(--text-primary))",
        boxShadow: "var(--shadow-md)",
        transform: "translateY(-1px) scale(1.03)",
      };
    } else if (variant === "tertiary") {
      hoverStyle = {
        backgroundColor: "hsl(var(--state-hover))",
        color: "hsl(var(--text-primary))",
        textDecoration: "underline",
      };
    } else if (variant === "danger-primary") {
      hoverStyle = {
        backgroundColor: "hsl(var(--state-error) / 0.9)",
        border: `1.5px solid hsl(var(--state-error) / 0.9)`,
        boxShadow: `var(--shadow-md), 0 0 0 1px hsl(var(--state-error) / 0.3)`,
        color: "hsl(var(--text-inverse))",
        transform: "translateY(-1px) scale(1.03)",
      };
    } else if (variant === "danger-secondary") {
      hoverStyle = {
        backgroundColor: "hsl(var(--state-error) / 0.1)",
        border: `1.5px solid hsl(var(--state-error))`,
        color: "hsl(var(--state-error))",
        boxShadow: "var(--shadow-md)",
        transform: "translateY(-1px) scale(1.03)",
      };
    }
  }
  return (
    <button
      style={{ ...baseStyle, ...hoverStyle }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      <Text as="span" size={size} weight={weight} color={text} style={{ pointerEvents: "none" }}>{children}</Text>
    </button>
  );
} 