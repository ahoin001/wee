// WInput.jsx - Placeholder component (to be implemented)
import React from "react";

const WInput = ({ value, onChange, placeholder, className, ...props }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-border-primary rounded-md bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-wii-blue focus:border-transparent ${className || ''}`}
      {...props}
    />
  );
};

export default WInput; 