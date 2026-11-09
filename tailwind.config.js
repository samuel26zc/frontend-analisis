/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cafe: {
          950: '#1F140E',
          900: '#2C1D11',
          800: '#3E2718',
          700: '#523620',
          600: '#6E492B',
          500: '#8F6039',
          400: '#B07D52',
          300: '#CFB092',
          200: '#E6D8C8',
          100: '#F2EBE1',
          50: '#FBF9F5',
        },
        cordillera: {
          950: '#0D1F16',
          900: '#142C20',
          800: '#1B3B2B',
          700: '#2E5A44',
          600: '#3D7358',
          500: '#529170',
          400: '#74B091',
          300: '#A3CEB8',
          200: '#C8E2D4',
          100: '#E3ECE7',
          50: '#F2F7F4',
        },
        ambar: {
          950: '#451A03',
          900: '#78350F',
          800: '#92400E',
          700: '#B45309',
          600: '#D97706',
          500: '#F59E0B',
          400: '#FBBF24',
          300: '#FCD34D',
          200: '#FDE68A',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        terracota: {
          950: '#431407',
          900: '#611E13',
          800: '#7A271A',
          700: '#9A3E26',
          600: '#C05638',
          500: '#D96B4B',
          400: '#E68A6E',
          300: '#F2B29E',
          200: '#F8D0C4',
          100: '#FDE8E4',
          50: '#FDF5F3',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
