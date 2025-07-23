import React from "react";
import { colors, radii, fontSizes, shadows } from "./tokens";

export default function Button({ variant = "primary", children, style: userStyle, ...props }) {
  let baseStyle = {
    borderRadius: radii.md,
    fontSize: fontSizes.md,
    fontWeight: 600,
    padding: "0.45rem 1.1rem",
    cursor: "pointer",
    outline: "none",
    transition: "background 0.18s, color 0.18s, border 0.18s, box-shadow 0.18s, transform 0.18s",
    position: "relative",
    boxShadow: "none",
    border: "none",
    background: "none",
    color: colors.primary,
    ...userStyle,
  };
  if (variant === "primary") {
    baseStyle = {
      ...baseStyle,
      background: colors.primary,
      color: colors.textOnPrimary,
      border: `1.5px solid ${colors.primary}`,
      boxShadow: shadows.card,
    };
  } else if (variant === "secondary") {
    baseStyle = {
      ...baseStyle,
      background: colors.card,
      color: colors.primary,
      border: `1.5px solid ${colors.primary}`,
      boxShadow: shadows.card,
    };
  } else if (variant === "tertiary") {
    baseStyle = {
      ...baseStyle,
      background: "transparent",
      color: colors.primary,
      border: "none",
      boxShadow: "none",
    };
  }
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
      {children}
    </button>
  );
} 