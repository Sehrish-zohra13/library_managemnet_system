/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#060e20',
          'container-lowest': '#040a16',
          'container-low': '#091328',
          'container': '#0f1930',
          'container-high': '#162040',
          'container-highest': '#1c2848',
          'bright': '#1f2b49',
          'variant': '#2a3558',
        },
        primary: {
          DEFAULT: '#8b7cf7',
          dim: '#6c5ce7',
          light: '#a78bfa',
          darker: '#5b4dc7',
          container: '#2d2466',
        },
        secondary: {
          DEFAULT: '#34d399',
          dim: '#10b981',
          container: '#064e3b',
        },
        tertiary: {
          DEFAULT: '#f472b6',
          dim: '#ec4899',
          container: '#831843',
        },
        danger: {
          DEFAULT: '#ef4444',
          dim: '#dc2626',
          container: '#7f1d1d',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dim: '#d97706',
        },
        'on-surface': '#dee5ff',
        'on-surface-dim': '#9ca3bf',
        'on-surface-faint': '#6b7394',
        'on-primary': '#ffffff',
        outline: {
          DEFAULT: '#40485d',
          variant: '#2d3548',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-sm': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'headline-lg': ['1.75rem', { lineHeight: '1.3' }],
        'headline-md': ['1.5rem', { lineHeight: '1.35' }],
        'headline-sm': ['1.25rem', { lineHeight: '1.4' }],
        'body-lg': ['1rem', { lineHeight: '1.6' }],
        'body-md': ['0.875rem', { lineHeight: '1.6' }],
        'body-sm': ['0.75rem', { lineHeight: '1.5' }],
        'label-lg': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'label-md': ['0.75rem', { lineHeight: '1.3', letterSpacing: '0.04em' }],
        'label-sm': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.06em' }],
      },
      borderRadius: {
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        'full': '9999px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        'ambient': '0 8px 60px rgba(222, 229, 255, 0.04)',
        'ambient-lg': '0 16px 80px rgba(222, 229, 255, 0.06)',
        'glow-primary': '0 0 20px rgba(139, 124, 247, 0.3)',
        'glow-secondary': '0 0 20px rgba(52, 211, 153, 0.3)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-input': '0 0 0 3px rgba(139, 124, 247, 0.1), 0 0 16px rgba(139, 124, 247, 0.08)',
        'card-hover': '0 2px 12px rgba(0, 0, 0, 0.15)',
        'card-lift': '0 8px 30px rgba(0, 0, 0, 0.25), 0 0 20px rgba(139, 124, 247, 0.06)',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #8b7cf7 0%, #6c5ce7 100%)',
        'surface-gradient': 'linear-gradient(180deg, #0f1930 0%, #060e20 100%)',
        'glass': 'linear-gradient(135deg, rgba(42, 53, 88, 0.6) 0%, rgba(15, 25, 48, 0.6) 100%)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'count-up': 'countUp 1s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 124, 247, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(139, 124, 247, 0.15)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
