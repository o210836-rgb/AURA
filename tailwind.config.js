/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Use a clean, humanist sans-serif. 'Inter' is good, but ensuring system fallbacks feels native.
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // "Stone": Warm, earthy neutrals. Replaces cold 'gray' or 'zinc'.
        stone: {
          50: '#fafaf9',  // Almost paper white
          100: '#f5f5f4', // Warm light gray
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e', // Text secondary
          700: '#44403c',
          800: '#292524', // Text primary
          900: '#1c1917',
        },
        // "Vintage Moss": Lively but grounded. Not cyber-green, but plant-green.
        vintage: {
          50: '#f4f9f4',
          100: '#e1efe0',
          200: '#c2dec0',
          300: '#96c392',
          400: '#6b9f67',
          500: '#4a7d46', // Your main brand color
          600: '#396336',
          700: '#2e4f2b',
          800: '#263f24',
          900: '#20341f',
        },
        // "Clay": A soft warm accent for errors or highlights (like a reddish-orange shirt)
        clay: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#e11d48', // Soft red/pink
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)', // Apple-style ease
        'breathe': 'breathe 4s ease-in-out infinite',
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
          '0%, 100%': { transform: 'scale(1)', opacity: 0.9 },
          '50%': { transform: 'scale(1.05)', opacity: 1 },
        },
      },
      backgroundImage: {
        // A subtle noise texture to give it that "film grain" look
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
};
