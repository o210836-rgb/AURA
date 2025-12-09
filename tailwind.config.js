/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        // "Stone": Warm, vintage paper background (unchanged)
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        // "Iris": Deep, Rich Purple (The theme you requested)
        iris: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', 
          600: '#7c3aed', // PRIMARY BRAND COLOR
          700: '#6d28d9', // Darker Purple
          800: '#5b21b6', // Deep Velvet
          900: '#4c1d95', // Midnight
          950: '#2e1065', // Ink
        },
        // "Amethyst": A soft secondary accent (Pinkish-Purple)
        amethyst: {
          50: '#fdf4ff',
          100: '#fae8ff',
          500: '#d946ef',
          600: '#c026d3',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'breathe': 'breathe 5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.8 },
          '50%': { transform: 'scale(1.05)', opacity: 1 },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
};
