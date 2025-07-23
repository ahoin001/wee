import React from "react";
import { colors, fontSizes } from "./tokens";

export default function Text({
  as: Tag = "span",
  color = colors.text,
  size = "md",
  weight = 400,
  style,
  children,
  ...props
}) {
  return (
    <Tag
      style={{
        color,
        fontSize: fontSizes[size] || fontSizes.md,
        fontWeight: weight,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
} 