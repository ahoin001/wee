// WCard.jsx - Placeholder component (to be implemented)
import React from "react";

const WCard = ({ children, className, ...props }) => {
  return (
    <div
      className={`bg-surface-primary border border-border-primary rounded-lg shadow-card p-4 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default WCard; 