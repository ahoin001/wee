/** @type {import('tailwindcss').Config} */
/** Theme colors resolve from `src/styles/design-system.css` — single source of truth. */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand (HSL components from :root / .dark-mode)
        'wii-blue': 'hsl(var(--wii-blue))',
        'wii-blue-hover': 'hsl(var(--wii-blue-hover))',
        'wii-blue-active': 'hsl(var(--wii-blue-active))',

        // Background colors
        'bg-primary': 'hsl(var(--bg-primary))',
        'bg-secondary': 'hsl(var(--bg-secondary))',
        'bg-tertiary': 'hsl(var(--bg-tertiary))',
        'bg-elevated': 'hsl(var(--bg-elevated))',
        'bg-overlay': 'hsl(var(--bg-overlay))',

        // Surface colors
        'surface-primary': 'hsl(var(--surface-primary))',
        'surface-secondary': 'hsl(var(--surface-secondary))',
        'surface-tertiary': 'hsl(var(--surface-tertiary))',
        'surface-elevated': 'hsl(var(--surface-elevated))',
        'surface-glass': 'hsl(var(--surface-glass))',
        'surface-wii-tint': 'hsl(var(--surface-wii-tint))',

        // Border colors
        'border-primary': 'hsl(var(--border-primary))',
        'border-secondary': 'hsl(var(--border-secondary))',
        'border-tertiary': 'hsl(var(--border-tertiary))',
        'border-accent': 'hsl(var(--border-accent))',

        // Text colors
        'text-primary': 'hsl(var(--text-primary))',
        'text-secondary': 'hsl(var(--text-secondary))',
        'text-tertiary': 'hsl(var(--text-tertiary))',
        'text-inverse': 'hsl(var(--text-inverse))',
        'text-on-accent': 'hsl(var(--text-on-accent))',
        'text-accent': 'hsl(var(--text-accent))',
        'link': 'hsl(var(--link))',
        'link-hover': 'hsl(var(--link-hover))',

        // State colors
        'state-hover': 'hsl(var(--state-hover))',
        'state-active': 'hsl(var(--state-active))',
        'state-disabled': 'hsl(var(--state-disabled))',
        'state-error': 'hsl(var(--state-error))',
        'state-error-hover': 'hsl(var(--state-error-hover))',
        'state-error-light': 'hsl(var(--state-error-light))',
        'state-success': 'hsl(var(--state-success))',
        'state-warning': 'hsl(var(--state-warning))',

        // Glass colors
        'glass-bg': 'hsl(var(--glass-bg))',
        'glass-border': 'hsl(var(--glass-border))',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      fontSize: {
        sm: '13px',
        md: '15px',
        lg: '18px',
        xl: '24px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
      },
      transitionDuration: {
        18: '0.18s',
      },
      backdropBlur: {
        xs: '2px',
      },
      rotate: {
        15: '15deg',
        25: '25deg',
      },
    },
  },
  plugins: [],
};
