// WButton.jsx - Tailwind Variants-based button component
// Usage:
// <WButton variant="primary">Label</WButton>
// <WButton variant="secondary" size="sm">Small Button</WButton>
// <WButton variant="tertiary" fullWidth>Full Width</WButton>
// <WButton variant="danger-primary">Delete</WButton>
// <WButton variant="danger-secondary" size="sm">Remove</WButton>
// <WButton className="custom-class">Custom</WButton>

import React, { useCallback, useState } from "react";
import { tv } from "tailwind-variants";

/** Outlined / neutral actions — shared by `secondary` and `secondary-strong` (high label + border contrast). */
const variantSecondarySurface = [
  "text-text-primary border-2 border-border-secondary",
  "bg-surface-secondary",
  "shadow-sm backdrop-blur-[6px]",
  "hover:bg-state-hover hover:border-primary",
  "hover:transform hover:-translate-y-[1px] hover:scale-[1.02]",
  "active:scale-[0.98]",
  "focus:ring-2 focus:ring-primary focus:ring-offset-2",
  "disabled:bg-state-disabled disabled:border-state-disabled disabled:opacity-60",
];

const buttonVariants = tv({
  base: [
    "inline-flex items-center justify-center",
    "cursor-pointer outline-none relative",
    "transition-all duration-[0.22s] ease-[cubic-bezier(0.4,0,0.2,1)]",
    "font-medium",
    "focus:ring-2 focus:ring-primary focus:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "border-[1.5px] border-solid rounded-[var(--radius-md)]",
  ],
  variants: {
    variant: {
      primary: [
        /* Themeable via --primary (synced from ribbon accent); solid fill for reliable contrast. */
        "text-text-on-accent border-[hsl(var(--border-accent))]",
        "bg-primary",
        "shadow-[var(--shadow-soft),inset_0_1px_0_rgba(255,255,255,0.22)] [text-shadow:0_1px_0_rgba(0,0,0,0.18)]",
        "hover:bg-primary-hover",
        "hover:transform hover:-translate-y-[1px] hover:scale-[1.02]",
        "active:scale-[0.98]",
        "focus:ring-2 focus:ring-primary focus:ring-offset-2",
        /* Disabled: soft Wii-era “resting” chip — tinted surface, gentle inset gloss, muted label (not harsh grey slab). */
        "disabled:!opacity-100 disabled:[text-shadow:none] disabled:font-medium",
        "disabled:text-text-secondary disabled:bg-[hsl(var(--surface-wii-tint))]",
        "disabled:border-[hsl(var(--border-primary)/0.42)] disabled:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_6px_rgba(15,36,61,0.05)]",
        "disabled:rounded-[var(--radius-lg)] disabled:scale-100 disabled:hover:scale-100 disabled:hover:translate-y-0",
        "disabled:hover:bg-[hsl(var(--surface-wii-tint))] disabled:hover:border-[hsl(var(--border-primary)/0.42)]",
        "disabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_6px_rgba(15,36,61,0.05)]",
      ],
      secondary: variantSecondarySurface,
      /** Same as `secondary` (alias for existing call sites). */
      "secondary-strong": variantSecondarySurface,
      tertiary: [
        "bg-transparent border-transparent text-text-primary",
        "shadow-none",
        "hover:bg-state-hover hover:shadow-none",
        "hover:transform hover:-translate-y-[1px] active:scale-[0.98]",
        "focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:bg-transparent disabled:border-transparent",
      ],
      "danger-primary": [
        "bg-state-error border-state-error text-text-on-accent [text-shadow:0_1px_0_rgba(0,0,0,0.2)]",
        "shadow-card",
        "hover:bg-state-error-hover hover:border-state-error-hover",
        "hover:transform hover:-translate-y-[1px] hover:scale-[1.03]",
        "focus:ring-2 focus:ring-state-error focus:ring-offset-2",
        "disabled:!opacity-100 disabled:[text-shadow:none] disabled:font-medium",
        "disabled:text-text-secondary disabled:bg-[hsl(var(--surface-wii-tint))]",
        "disabled:border-[hsl(var(--border-primary)/0.42)] disabled:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_6px_rgba(15,36,61,0.05)]",
        "disabled:rounded-[var(--radius-lg)] disabled:scale-100 disabled:hover:scale-100 disabled:hover:translate-y-0",
        "disabled:hover:bg-[hsl(var(--surface-wii-tint))] disabled:hover:border-[hsl(var(--border-primary)/0.42)]",
        "disabled:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_6px_rgba(15,36,61,0.05)]",
      ],
      "danger-secondary": [
        "bg-surface-secondary border-2 border-state-error text-state-error",
        "shadow-sm",
        "hover:bg-state-error-light hover:border-state-error",
        "hover:transform hover:-translate-y-[1px] hover:scale-[1.02]",
        "active:scale-[0.98]",
        "focus:ring-2 focus:ring-state-error focus:ring-offset-2",
        "disabled:!opacity-80 disabled:bg-[hsl(var(--surface-wii-tint))] disabled:border-[hsl(var(--border-primary)/0.42)] disabled:text-text-tertiary",
        "disabled:shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_1px_4px_rgba(15,36,61,0.04)] disabled:rounded-[var(--radius-lg)]",
      ],
    },
    size: {
      sm: "text-[13px] px-[0.86rem] py-[0.38rem]",
      md: "text-[15px] px-[1.18rem] py-[0.52rem]",
      lg: "text-[18px] px-[1.65rem] py-[0.75rem]",
    },
    weight: {
      400: "font-normal",
      500: "font-medium",
      600: "font-semibold",
      700: "font-bold",
    },
    rounded: {
      true: "rounded-[var(--radius-pill)]",
      false: "rounded-[var(--radius-md)]",
    },
    fullWidth: {
      true: "w-full",
      false: "w-auto",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    weight: 600,
    rounded: false,
    fullWidth: false,
  },
});

const WButton = React.memo(({
  variant = "primary",
  size = "md",
  weight = 600,
  fullWidth = false,
  rounded = false,
  className,
  children,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  disabled = false,
  ...props
}) => {
  const [hovered, setHovered] = useState(false);
  
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

  // Calculate hover shadow based on variant
  const getHoverShadow = () => {
    if (!hovered) return {};
    
    if (variant === "primary") {
      return {
        boxShadow:
          "var(--shadow-soft-hover), 0 0 18px hsl(var(--primary) / 0.28)",
      };
    } else if (variant === "secondary" || variant === "secondary-strong") {
      return {
        boxShadow: "var(--shadow-soft-hover)",
      };
    } else if (variant === "tertiary") {
      return {
        boxShadow: "none",
      };
    } else if (variant === "danger-primary") {
      return {
        boxShadow: "var(--shadow-soft-hover), 0 0 18px rgb(220 38 38 / 0.24)",
      };
    } else if (variant === "danger-secondary") {
      return {
        boxShadow: "var(--shadow-soft-hover), 0 0 0 1px hsl(var(--state-error) / 0.12)",
      };
    }
    return {};
  };

  return (
    <button
      className={buttonVariants({
        variant,
        size,
        weight,
        rounded,
        fullWidth,
        className,
      })}
      style={getHoverShadow()}
      disabled={disabled}
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

WButton.displayName = 'WButton';

export default WButton; 