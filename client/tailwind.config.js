/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Be Vietnam Pro', 'Manrope', 'Inter', 'sans-serif'],
        serif: ['Noto Serif', 'Noto Serif Display', 'serif'],
        title: ['Noto Serif', 'Noto Serif Display', 'serif'],
        numeric: ['Space Grotesk', 'Be Vietnam Pro', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
