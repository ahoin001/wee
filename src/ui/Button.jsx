// Button.jsx - Versatile, plug-and-play button for all app uses
// Usage:
// <Button variant="primary">Label</Button>
// <Button variant="secondary" size="sm">Small Button</Button>
// <Button variant="tertiary" fullWidth>Full Width</Button>
// <Button color="#ff0" bgColor="#333">Custom</Button>

import React from "react";
import { colors, radii, fontSizes, shadows } from "./tokens";
import Text from "./Text";

function getAutoButtonColors({ variant, color, bgColor, borderColor }) {
  // Detect dark mode
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Defaults
  let text = color;
  let bg = bgColor;
  let border = borderColor;
  if (!color) {
    if (variant === "primary") text = isDark ? colors.surface : colors.textOnPrimary;
    else text = isDark ? colors.primary : colors.primary;
  }
  if (!bgColor) {
    if (variant === "primary") bg = isDark ? "#1a4a6a" : colors.primary;
    else if (variant === "secondary") bg = isDark ? "#222b36" : "#f7fafd"; // Light blue-gray background for light mode
    else bg = "transparent";
  }
  if (!borderColor) {
    if (variant === "primary") border = isDark ? "#1a4a6a" : colors.primary;
    else if (variant === "secondary") border = isDark ? colors.primary : colors.primary;
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
    background: bg,
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
        background: "#007acc",
        border: `1.5px solid #007acc`,
        boxShadow: `${shadows.card}, 0 0 8px 2px #0099ff33`,
        color: colors.textOnPrimary,
        transform: "translateY(-1px) scale(1.03)",
  };
    } else if (variant === "secondary") {
      hoverStyle = {
        background: "#e6f3ff",
        border: `1.5px solid #007acc`,
        color: colors.primary,
        boxShadow: shadows.card,
        transform: "translateY(-1px) scale(1.03)",
      };
    } else if (variant === "tertiary") {
      hoverStyle = {
        background: "#e6f3ff",
        color: colors.primary,
        textDecoration: "underline",
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