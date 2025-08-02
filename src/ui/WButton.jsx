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

const buttonVariants = tv({
  base: [
    "inline-flex items-center justify-center",
    "cursor-pointer outline-none relative",
    "transition-all duration-[0.18s] ease-out",
    "font-semibold",
    "focus:ring-2 focus:ring-wii-blue focus:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "border-[1.5px] border-solid",
  ],
  variants: {
    variant: {
      primary: [
        "bg-wii-blue border-wii-blue text-text-inverse",
        "shadow-card",
        "hover:bg-wii-blue-hover hover:border-wii-blue-hover",
        "hover:transform hover:-translate-y-[1px] hover:scale-[1.03]",
        "focus:ring-2 focus:ring-wii-blue focus:ring-offset-2",
        "disabled:bg-state-disabled disabled:border-state-disabled",
      ],
      secondary: [
        "bg-surface-secondary border-border-primary text-text-primary",
        "shadow-card",
        "hover:bg-state-hover hover:border-wii-blue",
        "hover:transform hover:-translate-y-[1px] hover:scale-[1.03]",
        "focus:ring-2 focus:ring-wii-blue focus:ring-offset-2",
        "disabled:bg-state-disabled disabled:border-state-disabled",
      ],
      tertiary: [
        "bg-transparent border-transparent text-text-primary",
        "shadow-none",
        "hover:bg-state-hover hover:shadow-none",
        "hover:transform hover:-translate-y-[1px]",
        "focus:ring-2 focus:ring-wii-blue focus:ring-offset-2",
        "disabled:bg-transparent disabled:border-transparent",
      ],
      "danger-primary": [
        "bg-state-error border-state-error text-text-inverse",
        "shadow-card",
        "hover:bg-state-error-hover hover:border-state-error-hover",
        "hover:transform hover:-translate-y-[1px] hover:scale-[1.03]",
        "focus:ring-2 focus:ring-state-error focus:ring-offset-2",
        "disabled:bg-state-disabled disabled:border-state-disabled",
      ],
      "danger-secondary": [
        "bg-surface-secondary border-state-error text-state-error",
        "shadow-card",
        "hover:bg-state-error-light hover:border-state-error",
        "hover:transform hover:-translate-y-[1px] hover:scale-[1.03]",
        "focus:ring-2 focus:ring-state-error focus:ring-offset-2",
        "disabled:bg-state-disabled disabled:border-state-disabled",
      ],
    },
    size: {
      sm: "text-[13px] px-[0.8rem] py-[0.32rem]",
      md: "text-[15px] px-[1.1rem] py-[0.45rem]",
      lg: "text-[18px] px-[1.6rem] py-[0.7rem]",
    },
    weight: {
      400: "font-normal",
      500: "font-medium",
      600: "font-semibold",
      700: "font-bold",
    },
    rounded: {
      true: "rounded-full",
      false: "rounded-[8px]",
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
        boxShadow: "var(--shadow-md), 0 0 20px rgb(0 153 255 / 0.3)",
      };
    } else if (variant === "secondary") {
      return {
        boxShadow: "var(--shadow-md)",
      };
    } else if (variant === "tertiary") {
      return {
        boxShadow: "none",
      };
    } else if (variant === "danger-primary") {
      return {
        boxShadow: "var(--shadow-md), 0 0 20px rgb(220 38 38 / 0.3)",
      };
    } else if (variant === "danger-secondary") {
      return {
        boxShadow: "var(--shadow-md)",
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