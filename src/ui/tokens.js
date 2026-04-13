/** Strings for inline styles — mirror design-system.css :root */
export const colors = {
  primary: "hsl(var(--wii-blue))",
  accent: "hsl(var(--state-success))",
  error: "hsl(var(--state-error))",
  surface: "hsl(var(--surface-primary))",
  surfaceDark: "hsl(var(--bg-primary))",
  card: "hsl(var(--surface-secondary))",
  border: "hsl(var(--border-primary))",
  text: "hsl(var(--text-primary))",
  textSecondary: "hsl(var(--text-secondary))",
  textOnPrimary: "hsl(var(--text-on-accent))",
  ribbonDefault: "hsl(var(--surface-secondary))",
  ribbonGlow: "hsl(var(--wii-blue))",
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
  card: "var(--shadow-card)",
  modal: "var(--shadow-modal)",
  glow: (color, px) => `0 0 ${px}px ${color}`,
}; 