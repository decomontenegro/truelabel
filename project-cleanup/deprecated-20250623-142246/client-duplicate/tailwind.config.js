/** @type {import('tailwindcss').Config} */
import { tailwindExtend } from './src/styles/design-system';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: tailwindExtend,
  },
  plugins: [],
}
