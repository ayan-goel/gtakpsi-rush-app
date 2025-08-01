/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apple-gray': {
          50: '#f9f9f9',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        }
      },
      borderRadius: {
        'apple': '0.875rem',      // 14px - standard Apple rounding
        'apple-lg': '1.125rem',   // 18px - larger Apple rounding
        'apple-xl': '1.5rem',     // 24px - extra large Apple rounding
        'apple-2xl': '2rem',      // 32px - ultra rounded
        'apple-full': '9999px',   // pill shape
      },
      fontFamily: {
        'sans': ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
        'geist': ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'apple-caption2': ['0.6875rem', { lineHeight: '0.875rem', fontWeight: '400' }],
        'apple-caption1': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        'apple-footnote': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
        'apple-subheadline': ['0.9375rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'apple-body': ['1.0625rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        'apple-headline': ['1.0625rem', { lineHeight: '1.375rem', fontWeight: '600' }],
        'apple-title3': ['1.25rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'apple-title2': ['1.375rem', { lineHeight: '1.625rem', fontWeight: '400' }],
        'apple-title1': ['1.75rem', { lineHeight: '2.125rem', fontWeight: '400' }],
        'apple-large': ['2.125rem', { lineHeight: '2.5rem', fontWeight: '400' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

    },
  },
  plugins: [],
}