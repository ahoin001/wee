export const colors = {
  primary: "#0099ff",
  accent: "#4CAF50",
  error: "#dc3545",
  surface: "#fff",
  surfaceDark: "#222",
  card: "#f9fafd",
  border: "#e0e0e6",
  text: "#222",
  textSecondary: "#888",
  textOnPrimary: "#fff",
  ribbonDefault: "#e0e6ef",
  ribbonGlow: "#0099ff",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
};

export const scrollbar = {
  size: 12,
  radius: 999,
};

export const navigation = {
  zIndex: 1000,
  sideButtonSize: 48,
  sideOffsets: { default: 20, md: 16, sm: 12, xs: 8 },
  indicatorBottomOffset: 180,
  standardBottomOffset: 200,
  dotSize: 8,
  dotGap: 6,
  cssVars: {
    sideButtonSize: "--nav-side-button-size",
    indicatorBottomOffset: "--nav-indicator-bottom-offset",
    standardBottomOffset: "--nav-standard-bottom-offset",
    dotSize: "--nav-dot-size",
    dotGap: "--nav-dot-gap",
    easing: "--nav-ease-standard",
    durationBase: "--nav-duration-base",
    durationSlow: "--nav-duration-slow",
  },
};

export const fontSizes = {
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
};

export const shadows = {
  card: "0 2px 8px #0001",
  modal: "0 20px 40px rgba(0,0,0,0.3)",
  glow: (color, px) => `0 0 ${px}px ${color}`,
}; 