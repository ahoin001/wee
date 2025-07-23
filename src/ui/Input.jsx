import React from "react";
import { colors, radii, fontSizes } from "./tokens";
import Text from "./Text";

export default function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <Text variant="label">{label}</Text>
      )}
      <input
        style={{
          width: "100%",
          padding: "0.75rem",
          border: `1px solid ${error ? colors.error : colors.border}`,
          borderRadius: radii.md,
          fontSize: fontSizes.md,
          marginTop: 4,
        }}
        {...props}
      />
      {error && <Text size="sm" color={colors.error}>{error}</Text>}
    </div>
  );
} 