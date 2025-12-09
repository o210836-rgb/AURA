/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'], // Essential for the vintage nautical look
      },
      colors: {
        // "Sand": The warm, vintage paper/beach background
        sand: {
          50: '#fdfcf8',
          100: '#f5f5f0',
          200: '#e6e5dd',
          300: '#d6d4c8',
          400: '#a8a599',
          500: '#7e7b70',
          600: '#5e5c52',
          700: '#45433b',
          800: '#2b2a25',
          900: '#1a1916',
        },
        // "Tide": Vintage Sky & Ocean (Muted, Dusty Blues/Teals)
        tide: {
          50: '#f0f9ff',  // Sea Foam
          100: '#e0f2fe', // Pale Sky
          200: '#bae6fd', // Light Blue
          300: '#7dd3fc', // Sky
          400: '#38bdf8', // Azure
          500: '#0ea5e9', // Ocean
          600: '#0284c7', // Deep Water
          700: '#0369a1', // Vintage Denim
          800: '#075985', // Navy
          900: '#0c4a6e', // Midnight Depth
          950: '#082f49',
        },
        // "Coral": Subtle reef accents
        coral: {
          50: '#fff1f2',
          500: '#f43f5e',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'wave-slow': 'wave 8s ease-in-out infinite',
        'wave-fast': 'wave 6s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(1deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 0.3, transform: 'scale(1.1)' },
        }
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
};
