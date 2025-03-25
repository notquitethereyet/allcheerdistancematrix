/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-color': '#FC6060',
        'background-color': '#F4F1DE',
        'text-color': '#2D2A32',
        'primary-highlight': '#03CF9C',
        'secondary-highlight': '#62B3ED',
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [],
}