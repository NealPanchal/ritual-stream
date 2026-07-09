import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ritual brand color palette
        black: '#000000',
        'base-black': '#080808',
        'base-gray': '#0a0a0b',
        'base-gray-light': '#111114',
        'base-gray-lighter': '#1e1e24',
        'ritual-green': '#00F5A0',
        'ritual-green-hover': '#00c87f',
        'ritual-green-dim': '#00F5A030',
        'base-blue': '#00F5A0',       // alias kept for compatibility
        'base-blue-hover': '#00c87f', // alias kept for compatibility
        'base-white': '#ffffff',
        'base-gray-text': '#8a919e',
      },
      fontFamily: {
        base: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 245, 160, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 245, 160, 0.35)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'ritual': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'ritual-hover': '0 8px 30px rgba(0, 245, 160, 0.25)',
        'base': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'base-hover': '0 8px 30px rgba(0, 245, 160, 0.25)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'base': '8px',
        'base-lg': '12px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

export default config
