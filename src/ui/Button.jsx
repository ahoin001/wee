// Button.jsx - Versatile, plug-and-play button for all app uses
// Usage:
// <Button variant="primary">Label</Button>
// <Button variant="secondary" size="sm">Small Button</Button>
// <Button variant="tertiary" fullWidth>Full Width</Button>
// <Button variant="danger-primary">Delete</Button>
// <Button variant="danger-secondary" size="sm">Remove</Button>
// <Button color="#ff0" bgColor="#333">Custom</Button>

import React, { useCallback, useMemo, useState } from "react";
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

const Button = React.memo(({
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
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  ...props
}) => {
  const [hovered, setHovered] = useState(false);
  
  // Memoize button colors to prevent recalculation
  const buttonColors = useMemo(() => 
    getAutoButtonColors({ variant, color, bgColor, borderColor }), 
    [variant, color, bgColor, borderColor]
  );
  const { text, bg, border } = buttonColors;
  
  // Memoize sizes object
  const sizes = useMemo(() => ({
    sm: { fontSize: fontSizes.sm, padding: "0.32rem 0.8rem" },
    md: { fontSize: fontSizes.md, padding: "0.45rem 1.1rem" },
    lg: { fontSize: fontSizes.lg, padding: "0.7rem 1.6rem" },
  }), []);
  
  // Memoize base style
  const baseStyle = useMemo(() => ({
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
  }), [rounded, sizes, size, weight, variant, border, bg, text, fullWidth, style]);
  
  // Memoize hover style
  const hoverStyle = useMemo(() => {
    if (!hovered) return {};
    
    if (variant === "primary") {
      return {
        backgroundColor: "hsl(var(--wii-blue-hover))",
        border: `1.5px solid hsl(var(--wii-blue-hover))`,
        boxShadow: `var(--shadow-md), var(--shadow-glow)`,
        color: "hsl(var(--text-inverse))",
        transform: "translateY(-1px) scale(1.03)",
      };
    } else if (variant === "secondary") {
      return {
        backgroundColor: "hsl(var(--state-hover))",
        border: `1.5px solid hsl(var(--wii-blue))`,
        color: "hsl(var(--text-primary))",
        boxShadow: "var(--shadow-md)",
        transform: "translateY(-1px) scale(1.03)",
      };
    } else if (variant === "tertiary") {
      return {
        backgroundColor: "hsl(var(--state-hover))",
        color: "hsl(var(--text-primary))",
        transform: "translateY(-1px)",
      };
    } else if (variant === "danger-primary") {
      return {
        backgroundColor: "hsl(var(--state-error-hover))",
        border: `1.5px solid hsl(var(--state-error-hover))`,
        boxShadow: `var(--shadow-md), var(--shadow-glow)`,
        color: "hsl(var(--text-inverse))",
        transform: "translateY(-1px) scale(1.03)",
      };
    } else if (variant === "danger-secondary") {
      return {
        backgroundColor: "hsl(var(--state-error-light))",
        border: `1.5px solid hsl(var(--state-error))`,
        color: "hsl(var(--state-error))",
        boxShadow: "var(--shadow-md)",
        transform: "translateY(-1px) scale(1.03)",
      };
    }
    return {};
  }, [hovered, variant]);
  
  // Memoize event handlers
  const handleMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback((e) => {
    setHovered(false);
    if (onMouseLeave) onMouseLeave(e);
  }, [onMouseLeave]);
  
  const handleMouseDown = useCallback((e) => {
    if (onMouseDown) onMouseDown(e);
  }, [onMouseDown]);
  
  const handleMouseUp = useCallback((e) => {
    if (onMouseUp) onMouseUp(e);
  }, [onMouseUp]);

  return (
    <button
      style={{ ...baseStyle, ...hoverStyle }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 