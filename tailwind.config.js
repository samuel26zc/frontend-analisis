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
          200: '#E6D8C8',
          100: '#F2EBE1',
          50: '#FBF9F5',
        },
        cordillera: {
          900: '#142C20',
          800: '#1B3B2B',
          700: '#2E5A44',
          600: '#3D7358',
          500: '#529170',
          100: '#E3ECE7',
          50: '#F2F7F4',
        },
        ambar: {
          800: '#92400E',
          700: '#B45309',
          600: '#D97706',
          500: '#F59E0B',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        terracota: {
          800: '#7A271A',
          700: '#9A3E26',
          600: '#C05638',
          500: '#D93853',
          100: '#FDE8E4',
          50: '#FDF5F3',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
