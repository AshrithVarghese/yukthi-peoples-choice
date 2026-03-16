/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          500: '#3b82f6', // You can change this to Yukthi's theme color
          600: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}