/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wii-specific colors
        'wii-blue': 'hsl(195 75% 60%)',
        'wii-blue-hover': 'hsl(195 75% 55%)',
        'wii-blue-active': 'hsl(195 75% 50%)',
        
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
        'text-accent': 'hsl(var(--text-accent))',
        
        // State colors
        'state-hover': 'hsl(var(--state-hover))',
        'state-active': 'hsl(var(--state-active))',
        'state-disabled': 'hsl(var(--state-disabled))',
        'state-error': 'hsl(var(--state-error))',
        'state-error-hover': 'hsl(0 84% 55%)',
        'state-error-light': 'hsl(0 84% 95%)',
        'state-success': 'hsl(var(--state-success))',
        'state-warning': 'hsl(var(--state-warning))',
        
        // Glass colors
        'glass-bg': 'hsl(var(--glass-bg))',
        'glass-border': 'hsl(var(--glass-border))',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      fontSize: {
        'sm': '13px',
        'md': '15px',
        'lg': '18px',
        'xl': '24px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glow': 'var(--shadow-glow)',
        'card': '0 2px 8px #0001',
        'modal': '0 20px 40px rgba(0,0,0,0.3)',
      },
      transitionDuration: {
        '18': '0.18s',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
} 