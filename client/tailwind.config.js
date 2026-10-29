/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#00032b', 900: '#00053f', 800: '#000a5c', 700: '#001d8a' },
        brand: { DEFAULT: '#0693e3', dark: '#0577b9', light: '#6cc4f0', soft: '#e8f5fd' },
        cream: '#f8f9ec',
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'Montserrat', 'system-ui', 'sans-serif'],
        display: ['Montserrat', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rise: { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(6px)' } },
      },
      animation: { rise: 'rise .7s cubic-bezier(.2,.7,.2,1) both', bob: 'bob 1.8s ease-in-out infinite' },
    },
  },
  plugins: [],
};
