// WText.jsx - Placeholder component (to be implemented)
import React from "react";

const WText = ({ variant = "body", children, className, ...props }) => {
  const variantClasses = {
    h1: "text-3xl font-bold text-text-primary",
    h2: "text-2xl font-semibold text-text-primary",
    h3: "text-xl font-medium text-text-primary",
    body: "text-base text-text-primary",
    caption: "text-sm text-text-secondary",
    label: "text-sm font-medium text-text-primary",
  };

  return (
    <div className={`${variantClasses[variant]} ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export default WText; 