/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          50: '#f2fbf5',
          100: '#e1f6e9',
          200: '#c5ebd3',
          300: '#97d9b2',
          400: '#62be8c',
          500: '#3ba36e',
          600: '#2b8457',
          700: '#246947',
          800: '#20543a',
          900: '#1b4531',
          950: '#0b261a',
        },
        earth: {
          50: '#fdfbf7',
          100: '#f8f4ec',
          200: '#efe7d6',
          300: '#e3d4b9',
          400: '#d2bb94',
          500: '#c1a273',
          600: '#b18e5e',
          700: '#93734e',
          800: '#775e43',
          900: '#614d3a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
